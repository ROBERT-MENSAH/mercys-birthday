/**
 * Real-tap probe: can a finger actually reach the cake / song button?
 *
 *   node tools/tapprobe.mjs
 *
 * The browser test drives these with el.click(). A scripted click fires the
 * handler no matter what is painted on top, so it passes even when a real tap
 * lands on some invisible overlay and nothing happens. This probe scrolls the
 * element into view, hit-tests the centre with elementFromPoint(), and then
 * dispatches a genuine mouse press/release through CDP.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".browse-tap");
const PORT = Number(process.env.PORT || 4199);
const BASE = `http://127.0.0.1:${PORT}`;
const CDP_PORT = Number(process.env.CDP_PORT || 9351);
const TARGET_PATH = process.env.TAP_PATH || "/birthday/";
const SELECTOR = process.env.TAP_SEL || "[data-cake]";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!CHROME) { console.log("No Chrome/Edge found."); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (...a) => { console.log(...a); };

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP websocket failed")), { once: true });
  });
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
    }
  });
  let seq = 0;
  return { ws, send: (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error("timeout " + method)); }
    }, 20000);
  }) };
}

const server = spawn(process.execPath, [path.join(ROOT, "tools/serve.mjs"), String(PORT)], { stdio: "ignore" });
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(OUT, "profile")}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--hide-scrollbars", "about:blank",
], { stdio: "ignore" });
const cleanup = () => { try { server.kill(); } catch {} try { chrome.kill(); } catch {} };
process.on("exit", cleanup);
const bail = (m) => { say(m); cleanup(); setTimeout(() => process.exit(1), 200); };

for (let i = 0; i < 80; i++) {
  try { const r = await fetch(`${BASE}${TARGET_PATH}`); if (r.ok) break; } catch {}
  await sleep(250);
}
let ver;
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (r.ok) { ver = await r.json(); break; }
  } catch {}
  await sleep(250);
}
if (!ver) bail("devtools never came up");

const client = await connect(ver.webSocketDebuggerUrl);
const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
const cmd = (m, p = {}) => client.send(m, p, sessionId);
await cmd("Page.enable");
await cmd("Runtime.enable");
const W = Number(process.env.TAP_W || 390);
const H = Number(process.env.TAP_H || 844);
await cmd("Emulation.setDeviceMetricsOverride", {
  width: W, height: H, deviceScaleFactor: 2, mobile: true,
});

const evaluate = async (expression) => {
  const res = await cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error((res.exceptionDetails.exception || {}).description || res.exceptionDetails.text);
  return res.result.value;
};

await cmd("Page.navigate", { url: `${BASE}${TARGET_PATH}` });
await sleep(2500);

const report = await evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(SELECTOR)});
  if (!el) return { error: 'selector not found' };
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  return true;
})()`);
if (report && report.error) bail("selector not found: " + report.error);
await sleep(600);

const geom = await evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(SELECTOR)});
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = document.elementFromPoint(cx, cy);
  const cs = getComputedStyle(el);
  /* full ancestor/overlay audit at that point */
  const stack = document.elementsFromPoint(cx, cy).slice(0, 6).map(n =>
    n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ')[0] : ''));
  return {
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    viewportH: innerHeight,
    onScreen: r.top >= 0 && r.bottom <= innerHeight,
    pointerEvents: cs.pointerEvents, display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
    centerInsideViewport: cy >= 0 && cy <= innerHeight,
    hitTag: hit ? hit.tagName.toLowerCase() + (hit.className ? '.' + String(hit.className).split(' ')[0] : '') : null,
    hitIsTarget: !!(hit && (hit === el || el.contains(hit) || hit.contains(el))),
    stack,
  };
})()`);
say("VIEWPORT " + W + "x" + H + "  selector " + SELECTOR);
say("GEOMETRY " + JSON.stringify(geom, null, 2));

/* --- a REAL tap --- */
const cx = geom.rect.x + geom.rect.w / 2;
const cy = geom.rect.y + geom.rect.h / 2;
for (const type of ["mousePressed", "mouseReleased"]) {
  await cmd("Input.dispatchMouseEvent", { type, x: cx, y: cy, button: "left", clickCount: 1 });
}
await sleep(700);

const after = await evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(SELECTOR)});
  const n = document.querySelector('[data-cake-note]');
  return {
    className: el.className,
    isOut: el.classList.contains('is-out'),
    ariaPressed: el.getAttribute('aria-pressed'),
    ariaLabel: el.getAttribute('aria-label'),
    noteText: n ? n.textContent : null,
    flameOpacity: (() => {
      const f = document.querySelector('.cake__flame');
      return f ? getComputedStyle(f).opacity : null;
    })(),
    toastOn: !!document.querySelector('[data-toast]') &&
             document.querySelector('[data-toast]').classList.contains('is-on'),
    toastText: (document.querySelector('[data-toast]') || {}).textContent,
  };
})()`);
say("AFTER REAL TAP " + JSON.stringify(after, null, 2));

/* screenshot the result so the change can be eyeballed */
try {
  const { data } = await cmd("Page.captureScreenshot", { format: "png" });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(path.join(OUT, "after-tap.png"), Buffer.from(data, "base64"));
  say("screenshot -> " + path.join(OUT, "after-tap.png"));
} catch (e) {
  say("screenshot failed: " + e.message);
}

const acted = SELECTOR === "[data-cake]"
  ? after.isOut || after.toastOn
  : after.ariaPressed === "true" || after.toastOn;
say(acted ? "\nRESULT: real tap works."
          : "\nRESULT: REAL TAP DID NOTHING - a real user cannot reach this element.");
cleanup();
setTimeout(() => process.exit(acted ? 0 : 2), 200);
