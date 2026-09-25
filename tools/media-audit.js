/**
 * Audit js/media-manifest.json.
 *
 * Two things matter here:
 *   1. Every video must resolve to a real poster file on disk.
 *   2. The manifest must not contain duplicate keys. JSON silently keeps the
 *      last value for a repeated key, so a collision would quietly drop a
 *      poster without any error anywhere.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "js", "media-manifest.json");

const raw = fs.readFileSync(MANIFEST, "utf8");

// Detect duplicate top-level keys by scanning the raw text, because
// JSON.parse() has already discarded them by the time we get the object.
const keyPattern = /^  "([^"]+)":/gm;
const seen = new Map();
const duplicates = [];
let match;
while ((match = keyPattern.exec(raw)) !== null) {
  const key = match[1];
  seen.set(key, (seen.get(key) || 0) + 1);
  if (seen.get(key) === 2) duplicates.push(key);
}

const manifest = JSON.parse(raw);
let problems = 0;

console.log("Duplicate keys in manifest: " + (duplicates.length ? duplicates.join(", ") : "none"));
if (duplicates.length) problems++;

const images = Object.keys(manifest).filter((k) => !k.endsWith(".mp4"));
const videos = Object.keys(manifest).filter((k) => k.endsWith(".mp4"));
console.log(`Entries: ${images.length} images, ${videos.length} videos`);

let missingPoster = 0;
videos.forEach((key) => {
  const poster = manifest[key].poster;
  if (!poster) {
    console.log(`  MISSING poster: ${key}`);
    missingPoster++;
    return;
  }
  if (!fs.existsSync(path.join(ROOT, poster))) {
    console.log(`  POSTER NOT ON DISK: ${key} -> ${poster}`);
    missingPoster++;
  }
});
if (missingPoster) problems++;

let missingSizes = 0;
images.forEach((key) => {
  const entry = manifest[key];
  if (!entry.src || !fs.existsSync(path.join(ROOT, entry.src))) {
    console.log(`  FALLBACK NOT ON DISK: ${key} -> ${entry.src}`);
    missingSizes++;
    return;
  }
  (entry.widths || []).forEach((w) => {
    const file = path.join(ROOT, "assets", "img", `${entry.slug}-${w}.webp`);
    if (!fs.existsSync(file)) {
      console.log(`  SIZE NOT ON DISK: ${key} -> ${entry.slug}-${w}.webp`);
      missingSizes++;
    }
  });
});
if (missingSizes) problems++;

if (problems) {
  console.log(`\nMANIFEST AUDIT FAILED (${problems} problem${problems > 1 ? "s" : ""})`);
  process.exitCode = 1;
} else {
  console.log("\nMANIFEST AUDIT PASSED");
  console.log(`  ${images.length} image ladders resolve, ${videos.length} posters resolve`);
}
