# Handoff: Zaylist Directory page (`/directory`)

## Overview
A rebuilt Directory ("Places") page for zaylist.com. Same purpose as today's page — a filterable, map-aware guide to queer-owned and queer-friendly Portland places — with a different structure: a category **band rail** replaces the constellation, a full-width **map + key** sits above the list, and the list is a column of **slim wide place cards** that expand into the full place card in an overlay.

Repo this targets: `maxmackpdx-pride/pdx-pride-guide`, branch `master`.
Files it replaces / touches: `client/src/pages/Directory.tsx`, `client/src/pages/Directory.css`, `client/src/components/CategoryConstellation.tsx` (retired by the band rail), `client/src/components/DirectoryHero.tsx`, `client/src/components/PlaceModal.tsx`, `client/src/components/ds/PlaceCard.tsx`.

## About the design files
`Directory-standalone.html` is a **design reference** — a self-contained HTML prototype of the intended look and behavior, not production code to copy. Recreate it in the live client (React + Vite + wouter + TanStack Query, existing `client/src/components/ds/*` primitives and `client/src/index.css` tokens) using the patterns already there. Do not hand-port the prototype's inline styles; the real page already has the CSS layers this design is built on.

`Directory.dc.html` is the authoring source of the prototype (same markup, references project files instead of inlined assets). Open the standalone file in a browser to click through it.

## Fidelity
**High fidelity.** Colors, type, spacing, glass treatment, motion timings and copy are final and are all taken from the repo and the Zaylist design system. The card anatomy is a faithful port of `client/src/components/ds/PlaceCard.tsx`, so in the real codebase **reuse that component** rather than rebuilding it — the only card changes are the new "compact wide" layout variant and the upcoming-events flag (below).

## Page structure, top to bottom

1. **Running head** — sticky, `rgba(5,5,5,.94)` + `blur(10px)`, `1px solid #1c1c22` bottom border, 2px animated `--panel-seam` under it with a traveling white glint (`pdxSeamGlint`, 4.6s). In the live app this is the existing site header; keep it.
2. **Hero** — `pdxHeroIn` (.48s, fade + 10px rise). Behind it, `HeroAurora`: three blurred orbs (violet `rgba(136,0,255,.42)`, cyan `rgba(0,255,255,.3)`, magenta `rgba(255,0,204,.26)`), `blur(58–70px)`, drifting on 19s / 23s / 27s loops.
   - H1: Barlow Condensed 900, uppercase, `clamp(2.2rem, 6.4vw, 4.6rem)`, line-height .92, white: "Do business with / those of us on" followed by the ZAYLIST wordmark lockup image (`width: min(100%, 560px)`, trimmed art — the shipped `assets/logo-lockup.png` has large transparent padding, so trim before use).
   - Lede: `clamp(1rem, 2.4vw, 1.2rem)`, `--board-text #f4f1ea`, max 56ch: "Bars, food, cafes, venues, shops, and adult entertainment that are ours, or truly for us. Tune the spectrum, read the city, then go spend money there."
   - Mono mantra, right-aligned, 11px / .2em / uppercase, `--panel-magenta #ff1fa0`: "Show up · spend queer · keep them alive".
3. **Stats band** — full-bleed `--panel-band #070708`, `1px solid #1c1c22` top and bottom, `grid-template-columns: repeat(auto-fit, minmax(190px, 1fr))`, `pdxHeroIn` at +.07s. Three tiles: places listed (magenta `#ff1fa0`), queer-owned (lime `#c8fa3c`), hosting this week (cyan `#19e3ff`). Numerals Barlow Condensed 900, `clamp(2.6rem, 7vw, 4.4rem)`, line-height .82, `font-variant-numeric: tabular-nums`, each with `pdxNumPop` (.5s, staggered .3 / .4 / .5s). Mono labels 10px / .2em / `#999`.
4. **Category band rail** ("What do you need today?" + mono hint "Tap a band to tune the city") — `display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 16px 12px`, padded 12px top / 26px bottom so the floor blooms are not clipped. Each band is a deep-glass card (`.pdx-glass` + `.pdx-glass-rebind`, `--_c` = the category color, radius 12px) holding: a 3px bar in the category color (opacity 1 active / .45 idle), the count in Barlow 900 `clamp(1.6rem, 3.2vw, 2.4rem)` tabular, and a mono 10px / .18em label. Active band: count in the category color, label white, `pdxPulse` 4s ambient glow. **Categories with a count of 0 render no band** (same rule as the live constellation).
5. **Map** — `MapPanel` at 560px, category-colored pins, no day legend, "You" locate chip, plus a 2px refract seam across the top of the frame. Pins are click targets: a 44px transparent hit area per pin, and the selected place's pin gets a 42px accent ring pulsing on `zdRing` (2.2s).
6. **Map key** — neutral deep-glass card (`.pdx-glass--neutral`), 13px/16px padding, radius 12px: mono "KEY" then one 12px ringed dot per category, then a rainbow conic swatch for **Queer-owned**.
7. **Search + filters** — in normal flow directly under the key (deliberately *not* sticky). Full-width `SearchInput` (size `sm`, placeholder "Search the directory…"), a mono count pill ("50 places", lime on `#0c0c0f` with a `#1c1c22` hairline), then the neighborhood `FilterChip` row, wrapping so the whole set is visible (no horizontal scroll). Chips: ALL, Downtown, Old Town, Pearl, NW, N, NE, Alberta, Inner East, Central Eastside, SE, Montavilla, Multiple.
8. **The dock** — heading "The dock" + mono hint, then a single column of place cards, `gap: 12px`, in page flow.
9. **Add-a-place band** — deep-glass card, `--_c` acid yellow: "Is your place on Zaylist?" + "Members can list spots that are ours or truly for us. Owners can claim a listing and keep the hours honest." + solid `Button` size `lg` "Add a place".

The old close-seam footer is intentionally **not** part of this design.

## The cards

### Closed card — compact wide variant (new)
Reuse `ds/PlaceCard` and add a `--compact`/`--wide` variant. All of the resting anatomy is unchanged (`__glow`, `__body`, `__sheen`, 1.5px `__seam dir-refract`, hover Share/Follow in `__actions`, 6px hover lift, calm-mode rules). Differences:
- `__body` is a **row**: `flex-direction: row; align-items: center; gap: 14px; padding: 10px 14px 10px 10px; border-radius: 12px`. Everything except the logo well is wrapped in a `__main` column (`gap: 5px`).
- Logo well: `flex: 0 0 92px; height: 56px; padding: 0`; logo `max-height: 52px` (keeps `mix-blend-mode: screen` + `contrast(1.35) brightness(1.08)` + accent drop-shadow); media glow `blur(16px)`.
- `__glow` inset `-3px`, radius 14px.
- Content shown: category chip (and GRAND OPENING chip when active), name at `1.06rem`, and the address row only (`.78rem`, 12px icon). **Hidden at rest:** hours, phone, description, links, upcoming-events list, promoters — those are the big card's job.
- Right edge, vertically centered: the **upcoming-events flag** — mono 11.7px / .14em uppercase, `color: var(--c)`, `background: color-mix(in srgb, var(--c) 14%, #08080b)`, `1px solid color-mix(in srgb, var(--c) 55%, #101014)`, radius 6px, keyline + soft accent bloom, with a 9px dot in the **next event's day color** and the label "N upcoming events". Rendered only when the place has upcoming events.
- Whole card is clickable (`--clickable`), cursor pointer.

### Open card — the big card
Clicking a card opens a fixed overlay: `rgba(3,3,5,.72)` + `blur(6px)`, `z-index: 1000`, scrollable, click-to-close, above all page chrome. Inside, `max-width: 620px`:
- A 44x44 round X at the top-right corner of the card (`#0c0c0f`, black keyline, dark bevel, 6px/16px drop) — `aria-label="Close place detail"`.
- The **same** PlaceCard, `--open`: media well 190px (logo up to 150px), name `1.9rem`, description unclamped, and the full information set — address (links to Google Maps), hours, phone (`tel:`), description, Website / Instagram links, grand-opening date line.
- Upcoming events as a **horizontal rail** so the card cannot run long: mono hint "Swipe for the rest · the card stays put", then 224px tiles (`scroll-snap-align: start`, radius 10px, 3px left border in the day color, `background: color-mix(in srgb, <day> 8%, #0b0b0f)`) with the when-line in the day color and the title in white.
- Below it, a second deep-glass panel in the place's accent with the cross-surface content the live `PlaceModal` already loads: Google Maps link, promoter chips, **Missed connections here** (magenta `--board-spotted`, blinking live dot, quote rows with a 3px left border, link to `/spotted`), **Gig board** (violet `--board-gigs`, role + pay rows, link to `/pride-work`), and the claim line "Own this one? Claim the listing and keep the hours honest."

### Little-to-big transform
On card click, capture the card's `getBoundingClientRect()`, then run a FLIP on the open card with the Web Animations API (not inline styles, so a re-render can't strand it mid-transform):

```js
el.animate(
  [{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity: .45 },
   { transform: "none", opacity: 1 }],
  { duration: 360, easing: "cubic-bezier(.2,.85,.3,1)" }
);
```
with `transform-origin: top left`. Skipped in calm mode and `prefers-reduced-motion`. This is the same intent as `PlaceModal`'s existing FLIP, so prefer wiring the existing one.

## Categories (exact)
Keys, labels and colors are `TYPE_LABELS` / `TYPE_COLORS` from `client/src/pages/Directory.tsx`:

| type | label | color |
|---|---|---|
| bar | Bars & Clubs | `#FF00CC` |
| restaurant | Restaurants | `#FF6600` |
| cafe | Cafes | `#39FF14` |
| venue | Venues | `#19E3FF` |
| service | Services | `#A855F7` |
| shop | Shops | `#FFD700` |
| hotel | Hotels | `#FF1FA0` |
| nonprofit | Nonprofits | `#FFFFFF` (rainbow `--_edge`) |
| healthcare | Health & Care | `#FF00CC` (pink→white `--_edge`) |
| realestate | Real Estate | `#1A4DFF` (navy→white `--_edge`) |
| group | Clubs & Groups | `#FFD700` (white→gold `--_edge`) |
| campground | Campgrounds | `#39FF14` (lime→forest `--_edge`) |

Plus one **addition not in the repo**: an `adult` band (Adult, `#FF2400`, the repo's red-glow logo pack) covering adult shops and clubs that currently live under `shop`. If you don't want a new business type, keep the DB type as `shop` and derive the band from the logo pack / a flag.

Specialty edges use the exact gradients already in `PlaceModal.tsx` / `ds/PlaceCard.tsx` (`RAINBOW_EDGE`, `HEALTHCARE_EDGE`, `REALESTATE_EDGE`, `CAMPGROUND_EDGE`, `GROUP_EDGE`).

## Interactions & behavior
- **Band click** — sets the active type, clears the selection, retunes that band's accent. ALL resets.
- **Neighborhood chip** — single-select, clears the selection.
- **Search** — matches name, description and neighborhood, case-insensitive; clear button resets.
- **Sort** — queer-owned first (togglable), then A→Z, `sensitivity: "base"`. The live page sorts verified grand openings first; keep that too.
- **Card / pin click** — selects the place, opens the big card, rings the pin. Clicking the same card again closes it.
- **Close** — the X, or a click on the scrim.
- **Deep links** — keep the live behavior: `/directory/:id/:slug`, `?type=`, `?q=`, `?place=`, plus the `sessionStorage` grid/scroll restore.
- **Calm mode / reduced motion** — no grain, no aurora, no blooms (`--dir-gm: 0`), static seams, no card entrance, no FLIP. The prototype has a CALM toggle in its header purely to demo this; the real page uses the site-wide toggle.

## State
`activeType`, `activeNeighborhood`, `searchQuery`, `queerOwnedOnly`, `selectedPlaceId`, `originRect` (for the FLIP), `calm`. Data comes from `GET /api/directory` exactly as today (each business already carries `upcomingEvents`, `spotted`, `gigs`, `promoters`).

## Design tokens used
Colors: surfaces `#0a0a0a`, `#050505`, `--panel-band #070708`, `--panel-card #0c0c0f`, borders `#1c1c22` / `#1e1e24` / `#24242c`. Neons: `#FF00CC`, `#FF6600`, `#39FF14`, `#19E3FF`, `#00FFFF`, `#A855F7`, `#FFD700`, `#FF1FA0`, `#1A4DFF`, `#FF2400`, `#CCFF00`. Text `#fff` / `#f4f1ea` / `#c4c0b6` / `#8e8a82` / `#999` / `#666`. Day colors MON `#8800FF`, TUE `#0044FF`, WED `#FFEE00`, THU `#00FFFF`, FRI `#FF00CC`, SAT `#39FF14`, SUN `#FF6600`.
Type: display Barlow Condensed 700–900 uppercase; body Inter; mono `ui-monospace` at 9–12px with .14–.2em tracking, uppercase.
Radii: 12px chrome, 12px compact card, 16px full card, 10px tiles, pills for chips. Spacing: 6 / 10 / 12 / 14 / 18 / 22px rhythm.
Motion: .15–.16s hover/press; `pdxHeroIn` .48s (+.07s stats); `pgDirCardIn` .55s card entrance; `pdxNumPop` .5s; `pdxPulse` 4s; `dirRefract` 7s; seam flow 9s + glint 4.6s; aurora 19/23/27s; FLIP 360ms `cubic-bezier(.2,.85,.3,1)`.

## Assets
- Place logos: the repo's own pack, `client/public/directory-logos/*.png`, resolved through `shared/directoryLogos.ts` stems with `fallback_<type>.png` per category. Nothing new needed.
- Wordmark: `assets/logo-lockup.png` from the design system, **trimmed** of its transparent padding for inline headline use.
- Map: the prototype uses the branded `MapPanel` stand-in; production keeps Leaflet + CARTO Dark Matter with the same pin styling.

## Files in this bundle
- `Directory-standalone.html` — the clickable prototype, fully self-contained (open in any browser).
- `Directory.dc.html` — the prototype source.
- `README.md` — this document.
