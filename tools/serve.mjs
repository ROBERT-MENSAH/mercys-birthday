/**
 * Tiny static server for local preview.
 *
 *   node tools/serve.mjs [port]
 *
 * No dependencies. It exists mainly so the service worker and clean URLs
 * behave the same as they will on a real host.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.argv[2]) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

/* Mirrors the cache policy in vercel.json. Media and the icons are cached for
   30 days so a return visit downloads none of them, but deliberately NOT
   "immutable" for a year: the filenames are slugs, not content hashes, so a
   photo swapped under an existing name has to be able to expire. HTML, CSS
   and JS always revalidate so an edit shows up on refresh. */
const LONG = /^\/(img|videos|audio|icons)\//;
const REVALIDATE = /\.(html|css|js)$/;

const cacheControlFor = (rel) => {
  if (REVALIDATE.test(rel)) return "public, max-age=0, must-revalidate";
  if (LONG.test(rel)) return "public, max-age=2592000, stale-while-revalidate=86400";
  return "public, max-age=3600";
};

const send = async (res, code, file) => {
  const ext = path.extname(file).toLowerCase();
  const rel = "/" + path.relative(DIST, file).split(path.sep).join("/");
  res.writeHead(code, {
    "content-type": TYPES[ext] || "application/octet-stream",
    "cache-control": cacheControlFor(rel),
    "x-content-type-options": "nosniff",
  });
  res.end(await readFile(file));
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    /* block traversal outside dist */
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    let file = path.join(DIST, rel);
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) {
      file = path.join(file, "index.html");
      info = await stat(file).catch(() => null);
    }
    if (!info) {
      const notFound = path.join(DIST, "404.html");
      const body = await readFile(notFound);
      res.writeHead(404, { "content-type": TYPES[".html"] });
      res.end(body);
      return;
    }

    /* Range requests, so <video> and <audio> can seek and report a real
       duration. Without them Chrome treats a media file as an unbounded
       stream: duration comes back as Infinity and seeking silently fails.
       This mirrors what Vercel does for static files. */
    const range = req.headers.range;
    const type = TYPES[path.extname(file).toLowerCase()];
    if (range && (type === "video/mp4" || type === "audio/wav")) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : info.size - 1;
      res.writeHead(206, {
        "content-type": type,
        "content-range": `bytes ${start}-${end}/${info.size}`,
        "accept-ranges": "bytes",
        "content-length": end - start + 1,
      });
      res.end((await readFile(file)).subarray(start, end + 1));
      return;
    }

    await send(res, 200, file);
  } catch (err) {
    if (!res.headersSent) res.writeHead(500);
    res.end("Server error: " + err.message);
  }
}).listen(PORT, () => {
  console.log(`\nServing dist/ at http://localhost:${PORT}\nPress Ctrl+C to stop.\n`);
});
