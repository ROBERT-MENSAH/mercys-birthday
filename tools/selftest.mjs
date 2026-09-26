/**
 * End-to-end route smoke test against a running server.
 *
 *   node tools/selftest.mjs [port]
 *
 * Starts the server itself, hits every route plus the key assets, and
 * reports anything that does not behave as expected. Exits non-zero on
 * failure so it can gate a deploy.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 4399;
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn(process.execPath, [path.join(ROOT, "tools", "serve.mjs"), String(PORT)], {
  cwd: ROOT,
  stdio: "ignore",
});

const stop = () => { try { server.kill(); } catch {} };
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(1); });

/* wait for the listener */
async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(1000) });
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

const PAGES = [
  ["/", 200],
  ["/journey/", 200],
  ["/memories/", 200],
  ["/birthday/", 200],
  ["/wishes/", 200],
  ["/gifts/", 200],
  ["/creator/", 200],
  ["/story/childhood/", 200],
  ["/story/family/", 200],
  ["/story/people/", 200],
  ["/story/faith/", 200],
  ["/story/music/", 200],
  ["/story/today/", 200],
  ["/story/dreams/", 200],
  ["/this-page-does-not-exist/", 404],
];

const ASSETS = [
  ["/styles/app.css", 200, "text/css"],
  ["/scripts/app.js", 200, "text/javascript"],
  ["/manifest.webmanifest", 200, "manifest"],
  ["/sw.js", 200, "text/javascript"],
  ["/icons/favicon-32.png", 200, "image/png"],
  ["/icons/app-icon-192.png", 200, "image/png"],
  ["/icons/app-icon-512.png", 200, "image/png"],
  ["/icons/app-icon-maskable-512.png", 200, "image/png"],
  ["/img/me-currently-320.webp", 200, "image/webp"],
  ["/videos/MY%20STUDIO%20SONG.mp4", 200, "video/mp4"],
  ["/audio/happy-birthday.wav", 200, "audio/wav"],
];

const fail = [];

if (!(await ready())) {
  console.error("\nFAILED - server never came up on " + BASE + "\n");
  stop();
  process.exit(1);
}

for (const [path, expect] of PAGES) {
  try {
    const r = await fetch(BASE + path, { signal: AbortSignal.timeout(8000) });
    const body = await r.text();
    const ok = r.status === expect;
    console.log(
      "  " + (ok ? "ok  " : "BAD ") + r.status + "  " + String(body.length).padStart(7) + "b  " + path
    );
    if (!ok) fail.push(`${path} returned ${r.status}, expected ${expect}`);
    else if (expect === 200 && !/<title>[^<]+<\/title>/.test(body)) fail.push(`${path} has no <title>`);
  } catch (e) {
    fail.push(`${path} -> ${e.message}`);
    console.log("  ERR       " + path + "  " + e.message);
  }
}

for (const [path, expect, type] of ASSETS) {
  try {
    const r = await fetch(BASE + path, { signal: AbortSignal.timeout(15000) });
    const buf = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "";
    const ok = r.status === expect && ct.includes(type);
    console.log(
      "  " + (ok ? "ok  " : "BAD ") + r.status + "  " + String(buf.byteLength).padStart(7) + "b  " + ct.slice(0, 20).padEnd(20) + "  " + path
    );
    if (!ok) fail.push(`${path} returned ${r.status} ${ct}, expected ${expect} ${type}`);
  } catch (e) {
    fail.push(`${path} -> ${e.message}`);
    console.log("  ERR       " + path + "  " + e.message);
  }
}

/* range request, so <video> can seek */
try {
  const r = await fetch(BASE + "/videos/MYSELF%20NOW.mp4", { headers: { Range: "bytes=0-1023" } });
  const buf = await r.arrayBuffer();
  const ok = r.status === 206 && buf.byteLength === 1024;
  console.log("  " + (ok ? "ok  " : "BAD ") + r.status + "  video range request (" + buf.byteLength + "b)");
  if (!ok) fail.push("video range request returned " + r.status);
} catch (e) {
  fail.push("range request -> " + e.message);
}

/* traversal must be refused */
try {
  const r = await fetch(BASE + "/../package.json", { redirect: "manual" });
  const body = await r.text();
  const leaked = body.includes('"mercy-birthday"');
  console.log("  " + (leaked ? "BAD " : "ok  ") + r.status + "  path traversal refused");
  if (leaked) fail.push("path traversal leaked a file outside dist/");
} catch (e) {
  /* a rejected fetch is also an acceptable refusal */
  console.log("  ok        path traversal refused (" + e.message + ")");
}

stop();

if (fail.length) {
  console.error("\nFAILED - " + fail.length + " problem(s):\n");
  fail.forEach((f) => console.error("  - " + f));
  console.error("");
  process.exit(1);
}
console.log("\nOK - all routes and assets behave correctly.\n");
