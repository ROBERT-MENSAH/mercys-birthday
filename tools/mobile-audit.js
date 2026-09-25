/**
 * MOBILE VALIDATION HARNESS  (Chrome DevTools Protocol, no dependencies)
 * Mercy - A Story Worth Celebrating
 *
 * Drives a real headless Chrome against the local server and asserts the
 * things the design brief actually cares about on a phone:
 *
 *   - the first screen paints the hero photograph, not a blank screen
 *   - the kinetic headline finishes fully visible and the CTA is reachable
 *   - no horizontal overflow at any target width
 *   - touch targets are big enough to hit with a thumb
 *   - nothing fetches a video until a video is opened
 *   - images carry a srcset, so the phone downloads one small size
 *   - share, sound, and closing controls are all present
 *   - no console errors, uncaught exceptions, or failed requests
 *
 * Usage:  node tools/mobile-audit.js [baseUrl] [chromePath]
 */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { connect } = require("./cdp-client");

const BASE = process.argv[2] || "http://127.0.0.1:8770/";
const CHROME = process.argv[3] ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;

/* The widths the brief names first, then the secondary adaptations. */
const PHONE_WIDTHS = [320, 360, 375, 390, 412, 430];
const OTHER_WIDTHS = [768, 1024, 1440];
const HEIGHT = 780;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mercy-cdp-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
  });
}

async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try { return await getJson(`http://127.0.0.1:${PORT}/json/version`); }
    catch (e) { await sleep(250); }
  }
  throw new Error("Chrome did not expose a debugging port");
}

let failures = 0;
const pass = (m) => console.log("  PASS  " + m);
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const info = (m) => console.log("        " + m);

async function main() {
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--autoplay-policy=no-user-gesture-required",
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + profile,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForChrome();
    const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = targets.find((t) => t.type === "page");
    const cdp = await connect(page.webSocketDebuggerUrl);

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Log.enable");

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const requestedUrls = [];

    cdp.on((msg) => {
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(" "));
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params.exceptionDetails;
        pageErrors.push(d.text + " " + ((d.exception || {}).description || ""));
      }
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
        consoleErrors.push(msg.params.entry.text);
      }
      if (msg.method === "Network.requestWillBeSent") {
        requestedUrls.push(msg.params.request.url);
      }
      if (msg.method === "Network.loadingFailed") {
        failedRequests.push(msg.params.errorText);
      }
    });

    /** Evaluate an expression in the page and parse its JSON result. */
    async function evaluate(expression) {
      const res = await cdp.send("Runtime.evaluate", {
        expression, returnByValue: true, awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text + " " +
          ((res.exceptionDetails.exception || {}).description || ""));
      }
      return JSON.parse(res.result.value);
    }

    async function setViewport(width, mobile) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width, height: HEIGHT, deviceScaleFactor: mobile ? 2 : 1, mobile
      });
      await sleep(300);
    }


    await setViewport(390, true);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cdp.send("Page.navigate", { url: BASE });
    await sleep(1400);

    /* ---------------------------------------------------------------- */
    console.log("=== FIRST SCREEN (390px) ===");
    const first = await evaluate(`(() => {
      const img = document.querySelector('.prologue__photo');
      const r = img ? img.getBoundingClientRect() : null;
      return JSON.stringify({
        hasHero: !!img,
        decoded: img ? (img.complete && img.naturalWidth > 0) : false,
        currentSrc: img ? img.currentSrc : null,
        fills: r ? (r.width >= window.innerWidth - 1 && r.height > 200) : false,
        headline: (document.querySelector('.prologue__headline')||{}).innerText || '',
        kicker: (document.querySelector('.prologue__kicker')||{}).innerText || ''
      });
    })()`);

    first.hasHero ? pass("hero photograph present") : fail("no hero photograph");
    first.decoded ? pass("hero photograph decoded") : fail("hero photograph did not decode");
    first.fills ? pass("hero fills the first screen") : fail("hero does not fill the screen");
    /me-currently-\d+\.webp$/.test(first.currentSrc || "")
      ? pass("served a responsive size: " + first.currentSrc.split("/").pop())
      : fail("hero not served responsively: " + first.currentSrc);
    info("kicker: " + JSON.stringify(first.kicker));
    info("headline: " + JSON.stringify(first.headline.replace(/\\n/g, " / ")));

    /* ---------------------------------------------------------------- */
    console.log("\n=== KINETIC SEQUENCE COMPLETES ===");
    await sleep(4200);
    const seq = await evaluate(`(() => {
      const op = (s) => { const e = document.querySelector(s);
        return e ? +getComputedStyle(e).opacity : null; };
      const btn = document.querySelector('[data-begin-journey]');
      return JSON.stringify({
        live: document.querySelector('.prologue').classList.contains('is-live'),
        words: [...document.querySelectorAll('.prologue__word')].map(e => +getComputedStyle(e).opacity),
        name: op('.prologue__name'),
        action: op('.prologue__action'),
        hint: op('.prologue__hint'),
        buttonHeight: btn ? Math.round(btn.getBoundingClientRect().height) : 0
      });
    })()`);

    seq.live ? pass("sequence ran (.is-live applied)") : fail("sequence never started");
    seq.words.every((o) => o > 0.95)
      ? pass("all " + seq.words.length + " kinetic lines revealed")
      : fail("lines not fully revealed: " + seq.words.join(", "));
    seq.name > 0.95 ? pass("name resolved into view") : fail("name not visible");
    seq.action > 0.95 ? pass("begin action revealed") : fail("begin action hidden");
    seq.hint > 0.95 ? pass("closing hint revealed") : fail("hint hidden");
    seq.buttonHeight >= 44
      ? pass("begin button is a real touch target (" + seq.buttonHeight + "px)")
      : fail("begin button too small: " + seq.buttonHeight + "px");

    /* ---------------------------------------------------------------- */
    console.log("\n=== RESPONSIVE: NO HORIZONTAL OVERFLOW ===");
    for (const width of PHONE_WIDTHS.concat(OTHER_WIDTHS)) {
      await setViewport(width, width < 768);
      const d = await evaluate(`JSON.stringify({
        doc: document.documentElement.scrollWidth,
        win: window.innerWidth,
        offenders: [...document.querySelectorAll('body *')]
          .filter(e => { const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > window.innerWidth + 1.5; })
          .slice(0, 5)
          .map(e => (typeof e.className === 'string' && e.className) || e.tagName)
      })`);
      if (d.doc <= d.win + 1) {
        pass(width + "px  scrollWidth " + d.doc + " <= viewport " + d.win);
      } else {
        fail(width + "px  OVERFLOW " + d.doc + " > " + d.win +
          "  [" + d.offenders.join(", ") + "]");
      }
    }


    /* ---------------------------------------------------------------- */
    console.log("\n=== TOUCH TARGETS (>= 44px) ===");
    await setViewport(375, true);
    await evaluate("document.querySelector('[data-begin-journey]').click(); 1");
    await sleep(2800);
    const small = await evaluate(`JSON.stringify(
      [...document.querySelectorAll('button, a.btn, [role=tab]')]
        .filter(e => e.offsetParent !== null)
        .map(e => ({ t: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 24),
                     h: Math.round(e.getBoundingClientRect().height) }))
        .filter(x => x.h > 0 && x.h < 44))`);
    small.length === 0
      ? pass("every visible control is at least 44px tall")
      : fail("too small: " + small.map((x) => x.t + "(" + x.h + "px)").join(", "));

    /* ---------------------------------------------------------------- */
    console.log("\n=== GALLERY + MEDIA LAZINESS ===");
    const gallery = await evaluate(`JSON.stringify({
      cards: document.querySelectorAll('.vault-card-item').length,
      withSrcset: document.querySelectorAll('.vault-card-item img[srcset]').length,
      videos: document.querySelectorAll('.vault-card-item video').length,
      videosWithPoster: document.querySelectorAll('.vault-card-item video[poster]').length,
      preloads: [...new Set([...document.querySelectorAll('.vault-card-item video')]
        .map(v => v.getAttribute('preload')))]
    })`);
    gallery.cards >= 27 ? pass(gallery.cards + " gallery cards rendered")
      : fail("only " + gallery.cards + " cards");
    gallery.withSrcset >= 17 ? pass(gallery.withSrcset + " images carry a srcset")
      : fail("only " + gallery.withSrcset + " images have a srcset");
    gallery.videos > 0 && gallery.videosWithPoster === gallery.videos
      ? pass("all " + gallery.videos + " video tiles have a poster")
      : fail(gallery.videosWithPoster + "/" + gallery.videos + " video tiles have a poster");
    gallery.preloads.length === 1 && gallery.preloads[0] === "none"
      ? pass("every gallery video is preload=none")
      : fail("video preload values: " + gallery.preloads.join(","));

    const earlyVideos = requestedUrls.filter((u) => /\/assets\/videos\//.test(u));
    earlyVideos.length === 0
      ? pass("no video bytes fetched before a video is opened")
      : fail("videos fetched too early: " +
          earlyVideos.map((u) => u.split("/").pop()).join(", "));

    /* ---------------------------------------------------------------- */
    console.log("\n=== SHARE, SOUND, CLOSING, CREATOR CREDIT ===");
    const closing = await evaluate(`JSON.stringify({
      shareWish: !!document.querySelector('[data-share-wish]'),
      shareApp: !!document.querySelector('[data-share-app]'),
      soundToggle: !!document.querySelector('[data-sound-toggle]'),
      credit: (document.querySelector('.creator-credit__meta') || {}).innerText || '',
      creditImages: document.querySelectorAll('.creator-credit img').length,
      soundApi: typeof (window.MERCY_SOUND || {}).play === 'function',
      mediaApi: typeof (window.MERCY_MEDIA || {}).applyImage === 'function',
      prologueApi: typeof (window.MERCY_PROLOGUE || {}).settle === 'function',
      chapters: document.querySelectorAll('[data-chapter]').length
    })`);
    closing.shareWish ? pass("send-a-wish action present") : fail("no send-a-wish action");
    closing.shareApp ? pass("share action present") : fail("no share action");
    closing.soundToggle ? pass("celebration sound toggle present") : fail("no sound toggle");
    closing.soundApi ? pass("sound module loaded") : fail("sound module missing");
    closing.mediaApi ? pass("media module loaded") : fail("media module missing");
    closing.prologueApi ? pass("prologue module loaded") : fail("prologue module missing");
    closing.creditImages === 0
      ? pass("creator credit is typographic (nothing competes with Mercy)")
      : fail("creator credit uses " + closing.creditImages + " image(s)");
    info("credit reads: " + JSON.stringify(closing.credit));
    info("chapters tracked: " + closing.chapters);

    /* ---------------------------------------------------------------- */
    console.log("\n=== ERRORS ===");
    const realFailures = failedRequests.filter((e) => !/ERR_ABORTED/.test(e));
    consoleErrors.length === 0 ? pass("no console errors")
      : fail("console: " + consoleErrors.slice(0, 3).join(" | "));
    pageErrors.length === 0 ? pass("no uncaught exceptions")
      : fail("exception: " + pageErrors.slice(0, 2).join(" | "));
    realFailures.length === 0 ? pass("no failed requests")
      : fail("request failures: " + realFailures.slice(0, 3).join(", "));

    /* ---------------------------------------------------------------- */
    console.log("\n=== REQUEST SUMMARY ===");
    const origin = BASE.replace(/\/$/, "");
    const local = requestedUrls.filter((u) => u.startsWith(origin));
    const localVideos = local.filter((u) => /\/assets\/videos\//.test(u));
    const localImages = local.filter((u) => /\.(webp|jpg|jpeg|png)/.test(u));
    info(local.length + " requests, " + localImages.length + " images, " +
      localVideos.length + " videos (0 expected before interaction)");

    cdp.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }

  console.log("\n=== RESULT ===");
  if (failures) {
    console.log("MOBILE AUDIT FAILED: " + failures + " problem(s)");
    process.exitCode = 1;
  } else {
    console.log("MOBILE AUDIT PASSED");
  }
}

main().catch((err) => {
  console.error("harness error:", err.message);
  process.exitCode = 1;
});
