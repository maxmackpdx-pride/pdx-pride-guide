#!/usr/bin/env python3
"""Build custom Zay-family candidates without a font dependency."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client/public/brand/family"

# A compact custom angular alphabet. Geometry is authored on a 100x140 cell.
# The terminal Z is the HAÜZ family construction, normalized from the canonical
# candidate master rather than typeset from a font.
GLYPH = {
    "A": '<path d="M4 140 43 0h28l27 140H73l-6-31H31l-8 31Zm34-55h25L54 35Z" fill-rule="evenodd"/>',
    "B": '<path d="M8 0h55l25 20v38L76 70l16 14v36l-24 20H8Zm25 24v34h27l7-7V31l-8-7Zm0 57v35h29l7-7V89l-8-8Z" fill-rule="evenodd"/>',
    "C": '<path d="M85 0H31L7 23v94l23 23h48l15-18-13-19-12 13H39l-8-8V31l8-8h30l11 13 15-18Z"/>',
    "D": '<path d="M8 0h54l30 29v82l-30 29H8Zm25 25v90h22l13-13V38L55 25Z" fill-rule="evenodd"/>',
    "E": '<path d="M13 0h80L76 24H37v31h42L65 78H37v38h55l-18 24H13Z"/>',
    "G": '<path d="M91 18 77 37 65 24H39l-9 9v74l9 9h25l8-8V87H51l14-23h31v55l-22 21H29L6 117V24L31 0h45Z"/>',
    "I": '<path d="M35 0h29L52 140H23Z"/>',
    "K": '<path d="M12 0h27v52L73 0h30L61 65l34 75H64L42 87l-3 5v48H12Z"/>',
    "L": '<path d="M20 0h29L37 115h57l-18 25H8Z"/>',
    "M": '<path d="M7 140 20 0h27l17 52L91 0h25l-12 140H77l7-80-24 46-17-46-8 80Z"/>',
    "N": '<path d="M9 140 22 0h25l31 77 7-77h27L99 140H75L44 65l-7 75Z"/>',
    "O": '<path d="M29 0h52l22 23-10 94-25 23H20L0 117l9-94Zm8 24-8 92h30l10-9 8-74-8-9Z" fill-rule="evenodd"/>',
    "P": '<path d="M12 140 24 0h57l22 22-5 55-26 22H39l-3 41Zm36-116-5 51h24l8-8 3-35-7-8Z" fill-rule="evenodd"/>',
    "R": '<path d="M10 140 23 0h57l23 22-5 50-22 18 22 50H67L50 96H38l-4 44Zm37-116-5 49h24l8-8 3-33-7-8Z" fill-rule="evenodd"/>',
    "S": '<path d="M96 17 79 38 68 24H37l-8 8-2 19 7 7h39l20 21-4 39-24 22H15L0 122l16-20 10 14h31l9-8 2-20-7-7H23L3 61l4-39L31 0h50Z"/>',
    "T": '<path d="M8 0h96L86 25H61L51 140H23L33 25H0Z"/>',
    "U": '<path d="M14 0h28l-9 104 9 12h24l12-12L87 0h28l-10 116-25 24H29L5 116Z"/>',
    "V": '<path d="M8 0h29l12 99L79 0h31L58 140H31Z"/>',
    "Z": '<path d="M4 0 20 25h49L8 140l88-7 17-25-61 2L111 0Z"/>',
    "&": '<path d="M81 140 68 124l-18 16H21L3 120V94l21-22-10-14V27L36 5h27l20 21v25L65 69l11 13 14-17 16 17-15 19 15 18Zm-49-36v10h14l7-7-14-18Zm5-66v9l11 14 12-12V36l-7-7h-9Z" fill-rule="evenodd"/>',
}

PALETTE = {
    "placez": ("#19E3FF", "#FFFFFF"),
    "marketz": ("#CCFF00", "#FFFFFF"),
    "eventz": ("#FF5A1F", "#FFFFFF"),
    "mizzed": ("#FF00CC", "#FFFFFF"),
}

def glyph(char, x, y, w, h, fill):
    return f'<g transform="translate({x} {y}) scale({w/120:.5f} {h/140:.5f})" fill="{fill}">{GLYPH[char]}</g>'

def linear(name, word, color, terminal="#FFFFFF", feature=None):
    widths = {"I": 58, "M": 128, "W": 128}
    x, y, h, gap = 52, 54, 270, 5
    parts=[]
    for i,ch in enumerate(word):
        w=widths.get(ch, 108)
        is_terminal = i == len(word)-1 and ch == "Z"
        is_feature = feature == i
        gh = 330 if is_terminal or is_feature else h
        gy = 22 if is_terminal or is_feature else y
        gw = 132 if is_terminal or is_feature else w
        fill = terminal if is_terminal or is_feature else color
        parts.append(glyph(ch,x,gy,gw,gh,fill))
        x += gw + gap
    width=max(1100,int(x+70))
    parts.append(f'<path d="M52 350H{x-30}l-42 24H52Z" fill="{color}"/>')
    parts.append(f'<text x="{width-70}" y="64" fill="#fff" font-family="Arial,sans-serif" font-size="28" font-weight="700">TM</text>')
    body="\n  ".join(parts)
    title=name.replace("z","Z")
    return width, body, title

def save(filename,title,width,height,body,desc):
    (OUT/filename).write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title><desc id="desc">{desc}</desc>
  <metadata>status=owner-requested custom revision candidate; date=2026-08-12; editable-paths=true; raster-embedded=false; source=Zay-family custom glyph library; font-derived=false</metadata>
  {body}
</svg>\n''')

for key,word in (("placez","PLACEZ"),("marketz","MARKETZ"),("eventz","EVENTZ")):
    width,body,title=linear(key,word,*PALETTE[key])
    save(f"{key}.svg",title,width,420,body,f"Custom angular {title} wordmark with oversized white terminal Z.")

width,body,_=linear("mizzed","MIZZED",*PALETTE["mizzed"],feature=3)
save("mizzed.svg","MizZed",width,420,body,"Custom angular MizZed wordmark with one oversized white featured Z.")

# Clubz & Groupz is a muscular two-line lockup. Each name ends in the same
# oversized white family Z; the ampersand is a compact hinge, not a divider.
parts=[]
x=55
for ch in "CLUBZ":
    terminal=ch=="Z"; w=132 if terminal else 112
    parts.append(glyph(ch,x,34 if terminal else 55,w,205 if terminal else 180,"#FFFFFF" if terminal else "#19E3FF")); x+=w+5
parts.append('<path d="M52 248h590l-44 22H52Z" fill="#19E3FF"/>')
parts.append(glyph("&",64,306,92,118,"#FFFFFF"))
x=180
for ch in "GROUPZ":
    terminal=ch=="Z"; w=132 if terminal else 104
    parts.append(glyph(ch,x,282 if terminal else 303,w,205 if terminal else 180,"#FFFFFF" if terminal else "#FFD700")); x+=w+5
parts.append(f'<path d="M176 496h{x-176}l-44 22H176Z" fill="#FFD700"/>')
parts.append(f'<text x="{x+12}" y="320" fill="#fff" font-family="Arial,sans-serif" font-size="28" font-weight="700">TM</text>')
save("clubs-groups.svg","Clubz &amp; Groupz",max(1080,x+90),540,"\n  ".join(parts),"Custom cyan, white, and gold Clubz and Groupz lockup with paired family Z terminals.")
