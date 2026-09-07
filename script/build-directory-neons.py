#!/usr/bin/env python3
"""Build transparent, detail-safe neon directory logos from reviewed sources."""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


CATEGORY_COLORS = {
    "bar": "#FF00CC",
    "restaurant": "#FF6600",
    "cafe": "#39FF14",
    "venue": "#19E3FF",
    "service": "#A855F7",
    "shop": "#FFD700",
    "hotel": "#FF1FA0",
    "nonprofit": "#FFFFFF",
    "healthcare": "#FF00CC",
    "realestate": "#1A4DFF",
    "group": "#FFD700",
    "campground": "#39FF14",
}

ADULT_RED = "#FF2038"
NEON_PADDING = 72


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def load_source(path: Path) -> Image.Image:
    if path.suffix.lower() != ".svg":
        return Image.open(path).convert("RGBA")
    with tempfile.NamedTemporaryFile(suffix=".png") as rendered:
        subprocess.run(
            [
                "inkscape",
                str(path),
                "--export-type=png",
                "--export-width=1800",
                f"--export-filename={rendered.name}",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return Image.open(rendered.name).convert("RGBA")


def remove_connected_background(image: Image.Image, threshold: float = 62.0) -> Image.Image:
    """Remove only edge-connected pixels close to the median corner color."""
    rgba = np.asarray(image.convert("RGBA")).copy()
    height, width = rgba.shape[:2]
    corners = np.array(
        [rgba[0, 0, :3], rgba[0, width - 1, :3], rgba[height - 1, 0, :3], rgba[height - 1, width - 1, :3]],
        dtype=np.float32,
    )
    background = np.median(corners, axis=0)
    distance = np.sqrt(np.sum((rgba[:, :, :3].astype(np.float32) - background) ** 2, axis=2))
    eligible = (distance <= threshold) & (rgba[:, :, 3] > 0)
    seen = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        if eligible[0, x]: queue.append((0, x))
        if eligible[height - 1, x]: queue.append((height - 1, x))
    for y in range(height):
        if eligible[y, 0]: queue.append((y, 0))
        if eligible[y, width - 1]: queue.append((y, width - 1))
    while queue:
        y, x = queue.popleft()
        if seen[y, x] or not eligible[y, x]:
            continue
        seen[y, x] = True
        if y: queue.append((y - 1, x))
        if y + 1 < height: queue.append((y + 1, x))
        if x: queue.append((y, x - 1))
        if x + 1 < width: queue.append((y, x + 1))
    rgba[seen, 3] = 0
    # Fade the JPEG fringe instead of leaving a hard rectangular outline.
    fringe = (distance > threshold) & (distance < threshold + 34) & ~seen
    rgba[fringe, 3] = np.minimum(
        rgba[fringe, 3], ((distance[fringe] - threshold) / 34.0 * 255).astype(np.uint8)
    )
    return Image.fromarray(rgba, "RGBA")


def text_mark(text: str, single_line: bool = False) -> Image.Image:
    words = text.split()
    if single_line:
        lines = [text]
    elif len(words) >= 4:
        split = math.ceil(len(words) / 2)
        lines = [" ".join(words[:split]), " ".join(words[split:])]
    elif len(words) == 3:
        lines = [" ".join(words[:2]), words[2]]
    else:
        lines = [text]
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_size = 176 if len(max(lines, key=len)) < 15 else 124
    font = ImageFont.truetype(font_path, font_size)
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    boxes = [probe.textbbox((0, 0), line, font=font, stroke_width=2) for line in lines]
    width = max(box[2] - box[0] for box in boxes) + 48
    line_height = max(box[3] - box[1] for box in boxes)
    height = len(lines) * line_height + max(0, len(lines) - 1) * 26 + 48
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    y = 24
    for line, box in zip(lines, boxes):
        line_width = box[2] - box[0]
        draw.text(
            ((width - line_width) / 2, y - box[1]),
            line,
            font=font,
            fill=(255, 255, 255, 255),
            stroke_width=2,
            stroke_fill=(255, 255, 255, 255),
        )
        y += line_height + 26
    return image


def trim_and_scale(image: Image.Image, already_neon: bool = False) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    threshold = 150 if already_neon else 18
    ys, xs = np.where(alpha >= threshold)
    if not len(xs):
        raise ValueError("source has no visible mark")
    image = image.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    original_longest = max(image.size)
    longest = original_longest
    scale = 900 / longest
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)
    if original_longest < 200:
        rgba = np.asarray(image).copy()
        rgba[:, :, 3] = np.asarray(image.getchannel("A").filter(ImageFilter.GaussianBlur(0.8)))
        image = Image.fromarray(rgba, "RGBA")
    if already_neon:
        rgba = np.asarray(image).copy()
        alpha = rgba[:, :, 3]
        rgba[:, :, 3] = np.where(alpha >= 135, np.clip((alpha.astype(np.int16) - 110) * 6, 0, 255), 0).astype(np.uint8)
        image = Image.fromarray(rgba, "RGBA")
    return image


def adaptive_palette(rgb: np.ndarray, alpha: np.ndarray, colors: int = 5) -> np.ndarray:
    visible = rgb[alpha >= 32]
    if not len(visible):
        return np.array([[255, 255, 255]], dtype=np.int16)
    if len(visible) > 120_000:
        visible = visible[:: math.ceil(len(visible) / 120_000)]
    strip = Image.fromarray(visible.reshape(1, -1, 3).astype(np.uint8), "RGB")
    quantized = strip.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    palette = np.array(quantized.getpalette()[: colors * 3], dtype=np.int16).reshape(-1, 3)
    used = sorted(set(np.asarray(quantized).reshape(-1).tolist()))
    return palette[used]


def quantize_core(image: Image.Image, max_colors: int = 5) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    alpha = rgba[:, :, 3]
    palette = adaptive_palette(rgb, alpha, max_colors)
    visible = alpha >= 1
    pixels = rgb[visible]
    batch = 100_000
    mapped = np.empty_like(pixels)
    for start in range(0, len(pixels), batch):
        block = pixels[start : start + batch]
        distances = np.sum((block[:, None, :] - palette[None, :, :]) ** 2, axis=2)
        mapped[start : start + batch] = palette[np.argmin(distances, axis=1)]
    rgba[visible, :3] = mapped.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def solid_core(image: Image.Image, color: str) -> Image.Image:
    alpha = image.getchannel("A")
    return Image.merge(
        "RGBA",
        [Image.new("L", image.size, channel) for channel in hex_rgb(color)] + [alpha],
    )


def monochrome_detail_alpha(image: Image.Image) -> Image.Image:
    """Keep internal mark detail when a filled multicolor badge becomes one color."""
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible = alpha >= 32
    density = float(np.count_nonzero(visible)) / visible.size
    if density < 0.48:
        return Image.fromarray(alpha, "L")

    colors, counts = np.unique(rgba[visible, :3], axis=0, return_counts=True)
    dominant = colors[int(np.argmax(counts))].astype(np.int32)
    distance = np.sqrt(np.sum((rgba[:, :, :3].astype(np.int32) - dominant) ** 2, axis=2))
    contrasting = np.where(distance >= 26, alpha, 0).astype(np.uint8)

    alpha_image = Image.fromarray(alpha, "L")
    eroded = alpha_image.filter(ImageFilter.MinFilter(9))
    outer_edge = np.clip(
        alpha.astype(np.int16) - np.asarray(eroded).astype(np.int16), 0, 255
    ).astype(np.uint8)
    detail = np.maximum(contrasting, outer_edge)
    detail_image = Image.fromarray(detail, "L").filter(ImageFilter.MaxFilter(3))
    return detail_image


def colorize_alpha(alpha: Image.Image, color: tuple[int, int, int], opacity: float) -> Image.Image:
    scaled = alpha.point(lambda value: round(value * opacity))
    return Image.merge(
        "RGBA",
        [Image.new("L", alpha.size, channel) for channel in color] + [scaled],
    )


def render_neon(
    core: Image.Image,
    fallback_glow: str,
    force_core: str | None = None,
    preserve_alpha: bool = False,
) -> Image.Image:
    core = core.convert("RGBA")
    if force_core:
        detail_alpha = core.getchannel("A") if preserve_alpha else monochrome_detail_alpha(core)
        core = solid_core(core, force_core)
        core.putalpha(detail_alpha)
    rgba = np.asarray(core).copy()
    alpha = rgba[:, :, 3]
    rgb = rgba[:, :, :3]
    luma = rgb[:, :, 0] * 0.2126 + rgb[:, :, 1] * 0.7152 + rgb[:, :, 2] * 0.0722
    dark = (alpha > 0) & (luma < 42)
    glow_rgb = rgb.copy()
    glow_rgb[dark] = hex_rgb(fallback_glow)
    # Black ink becomes the reviewed brand accent so it remains visible as neon.
    rgba[dark, :3] = hex_rgb(fallback_glow)
    core = Image.fromarray(rgba, "RGBA")
    glow_color = Image.fromarray(np.dstack((glow_rgb, alpha)).astype(np.uint8), "RGBA")

    padding = NEON_PADDING
    size = (core.width + padding * 2, core.height + padding * 2)
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    alpha_canvas = Image.new("L", size, 0)
    alpha_canvas.paste(core.getchannel("A"), (padding, padding))
    color_canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    color_canvas.paste(glow_color, (padding, padding))
    for radius, opacity in ((30, 0.20), (14, 0.34), (5, 0.56)):
        blurred_alpha = alpha_canvas.filter(ImageFilter.GaussianBlur(radius))
        blurred_rgb = color_canvas.filter(ImageFilter.GaussianBlur(radius))
        layer = np.asarray(blurred_rgb).copy()
        layer[:, :, 3] = np.asarray(blurred_alpha.point(lambda value: round(value * opacity)))
        result = Image.alpha_composite(result, Image.fromarray(layer, "RGBA"))
    # The unblurred mark is composited last so bloom cannot erase counters or fine type.
    result.alpha_composite(core, (padding, padding))
    return result


def render_adult_neon(core: Image.Image, preserve_alpha: bool = False) -> Image.Image:
    """Render the adult-venue system: dominant red neon with a crisp white edge accent."""
    core = core.convert("RGBA")
    detail_alpha = core.getchannel("A") if preserve_alpha else monochrome_detail_alpha(core)
    red_core = solid_core(core, ADULT_RED)
    red_core.putalpha(detail_alpha)
    result = render_neon(red_core, ADULT_RED)

    shifted = Image.new("L", detail_alpha.size, 0)
    shifted.paste(detail_alpha, (4, 4))
    highlight_alpha = ImageChops.subtract(detail_alpha, shifted).filter(ImageFilter.MaxFilter(3))

    highlight_canvas = Image.new("L", result.size, 0)
    highlight_canvas.paste(highlight_alpha, (NEON_PADDING, NEON_PADDING))
    white = (255, 255, 255)
    result = Image.alpha_composite(
        result,
        colorize_alpha(highlight_canvas.filter(ImageFilter.GaussianBlur(4)), white, 0.34),
    )
    result = Image.alpha_composite(result, colorize_alpha(highlight_canvas, white, 0.96))
    return result


def prepare(entry: dict, source_root: Path) -> Image.Image:
    if entry.get("textFallback"):
        source = text_mark(entry["textFallback"], bool(entry.get("singleLine")))
    else:
        source = load_source(source_root / entry["localFile"])
        if entry.get("removeBackground") or source.getchannel("A").getextrema() == (255, 255):
            source = remove_connected_background(source)
    source = trim_and_scale(source, bool(entry.get("alreadyNeon")))
    return quantize_core(source, 5)


def save_png(image: Image.Image, path: Path) -> None:
    """Write atomically so an interrupted batch cannot leave a partial PNG."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".png", delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        image.save(temporary_path, format="PNG", compress_level=6)
        with Image.open(temporary_path) as check:
            check.load()
        os.replace(temporary_path, path)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=Path(__file__).with_name("directory-neon-sources.json"))
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    args.output_root.mkdir(parents=True, exist_ok=True)
    twin_root = args.output_root / "z-white"
    twin_root.mkdir(exist_ok=True)

    for entry in manifest["groups"]:
        core = prepare(entry, args.source_root)
        save_png(render_neon(core, entry["glow"]), args.output_root / f'{entry["stem"]}.png')
        save_png(render_neon(core, "#FFD700", force_core="#FFFFFF"), twin_root / f'{entry["stem"]}.png')

    for entry in manifest["remainingMissing"]:
        core = prepare(entry, args.source_root)
        color = CATEGORY_COLORS[entry["type"]]
        save_png(
            render_neon(core, color, force_core=color, preserve_alpha=bool(entry.get("preserveAlpha"))),
            args.output_root / f'{entry["stem"]}.png',
        )

    for entry in manifest.get("qualityRepairs", []):
        core = prepare(entry, args.source_root)
        color = CATEGORY_COLORS[entry["type"]]
        save_png(
            render_neon(core, color, force_core=color, preserve_alpha=bool(entry.get("preserveAlpha"))),
            args.output_root / f'{entry["stem"]}.png',
        )

    for entry in manifest.get("legacyQualityRepairs", []):
        core = prepare(entry, args.source_root)
        color = CATEGORY_COLORS[entry["type"]]
        rendered = (
            render_adult_neon(core, preserve_alpha=bool(entry.get("preserveAlpha")))
            if entry.get("adultNeon")
            else render_neon(core, color, force_core=color, preserve_alpha=bool(entry.get("preserveAlpha")))
        )
        save_png(
            rendered,
            args.output_root / f'{entry["stem"]}.png',
        )

    for entry in manifest.get("adultNeons", []):
        core = prepare(entry, args.source_root)
        save_png(
            render_adult_neon(core, preserve_alpha=bool(entry.get("preserveAlpha"))),
            args.output_root / f'{entry["stem"]}.png',
        )


if __name__ == "__main__":
    main()
