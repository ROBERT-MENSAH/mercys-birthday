/**
 * Generates the app icons from Mercy's favourite picture.
 *
 *   node tools/makeicons-photo.mjs
 *
 * The old icons were a procedurally drawn "M" monogram, which says nothing
 * about whose birthday this is. These are cut from the photograph captioned
 * "One of her favourite pictures." (tools/content.mjs, id my-favourate-picture)
 * so the icon on a phone's home screen is actually her.
 *
 * Why a browser: Node cannot decode a JPEG or a WebP without a dependency, and
 * this project has none. Headless Chrome can, so we let it rasterise the crops
 * on a canvas and hand back PNGs. The source is served over HTTP rather than
 * file:// so the canvas is not tainted and toDataURL() is allowed.
 *
 * The generated PNGs are committed, so this only needs re-running when the
 * chosen picture changes.
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "icons");
const SRC = path.join(ROOT, "img", "my-favourate-picture-960.jpg");

/* Where to aim the crop, as a fraction of the source image. The photograph is
   a 3:4 portrait; her face sits a little right of centre and about a third of
   the way down. FOCUS is that point, and ZOOM is how much of the width the
   square crop takes - 1.0 would be the full width. */
const FOCUS_X = 0.52;
const FOCUS_Y = 0.33;
const ZOOM = 0.78;
const MASKABLE_ZOOM = 0.86;   /* maskable needs a little more room: the platform crops the edges */

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!CHROME) { console.error("No Chrome or Edge found."); process.exit(1); }
if (!existsSync(SRC)) { console.error("Missing source photo: " + SRC); process.exit(1); }

const PORT = Number(process.env.ICON_PORT || 4211);
const CDP_PORT = Number(process.env.ICON_CDP || 9362);
const PROFILE = path.join(ROOT, ".browse-icons");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------- tiny same-origin server */
const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
  /* A blank page on the same origin as the image. Without this the page stays
     on about:blank, the canvas is cross-origin, and toDataURL() is blocked. */
  if (name === "" || name === "index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end("<!doctype html><meta charset=utf-8><title>icons</title><body></body>");
    return;
  }
  const file = path.join(ROOT, "img", path.basename(name));
  if (!file.startsWith(path.join(ROOT, "img")) || !existsSync(file)) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "no-store" });
  res.end(readFileSync(file));
});

/* ------------------------------------------------------------- CDP client */
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
    }, 30000);
  }) };
}

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${PROFILE}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank",
], { stdio: "ignore" });

const cleanup = () => { try { server.close(); } catch {} try { chrome.kill(); } catch {} };
process.on("exit", cleanup);

server.listen(PORT, "127.0.0.1");
for (let i = 0; i < 80; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/my-favourite-picture-960.jpg`); if (r.ok) break; } catch {}
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
if (!ver) { console.error("Chrome devtools never came up"); cleanup(); process.exit(1); }

const client = await connect(ver.webSocketDebuggerUrl);
const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
const cmd = (m, p = {}) => client.send(m, p, sessionId);
await cmd("Page.enable");
await cmd("Runtime.enable");
/* Load the same-origin blank page so the canvas is not tainted. */
await cmd("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
await sleep(1200);

/* Draws one icon on a canvas and returns it as a PNG data URL. */
const RENDER = (size, zoom, radius, maskable) => `(async () => {
  const img = new Image();
  img.src = 'http://127.0.0.1:${PORT}/my-favourate-picture-960.jpg';
  await img.decode();

  const c = document.createElement('canvas');
  c.width = c.height = ${size};
  const g = c.getContext('2d');

  /* Cover-fit a square crop of the source, aimed at her face. */
  const side = img.width * ${zoom};
  const cx = img.width * ${FOCUS_X};
  const cy = img.height * ${FOCUS_Y};
  const sx = Math.max(0, Math.min(img.width - side, cx - side / 2));
  const sy = Math.max(0, Math.min(img.height - side, cy - side / 2));
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, sx, sy, side, side, 0, 0, ${size}, ${size});

  if (${maskable}) {
    /* A maskable icon is masked by the platform, so everything meaningful has
       to survive inside the central 80%. A soft vignette pulls the eye to the
       middle and hides whatever the mask ends up clipping. */
    const grd = g.createRadialGradient(${size}/2, ${size}/2, ${size}*0.28, ${size}/2, ${size}/2, ${size}*0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.34)');
    g.fillStyle = grd;
    g.fillRect(0, 0, ${size}, ${size});
  }

  if (${radius} > 0) {
    /* Clip to a rounded square for the "any" purpose icons. */
    g.globalCompositeOperation = 'destination-in';
    g.beginPath();
    const r = ${radius};
    g.moveTo(r, 0);
    g.arcTo(${size}, 0, ${size}, ${size}, r);
    g.arcTo(${size}, ${size}, 0, ${size}, r);
    g.arcTo(0, ${size}, 0, 0, r);
    g.arcTo(0, 0, ${size}, 0, r);
    g.closePath();
    g.fill();
  }

  return c.toDataURL('image/png');
})()`;

const TARGETS = [
  { file: "favicon-32.png", size: 32, radius: 7, maskable: false },
  { file: "apple-touch-icon.png", size: 180, radius: 0, maskable: false },
  { file: "app-icon-192.png", size: 192, radius: 42, maskable: false },
  { file: "app-icon-512.png", size: 512, radius: 112, maskable: false },
  { file: "app-icon-maskable-192.png", size: 192, radius: 0, maskable: true },
  { file: "app-icon-maskable-512.png", size: 512, radius: 0, maskable: true },
];

mkdirSync(OUT, { recursive: true });
for (const t of TARGETS) {
  const res = await cmd("Runtime.evaluate", {
    expression: RENDER(t.size, t.maskable ? MASKABLE_ZOOM : ZOOM, t.radius, t.maskable),
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.exceptionDetails) {
    console.error("render failed for " + t.file + ": " +
      ((res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text));
    cleanup(); process.exit(1);
  }
  const dataUrl = res.result.value;
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const buf = Buffer.from(b64, "base64");
  writeFileSync(path.join(OUT, t.file), buf);
  console.log("  " + t.file.padEnd(28) + t.size + "x" + t.size + "  " + Math.round(buf.length / 1024) + " KB");
}

console.log("\nIcons written to " + OUT + "\n");
cleanup();
setTimeout(() => process.exit(0), 200);

