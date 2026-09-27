/**
 * Post-build verification.
 *
 *   node tools/check.mjs
 *
 * Fails loudly on anything that would break in a browser:
 *   - internal links and asset references that do not resolve
 *   - <img> without alt text
 *   - <img> without width/height-ish aspect framing or lazy loading
 *   - <video> present in initial HTML (videos must be poster-first)
 *   - duplicate element ids
 *   - unescaped stray template output / unresolved placeholders
 *   - pages missing a <title>, description, or viewport
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const issues = [];
const add = (page, msg) => issues.push(`${page}: ${msg}`);

/** every .html file, as dist-relative posix paths */
function htmlFiles(dir = DIST, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, acc);
    else if (entry.endsWith(".html")) acc.push(path.relative(DIST, full).replace(/\\/g, "/"));
  }
  return acc;
}

const pages = htmlFiles();

/* resolve a relative URL the way a browser would, from the page's folder */
function resolve(page, url) {
  const baseDir = path.posix.dirname(page);
  return path.posix.normalize(path.posix.join(baseDir, url));
}

for (const page of pages) {
  const html = readFileSync(path.join(DIST, page), "utf8");
  const rel = page === "index.html" ? "./" : page;

  /* ---- required head tags ---- */
  if (!/<title>[^<]{3,}<\/title>/.test(html)) add(page, "missing or empty <title>");
  if (!/<meta name="description" content="[^"]{10,}"/.test(html)) add(page, "missing or thin meta description");
  if (!/name="viewport"/.test(html)) add(page, "missing viewport meta");
  if (!/<html lang="/.test(html)) add(page, "missing lang attribute");

  /* ---- unresolved template placeholders ---- */
  if (/\$\{|\bundefined\b|\[object Object\]|NaN/.test(html)) {
    const bad = html.match(/.*(?:\$\{|\bundefined\b|\[object Object\]|NaN).*/);
    add(page, `unresolved placeholder: ${bad ? bad[0].trim().slice(0, 110) : "?"}`);
  }

  /* ---- duplicate ids ---- */
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) add(page, `duplicate id(s): ${[...new Set(dupes)].join(", ")}`);

  /* ---- images ---- */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    /* the lightbox <img> has no src until JS opens it - nothing to check */
    if (!/\ssrc="/.test(tag)) continue;
    if (!/\salt="/.test(tag)) add(page, `<img> without alt: ${tag.slice(0, 90)}`);
    if (!/\bloading="/.test(tag)) add(page, `<img> without loading attr: ${tag.slice(0, 90)}`);
  }

  /* ---- videos must never be in the initial HTML ---- */
  if (/<video\b/.test(html)) add(page, "<video> present in initial HTML (videos must load on interaction)");

  /* ---- every video card must carry a playable source ---- */
  const cards = [...html.matchAll(/data-video="([^"]+)"[^>]*data-src="([^"]+)"/g)];
  for (const [, id, src] of cards) {
    const target = resolve(page, decodeURIComponent(src));
    if (!existsSync(path.join(DIST, target))) {
      add(page, `video "${id}" points at missing file ${src} -> ${target}`);
    }
  }

  /* ---- video posters ---- */
  for (const m of html.matchAll(/data-poster="([^"]+)"/g)) {
    const target = resolve(page, decodeURIComponent(m[1]));
    if (!existsSync(path.join(DIST, target))) add(page, `poster missing: ${m[1]}`);
  }

  /* ---- links and assets ---- */
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|tel:|mailto:|data:|#)/.test(url)) continue;
    const clean = url.split("#")[0].split("?")[0];
    if (!clean) continue;
    const target = resolve(page, decodeURIComponent(clean));
    if (!existsSync(path.join(DIST, target))) {
      add(page, `broken reference: ${url} -> ${target}`);
    }
  }

  /* ---- srcset candidates ---- */
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const cand of m[1].split(",")) {
      const file = cand.trim().split(/\s+/)[0];
      if (!file) continue;
      const target = resolve(page, decodeURIComponent(file));
      if (!existsSync(path.join(DIST, target))) add(page, `srcset points at missing file: ${file}`);
    }
  }

  /* ---- media frames must never be empty ----
     A cover that fails to resolve used to render a blank rounded box, which is
     easy to miss by eye. Catch it here instead. */
  for (const m of html.matchAll(/<div class="(hero__frame|chcard__media|chap__media)">([\s\S]*?)<\/div>/g)) {
    if (!/<img\b/.test(m[2])) add(page, `empty media frame (.${m[1]}) - cover did not resolve`);
  }

  /* ---- no interactive content nested inside a link ---- */
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    if (/<button\b/.test(m[1])) add(page, "<button> nested inside <a> (invalid HTML, fires both zoom and navigation)");
  }

  /* ---- accessibility basics ---- */
  const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
  for (const b of buttons) {
    const hasLabel = /aria-label=/.test(b) || /aria-labelledby=/.test(b) || /title=/.test(b);
    const empty = /<button\b[^>]*>\s*<\/button>/.test(b);
    if (empty) add(page, "empty <button> with no accessible name");
  }
  if (/<html[^>]*>/.test(html) && !/class="sprite"/.test(html)) add(page, "icon sprite missing");
}

/* ---- global checks ---- */
if (!existsSync(path.join(DIST, "manifest.webmanifest"))) issues.push("global: manifest.webmanifest missing");
if (!existsSync(path.join(DIST, "sw.js"))) issues.push("global: sw.js missing");
for (const i of ["favicon-32.png", "apple-touch-icon.png", "app-icon-192.png", "app-icon-512.png"]) {
  if (!existsSync(path.join(DIST, "icons", i))) issues.push(`global: icons/${i} missing`);
}

/* Mojibake guard. A character that was UTF-8 encoded and then decoded as
   latin-1 survives in the source as several odd characters, and it reaches
   the page as visible garbage (e.g. "Friend â€¢" instead of "Friend •").
   These are the tell-tale C1 range, replacement char, and smart-quote
   sequences that only ever appear when that round-trip has happened. */
const MOJIBAKE = /[Â-ÿ]|â(?:€|™|œ|ž|„|“|”|€¦|€ |€¢|€³|€¤|€¦)|Ã©|Ã¨|Ã¡|Ã­|ï¿½/;
for (const page of pages) {
  const html = readFileSync(path.join(DIST, page), "utf8");
  const m = html.match(MOJIBAKE);
  if (m) {
    const i = Math.max(0, m.index - 30);
    add(page, `possible mojibake "${m[0]}" near: ...${html.slice(i, m.index + 40).replace(/\s+/g, " ")}...`);
  }
}

/* ---- report ---- */
if (issues.length) {
  console.error(`\nFAILED - ${issues.length} issue(s):\n`);
  issues.slice(0, 60).forEach((i) => console.error("  - " + i));
  if (issues.length > 60) console.error(`  ... and ${issues.length - 60} more`);
  console.error("");
  process.exit(1);
}

console.log(`\nOK - ${pages.length} pages checked, no issues.\n`);
