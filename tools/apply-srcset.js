/**
 * Rewrites the static <img> tags in index.html so they carry a responsive
 * srcset / sizes pair, using the ladder described by js/media-manifest.json.
 *
 * The build step that produces that manifest is tools/optimize-images.py.
 * Run in order:
 *     python tools/optimize-images.py
 *     node tools/apply-srcset.js
 *
 * Existing attributes (alt, class, loading, fetchpriority) are preserved.
 * Width/height are added so the browser can reserve layout space and avoid
 * content shift. The original `src` is kept as the JPEG fallback target.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HTML = path.join(ROOT, "index.html");
const MANIFEST = path.join(ROOT, "js", "media-manifest.json");

/**
 * Layout roles, derived from the classes each <img> sits inside. The `sizes`
 * attribute tells the browser how wide the image will actually render, which is
 * what makes srcset selection correct rather than merely present.
 */
function sizesFor(classes, attrClass) {
  const all = (classes + " " + attrClass).toLowerCase();
  if (all.includes("prologue") || all.includes("hero")) return "100vw";
  if (all.includes("birthday-letter-invitation") || all.includes("montage")) {
    return "(max-width: 640px) 92vw, 45vw";
  }
  if (all.includes("sibling") || all.includes("vault") || all.includes("gallery")) {
    return "(max-width: 640px) 45vw, (max-width: 1100px) 30vw, 24vw";
  }
  if (all.includes("frame") || all.includes("card") || all.includes("portrait")
      || all.includes("stage") || all.includes("best-friend")) {
    return "(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 38vw";
  }
  return "(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 40vw";
}

function buildSrcset(entry) {
  return entry.widths
    .map((w) => `assets/img/${entry.slug}-${w}.webp ${w}w`)
    .join(", ");
}

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error("js/media-manifest.json is missing.");
    console.error("Run: python tools/optimize-images.py");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let html = fs.readFileSync(HTML, "utf8");

  const baseName = (src) => src.split("/").pop().split("?")[0];

  // Match a whole <img ...> tag, then pull out just the attributes we need.
  const tagPattern = /<img\b[^>]*>/gi;
  let rewritten = 0;
  let skipped = 0;

  html = html.replace(tagPattern, (tag) => {
    if (/\ssrcset=/i.test(tag)) { skipped++; return tag; }

    const srcMatch = tag.match(/\ssrc="([^"]+)"/i);
    if (!srcMatch) { skipped++; return tag; }
    const originalSrc = srcMatch[1];
    const entry = manifest[baseName(originalSrc)];
    if (!entry) { skipped++; return tag; }

    // Find the container's classes so `sizes` reflects the real layout slot.
    const index = html.indexOf(tag);
    const before = html.slice(Math.max(0, index - 400), index);
    const openers = before.match(/<(figure|div|span|aside|section)\b[^>]*>/gi) || [];
    const containerClasses = openers
      .slice(-3)
      .map((o) => (o.match(/\sclass="([^"]*)"/i) || [, ""])[1])
      .join(" ");

    const attrClass = (tag.match(/\sclass="([^"]*)"/i) || [, ""])[1];
    const sizes = sizesFor(containerClasses, attrClass);
    const srcset = buildSrcset(entry);
    const fallback = entry.src;

    let out = tag;
    // Swap the original path for the generated JPEG fallback of the same slug.
    out = out.replace(/\ssrc="[^"]+"/i, ` src="${fallback}"`);
    // HTML void element: self-close it rather than emitting a </img> end tag.
    out = out.replace(/\s*\/?>$/, ` width="${entry.width}" height="${entry.height}">`);
    // Insert the responsive pair after src.
    out = out.replace(
      new RegExp(`(\\ssrc="${fallback.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")`),
      `$1 srcset="${srcset}" sizes="${sizes}"`
    );
    if (!/\sdecoding=/i.test(out)) out = out.replace(/<img/i, `<img decoding="async"`);
    rewritten++;
    return out;
  });

  fs.writeFileSync(HTML, html, "utf8");

  /* Keep the hero preload in step with what the markup actually requests.
     A preload that points at a file nothing fetches wastes bandwidth and
     triggers a console warning; this keeps the two in lockstep. */
  const heroEntry = manifest["ME CURRENTLY.jpg"];
  if (heroEntry) {
    const preloadPattern = /<link rel="preload" as="image"[\s\S]*?>/i;
    const existing = html.match(preloadPattern);
    if (existing) {
      const replacement =
        `<link rel="preload" as="image" href="${heroEntry.src}"\n` +
        `        imagesrcset="${buildSrcset(heroEntry)}" imagesizes="100vw" fetchpriority="high">`;
      html = html.replace(preloadPattern, replacement);
      fs.writeFileSync(HTML, html, "utf8");
      console.log(`Hero preload synced -> ${heroEntry.src}`);
    }
  }

  console.log(`Responsive <img> tags rewritten: ${rewritten}`);
  if (skipped) console.log(`Left untouched (decorative or already sized): ${skipped}`);
}

main();
