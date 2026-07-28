# HAÜS title motif ("Dynamic text")

How the big name over the first photo works, so it can be ported into the Zaylist
client. Behaves like Adobe Express **Dynamic** text: capitalized, one word per
line, every line scaled to fill the *same* width.

## Where it lives

| Piece | File |
| --- | --- |
| `Well` component (photo + title + caption row) | `haus-ui.jsx` |
| `nameLines()` / `measureLine()` helpers | `haus-ui.jsx` |
| `.hz-well`, `.hz-well__name`, `.hz-well__label` | `haus.css` |

Used by every card and detail head: `<Well photos={…} title={…} nameCap={0.62}>`.

## The rule

1. **Split, don't wrap.** `nameLines(title)` splits on whitespace so each word is
   its own line. "Rowan Vasquez" → `ROWAN` / `VASQUEZ`. Titles ending in HAÜS keep
   HAÜS on its own line.
2. **One shared width.** The block gets a single pixel width `nameW`. Every line is
   rendered at exactly that width — that is what produces the flush-left/flush-right
   column in the reference.
3. **Scale, never stretch.** Each line is an inline `<svg viewBox="0 0 W 108">`
   whose `W` is the *measured* advance width of that word at 100px Barlow Condensed
   900. Setting the SVG's CSS width to `nameW` scales the glyphs uniformly, so a
   short word gets big type and a long word gets small type with no horizontal
   distortion. `preserveAspectRatio="none"` is present but the height is computed
   from the same ratio, so the aspect is preserved in practice.
   - line height = `nameW * (108 / measuredWidth)`
4. **Fit the budget, don't overflow.** The height available is the photo height
   minus the caption row minus 22px of breathing room. `nameW` is the smaller of:
   - the width cap: `wellWidth * nameCap`
   - the height fit: `heightBudget / Σ(108 / measuredWidth_i)`
   So a long name gets *narrower*, never taller, and it can never sit under the
   caption row or the dots.
5. **Scale with card width, not content.** `kH` (share of photo height the block
   may claim) is `0.62 * clamp(wellWidth / 390, 1, 1.26)`, so full-width HAÜS
   cards get proportionally larger type than the two-up cards while all cards in a
   column stay visually consistent.
6. **`nameCap` per surface.** Cards use `0.62`; Offering/Looking detail heads use
   `0.35` so the title covers at most a third of the image left-to-right.

## Measuring

`measureLine()` measures on a cached 2D canvas context at
`900 100px "Barlow Condensed"` and memoizes per string. Because webfont metrics
differ from the fallback, `useFontsReady()` re-renders once `document.fonts.ready`
resolves; before that the block is `visibility:hidden` so no unscaled flash shows.
A `ResizeObserver` on the well and on the caption row recomputes `nameW` on layout
change (viewport toggle, column change).

## Layout contract

`.hz-well` is a flex column: title block, flexible spacer, caption row. The title
is `flex:0 0 auto` and the caption row is `flex:none`, so nothing overlaps —
the guard is structural, not a magic z-index or offset.

## Character limits

House names are authored to fit: keep them to **3 words / ~22 characters** (for
example "The Hawthorne HAÜS"). Longer strings still render, they just shrink; past
about 4 words the type gets small enough that the motif stops reading as a motif.
Enforce the limit in the composer field, not in this component.

## Design-system notes

- Type is **Barlow Condensed 900** from `--font-display` / `--fw-black`, fill
  `--text-hi`. No invented tracking, no synthetic stretch, no new weights.
- The hard drop shadow is `filter: drop-shadow(0 3px 0 rgba(0,0,0,.55))` — the
  same lit-plate keyline logic used elsewhere, not a glow.
- Nothing here sets a color; the surrounding surface's `--c` drives the dots,
  arrows, and border. Calm mode needs no special case.
