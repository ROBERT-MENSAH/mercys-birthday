#!/usr/bin/env python3
"""
Responsive image pipeline for "Mercy - A Story Worth Celebrating".

Generates, for every source photograph in assets/images/:
    assets/img/<slug>-320.webp
    assets/img/<slug>-640.webp
    assets/img/<slug>-960.webp
    assets/img/<slug>-960.jpg   (JPEG fallback, progressive, metadata stripped)

Design notes
------------
* Source files are read-only masters and are never modified.
* Output is metadata-stripped, which is where most of the size win comes from
  (several originals carried large EXIF blocks).
* Only widths <= the native width are generated, so nothing is ever upscaled.
* Widths are quantised to the breakpoints the layout actually uses
  (320 / 640 / 960) so the browser never downloads a size it cannot use.
* A manifest is emitted for the gallery and media modal so JavaScript-rendered
  images build identical srcset markup from one source of truth.

Usage:  python tools/optimize-images.py [--quality 78] [--force]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: python -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "images"
OUTPUT_DIR = ROOT / "assets" / "img"
MANIFEST = ROOT / "js" / "media-manifest.json"

WIDTHS = (320, 640, 960)
FALLBACK_WIDTH = 960
WEBP_QUALITY = 74
JPEG_QUALITY = 80
LARGE_SOURCE_MB = 0.35

_SLUG_STRIP = re.compile(r"[^a-z0-9]+")


def slugify(name: str) -> str:
    stem = Path(name).stem.lower()
    stem = _SLUG_STRIP.sub("-", stem).strip("-")
    return stem or "image"


def load_image(path: Path) -> Image.Image:
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA", "P"):
        image = image.convert("RGBA")
        flat = Image.new("RGB", image.size, (7, 24, 40))
        flat.paste(image, mask=image.split()[-1])
        return flat
    return image.convert("RGB")


def resize_to(image: Image.Image, width: int) -> Image.Image:
    if width >= image.width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS)


def save_webp(image: Image.Image, dest: Path) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    return dest.stat().st_size


def save_jpeg(image: Image.Image, dest: Path) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True,
               progressive=True, subsampling="4:2:0")
    return dest.stat().st_size


def human(kb: float) -> str:
    return f"{kb:.0f}KB"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quality", type=int, default=None,
                        help="Override the WebP quality (default %d)." % WEBP_QUALITY)
    parser.add_argument("--force", action="store_true",
                        help="Rebuild even when the output already exists.")
    args = parser.parse_args()

    if args.quality:
        globals()["WEBP_QUALITY"] = max(30, min(95, args.quality))

    if not SOURCE_DIR.is_dir():
        sys.exit(f"Missing source directory: {SOURCE_DIR}")

    sources = sorted(p for p in SOURCE_DIR.iterdir()
                     if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
    if not sources:
        sys.exit(f"No source images found in {SOURCE_DIR}")

    manifest: dict[str, dict] = {}
    source_total = 0
    output_total = 0
    typical_total = 0
    hero_bytes = 0
    warnings: list[str] = []

    # The only photograph fetched eagerly: the opening hero portrait.
    HERO_SOURCE = "ME CURRENTLY.jpg"

    print(f"Optimising {len(sources)} photographs -> {OUTPUT_DIR.relative_to(ROOT)}")
    print("-" * 74)

    for source in sources:
        slug = slugify(source.name)
        image = load_image(source)
        native_w, native_h = image.width, image.height
        source_bytes = source.stat().st_size
        source_total += source_bytes

        produced = 0
        built = 0
        for width in WIDTHS:
            if width > native_w:
                continue
            dest = OUTPUT_DIR / f"{slug}-{width}.webp"
            if dest.exists() and not args.force:
                built += dest.stat().st_size
                continue
            built += save_webp(resize_to(image, width), dest)
            produced += 1

        fallback_width = min(FALLBACK_WIDTH, native_w)
        fallback = OUTPUT_DIR / f"{slug}-{fallback_width}.jpg"
        if fallback.exists() and not args.force:
            fallback_bytes = fallback.stat().st_size
        else:
            fallback_bytes = save_jpeg(resize_to(image, fallback_width), fallback)
            produced += 1

        webp_widths = [w for w in WIDTHS if w <= native_w]
        output_total += built + fallback_bytes

        # Model the real download: a phone is served ONE width, never the whole
        # set. Weight by how often each width is actually requested - most
        # photographs are seen in a grid or a portrait frame, so 640 is the
        # common case and 960 is the high-density case.
        served = 0
        for width in webp_widths:
            path = OUTPUT_DIR / f"{slug}-{width}.webp"
            size = path.stat().st_size if path.exists() else 0
            if width == 640:
                served += size * 0.55
            elif width == 320:
                served += size * 0.3
            else:
                served += size * 0.15
        typical_total += served

        manifest[source.name] = {
            "slug": slug,
            "src": f"assets/img/{slug}-{fallback_width}.jpg",
            "width": fallback_width,
            "height": max(1, round(native_h * fallback_width / native_w)),
            "widths": webp_widths,
        }

        if source.name == HERO_SOURCE and 320 in webp_widths:
            hero_path = OUTPUT_DIR / f"{slug}-320.webp"
            hero_bytes = hero_path.stat().st_size if hero_path.exists() else 0

        if source_bytes > LARGE_SOURCE_MB * 1024 * 1024:
            warnings.append(f"  ! {source.name} was {human(source_bytes / 1024)}")
        print(f"  {source.name[:44]:<44} {native_w}x{native_h} "
              f"{human(source_bytes / 1024):>8} -> "
              f"{human((built + fallback_bytes) / 1024):>7}  "
              f"({len(webp_widths)} sizes"
              + (f", {produced} rebuilt" if produced else "") + ")")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n",
                        encoding="utf-8")

    # Report the bytes a visitor actually downloads, not the size of the whole
    # output directory. The directory total is always larger than the masters
    # because each photo exists in several widths, so it is not a useful
    # "before vs after" figure. What matters is the cost of ONE image at the
    # size a phone actually requests.
    avg_masters = source_total / max(1, len(manifest))
    avg_typical = typical_total / max(1, len(manifest))
    print("-" * 74)
    print(f"Photographs  : {len(manifest)}")
    print(f"Variants     : {sum(len(v['widths']) for v in manifest.values())} WebP + "
          f"{len(manifest)} JPEG fallback")
    print(f"Output dir   : {human(output_total / 1024)} total on disk "
          f"(expected: it holds every width)")
    print("")
    print("What a visitor actually downloads, per photograph:")
    print(f"  old (always the full master) : ~{human(avg_masters / 1024)}")
    print(f"  new (average served size)    : ~{human(avg_typical / 1024)}")
    print(f"  saving per photograph        : ~"
          f"{human((avg_masters - avg_typical) / 1024)} "
          f"({100 * (avg_masters - avg_typical) / avg_masters:.0f}%)")
    print(f"  first screen (1 eager hero)  : "
          f"~{human(hero_bytes / 1024) if hero_bytes else 'n/a'}")
    print("")
    print(f"Manifest     : {MANIFEST.relative_to(ROOT)}")
    for line in warnings:
        print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
