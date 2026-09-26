/**
 * Generates WebP siblings for images whose largest variant is a JPEG.
 *
 *   node tools/makewebp.mjs
 *
 * Why this exists: tools/media.mjs builds a srcset and prefers WebP at each
 * width. Where only a JPEG exists at the largest width, every modern browser
 * downloads that JPEG instead - the home page hero (me-currently-852.jpg)
 * alone was 93 KB on the critical path. Encoding the same pixels as WebP
 * cuts roughly 60% of that with no visible difference at these sizes.
 *
 * Like tools/makeicons-photo.mjs, this rasterises in headless Chrome because
 * Node cannot decode a JPEG without a dependency, and this project has none.
 * The generated WebPs are committed; this only re-runs when sources change.
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "img");

/* Photos look fine at this; the visual difference against 0.9 is not visible
   on a phone at these widths, and it is worth a lot of KB per image. */
const QUALITY = 0.7;

/* Below this width the existing 320/640 WebP siblings already cover every
   screen, so a JPEG is never the one that gets picked. */
const MIN_WIDTH = 600;

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!CHROME) { console.error("No Chrome or Edge found."); process.exit(1); }

const PORT = Number(process.env.WEBP_PORT || 4213);
const CDP_PORT = Number(process.env.WEBP_CDP || 9364);
const PROFILE = path.join(ROOT, ".browse-webp");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Every JPEG at or above MIN_WIDTH that does not already have a WebP sibling
   at the same width. --force re-encodes ones that already exist, which is how
   QUALITY gets tuned without hand-deleting files. */
const FORCE = process.argv.includes("--force");
const targets = [];
for (const f of readdirSync(IMG)) {
  const m = f.match(/^(.*)-(\d+)\.jpg$/);
  if (!m) continue;
  const w = Number(m[2]);
  if (w < MIN_WIDTH) continue;
  const webp = path.join(IMG, f.replace(/\.jpg$/, ".webp"));
  if (existsSync(webp) && !FORCE) continue;
  targets.push({ file: f, id: m[1], w });
}
if (!targets.length) { console.log("Every large JPEG already has a WebP sibling."); process.exit(0); }

console.log(`Encoding ${targets.length} WebP variant(s) at q=${QUALITY}:`);
for (const t of targets) console.log(`  ${t.file} -> ${t.id}-${t.w}.webp`);

const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
  if (name === "" || name === "index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end("<!doctype html><meta charset=utf-8><title>webp</title><body></body>");
    return;
  }
  const file = path.join(IMG, path.basename(name));
  if (!file.startsWith(IMG) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "no-store" });
  res.end(readFileSync(file));
});

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP websocket failed")), { once: true });
  });
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });
  let seq = 0;
  return { ws, send: (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error("timeout waiting for " + method)); }
    }, 60000);
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
  try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch {}
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
/* Load a same-origin blank page so the canvas is not tainted and toDataURL works. */
await cmd("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
await sleep(1200);

/* Re-encode one JPEG as WebP at its existing pixel size, so the width in the
   filename still matches the width descriptor in the srcset. */
const ENCODE = (name) => `(async () => {
  const img = new Image();
  img.src = 'http://127.0.0.1:${PORT}/${name}';
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0);
  const url = c.toDataURL('image/webp', ${QUALITY});
  return { data: url.split(',')[1], w: c.width, h: c.height };
})()`;

let saved = 0;
for (const t of targets) {
  const r = await cmd("Runtime.evaluate", {
    expression: ENCODE(t.file),
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    console.error(`  FAILED ${t.file}: ${r.exceptionDetails.text}`);
    continue;
  }
  const { data, w, h } = r.result.value;
  if (!data) { console.error(`  FAILED ${t.file}: canvas returned no data`); continue; }
  if (w !== t.w) {
    console.error(`  SKIP ${t.file}: decoded ${w}px but filename says ${t.w}px`);
    continue;
  }
  const out = path.join(IMG, `${t.id}-${t.w}.webp`);
  /* Compare against the JPEG this replaces, not against a possibly-absent
     previous WebP, otherwise a first run reports a saving of Infinity. */
  const jpgKB = readFileSync(path.join(IMG, t.file)).length;
  const buf = Buffer.from(data, "base64");
  if (buf.length >= jpgKB) {
    console.log(`  kept ${path.basename(out)} (webp was not smaller than the jpg)`);
    continue;
  }
  writeFileSync(out, buf);
  saved += Math.round((jpgKB - buf.length) / 1024);
  console.log(
    `  wrote ${path.basename(out)}  ${(jpgKB / 1024).toFixed(1)} KB jpg -> ${(buf.length / 1024).toFixed(1)} KB webp`,
  );
}
console.log(saved > 0 ? `\nDone. Saved about ${saved} KB across the site.` : "\nNothing new to write.");
cleanup();
setTimeout(() => process.exit(0), 300);

