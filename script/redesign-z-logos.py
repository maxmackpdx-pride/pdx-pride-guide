#!/usr/bin/env python3
"""Generate the owner-requested 2026-08-12 Z/ index wordmark candidates."""

from pathlib import Path
from xml.sax.saxutils import escape

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client/public/brand/family"
FONT = ROOT / "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-900-italic.woff2"

font = TTFont(FONT)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
units = font["head"].unitsPerEm


def run_width(text: str, size: float, tracking: float = -24) -> float:
    total = 0.0
    for index, char in enumerate(text):
        glyph_name = cmap[ord(char)]
        total += hmtx[glyph_name][0]
        if index < len(text) - 1:
            total += tracking
    return total * size / units


def outlined_run(text: str, x: float, baseline: float, size: float, fill: str, tracking: float = -24) -> tuple[str, float]:
    scale = size / units
    cursor = 0.0
    paths: list[str] = []
    for index, char in enumerate(text):
        glyph_name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[glyph_name].draw(pen)
        paths.append(f'<path d="{pen.getCommands()}" transform="translate({cursor:.2f})"/>')
        cursor += hmtx[glyph_name][0]
        if index < len(text) - 1:
            cursor += tracking
    group = (
        f'<g fill="{fill}" transform="translate({x:.2f} {baseline:.2f}) scale({scale:.6f} {-scale:.6f})">'
        + "".join(paths)
        + "</g>"
    )
    return group, cursor * scale


def write_logo(name: str, title: str, width: int, height: int, body: str, desc: str) -> None:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">{escape(title)}</title>
  <desc id="desc">{escape(desc)}</desc>
  <metadata>status=owner-requested from-scratch revision candidate; date=2026-08-12; editable-paths=true; raster-embedded=false; source-font=Barlow Condensed 900 Italic; treatment=custom outlined lockup</metadata>
  {body}
</svg>
'''
    (OUT / name).write_text(svg)


def one_terminal(name: str, title: str, stem: str, stem_size: float, stem_fill: str, z_fill: str, accent: str) -> None:
    stem_group, stem_width = outlined_run(stem, 70, 365, stem_size, stem_fill)
    z_x = 70 + stem_width + 18
    z_group, _ = outlined_run("Z", z_x, 398, 430, z_fill, tracking=0)
    body = f'''<path fill="{accent}" d="M58 420H620L570 448H58Z"/>
  {stem_group}
  {z_group}
  <path fill="{accent}" d="M{z_x + 22:.2f} 54h184l-28 18h-184Z"/>
  <text x="1510" y="92" fill="{z_fill}" font-family="Arial, sans-serif" font-size="34" font-weight="700">TM</text>'''
    write_logo(name, title, 1600, 500, body, f"{title} angular Zay-family wordmark with an oversized terminal Z.")


one_terminal("placez.svg", "PlaceZ", "PLACE", 330, "#19E3FF", "#FFFFFF", "#19E3FF")
one_terminal("marketz.svg", "MarketZ", "MARKET", 280, "#CCFF00", "#FFFFFF", "#CCFF00")
one_terminal("eventz.svg", "EventZ", "EVENT", 325, "#FF5A1F", "#FFFFFF", "#FF5A1F")


# MizZed: one featured internal capital Z, with the surrounding word kept as one rhythm.
miz, miz_width = outlined_run("MIZ", 65, 365, 315, "#FF00CC")
featured_x = 65 + miz_width + 8
featured, featured_width = outlined_run("Z", featured_x, 402, 425, "#FFFFFF", tracking=0)
ed_x = featured_x + featured_width - 8
ed, _ = outlined_run("ED", ed_x, 365, 315, "#FF00CC")
mizzed_body = f'''<path fill="#FF00CC" d="M54 420h520l-48 28H54Z"/>
  {miz}
  {featured}
  {ed}
  <path fill="#FFFFFF" d="M{featured_x + 18:.2f} 54h178l-27 18h-178Z"/>
  <text x="1510" y="92" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="34" font-weight="700">TM</text>'''
write_logo(
    "mizzed.svg",
    "MizZed",
    1600,
    500,
    mizzed_body,
    "MizZed magenta wordmark with one oversized white internal capital Z.",
)


# Clubs & Groups: a true two-name lockup, not a Z/SPACE substitute.
clubs, _ = outlined_run("CLUBS", 70, 275, 250, "#19E3FF")
groups, _ = outlined_run("GROUPS", 530, 505, 250, "#FFD700")
amp, _ = outlined_run("&", 102, 508, 205, "#FFFFFF", tracking=0)
clubs_body = f'''{clubs}
  <path fill="#FFFFFF" d="M474 70h42L388 530h-42Z"/>
  {amp}
  {groups}
  <path fill="#19E3FF" d="M62 302h385l-42 22H62Z"/>
  <path fill="#FFD700" d="M520 532h640l-42 22H520Z"/>
  <text x="1690" y="98" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="34" font-weight="700">TM</text>'''
write_logo(
    "clubs-groups.svg",
    "Clubs &amp; Groups",
    1800,
    600,
    clubs_body,
    "Clubs and Groups cyan, white, and gold two-part Zay-family lockup.",
)
