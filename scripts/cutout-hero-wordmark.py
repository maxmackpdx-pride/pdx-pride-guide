#!/usr/bin/env python3
"""
Hero wordmark plate cutout for Zaylist.

Takes a neon logo on a soft gray gradient plate and produces a transparent PNG
where ONLY the neutral plate is removed. Saturated neon pixels (letter fills,
outlines, glow) keep full RGB and full alpha — never desaturated or recolored.

Usage:
  python3 scripts/cutout-hero-wordmark.py [source.jpg]
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "client" / "src" / "assets" / "home"
OUT_JPG = HOME / "hero-wordmark.jpg"
OUT_PNG = HOME / "hero-wordmark.png"

# Saturation thresholds (HSV S in 0..1).
# Below SAT_LO  → fully transparent (neutral gray plate)
# Above SAT_HI  → fully opaque (neon cores / letter fills / strong glow)
# Between       → soft feather only on plate-adjacent edges
#
# Tuned so plate-tinted outer haze (sat ~0.12–0.30, light gray mixed into glow)
# feathers out, while near-letter neon (sat ≳ 0.5) stays solid alpha 255.
SAT_LO = 0.12
SAT_HI = 0.38

# Absolute chroma (max-min)/255: anything this colorful is forced fully opaque
# even if S is oddly low (guards bright neon cores).
CHROMA_FORCE_OPAQUE = 0.18

# Very dark, non-neutral cores (letter interiors) — keep even if low chroma.
# Uses sat floor so pure gray blacks on plate stay out.
DARK_V_MAX = 0.25
DARK_SAT_MIN = 0.10


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / max(edge1 - edge0, 1e-6), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def cutout(rgb: np.ndarray) -> Image.Image:
    """Build RGBA with original RGB preserved; alpha from chroma/saturation."""
    r = rgb[..., 0].astype(np.float32)
    g = rgb[..., 1].astype(np.float32)
    b = rgb[..., 2].astype(np.float32)

    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    delta = mx - mn

    # HSV-style saturation: 0 on pure gray, 1 on pure primary.
    sat = np.zeros_like(mx)
    np.divide(delta, mx, out=sat, where=mx > 1e-6)
    chroma = delta / 255.0
    val = mx / 255.0

    # Soft alpha from saturation ramp (feather only near plate gray).
    alpha_f = smoothstep(SAT_LO, SAT_HI, sat)

    # Force fully opaque on clearly saturated / chromatic neon.
    force = (sat >= SAT_HI) | (chroma >= CHROMA_FORCE_OPAQUE)
    # Keep dark letter fills (near-black with residual hue).
    force |= (val <= DARK_V_MAX) & (sat >= DARK_SAT_MIN)
    alpha_f = np.where(force, 1.0, alpha_f)

    # Plate: low sat AND not forced → transparent
    alpha = np.round(alpha_f * 255.0).astype(np.uint8)

    # CRITICAL: never touch RGB — copy source bytes exactly.
    rgba = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = rgb
    rgba[..., 3] = alpha
    return Image.fromarray(rgba)  # uint8 HxWx4 → RGBA


def main() -> int:
    if len(sys.argv) > 1:
        src = Path(sys.argv[1]).expanduser().resolve()
    else:
        src = Path(
            "/Users/tuckercasey/.grok/sessions/"
            "%2FUsers%2Ftuckercasey/019f8718-a3e9-79e0-8550-e35817a2829c/assets/"
            "image-09f905c1-e7a5-47f2-9032-11c94a1c0dc5.jpg"
        )

    if not src.is_file():
        print(f"ERROR: source not found: {src}", file=sys.stderr)
        return 1

    HOME.mkdir(parents=True, exist_ok=True)

    # 1) Source copy as JPG
    shutil.copy2(src, OUT_JPG)
    print(f"Copied source → {OUT_JPG} ({OUT_JPG.stat().st_size:,} bytes)")

    # 2) Cutout PNG
    img = Image.open(src).convert("RGB")
    rgb = np.asarray(img)
    out = cutout(rgb)

    # Lossless PNG, no palette, no color remapping
    out.save(OUT_PNG, format="PNG", compress_level=6, optimize=True)

    alpha = np.asarray(out)[..., 3]
    opaque = (alpha == 255).mean()
    clear = (alpha == 0).mean()
    mid = ((alpha > 0) & (alpha < 255)).mean()
    print(f"Wrote cutout  → {OUT_PNG} ({OUT_PNG.stat().st_size:,} bytes)")
    print(f"  size {out.size[0]}x{out.size[1]} RGBA")
    print(f"  alpha: opaque={opaque:.1%} feather={mid:.1%} clear={clear:.1%}")

    # Sanity: RGB of fully-opaque pixels must match source exactly
    src_rgb = rgb
    out_rgb = np.asarray(out)[..., :3]
    mask = alpha == 255
    if mask.any():
        mismatch = np.any(src_rgb[mask] != out_rgb[mask])
        print(f"  RGB identity on opaque pixels: {'OK' if not mismatch else 'FAIL'}")

    # Spot-check neon cores stay opaque
    checks = {
        "Z-ish": (420, 280),
        "yellow A tip": (480, 520),
        "cyan L": (420, 780),
        "magenta T": (420, 1200),
        "plate corner TL": (20, 20),
        "plate bottom": (900, 768),
    }
    a = alpha
    for name, (y, x) in checks.items():
        print(f"  sample {name:16s} alpha={a[y, x]:3d} rgb={tuple(src_rgb[y, x])}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
