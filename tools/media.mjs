/**
 * Media resolver — turns content ids into real, verified file URLs.
 *
 * The build scans `img/` and `videos/` so that a missing or renamed asset
 * fails the build loudly instead of shipping a broken <img>.
 */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { photos, videos } from "./content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imgFiles = readdirSync(path.join(root, "img"));
const videoFiles = readdirSync(path.join(root, "videos")).filter((f) =>
  /\.(mp4|webm|mov|m4v)$/i.test(f),
);

export const problems = [];

/* "MY VIDEO  2.mp4" -> "my-video--2"  (every space becomes one dash) */
export const slugify = (name) =>
  path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/\s/g, "-");

/** All generated sizes that actually exist on disk, smallest first. */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const variantsFor = (id) => {
  const re = new RegExp(`^${escapeRe(id)}-(\\d+)\\.(webp|jpe?g)$`);
  const found = [];
  for (const f of imgFiles) {
    const m = f.match(re);
    if (m) found.push({ w: Number(m[1]), ext: m[2] === "jpeg" ? "jpg" : m[2] });
  }
  // webp first at equal widths, then ascending width
  return found.sort((a, b) => a.w - b.w || (a.ext === "webp" ? -1 : 1));
};

export const media = { photos: {}, videos: {} };

for (const p of photos) {
  const variants = variantsFor(p.id);
  if (!variants.length) {
    problems.push(`No image files found for photo id "${p.id}"`);
    continue;
  }
  media.photos[p.id] = {
    ...p,
    variants,
    largest: variants[variants.length - 1],
    src: `img/${p.id}-${variants[variants.length - 1].w}.${variants[variants.length - 1].ext}`,
    srcset: variants.map((v) => `img/${p.id}-${v.w}.${v.ext} ${v.w}w`).join(", "),
    sizes: "(max-width: 720px) 92vw, 46vw",
  };
}

for (const v of videos) {
  if (!videoFiles.includes(v.file)) problems.push(`Missing video file "${v.file}" (id: ${v.id})`);
  const slug = slugify(v.file);
  const posterFile = `img/${slug}-poster.webp`;
  const hasPoster = existsSync(path.join(root, posterFile));
  media.videos[v.id] = {
    ...v,
    slug,
    src: `videos/${v.file}`,
    poster: hasPoster ? posterFile : v.poster && media.photos[v.poster] ? media.photos[v.poster].src : null,
    posterAsset: hasPoster ? posterFile : v.poster || null,
  };
}

export const photo = (id) => media.photos[id];
export const video = (id) => media.videos[id];

/**
 * A chapter cover. Chapters may be led by a photograph or by a video, so this
 * resolves either to the photo record or to the video's poster frame. Returns
 * a photo-shaped object so it can be handed straight to picture().
 * Returns null if the id is unknown or the video has no poster.
 */
export function cover(id) {
  if (media.photos[id]) return media.photos[id];
  const v = media.videos[id];
  if (v && v.poster) {
    return {
      id,
      group: v.group,
      caption: v.title,
      alt: v.alt,
      src: v.poster,
      srcset: null,
      sizes: "100vw",
      isVideoCover: true,
    };
  }
  return null;
}

/** `hhmmss` timestamp of a local Date, used for cache-busting the build. */
export const stamp = (d) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join("");
