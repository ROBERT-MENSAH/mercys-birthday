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
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const send = async (res, code, file) => {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(code, {
    "content-type": TYPES[ext] || "application/octet-stream",
    "cache-control": [".html", ".css", ".js"].includes(ext) ? "no-cache" : "public, max-age=3600",
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

    /* range requests so <video> can seek */
    const range = req.headers.range;
    if (range && TYPES[path.extname(file).toLowerCase()] === "video/mp4") {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : info.size - 1;
      res.writeHead(206, {
        "content-type": "video/mp4",
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
