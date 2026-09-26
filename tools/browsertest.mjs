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

const P_NAV = `(() => {
  const bar = document.querySelector('.top');
  if (!bar) return { present: false };
  const nav = bar.querySelector('.top__nav');
  const links = nav ? [...nav.querySelectorAll('.top__link')] : [];
  const menuBtn = bar.querySelector('.top__menu');
  const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  const r = bar.getBoundingClientRect();
  const inl = bar.querySelector('.top__in');
  return {
    present: true,
    count: links.length,
    mode: shown(nav) ? 'inline' : (shown(menuBtn) ? 'drawer' : 'none'),
    onScreen: r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.height > 20,
    height: Math.round(r.height),
    clipped: inl ? inl.scrollWidth > inl.clientWidth + 1 : false,
    current: links.filter(t => t.hasAttribute('aria-current')).length,
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
  { name: "phone-360", w: 360, h: 740, mobile: true },
  { name: "phone-375", w: 375, h: 812, mobile: true },
  { name: "phone-390", w: 390, h: 844, mobile: true },
  { name: "phone-412", w: 412, h: 915, mobile: true },
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
      const bar = await page.eval(P_NAV);

      if (ov.scrollW > ov.innerW + 1) {
        layoutIssues.push(`${v.name} ${url}: horizontal overflow ${ov.scrollW} > ${ov.innerW} [${ov.offenders.join(", ")}]`);
      }
      if (imgs.broken.length) {
        layoutIssues.push(`${v.name} ${url}: ${imgs.broken.length}/${imgs.total} images never decoded: ${imgs.broken.join(", ")}`);
      }
      if (!bar.present) layoutIssues.push(`${v.name} ${url}: no .top nav`);
      else {
        if (!bar.onScreen) layoutIssues.push(`${v.name} ${url}: header off-screen (h=${bar.height})`);
        if (bar.clipped) layoutIssues.push(`${v.name} ${url}: header content clipped/scrollable`);
        if (bar.mode === 'none') layoutIssues.push(`${v.name} ${url}: no nav links and no menu button`);
        if (bar.current !== 1) layoutIssues.push(`${v.name} ${url}: aria-current count = ${bar.current}`);
      }

      if (shotFor.has(`${v.name}/${name}`)) await page.shot(`${v.name}__${name}`);
    }
  }
  record(layoutIssues.length === 0, `responsive sweep (${VIEWS.length} viewports x ${PAGES.length} pages)`);
  for (const i of layoutIssues) console.log(`      ! ${i}`);

  /* ---- perf snapshot: first load must be quick, and scrolling must be smooth ---- */
  console.log("\nPerformance");
  for (const v of [VIEWS[3], VIEWS[7]]) {
    await setViewport(v);
    for (const url of ["/", "/memories/"]) {
      await page.goto(BASE + url, { settle: 1200 });
      const m = await page.eval(`(() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const res = performance.getEntriesByType('resource');
        let total = 0, vids = 0;
        for (const r of res) {
          total += (r.transferSize || 0);
          /* the extension has to be the END of the path, otherwise
             "/manifest.webmanifest" would match on "mov". */
          if (/\\.(mp4|webm|m4v)$/i.test(new URL(r.name).pathname)) vids++;
        }
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        const media = res.filter(r => /\\.(mp4|webm|m4v)$/i.test(new URL(r.name).pathname))
                         .map(r => r.name.replace(location.origin, ''));
        return {
          fcp: fcp ? Math.round(fcp.startTime) : null,
          dcl: Math.round(nav.domContentLoadedEventEnd || 0),
          kb: Math.round(total / 1024), req: res.length, videoReqs: vids,
          media,
        };
      })()`);
      const f = await page.eval(`(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let frames = 0, running = true;
        const tick = () => { if (running) { frames++; requestAnimationFrame(tick); } };
        requestAnimationFrame(tick);
        const t0 = performance.now();
        const max = document.documentElement.scrollHeight - window.innerHeight;
        for (let i = 0; i <= 40; i++) { window.scrollTo(0, (max * i) / 40); await sleep(50); }
        const dur = performance.now() - t0;
        running = false;
        return Math.round((frames / dur) * 1000);
      })()`);
      console.log(
        `  ${v.name.padEnd(13)} ${url.padEnd(12)} fcp=${String(m.fcp).padStart(4)}ms dcl=${String(m.dcl).padStart(4)}ms ` +
        `${String(m.kb).padStart(4)}KB / ${String(m.req).padStart(2)} req  videoReqs=${m.videoReqs} ${m.media.join(",")}  scrollFps=${f}`
      );
    }
  }

  /* ---- install card states: report exactly what a visitor would see ---- */
  console.log("\nInstall card state");
  await setViewport(VIEWS[3]);
  await page.goto(`${BASE}/`, { settle: 1500 });
  const installState = await page.eval(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const snap = (tag) => {
      const card = document.querySelector('[data-install]');
      const btn = card.querySelector('[data-install-btn]');
      const steps = card.querySelector('[data-install-steps]');
      const note = card.querySelector('[data-install-note]');
      const vis = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
      return tag + ': ' + JSON.stringify({
        cls: card.className.replace('installcard', '').trim(),
        button: vis(btn), iosSteps: vis(steps), note: vis(note),
        label: (card.querySelector('[data-install-label]')?.textContent || '').trim(),
        body: (card.querySelector('[data-install-body]')?.textContent || '').trim().slice(0, 70),
      });
    };
    const out = [snap('as-loaded')];
    await sleep(4200);
    out.push(snap('after-4s-settle'));
    return out;
  })()`);
  for (const line of installState) console.log("  " + line);

  /* ---- bottom tab bar: app-quality on phones, absent on desktop ---- */
  console.log("\nBottom navigation");
  const tabReport = [];
  for (const v of [VIEWS[0], VIEWS[3], VIEWS[7]]) {
    await setViewport(v);
    for (const [name, url] of [["home", "/"], ["wishes", "/wishes/"], ["gifts", "/gifts/"]]) {
      await page.goto(BASE + url, { settle: 600 });
      const t = await page.eval(`(() => {
        const bar = document.querySelector('[data-tabs]');
        if (!bar) return { error: 'no tab bar' };
        const cs = getComputedStyle(bar);
        const r = bar.getBoundingClientRect();
        const tabs = [...bar.querySelectorAll('[data-tab]')];
        const tapHeights = tabs.map(a => Math.round(a.getBoundingClientRect().height));
        const labels = tabs.map(a => (a.querySelector('.tab__label')?.textContent || '').trim());
        const active = tabs.filter(a => a.getAttribute('aria-current') === 'page');
        const bodyPad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        return {
          shown: cs.display !== 'none',
          position: cs.position,
          onScreen: r.bottom <= window.innerHeight + 1 && r.top >= -1 && r.height > 20,
          height: Math.round(r.height),
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          count: tabs.length,
          minTap: Math.min(...tapHeights),
          labels,
          activeCount: active.length,
          activeLabel: active[0] ? (active[0].querySelector('.tab__label')?.textContent || '').trim() : null,
          bodyPad: Math.round(bodyPad),
        };
      })()`);
      tabReport.push({ v: v.name, name, ...t });
    }
  }
  const phone = tabReport.filter((r) => r.v.startsWith("phone"));
  const desk = tabReport.filter((r) => r.v === "desktop-1280");
  const tabIssues = [];
  for (const r of phone) {
    if (r.error) { tabIssues.push(`${r.v} ${r.name}: ${r.error}`); continue; }
    if (!r.shown) tabIssues.push(`${r.v} ${r.name}: tab bar not shown on phone`);
    if (r.position !== "fixed") tabIssues.push(`${r.v} ${r.name}: position=${r.position} (want fixed)`);
    if (!r.onScreen) tabIssues.push(`${r.v} ${r.name}: bar off-screen h=${r.height}`);
    if (r.count !== 5) tabIssues.push(`${r.v} ${r.name}: ${r.count} tabs (want 5)`);
    if (r.minTap < 44) tabIssues.push(`${r.v} ${r.name}: tap target ${r.minTap}px < 44px`);
    if (r.overflowX > 1) tabIssues.push(`${r.v} ${r.name}: overflows by ${r.overflowX}px`);
    if (r.activeCount > 1) tabIssues.push(`${r.v} ${r.name}: ${r.activeCount} active tabs`);
    /* the page must reserve room, so the last content is never behind the bar */
    if (r.bodyPad < 58) tabIssues.push(`${r.v} ${r.name}: body padding ${r.bodyPad}px < 58px bar height`);
  }
  for (const r of desk) {
    if (r.error) { tabIssues.push(`${r.v} ${r.name}: ${r.error}`); continue; }
    /* the bar is shown at every width, so the same guarantees apply on desktop */
    if (!r.shown) tabIssues.push(`${r.v} ${r.name}: tab bar not shown on desktop`);
    if (r.position !== "fixed") tabIssues.push(`${r.v} ${r.name}: position=${r.position} (want fixed)`);
    if (!r.onScreen) tabIssues.push(`${r.v} ${r.name}: bar off-screen h=${r.height}`);
    if (r.count !== 5) tabIssues.push(`${r.v} ${r.name}: ${r.count} tabs (want 5)`);
    if (r.overflowX > 1) tabIssues.push(`${r.v} ${r.name}: overflows by ${r.overflowX}px`);
    if (r.activeCount > 1) tabIssues.push(`${r.v} ${r.name}: ${r.activeCount} active tabs`);
    if (r.bodyPad < 58) tabIssues.push(`${r.v} ${r.name}: body padding ${r.bodyPad}px < 58px bar height`);
  }
  record(tabIssues.length === 0, `tab bar across 3 viewports x 3 pages`, JSON.stringify(tabReport));
  for (const i of tabIssues) console.log(`      ! ${i}`);

  /* the bar must stay pinned at the page bottom too - lazy images and videos
     keep growing the document, so this is checked after everything settles */
  for (const v of [VIEWS[0], VIEWS[3]]) {
    await setViewport(v);
    await page.goto(`${BASE}/`, { settle: 900 });
    await page.shot(`tabs-${v.name}`);
    await page.eval(`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      /* step down in increments so lazy content cannot outrun us, then settle */
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo(0, y);
        await sleep(120);
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await sleep(900);
    })()`);
    const pinned = await page.eval(`(() => {
      const bar = document.querySelector('[data-tabs]');
      if (!bar) return { error: 'missing' };
      const r = bar.getBoundingClientRect();
      return { cls: bar.className, shown: getComputedStyle(bar).display !== 'none',
        onScreen: r.bottom <= window.innerHeight + 1 && r.top >= -1 && r.height > 20,
        h: Math.round(r.height) };
    })()`);
    const bottomOk = pinned.shown && pinned.onScreen && !/\bis-hide\b/.test(pinned.cls || "");
    record(bottomOk, `tab bar stays pinned at page bottom (${v.name})`, JSON.stringify(pinned));
    await page.shot(`tabs-${v.name}-bottom`);
  }
  await setViewport(VIEWS[3]);
  /* ---- service worker on a nested route ---- */
  await setViewport(VIEWS[3]);
  await page.goto(`${BASE}/story/faith/`, { settle: 800 });
  const sw = await page.eval(P_SW);
  record(!sw.error && sw.scope === `${BASE}/`, "service worker registers with root scope on /story/faith/", JSON.stringify(sw));

  /* ---- PWA: manifest, installability, install card states ---- */
  console.log("\nPWA / install");
  await setViewport(VIEWS[3]);
  await page.goto(`${BASE}/`, { settle: 900 });

  const manifest = await page.eval(`(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.href;
    if (!href) return { error: 'no manifest link' };
    const res = await fetch(href);
    if (!res.ok) return { error: 'manifest fetch ' + res.status };
    const m = await res.json();
    const sizes = (m.icons || []).map(i => i.sizes);
    return {
      name: m.name, short: m.short_name, display: m.display,
      startUrl: m.start_url, scope: m.scope,
      theme: m.theme_color, bg: m.background_color,
      has192: sizes.includes('192x192'), has512: sizes.includes('512x512'),
      hasMaskable: (m.icons || []).some(i => (i.purpose || '').includes('maskable')),
      hasApple: sizes.includes('180x180'),
      orientation: m.orientation,
    };
  })()`);
  const manifestOk =
    !manifest.error &&
    manifest.name === "Mercy's Birthday" &&
    manifest.display === "standalone" &&
    manifest.has192 && manifest.has512 && manifest.hasMaskable &&
    !!manifest.theme && !!manifest.bg;
  record(manifestOk, "manifest is installable", JSON.stringify(manifest));

  /* The install card must always resolve to exactly one honest state - a real
     button, iOS steps, an installed confirmation, or a plain note. Never a
     dead button. */
  const install = await page.eval(`(() => {
    const card = document.querySelector('[data-install]');
    if (!card) return { error: 'no install card' };
    const btn = card.querySelector('[data-install-btn]');
    const steps = card.querySelector('[data-install-steps]');
    const note = card.querySelector('[data-install-note]');
    const visible = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
    const r = btn && !btn.hidden ? btn.getBoundingClientRect() : null;
    return {
      present: true,
      btn: visible(btn), steps: visible(steps), note: visible(note),
      state: card.className,
      tapHeight: r ? Math.round(r.height) : null,
      body: (card.querySelector('[data-install-body]')?.textContent || '').trim().slice(0, 60),
    };
  })()`);
  const installOk = !install.error && (install.btn || install.steps || install.note);
  record(installOk, "install card resolves to a real action", JSON.stringify(install));
  record(!install.btn || (install.tapHeight ?? 46) >= 44, "install button meets 44px touch target",
    install.btn ? `h=${install.tapHeight}` : "button not shown in this browser (expected)");

  const part = await page.eval(`(() => {
    const bar = document.querySelector('[data-install-bar]');
    if (!bar) return { error: 'no install bar' };
    const btn = bar.querySelector('[data-install-btn]');
    const steps = bar.querySelector('[data-install-steps]');
    const note = bar.querySelector('[data-install-note]');
    const x = bar.querySelector('[data-install-dismiss]');
    const vis = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
    const box = bar.getBoundingClientRect();
    const xb = x ? x.getBoundingClientRect() : null;
    return {
      shown: vis(bar),
      btn: vis(btn), steps: vis(steps), note: vis(note),
      honest: vis(btn) || vis(steps) || vis(note),
      aboveFold: box.top < window.innerHeight && box.height > 0,
      top: Math.round(box.top),
      hasDismiss: !!x,
      dismissSize: xb ? [Math.round(xb.width), Math.round(xb.height)] : null,
      // the bar must not overlap the sticky header
      clearsHeader: box.top >= 0,
    };
  })()`);
  record(!part.error, "install bar exists on the home page", JSON.stringify(part));
  record(part.honest === true, "install bar resolves to a real action, never a dead button",
    JSON.stringify({ btn: part.btn, steps: part.steps, note: part.note }));
  record(part.aboveFold === true, "install bar is above the fold", `top=${part.top}`);
  record(!!part.hasDismiss && (part.dismissSize || []).every((n) => n >= 28),
    "install bar can be dismissed by a tappable control", JSON.stringify(part.dismissSize));

  /* Dismissing must actually stick. A prompt that comes back on the next
     reload is nagging, not a convenience. Cleared first so a previous run in
     this same profile cannot make the check pass for the wrong reason. */
  await page.eval(`(() => { try { localStorage.removeItem('mb-install-dismissed'); } catch (e) {} })()`);
  await page.goto(`${BASE}/`, { settle: 1400 });
  const afterDismiss = await page.eval(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const bar = () => document.querySelector('[data-install-bar]');
    const vis = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
    const before = vis(bar());
    const x = bar() && bar().querySelector('[data-install-dismiss]');
    if (x) x.click();
    await sleep(150);
    const afterClick = vis(bar());
    let stored = null;
    try { stored = localStorage.getItem('mb-install-dismissed'); } catch (e) {}
    return { before, afterClick, stored };
  })()`);
  record(afterDismiss && afterDismiss.before === true && afterDismiss.afterClick === false &&
         afterDismiss.stored === "1",
    "dismissing the install bar hides it and remembers", JSON.stringify(afterDismiss));
  await page.goto(`${BASE}/`, { settle: 1200 });
  const afterReload = await page.eval(`(() => {
    const bar = document.querySelector('[data-install-bar]');
    const vis = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
    return { shown: vis(bar) };
  })()`);
  record(afterReload.shown === false, "dismissed bar stays gone after a reload", JSON.stringify(afterReload));
  /* Put the profile back the way it was, so later checks see a first visit. */
  await page.eval(`(() => { try { localStorage.removeItem('mb-install-dismissed'); } catch (e) {} })()`);

  /* Opening hook: must show once, then leave the DOM and unlock scrolling.
     sessionStorage is cleared and the page reloaded first, so a previous run
     in the same profile cannot make the hook (correctly) stay hidden. */
  await page.goto(`${BASE}/`, { settle: 400 });
  await page.eval(`(() => { try { sessionStorage.removeItem('mb-gate-seen'); } catch (e) {} })()`);
  await page.goto(`${BASE}/`, { settle: 600 });
  const gate = await page.eval(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const el = document.querySelector('[data-gate]');
    if (!el) return { error: 'no gate' };
    const shownAtStart = !el.hidden;
    await sleep(3600);
    const gone = !document.querySelector('[data-gate]');
    const locked = document.documentElement.classList.contains('is-gated');
    return { shownAtStart, gone, locked };
  })()`);
  record(!gate.error && gate.shownAtStart && gate.gone && !gate.locked,
    "opening hook shows then removes itself", JSON.stringify(gate));

  /* A second visit in the same session must go straight to the content. */
  await page.goto(`${BASE}/`, { settle: 700 });
  const revisit = await page.eval(`(() => {
    const el = document.querySelector('[data-gate]');
    return { hiddenOrGone: !el || el.hidden };
  })()`);
  record(revisit.hiddenOrGone, "opening hook does not repeat on revisit", JSON.stringify(revisit));

  /* Scroll must work after the hook clears. */
  const scrolled = await page.eval(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const y0 = window.scrollY;
    window.scrollTo(0, 600);
    await sleep(300);
    return { moved: window.scrollY > y0 + 100, y: window.scrollY };
  })()`);
  record(scrolled.moved, "page scrolls after the opening hook", JSON.stringify(scrolled));

  /* Video cards must expose the structure a finished video needs, and must
     not preload any mp4 before the visitor presses play. Checked on
     /memories/, which carries all thirteen. */
  await page.goto(`${BASE}/memories/`, { settle: 900 });
  const vids = await page.eval(`(() => {
    const cards = [...document.querySelectorAll('[data-video]')];
    const vids = [...document.querySelectorAll('video')];
    return {
      cards: cards.length,
      withTitle: cards.filter(c => c.querySelector('.vcard__title')?.textContent.trim()).length,
      withPoster: cards.filter(c => c.querySelector('.vcard__poster')).length,
      withPlay: cards.filter(c => c.querySelector('[data-play]')).length,
      withState: cards.filter(c => c.querySelector('[data-vstate]')).length,
      liveVideos: vids.length,
    };
  })()`);
  record(vids.cards > 0 && vids.withTitle === vids.cards && vids.withPlay === vids.cards && vids.withState === vids.cards,
    `video cards complete (${vids.cards} cards)`, JSON.stringify(vids));
  record(vids.liveVideos === 0, "no <video> created before play", JSON.stringify({ liveVideos: vids.liveVideos }));

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
    const errs = [];
    window.addEventListener('error', (e) => errs.push(String((e.error && e.error.stack) || e.message || e)));

    /* Capture the <audio> the page builds. It is created with new Audio() and
       never attached to the DOM, so querySelectorAll cannot see it. */
    const OrigAudio = window.Audio;
    function AudioWrap() {
      const el = new (Function.prototype.bind.apply(OrigAudio, [null].concat([...arguments])))();
      window.__audio = el;
      return el;
    }
    AudioWrap.prototype = OrigAudio.prototype;
    window.Audio = AudioWrap;

    /* Keep counting oscillators too: if the file ever fails we silently fall
       back to the Web Audio synth, and we want to be able to prove which ran. */
    const Orig = window.AudioContext;
    let created = 0;
    if (Orig) {
      function Wrapped() {
        const c = new (Function.prototype.bind.apply(Orig, [null].concat([...arguments])))();
        window.__ctx = c;
        const co = c.createOscillator.bind(c);
        c.createOscillator = function () { created++; return co(); };
        return c;
      }
      Wrapped.prototype = Orig.prototype;
      window.AudioContext = Wrapped;
      window.webkitAudioContext = Wrapped;
    }

    const btn = document.querySelector('[data-song]');
    if (!btn) return { error: 'no [data-song]' };
    const label = btn.querySelector('[data-song-label]');
    const before = { pressed: btn.getAttribute('aria-pressed'), text: label ? label.textContent : '' };
    btn.click();
    /* Wait 5s. The rendered song runs ~11.8s; the old broken tune finished in
       ~3.5s, so a short wait is the cheapest way to catch it collapsing into
       a blip. */
    await new Promise(r => setTimeout(r, 5200));

    const a = window.__audio;
    const during = {
      pressed: btn.getAttribute('aria-pressed'),
      text: label ? label.textContent : '',
      stillPlayingAfter5s: btn.getAttribute('aria-pressed') === 'true',
      audio: a ? {
        src: a.currentSrc || a.src,
        duration: a.duration,
        currentTime: a.currentTime,
        paused: a.paused,
        readyState: a.readyState,
        error: a.error ? a.error.code : null,
      } : null,
      synthOscillators: created,
      usingRealFile: !!(a && !a.error && /happy-birthday\\.wav$/.test(a.currentSrc || a.src)),
    };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const after = { pressed: btn.getAttribute('aria-pressed'), text: label ? label.textContent : '' };
    return { before, during, after, errs };
  })()`);
  record(
    !song.error && song.during.pressed === "true" && song.during.text !== song.before.text && song.after.pressed === "false",
    "birthday song starts and stops",
    JSON.stringify(song),
  );
  /* A flipped aria-pressed only proves the handler ran - it says nothing about
     sound. Assert the rendered file really loaded, decoded, and is advancing. */
  const songAudio = song && song.during && song.during.audio;
  record(
    !song.error && song.during.usingRealFile && songAudio && !songAudio.error &&
    songAudio.duration > 10 && songAudio.currentTime > 1 && songAudio.paused === false,
    "birthday song plays the real rendered audio file",
    JSON.stringify(song && song.during) + (song && song.errs ? " errors=" + JSON.stringify(song.errs) : ""),
  );
  /* The tune must still be going after 5s - i.e. it is a real song, not a
     3-second click that happens to flip a button. */
  record(
    !song.error && song.during.stillPlayingAfter5s === true,
    "birthday song runs for a real length of time",
    JSON.stringify(song && song.during),
  );

  const cake = await page.eval(`(async () => {
    const cake = document.querySelector('[data-cake]');
    if (!cake) return { error: 'no [data-cake]' };
    const note = document.querySelector('[data-cake-note]');
    const before = { text: note && note.textContent, label: cake.getAttribute('aria-label') };
    /* Can a real finger actually reach it, or is something painted on top? */
    const hit = (() => {
      const r = cake.getBoundingClientRect();
      const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!(h && (h === cake || cake.contains(h) || h.contains(cake)));
    })();
    cake.click(); await new Promise(r => setTimeout(r, 250));
    const out = {
      isOut: cake.classList.contains('is-out'),
      toast: document.querySelector('[data-toast]').classList.contains('is-on'),
      text: note && note.textContent,
      label: cake.getAttribute('aria-label'),
    };
    cake.click(); await new Promise(r => setTimeout(r, 250));
    return {
      before, out, hit,
      relit: !cake.classList.contains('is-out'),
      textBack: note && note.textContent,
      labelBack: cake.getAttribute('aria-label'),
    };
  })()`);
  /* The class flipping is not enough on its own: the original bug was that the
     tap worked but changed almost nothing a visitor could see. Assert the
     instruction text and the accessible label both change too. */
  record(
    !cake.error && cake.out.isOut && cake.relit && cake.out.toast &&
    cake.out.text !== cake.before.text && cake.textBack === cake.before.text &&
    cake.out.label !== cake.before.label,
    "cake blows out, relights, and says so in words",
    JSON.stringify(cake),
  );
  record(
    !cake.error && cake.hit === true,
    "cake is actually tappable (no overlay swallowing the tap)",
    JSON.stringify(cake && cake.hit),
  );
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

  /* ---- keyboard: focusables reachable, skip link works ---- */
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

