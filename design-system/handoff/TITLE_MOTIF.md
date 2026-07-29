# HAÜS title motif ("Dynamic text")

How the big name over the first photo works. Behaves like Adobe Express **Dynamic**
text: capitalized, shared width, flush column, top-left of the cover photo.

**Live product is truth.** Implementation: `client/src/components/housing/HousingWell.tsx`
and `.hz-well*` in `client/src/pages/Housing.css`. This doc matches that code
(updated 2026-07-28). Public design system: [Title motif panel](https://maxmackpdx-pride.github.io/zaylist-design-system/)
under Brand treatments / Key terms in Prompts.

## Where it lives

| Piece | File |
| --- | --- |
| Photo well + title + caption | `HousingWell.tsx` |
| `nameLines()` / `measureLine()` | `HousingWell.tsx` |
| Well shell CSS | `Housing.css` (`.hz-well`, `.hz-well__name`, `.hz-well__label`) |
| Design system specimen | `guidelines/title-motif.html` in zaylist-design-system |

Used on every HAÜSING feed card and detail head:
`<HousingWell photos={…} title={…} nameCap={0.35} />` (detail only).

## Key terms

| Term | Meaning |
| --- | --- |
| **Title motif / dynamic text** | The household or person name set bold over the cover photo. Not a caption under the image. |
| **Photo well** | The cover image area (`.hz-well`). Fixed height **240px** desktop / **190px** mobile. Independent of the title frame. |
| **Title frame** | The region dynamic text is sized to fill (top-left). Defined as **shares of the well**, not of the whole card. |
| **Half card** | Looking / Offering / Managed. One column of the two-up feed. Same title frame on all three. |
| **Wide / Forming card** | Forming a HAÜS. Full feed width (`hz-card--wide`). Same **height** share as half cards; **wider** title frame. |
| **Equal line heights** | Every line of the name uses the same pixel height so short lines (HAÜS) do not collapse the block. |
| **HAÜS suffix** | Locked household name ending. Always its own second line when present. |
| **nameCap** | Optional width-share override. Feed cards omit it (use frame rules). Detail heads use **0.35**. |

## The rule (live)

### 1. Split, do not wrap
`nameLines(title)` uppercases and splits on whitespace into **at most two lines**,
balanced by character count. Titles ending in **HAÜS** keep HAÜS alone on line 2.

Examples: `ROWAN` · `ROSE CITY` / `FLATS` · `SUNNYSIDE` / `HAÜS` · `WILDROSE` / `HAÜS`.

### 2. One shared width
The name block has a single CSS width. Every line SVG is `width: 100%` of that
block so the column is flush left and right (dynamic text look).

### 3. Title frame (where text lives)
Frame is a **fraction of the photo well**, top-left. Mobile uses the same fractions.

| Surface | Width of well | Height of well |
| --- | --- | --- |
| Looking / Offering / Managed (half) | **55%** | **58%** |
| Forming (wide well, aspect ≥ 2.35) | **72%** (room for avatars on the right) | **58%** (same band as half) |
| Detail heads | **35%** (`nameCap={0.35}`) | **58%** (capped by caption) |

Constants in code: `HALF_FRAME_W_SHARE`, `WIDE_FRAME_W_SHARE`, `FRAME_H_SHARE`, `WIDE_ASPECT`.

### 4. Fill the frame
1. Build `frameW` / `frameH` from the shares above.
2. Split height evenly across lines (`lineH = frameH / n`).
3. Derive width from the **longest** word’s metrics so short HAÜS lines do not shrink the whole motif.
4. If the block is wider than `frameW`, scale down to fit.
5. Tiny optional horizontal stretch (**1.02**) on block width only.

### 5. Photo well size is separate
Do **not** change well height when adjusting type. Well stays **240 / 190**. Title
rules only move the text frame and scale.

### 6. Layout contract
`.hz-well` is a flex column: title block, flexible middle, caption row (avatars /
mono line / dots). Title is top-left; caption is bottom. Structural flex avoids
overlap; not z-index alone.

## Measuring

`measureLine()` uses a cached 2D canvas at `900 100px "Barlow Condensed"`, memoized
per string. After `document.fonts.ready`, the cache clears and the block remeasures.
Until fonts are ready the name stays `visibility: hidden`. `ResizeObserver` on the
well recomputes when the card width changes (half vs Forming, mobile).

## Character limits

House names: **3 words / ~22 characters** front part before HAÜS (composer). Longer
strings still render; they shrink inside the frame. Enforce in the composer, not only
in `HousingWell`.

## Design-system notes

- Type: **Barlow Condensed 900** (`--font-display` / `--fw-black`), fill `--text-hi`.
- Shadow: hard drop on `.hz-well__name` (lit-plate keyline family, not a soft glow).
- Accent `--c` drives well border, dots, and arrows; not the white name fill.
- Calm mode: no special case required for the title itself (static type).

## What goes in the overlay

| Card type | Title content |
| --- | --- |
| Looking | Person display name |
| Offering / Forming | Household display name (`… HAÜS`) |
| Forming, no photos | `Build a HAÜS` |
| Managed | Property / building name (no forced HAÜS) |

## Prompting

Say: **title motif**, **dynamic text**, or **HAÜSING name-over-cover**.  
Do not say: “make the text bigger on the image” without naming the frame shares
or the half vs Forming rule.
