import sys, os
sys.path.insert(0,'/home/claude')
from zglyph import word, render, H

OUT='/home/claude/zrepo/client/public/brand/family'

# name, accent-run, white-run, accent hex ramp (top, mid, bottom)
MARKS = [
 ("mizzed",  "MIZ", "ZED",  ("#ff45d8","#ff00cc","#cc0099")),
 ("placez",  "PLACE", "Z",  ("#ff8a4a","#ff2400","#c41c00")),
 ("marketz", "MARKET", "Z",  ("#e0ff4a","#ccff00","#a3cc00")),
 ("events",  "EVENT", "S",  ("#ffa54a","#ff6600","#cc5200")),
]

PAD_X, PAD_TOP, PAD_BOT = 40, 46, 54

for slug, a, b, (c1,c2,c3) in MARKS:
    pa, xa = word(a, PAD_X)
    pb, xb = word(b, xa + 26)          # a touch more air at the colour break
    w = xb + PAD_X + 96                # room for the TM
    h = H + PAD_TOP + PAD_BOT
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{a}{b} logo">
  <title>{a}{b} - transparent editable master</title>
  <metadata>status=owner-directed vector master; raster-embedded=false; editable-paths=true; built from ZAY master letter library geometry: 45 degree primary angles, unified heavy stroke, blade terminals</metadata>
  <defs>
    <linearGradient id="acc" gradientUnits="userSpaceOnUse" x1="0" y1="{PAD_TOP}" x2="0" y2="{PAD_TOP+H}">
      <stop offset="0" stop-color="{c1}"/><stop offset=".52" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/>
    </linearGradient>
    <linearGradient id="wht" gradientUnits="userSpaceOnUse" x1="0" y1="{PAD_TOP}" x2="0" y2="{PAD_TOP+H}">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".52" stop-color="#fafafd"/><stop offset="1" stop-color="#eeeef4"/>
    </linearGradient>
  </defs>
  <g transform="translate(0 {PAD_TOP})">
    {render(pa,"url(#acc)")}
    {render(pb,"url(#wht)")}
  </g>
  <text x="{xb+34:.0f}" y="{PAD_TOP+52:.0f}" fill="url(#acc)" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="54">TM</text>
</svg>'''
    open(f'{OUT}/{slug}.svg','w').write(svg)
    print(f'{slug}.svg  {w:.0f}x{h:.0f}  {len(svg)}b')
