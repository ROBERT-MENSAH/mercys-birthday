/**
 * Repair pass for the static <img> tags in index.html.
 *
 * The srcset is the source of truth. For every <img>, read the slug out of its
 * srcset, look that slug up in js/media-manifest.json, and restore:
 *   - src      the progressive JPEG fallback for that slug
 *   - srcset   the WebP ladder
 *   - width/height  the intrinsic size, so layout is reserved before decode
 *
 * Also re-syncs the hero <link rel="preload"> to the same entry, because a
 * preload pointing at a file nothing requests wastes bandwidth and logs a
 * console warning.
 *
 * Idempotent: safe to run repeatedly.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HTML = path.join(ROOT, "index.html");
const MANIFEST = path.join(ROOT, "js", "media-manifest.json");

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error("js/media-manifest.json is missing. Run: python tools/optimize-images.py");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

  // Reverse index: slug -> entry, built from the image entries only.
  const bySlug = {};
  Object.keys(manifest).forEach((key) => {
    const entry = manifest[key];
    if (entry && entry.slug && entry.srcset !== false) bySlug[entry.slug] = entry;
  });

  let html = fs.readFileSync(HTML, "utf8");
  let fixed = 0;
  let unmatched = 0;

  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    // Pull the slug from the first candidate in the existing srcset.
    const match = tag.match(/assets\/img\/([a-z0-9-]+)-\d+\.webp/);
    if (!match) { unmatched++; return tag; }
    const entry = bySlug[match[1]];
    if (!entry) { unmatched++; return tag; }

    const srcset = entry.widths.map((w) => `assets/img/${entry.slug}-${w}.webp ${w}w`).join(", ");

    let out = tag;
    // Replace or insert src.
    if (/\ssrc="[^"]*"/i.test(out)) {
      out = out.replace(/\ssrc="[^"]*"/i, ` src="${entry.src}"`);
    } else {
      out = out.replace(/<img/i, `<img src="${entry.src}"`);
    }
    // Replace or insert srcset.
    if (/\ssrcset="[^"]*"/i.test(out)) {
      out = out.replace(/\ssrcset="[^"]*"/i, ` srcset="${srcset}"`);
    } else {
      out = out.replace(new RegExp(`(\\ssrc="${entry.src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")`),
        `$1 srcset="${srcset}"`);
    }
    // Intrinsic size, so the browser reserves space and avoids layout shift.
    if (/\swidth="/i.test(out)) out = out.replace(/\swidth="\d+"/i, ` width="${entry.width}"`);
    else out = out.replace(/<img/i, `<img width="${entry.width}"`);
    if (/\sheight="/i.test(out)) out = out.replace(/\sheight="\d+"/i, ` height="${entry.height}"`);
    else out = out.replace(/<img/i, `<img height="${entry.height}"`);

    // Void element: never emit a closing tag.
    out = out.replace(/\s*<\/\s*img\s*>\s*$/i, "");
    out = out.replace(/\s*\/?>$/, ">");
    if (!/\sdecoding=/i.test(out)) out = out.replace(/<img/i, `<img decoding="async"`);

    fixed++;
    return out;
  });

  fs.writeFileSync(HTML, html, "utf8");

  // Re-sync the hero preload with the real entry.
  const hero = bySlug["me-currently"];
  if (hero) {
    const heroSrcset = hero.widths.map((w) => `assets/img/${hero.slug}-${w}.webp ${w}w`).join(", ");
    html = html.replace(/<link rel="preload" as="image"[\s\S]*?>/i,
      `<link rel="preload" as="image" href="${hero.src}"\n` +
      `        imagesrcset="${heroSrcset}" imagesizes="100vw" fetchpriority="high">`);
    fs.writeFileSync(HTML, html, "utf8");
    console.log(`Hero preload synced -> ${hero.src}`);
  }

  console.log(`Images repaired: ${fixed}`);
  if (unmatched) console.log(`Left untouched: ${unmatched}`);
}

main();
