"""
ZAY glyph builder.

The master letter library ships B D F G H I K L M O R S T Ü V ! and the locked
ZAYLIST lockup. The four wordmarks Tucker asked for need A C E N P Y Z as well,
and the existing family SVGs merge every letter into one path, so nothing can be
extracted. These are built instead, to the library's own written rules:

  Geometry      45 degree primary angles with custom blade terminals
  Stroke        one unified heavy weight across all glyphs
  Style         angular, technical, forward driving

One grid, one stroke, one blade depth for every letter, so the set stays
internally consistent even where a glyph is new.
"""

# ── grid ─────────────────────────────────────────────────────
H = 200.0        # cap height
W = 138.0        # default advance width
S = 46.0         # unified stroke weight
B = 26.0         # blade cut depth, the 45 degree corner shear
GAP = 11.0       # letter spacing


def poly(*pts):
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"


def glyphs():
    """Every glyph is a list of subpaths on a 0,0 to W,H box, y down."""
    g = {}

    # A: one silhouette that already contains the crossbar, plus a single
    # counter above it. Two same-direction subpaths under evenodd would have
    # subtracted the crossbar instead of drawing it.
    cb_t, cb_b = H * 0.66 - S * 0.34, H * 0.66 + S * 0.34
    def _al(y):   # inner left edge, apex to left foot
        return W / 2 + (S - W / 2) * (y / H)
    def _ar(y):   # inner right edge, apex to right foot
        return W / 2 + (W - S - W / 2) * (y / H)
    g["A"] = [poly((W / 2 - B * 0.4, 0), (W / 2 + B * 0.4, 0), (W, H),
                   (W - S, H), (_ar(cb_b), cb_b), (_al(cb_b), cb_b),
                   (S, H), (0, H)),
              poly((W / 2, S * 0.95), (_ar(cb_t), cb_t), (_al(cb_t), cb_t))]

    # C: octagonal counter, open right, blades top right and bottom right
    g["C"] = [poly((B, 0), (W, 0), (W - B, S), (S + B * 0.4, S),
                   (S, S + B * 0.4), (S, H - S - B * 0.4), (S + B * 0.4, H - S),
                   (W - B, H - S), (W, H), (B, H), (0, H - B), (0, B))]

    # E: three bars, blade on the top right and bottom right
    g["E"] = [poly((B, 0), (W, 0), (W - B, S), (S, S), (S, H * 0.5 - S * 0.36),
                   (W - B * 0.8, H * 0.5 - S * 0.36), (W - B * 1.4, H * 0.5 + S * 0.36),
                   (S, H * 0.5 + S * 0.36), (S, H - S), (W - B * 0.2, H - S),
                   (W, H), (0, H), (0, B))]

    # N: verticals plus a full diagonal, the most forward driving letter
    g["N"] = [poly((0, 0), (S, 0), (W - S, H - S * 1.1), (W - S, 0), (W, 0),
                   (W, H), (W - S, H), (S, S * 1.1), (S, H), (0, H))]

    # P: bowl to the waist, blade on the outer corner
    g["P"] = [poly((B, 0), (W - B, 0), (W, B), (W, H * 0.46 - B),
                   (W - B, H * 0.46), (S, H * 0.46), (S, H - B), (S - B, H),
                   (0, H), (0, B)),
              poly((S, S), (W - S - B * 0.4, S), (W - S, S + B * 0.4),
                   (W - S, H * 0.46 - S - B * 0.4),
                   (W - S - B * 0.4, H * 0.46 - S), (S, H * 0.46 - S))]

    # Y: the handoff glyph. Exit point is the right vertical edge, so the next
    # letter starts flush against it, per the library's Y handoff guide.
    g["Y"] = [poly((0, 0), (S, 0), (W / 2, H * 0.44), (W - S, 0), (W, 0),
                   (W / 2 + S * 0.5, H * 0.56), (W / 2 + S * 0.5, H),
                   (W / 2 - S * 0.5, H), (W / 2 - S * 0.5, H * 0.56))]

    # Z: the core letterform of the whole system
    g["Z"] = [poly((0, 0), (W, 0), (W, S * 0.62), (S * 0.92, H - S),
                   (W, H - S), (W, H), (0, H), (0, H - S * 0.62),
                   (W - S * 0.92, S), (0, S))]

    # ── library glyphs, rebuilt to the same grid ──────────────
    g["D"] = [poly((B, 0), (W - B, 0), (W, B), (W, H - B), (W - B, H), (0, H), (0, B)),
              poly((S, S), (W - S - B * 0.4, S), (W - S, S + B * 0.4),
                   (W - S, H - S - B * 0.4), (W - S - B * 0.4, H - S), (S, H - S))]
    g["F"] = [poly((B, 0), (W, 0), (W - B, S), (S, S), (S, H * 0.5 - S * 0.36),
                   (W - B * 1.6, H * 0.5 - S * 0.36), (W - B * 2.2, H * 0.5 + S * 0.36),
                   (S, H * 0.5 + S * 0.36), (S, H), (0, H))]
    # The signature stem: top left and bottom right sheared at 45, which is
    # what makes an upright letter read as forward driving.
    g["I"] = [poly((B, 0), (S, 0), (S, H - B), (S - B, H), (0, H), (0, B))]
    g["L"] = [poly((B, 0), (S, 0), (S, H - S), (W - B, H - S), (W, H), (0, H), (0, B))]
    g["M"] = [poly((0, 0), (S * 0.9, 0), (W / 2, H * 0.52), (W - S * 0.9, 0), (W, 0),
                   (W, H), (W - S, H), (W - S, H * 0.42), (W / 2, H * 0.86),
                   (S, H * 0.42), (S, H), (0, H))]
    g["O"] = [poly((B, 0), (W - B, 0), (W, B), (W, H - B), (W - B, H), (B, H),
                   (0, H - B), (0, B)),
              poly((S * 0.8 + B * 0.3, S), (W - S * 0.8 - B * 0.3, S),
                   (W - S * 0.8, S + B * 0.3), (W - S * 0.8, H - S - B * 0.3),
                   (W - S * 0.8 - B * 0.3, H - S), (S * 0.8 + B * 0.3, H - S),
                   (S * 0.8, H - S - B * 0.3), (S * 0.8, S + B * 0.3))]
    g["R"] = [poly((B, 0), (W - B, 0), (W, B), (W, H * 0.46 - B),
                   (W - B, H * 0.46), (W * 0.52, H * 0.46), (W, H),
                   (W - S * 0.78, H), (W * 0.3, H * 0.46), (S, H * 0.46),
                   (S, H - B), (S - B, H), (0, H), (0, B)),
              poly((S, S), (W - S - B * 0.4, S), (W - S, S + B * 0.4),
                   (W - S, H * 0.46 - S - B * 0.4),
                   (W - S - B * 0.4, H * 0.46 - S), (S, H * 0.46 - S))]
    # S traced as one outline: top bar, left stem to the waist, middle bar,
    # right stem to the foot, bottom bar. Blades on the four outer corners.
    M0, M1 = H * 0.5 - S * 0.5, H * 0.5 + S * 0.5
    g["S"] = [poly((B, 0), (W, 0), (W, S), (S, S), (S, M0), (W - B, M0),
                   (W, M0 + B), (W, H - B), (W - B, H), (0, H), (0, H - S),
                   (W - S, H - S), (W - S, M1), (0, M1), (0, B))]
    g["T"] = [poly((0, 0), (W, 0), (W - B, S), (W / 2 + S * 0.5, S),
                   (W / 2 + S * 0.5, H), (W / 2 - S * 0.5, H),
                   (W / 2 - S * 0.5, S), (B, S))]
    g["V"] = [poly((0, 0), (S, 0), (W / 2, H - S * 0.6), (W - S, 0), (W, 0),
                   (W / 2 + B * 0.4, H), (W / 2 - B * 0.4, H))]
    g["G"] = [poly((B, 0), (W, 0), (W - B, S), (S + B * 0.4, S),
                   (S, S + B * 0.4), (S, H - S - B * 0.4), (S + B * 0.4, H - S),
                   (W - S, H - S), (W - S, H * 0.62), (W * 0.44, H * 0.62),
                   (W * 0.44, H * 0.62 - S * 0.7), (W, H * 0.62 - S * 0.7),
                   (W, H - B), (W - B, H), (B, H), (0, H - B), (0, B))]
    g["H"] = [poly((B, 0), (S, 0), (S, H * 0.5 - S * 0.36),
                   (W - S, H * 0.5 - S * 0.36), (W - S, 0), (W, 0), (W, H),
                   (W - S, H), (W - S, H * 0.5 + S * 0.36),
                   (S, H * 0.5 + S * 0.36), (S, H - B), (S - B, H), (0, H), (0, B))]
    g["U"] = [poly((0, 0), (S, 0), (S, H - S - B * 0.4), (S + B * 0.4, H - S),
                   (W - S - B * 0.4, H - S), (W - S, H - S - B * 0.4),
                   (W - S, 0), (W, 0), (W, H - B), (W - B, H), (B, H),
                   (0, H - B))]
    return g


GLYPHS = glyphs()
# Letters whose shape reads narrower or wider than the default advance.
WIDTH = {"I": S, "T": W * 0.94, "L": W * 0.88, "Y": W * 0.96, "S": W * 0.92}


def word(text, x0=0.0):
    """Return (paths, advance) for a run of letters.

    A glyph's subpaths are joined into ONE d string so fill-rule evenodd can
    knock the counter out of the bowl. Emitting them as separate path elements
    fills the counter instead, which is why D O P R read as solid blobs.
    """
    out, x = [], x0
    for ch in text:
        if ch == " ":
            x += W * 0.42
            continue
        w = WIDTH.get(ch, W)
        out.append(("".join(GLYPHS[ch]), x))
        x += w + GAP
    return out, x - GAP


def render(parts, fill):
    return "".join(
        f'<path d="{d}" transform="translate({x:.1f} 0)" fill="{fill}" fill-rule="evenodd"/>'
        for d, x in parts
    )
