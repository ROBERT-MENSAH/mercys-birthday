/**
 * Generates the app icons.
 *
 *   node tools/icons.mjs
 *
 * The previous icons were a large "M" stamped over Mercy's face. These
 * replace them with an abstract pink monogram that obscures no photograph,
 * written with a tiny built-in PNG encoder so the project keeps zero
 * dependencies.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "icons");

/* ------------------------------------------------------------------ PNG */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** rgba: Buffer of size w*h*4 */
function encodePng(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA

  /* filter type 0 (none) on every scanline */
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------- drawing */
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a, b, t) => a + (b - a) * t;
const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

/** signed distance to a rounded rectangle, negative inside */
const sdRoundRect = (px, py, cx, cy, hw, hh, r) => {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const t = clamp((wx * vx + wy * vy) / (vx * vx + vy * vy), 0, 1);
  return Math.hypot(wx - vx * t, wy - vy * t);
};


/**
 * The mark: a deep navy-to-pink gradient tile with a soft rose glow, a gold
 * ring, and a serif "M" monogram. Abstract, so it never covers a face.
 */
function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = size;
  const NAVY = hex("#0B1026");
  const NAVY2 = hex("#1B2450");
  const ROSE2 = hex("#F75FA5");
  const GOLD = hex("#E7B168");

  const strokes = [
    [0.285, 0.695, 0.285, 0.315],
    [0.285, 0.315, 0.5, 0.545],
    [0.5, 0.545, 0.715, 0.315],
    [0.715, 0.315, 0.715, 0.695],
  ];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x + 0.5) / S;
      const v = (y + 0.5) / S;

      let r = mix(NAVY[0], NAVY2[0], v);
      let g = mix(NAVY[1], NAVY2[1], v);
      let b = mix(NAVY[2], NAVY2[2], v);

      const gd = Math.hypot(u - 0.28, v - 0.24);
      const glow = Math.max(0, 1 - gd / 0.62) ** 2.1;
      r = mix(r, ROSE2[0], glow * 0.95);
      g = mix(g, ROSE2[1], glow * 0.95);
      b = mix(b, ROSE2[2], glow * 0.95);

      const rd = Math.abs(Math.hypot(u - 0.5, v - 0.5) - 0.395);
      const ring = 1 - clamp(rd / 0.013, 0, 1);
      if (ring > 0) {
        r = mix(r, GOLD[0], ring * 0.9);
        g = mix(g, GOLD[1], ring * 0.9);
        b = mix(b, GOLD[2], ring * 0.9);
      }

      let d = Infinity;
      for (const [ax, ay, bx, by] of strokes) {
        d = Math.min(d, segDist(u, v, ax, ay, bx, by));
      }
      const ink = 1 - clamp((d - 0.042) / 0.011, 0, 1);
      if (ink > 0) {
        r = mix(r, 255, ink);
        g = mix(g, 255, ink);
        b = mix(b, 255, ink);
      }

      const o = (y * S + x) * 4;
      rgba[o] = Math.round(clamp(r, 0, 255));
      rgba[o + 1] = Math.round(clamp(g, 0, 255));
      rgba[o + 2] = Math.round(clamp(b, 0, 255));
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

/** Maskable icons fill the whole canvas; the platform applies the mask. */
function drawMaskable(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = size;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x + 0.5) / S;
      const v = (y + 0.5) / S;
      const t = clamp((Math.hypot(u - 0.5, v - 0.5) - 0.05) / 0.6, 0, 1);
      const o = (y * S + x) * 4;
      rgba[o] = Math.round(mix(11, 247, t));
      rgba[o + 1] = Math.round(mix(16, 95, t));
      rgba[o + 2] = Math.round(mix(38, 165, t));
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

/** Round the corners of an opaque tile for the "any" purpose icons. */
function roundCorners(rgba, size, radius) {
  const out = Buffer.from(rgba);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = sdRoundRect(x + 0.5, y + 0.5, size / 2, size / 2, size / 2, size / 2, radius);
      const o = (y * size + x) * 4;
      out[o + 3] = Math.round(255 * clamp(0.5 - d, 0, 1));
    }
  }
  return out;
}

mkdirSync(OUT, { recursive: true });

for (const t of [
  { file: "favicon-32.png", size: 32, radius: 7 },
  { file: "apple-touch-icon.png", size: 180, radius: 0 },
  { file: "app-icon-192.png", size: 192, radius: 42 },
  { file: "app-icon-512.png", size: 512, radius: 112 },
]) {
  const base = drawIcon(t.size);
  const final = t.radius > 0 ? roundCorners(base, t.size, t.radius) : base;
  writeFileSync(path.join(OUT, t.file), encodePng(final, t.size, t.size));
  console.log("  " + t.file.padEnd(24) + t.size + "x" + t.size);
}

for (const size of [192, 512]) {
  const file = `app-icon-maskable-${size}.png`;
  writeFileSync(path.join(OUT, file), encodePng(drawMaskable(size), size, size));
  console.log("  " + file.padEnd(24) + size + "x" + size);
}

console.log("\nIcons written to " + OUT + "\n");
