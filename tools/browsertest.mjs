/**
 * Headless browser test - drives a real Chrome over the DevTools Protocol.
 * No dependencies: Node 24 provides a global WebSocket, which is all CDP needs.
 *
 *   node tools/browsertest.mjs
 *
 * It starts tools/serve.mjs on its own port, then for each viewport checks
 * layout (no horizontal overflow), that every image actually decoded, that the
 * service worker registers on nested routes, and that each interaction works:
 * lightbox, memory filters, video play, song, candles, confetti, sharing.
 *
 * Screenshots land in .browse/shots so they can be eyeballed afterwards.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".browse");
const SHOTS = path.join(OUT, "shots");
const PORT = Number(process.env.PORT || 4173);
const BASE = `http://127.0.0.1:${PORT}`;
const CDP_PORT = Number(process.env.CDP_PORT || 9333);

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME = CHROME_CANDIDATES.find((p) => p && existsSync(p));

const results = [];
const shotErrors = [];
let sessionErrors = [];

const record = (ok, label, detail = "") => {
  results.push({ ok, label, detail });
  const mark = ok ? "  ok" : "FAIL";
  console.log(`${mark}  ${label}${detail ? "  - " + detail : ""}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------- CDP client -------- */
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP websocket failed")), { once: true });
  });

  const pending = new Map();
  const listeners = [];

  ws.addEventListener("message", (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.method})`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  });

  let seq = 0;
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout waiting for ${method}`));
        }
      }, 45000);
    });

  return {
    ws,
    send,
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  };
}

async function waitForDevTools() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome devtools endpoint never came up");
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("static server never came up");
}

/* ---------------------------------------------------- page helper -------- */
class Page {
  constructor(client, sessionId) {
    this.client = client;
    this.id = sessionId;
  }

  cmd(method, params = {}) {
    return this.client.send(method, params, this.id);
  }

  async goto(url, { settle = 500 } = {}) {
    const loaded = new Promise((resolve) => {
      this.client.on((msg) => {
        if (msg.method === "Page.loadEventFired" && msg.sessionId === this.id) resolve();
      });
      setTimeout(resolve, 20000);
    });
    await this.cmd("Page.navigate", { url });
    await loaded;
    await sleep(settle);
  }

  async eval(expression) {
    const res = await this.cmd("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      const d = res.exceptionDetails;
      throw new Error("page eval threw: " + ((d.exception && d.exception.description) || d.text));
    }
    return res.result.value;
  }

  async shot(name) {
    try {
      const { data } = await this.cmd("Page.captureScreenshot", { format: "png" });
      writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(data, "base64"));
    } catch (e) {
      shotErrors.push(`${name}: ${e.message}`);
    }
  }
}

/* ---------------------------------------------------- probes ------------- */
/* Each constant below is JavaScript that runs inside the page. */

const P_OVERFLOW = `(() => {
  const de = document.documentElement;
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
    if (cs.position === 'fixed' || cs.position === 'absolute') continue;
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      bad.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') +
               ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
    }
  }
  return { scrollW: de.scrollWidth, innerW: window.innerWidth, offenders: bad.slice(0, 6) };
})()`;

/* Force every image to load (ignoring lazy loading) and report the ones that
   never decoded - this is what catches a blank cover for good. */
const P_IMAGES = `(async () => {
  const all = [...document.images];
  /* the lightbox <img> ships without a src until it is opened - it is a
     placeholder, not content, so it must not count as a broken image. */
  const imgs = all.filter(i => i.hasAttribute('src'));
  for (const i of imgs) { i.loading = 'eager'; }
  await new Promise(r => setTimeout(r, 200));
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  return { total: imgs.length, broken: imgs.filter(i => !i.naturalWidth).map(i => (i.currentSrc || i.src).replace(location.origin, '')) };
})()`;

const P_SW = `(async () => {
  if (!('serviceWorker' in navigator)) return { error: 'no serviceWorker API' };
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(() => rej(new Error('not ready in 8s')), 8000)),
    ]);
    return { scope: reg.scope };
  } catch (e) { return { error: String(e.message || e) }; }
})()`;

const P_TABBAR = `(() => {
  const bar = document.querySelector('.tabbar');
  if (!bar) return { present: false };
  const list = bar.querySelector('.tabbar__list');
  const tabs = [...bar.querySelectorAll('.tab')];
  const r = bar.getBoundingClientRect();
  return {
    present: true,
    count: tabs.length,
    onScreen: r.top >= -1 && r.bottom <= window.innerHeight + 1,
    height: Math.round(r.height),
    clipped: list ? list.scrollWidth > list.clientWidth + 1 : false,
    current: tabs.filter(t => t.hasAttribute('aria-current')).length,
  };
})()`;

/* ---------------------------------------------------- setup -------------- */
if (!CHROME) {
  console.error("No Chrome or Edge found - cannot run the browser test.");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const server = spawn(process.execPath, [path.join(ROOT, "tools/serve.mjs"), String(PORT)], {
  stdio: "ignore",
});

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(OUT, "profile")}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const cleanup = () => {
  try { server.kill(); } catch {}
  try { chrome.kill(); } catch {}
};

const shutdown = (code) => {
  cleanup();
  /* give the killed children a moment before Node checks for stragglers */
  setTimeout(() => process.exit(code), 300);
};
process.on("exit", cleanup);

const VIEWS = [
  { name: "phone-320", w: 320, h: 640, mobile: true },
  { name: "phone-390", w: 390, h: 844, mobile: true },
  { name: "phone-430", w: 430, h: 932, mobile: true },
  { name: "tablet-768", w: 768, h: 1024, mobile: true },
  { name: "desktop-1280", w: 1280, h: 900, mobile: false },
];

const PAGES = [
  ["home", "/"],
  ["journey", "/journey/"],
  ["story-faith", "/story/faith/"],
  ["story-music", "/story/music/"],
  ["memories", "/memories/"],
  ["birthday", "/birthday/"],
  ["wishes", "/wishes/"],
  ["gifts", "/gifts/"],
  ["creator", "/creator/"],
];

async function main() {
  await waitForServer();
  const version = await waitForDevTools();
  const client = await connect(version.webSocketDebuggerUrl);

  /* Collect anything the page complains about, for the whole run. */
  client.on((msg) => {
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.details;
      sessionErrors.push("exception: " + ((d.exception && d.exception.description) || d.text));
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      sessionErrors.push("console: " + msg.params.args.map((a) => a.description ?? a.value).join(" "));
    } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      const e = msg.params.entry;
      if (!/favicon/i.test(e.text || "")) sessionErrors.push(`${e.source}: ${e.text} ${e.url || ""}`.trim());
    }
  });

  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  const page = new Page(client, sessionId);

  await page.cmd("Page.enable");
  await page.cmd("Runtime.enable");
  await page.cmd("Log.enable");
  await page.cmd("Network.enable");

  const setViewport = (v) =>
    page.cmd("Emulation.setDeviceMetricsOverride", {
      width: v.w,
      height: v.h,
      deviceScaleFactor: v.mobile ? 2 : 1,
      mobile: v.mobile,
    });

  const layoutIssues = [];
  const shotFor = new Set([
    "phone-320/home", "phone-390/home", "phone-390/journey", "phone-390/memories",
    "phone-390/birthday", "phone-430/story-faith", "phone-390/story-music",
    "tablet-768/journey", "desktop-1280/home", "desktop-1280/memories",
  ]);

  console.log(`\nResponsive sweep: ${VIEWS.length} viewports x ${PAGES.length} pages`);
  for (const v of VIEWS) {
    await setViewport(v);
    for (const [name, url] of PAGES) {
      await page.goto(BASE + url, { settle: 350 });
      const ov = await page.eval(P_OVERFLOW);
      const imgs = await page.eval(P_IMAGES);
      const bar = await page.eval(P_TABBAR);

      if (ov.scrollW > ov.innerW + 1) {
        layoutIssues.push(`${v.name} ${url}: horizontal overflow ${ov.scrollW} > ${ov.innerW} [${ov.offenders.join(", ")}]`);
      }
      if (imgs.broken.length) {
        layoutIssues.push(`${v.name} ${url}: ${imgs.broken.length}/${imgs.total} images never decoded: ${imgs.broken.join(", ")}`);
      }
      if (!bar.present) layoutIssues.push(`${v.name} ${url}: no .tabbar`);
      else {
        if (!bar.onScreen) layoutIssues.push(`${v.name} ${url}: tabbar off-screen (h=${bar.height})`);
        if (bar.clipped) layoutIssues.push(`${v.name} ${url}: tabbar list clipped/scrollable`);
        if (bar.current !== 1) layoutIssues.push(`${v.name} ${url}: aria-current count = ${bar.current}`);
      }

      if (shotFor.has(`${v.name}/${name}`)) await page.shot(`${v.name}__${name}`);
    }
  }
  record(layoutIssues.length === 0, `responsive sweep (${VIEWS.length} viewports x ${PAGES.length} pages)`);
  for (const i of layoutIssues) console.log(`      ! ${i}`);

  /* ---- service worker on a nested route ---- */
  await setViewport(VIEWS[1]);
  await page.goto(`${BASE}/story/faith/`, { settle: 800 });
  const sw = await page.eval(P_SW);
  record(!sw.error && sw.scope === `${BASE}/`, "service worker registers with root scope on /story/faith/", JSON.stringify(sw));

  /* ---- interactions, at phone width ---- */
  console.log("\nInteractions (390x844)");

  await page.goto(`${BASE}/memories/`, { settle: 700 });

  /* videos must not exist in the DOM until a play is pressed */
  const beforePlay = await page.eval(`({
    videos: document.querySelectorAll('video').length,
    cards: document.querySelectorAll('[data-video]').length,
  })`);
  record(beforePlay.videos === 0 && beforePlay.cards > 0, "no <video> in DOM before interaction", JSON.stringify(beforePlay));

  const play = await page.eval(`(async () => {
    const btn = document.querySelector('[data-play]');
    if (!btn) return { error: 'no [data-play]' };
    const card = btn.closest('[data-video]');
    const expect = card.getAttribute('data-src');
    btn.click();
    await new Promise(r => setTimeout(r, 1200));
    const v = card.querySelector('video');
    if (!v) return { error: 'no video element created' };
    return {
      srcMatches: v.getAttribute('src') === expect,
      src: v.getAttribute('src'),
      hasControls: v.hasAttribute('controls'),
      hasPoster: !!v.getAttribute('poster'),
      readyState: v.readyState,
      playing: card.classList.contains('is-playing') || !v.paused,
      error: v.error ? v.error.code : null,
    };
  })()`);
  record(!play.error && play.srcMatches && play.hasControls && play.hasPoster, "video play builds a player from data-src", JSON.stringify(play));
  await page.shot("phone-390__video-playing");

  /* memory filters */
  const filters = await page.eval(`(async () => {
    const chips = [...document.querySelectorAll('[data-filter]')];
    const items = [...document.querySelectorAll('[data-group]')];
    const out = [];
    for (const c of chips) {
      c.click();
      await new Promise(r => setTimeout(r, 150));
      const id = c.getAttribute('data-filter');
      out.push({
        id,
        shown: items.filter(i => !i.classList.contains('is-hidden')).length,
        want: id === 'all' ? items.length : items.filter(i => i.getAttribute('data-group') === id).length,
        on: c.classList.contains('is-on'),
        count: (document.querySelector('[data-count]') || {}).textContent || '',
      });
    }
    return { total: items.length, out };
  })()`);
  const badFilters = filters.out.filter((f) => f.shown !== f.want || !f.on || !f.count.includes(String(f.shown)));
  record(badFilters.length === 0 && filters.out.length > 1, `memory filters (${filters.total} items, ${filters.out.length} chips)`, JSON.stringify(badFilters));
  for (const f of badFilters) console.log(`      ! filter ${f.id}: shown ${f.shown}, want ${f.want}, is-on ${f.on}, count "${f.count}"`);

  /* lightbox */
  const lb = await page.eval(`(async () => {
    /* the filter test above leaves the last chip active; reset to All and
       only zoom photos that are actually visible. */
    const all = document.querySelector('[data-filter="all"]');
    if (all) { all.click(); await new Promise(r => setTimeout(r, 250)); }
    const zoom = [...document.querySelectorAll('[data-zoom]')].filter(b => b.offsetParent !== null);
    if (!zoom.length) return { error: 'no zoomable photos' };
    zoom[0].click();
    await new Promise(r => setTimeout(r, 500));
    const box = document.querySelector('[data-lightbox]');
    const img = box.querySelector('.lb__img');
    const opened = !box.hidden && document.body.classList.contains('lb-open');
    const firstSrc = img.currentSrc || img.src;
    const cap = box.querySelector('.lb__cap').textContent.trim();
    document.querySelector('[data-lb-next]').click();
    await new Promise(r => setTimeout(r, 400));
    const secondSrc = img.currentSrc || img.src;
    document.querySelector('[data-lb-close]').click();
    await new Promise(r => setTimeout(r, 400));
    return { count: zoom.length, opened, cap, firstSrc: firstSrc.replace(location.origin, ''),
             advanced: secondSrc !== firstSrc, natural: img.naturalWidth,
             closed: box.hidden && !document.body.classList.contains('lb-open') };
  })()`);
  record(!lb.error && lb.opened && lb.closed && lb.advanced && lb.natural > 0 && !!lb.cap, "lightbox opens, advances, closes", JSON.stringify(lb));


  await page.goto(`${BASE}/`, { settle: 600 });
  const swRoot = await page.eval(P_SW);
  record(!swRoot.error && swRoot.scope === `${BASE}/`, "service worker scope on /", JSON.stringify(swRoot));


  /* ---- birthday page: song, candles, confetti ---- */
  await page.goto(`${BASE}/birthday/`, { settle: 700 });

  const song = await page.eval(`(async () => {
    const btn = document.querySelector('[data-song]');
    if (!btn) return { error: 'no [data-song]' };
    const label = btn.querySelector('[data-song-label]');
    const before = { pressed: btn.getAttribute('aria-pressed'), text: label ? label.textContent : '' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const during = { pressed: btn.getAttribute('aria-pressed'), text: label ? label.textContent : '' };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const after = { pressed: btn.getAttribute('aria-pressed'), text: label ? label.textContent : '' };
    return { before, during, after };
  })()`);
  record(
    !song.error && song.during.pressed === "true" && song.during.text !== song.before.text && song.after.pressed === "false",
    "birthday song starts and stops",
    JSON.stringify(song),
  );

  const cake = await page.eval(`(async () => {
    const cake = document.querySelector('[data-cake]');
    if (!cake) return { error: 'no [data-cake]' };
    cake.click(); await new Promise(r => setTimeout(r, 250));
    const out = cake.classList.contains('is-out');
    const toast1 = document.querySelector('[data-toast]').classList.contains('is-on');
    cake.click(); await new Promise(r => setTimeout(r, 250));
    return { out, toast1, relit: !cake.classList.contains('is-out') };
  })()`);
  record(!cake.error && cake.out && cake.relit && cake.toast1, "cake blows out and relights", JSON.stringify(cake));
  await page.shot("phone-390__cake-out");

  const confetti = await page.eval(`(async () => {
    const btn = document.querySelector('[data-confetti]');
    if (!btn) return { error: 'no [data-confetti]' };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const host = document.querySelector('.confetti');
    return { host: !!host, pieces: host ? host.children.length : 0, hidden: host ? host.getAttribute('aria-hidden') : null };
  })()`);
  record(!confetti.error && confetti.host && confetti.pieces > 0 && confetti.hidden === "true", "confetti fires", JSON.stringify(confetti));
  await page.shot("phone-390__confetti");

  /* ---- sharing falls back to clipboard + toast when Web Share is absent ---- */
  const share = await page.eval(`(async () => {
    const btn = document.querySelector('[data-share]');
    if (!btn) return { error: 'no [data-share]' };
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    const t = document.querySelector('[data-toast]');
    return { nativeShare: typeof navigator.share === 'function', on: t.classList.contains('is-on'), text: t.textContent.trim().slice(0, 60) };
  })()`);
  record(!share.error && share.on && share.text.length > 0, "share produces a toast", JSON.stringify(share));

  /* ---- wishes: WhatsApp links are well formed ---- */
  await page.goto(`${BASE}/wishes/`, { settle: 600 });
  const wa = await page.eval(`(() => {
    const links = [...document.querySelectorAll('a[href^="https://wa.me/"], a[href^="https://api.whatsapp.com/"]')];
    return {
      count: links.length,
      bad: links.filter(a => !/wa\\.me\\/\\d{6,}/.test(a.href)).map(a => a.href.slice(0, 70)),
      encoded: links.filter(a => a.href.includes('text=')).length,
    };
  })()`);
  record(wa.count > 0 && wa.bad.length === 0, `WhatsApp wish links (${wa.count} links, ${wa.encoded} pre-filled)`, JSON.stringify(wa));

  /* ---- keyboard: tabbar links reachable, skip link works ---- */
  await page.goto(`${BASE}/`, { settle: 500 });
  const a11y = await page.eval(`(() => {
    const skip = document.querySelector('.skip');
    const focusables = [...document.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    const imgsNoAlt = [...document.images].filter(i => !i.hasAttribute('alt'));
    const buttonsNoName = [...document.querySelectorAll('button')].filter(b =>
      !(b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('title')));
    return { skip: !!skip, focusables: focusables.length, imgsNoAlt: imgsNoAlt.length, buttonsNoName: buttonsNoName.length };
  })()`);
  record(a11y.skip && a11y.imgsNoAlt === 0 && a11y.buttonsNoName === 0 && a11y.focusables > 10, "keyboard + naming basics", JSON.stringify(a11y));

  /* ---- console must stay clean ---- */
  record(sessionErrors.length === 0, "no console errors across the run");
  for (const e of [...new Set(sessionErrors)].slice(0, 12)) console.log(`      ! ${e}`);

  if (shotErrors.length) console.log(`\n(${shotErrors.length} screenshots failed: ${shotErrors[0]})`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
  console.log(`screenshots -> ${path.relative(ROOT, SHOTS)}`);
  client.close();
  return failed.length === 0;
}

main()
  .then((ok) => shutdown(ok ? 0 : 1))
  .catch((err) => {
    console.error("\nbrowser test crashed: " + (err && err.stack ? err.stack : err));
    for (const e of [...new Set(sessionErrors)].slice(0, 12)) console.error("page: " + e);
    shutdown(1);
  });

