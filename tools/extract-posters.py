#!/usr/bin/env python3
"""
Video poster extraction for "Mercy - A Story Worth Celebrating".

Every clip in this project is large (the folder is roughly 33MB), so none of
them may be preloaded. A video tile therefore has to show something useful
before playback starts. This script grabs ONE real frame from each clip and
writes a small WebP poster, used by the gallery thumbnails and as the
`poster` attribute on every <video>.

Why a real frame matters: the gallery previously borrowed one unrelated
photograph (ME CURRENTLY) as the poster for unrelated clips, so a visitor
could not tell what a memory contained before opening it.

Frame choice: about a third of the way in. The opening frames of these phone
clips are often black or mid-blink; a later frame reliably shows Mercy.

ffmpeg is resolved from imageio_ffmpeg when it is not already on PATH:
    python -m pip install imageio-ffmpeg

Usage:  python tools/extract-posters.py [--at 0.34] [--force]
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "videos"
POSTER_DIR = ROOT / "assets" / "img"
MANIFEST = ROOT / "js" / "media-manifest.json"

POSTER_WIDTH = 640  # A poster only ever reads as a thumbnail.
WEBP_QUALITY = 72
DEFAULT_AT = 0.34
DEFAULT_CANDIDATES = 7


def score_frame(path: Path):
    """
    Rate a candidate frame so the best one is chosen automatically.

    A single fixed sample point is not reliable across these clips: some open on
    a black frame, some catch a blink, and some land on a heavy face filter.
    This scores three things and sums them:

      sharpness  - mean absolute Laplacian response. A blurred or heavily
                   filtered frame scores low; a crisp one scores high.
      brightness - penalises near-black frames, which are common at the start
                   of a phone recording, and mildly penalises blown-out frames.
      contrast   - reward, because a flat grey frame tells the visitor nothing.

    Returns a float, or None if the frame could not be read.
    """
    try:
        from PIL import Image, ImageFilter, ImageStat
    except ImportError:
        return None
    try:
        with Image.open(path) as image:
            grey = image.convert("L")
            if grey.width > 480:
                grey = grey.resize((480, round(grey.height * 480 / grey.width)))
            stat = ImageStat.Stat(grey)
            mean = stat.mean[0]
            stddev = stat.stddev[0]
            edges = grey.filter(ImageFilter.FIND_EDGES)
            sharpness = ImageStat.Stat(edges).mean[0]
    except Exception:
        return None

    # Reward detail and contrast.
    value = sharpness * 1.6 + stddev * 0.8
    # Punish darkness hard: mean brightness of 0 is a black frame.
    if mean < 55:
        value *= 0.15
    elif mean < 85:
        value *= 0.6
    # Mildly punish blown-out frames.
    if mean > 215:
        value *= 0.7
    return value



def find_ffmpeg():
    """Locate ffmpeg: PATH first, then the imageio_ffmpeg wheel."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def probe_duration(ffmpeg: str, path: Path):
    """Read the clip duration in seconds, or None if it cannot be determined."""
    try:
        result = subprocess.run(
            [ffmpeg, "-hide_banner", "-i", str(path)],
            capture_output=True, text=True, errors="ignore", timeout=60,
        )
    except Exception:
        return None
    # ffmpeg has no "print duration" flag, so read it from the banner.
    for line in (result.stderr or "").splitlines():
        if "Duration:" in line:
            stamp = line.split("Duration:", 1)[1].split(",")[0].strip()
            try:
                hours, minutes, seconds = stamp.split(":")
                return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
            except ValueError:
                return None
    return None


def extract_frame(ffmpeg: str, clip: Path, dest: Path, timestamp: float) -> bool:
    """Write one scaled WebP frame from the clip at the given timestamp."""
    try:
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error",
             "-ss", f"{timestamp:.2f}", "-i", str(clip),
             "-frames:v", "1",
             # Seeking before -i is the fast path; it is accurate enough for a
             # poster and avoids decoding the whole clip.
             "-vf", f"scale={POSTER_WIDTH}:-2:flags=lanczos",
             "-c:v", "libwebp", "-quality", str(WEBP_QUALITY),
             "-y", str(dest)],
            capture_output=True, timeout=120, check=True,
        )
    except Exception:
        return False
    return dest.exists() and dest.stat().st_size > 0


def slugify(name: str) -> str:
    cleaned = "".join(c if c.isalnum() else "-" for c in Path(name).stem.lower())
    return "-".join(cleaned.split("-")).strip("-") or "video"


def record(manifest: dict, clip: Path, poster: Path, size: int) -> None:
    """Store the poster path on the clip's own manifest entry."""
    entry = manifest.setdefault(clip.name, {})
    entry["type"] = "video"
    entry["poster"] = poster.relative_to(ROOT).as_posix()
    entry["posterBytes"] = size


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--at", type=float, default=DEFAULT_AT,
                        help="Fallback sample fraction (default %.2f)." % DEFAULT_AT)
    parser.add_argument("--candidates", type=int, default=DEFAULT_CANDIDATES,
                        help="Frames to sample and score per clip (default %d)."
                             % DEFAULT_CANDIDATES)
    parser.add_argument("--force", action="store_true",
                        help="Re-extract even when the poster already exists.")
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        sys.exit("ffmpeg not found. Install it with: python -m pip install imageio-ffmpeg")
    if not SOURCE_DIR.is_dir():
        sys.exit(f"Missing source directory: {SOURCE_DIR}")

    clips = sorted(SOURCE_DIR.glob("*.mp4"))
    if not clips:
        sys.exit(f"No clips found in {SOURCE_DIR}")

    POSTER_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict = {}
    if MANIFEST.exists():
        try:
            manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            manifest = {}

    print(f"Extracting posters from {len(clips)} clips")
    print(f"  sampling    : {args.candidates} frames per clip, best score wins")
    print("-" * 74)

    made = skipped = failed = 0
    total_bytes = 0

    for clip in clips:
        poster = POSTER_DIR / f"{slugify(clip.name)}-poster.webp"

        if poster.exists() and not args.force:
            skipped += 1
            size = poster.stat().st_size
            total_bytes += size
            record(manifest, clip, poster, size)
            print(f"  {clip.name[:44]:<44} cached {size // 1024:>5}KB")
            continue

        duration = probe_duration(ffmpeg, clip)
        if not duration:
            print(f"  {clip.name[:44]:<44} SKIPPED (no duration)")
            failed += 1
            continue

        # Sample several points across the clip and keep the best-scoring one.
        # These clips vary wildly: some open on black, some are washed out, and
        # a single fixed offset reliably lands on the wrong frame for some.
        candidates = max(1, args.candidates)
        best_score = None
        best_ts = None
        best_tmp = None
        usable = max(0.2, duration - 0.2)

        for index in range(candidates):
            # Spread samples across the middle 80% of the clip.
            fraction = 0.10 + (0.80 * index / max(1, candidates - 1))
            timestamp = max(0.2, min(duration * fraction, usable))
            tmp = POSTER_DIR / f".candidate-{clip.stem[:24]}-{index}.webp"
            if not extract_frame(ffmpeg, clip, tmp, timestamp):
                tmp.unlink(missing_ok=True)
                continue
            score = score_frame(tmp)
            if score is None:
                # Cannot score: accept the first usable frame as a safe default.
                if best_tmp is None:
                    best_tmp, best_ts, best_score = tmp, timestamp, 0.0
                else:
                    tmp.unlink(missing_ok=True)
                continue
            if best_score is None or score > best_score:
                if best_tmp and best_tmp != tmp:
                    best_tmp.unlink(missing_ok=True)
                best_tmp, best_ts, best_score = tmp, timestamp, score
            else:
                tmp.unlink(missing_ok=True)

        if best_tmp is None:
            print(f"  {clip.name[:44]:<44} FAILED (no usable frame)")
            failed += 1
            continue

        if poster.exists():
            poster.unlink()
        best_tmp.replace(poster)
        best_tmp = None

        size = poster.stat().st_size
        total_bytes += size
        made += 1
        record(manifest, clip, poster, size)
        print(f"  {clip.name[:44]:<44} {int(duration):>4}s @ {best_ts:>5.1f}s "
              f"{size // 1024:>5}KB  score {best_score:6.1f}")

    # Never leave candidate scratch files behind.
    for leftover in POSTER_DIR.glob(".candidate-*.webp"):
        leftover.unlink(missing_ok=True)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n",
                        encoding="utf-8")

    print("-" * 74)
    print(f"Posters written : {made}")
    print(f"Already cached  : {skipped}")
    if failed:
        print(f"Failed          : {failed}")
    total_clips = made + skipped
    if total_clips:
        print(f"Total poster set: {total_bytes // 1024}KB "
              f"(~{total_bytes // total_clips // 1024}KB per clip)")
    print(f"Manifest        : {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

    """Store the poster path on the clip's own manifest entry."""
    entry = manifest.setdefault(clip.name, {})
    entry["type"] = "video"
    entry["poster"] = poster.relative_to(ROOT).as_posix()
    entry["posterBytes"] = size
