# Deep-glass migration - orchestrator notes

**Package path:** `docs/handoffs/deep-glass-2026-07-16/`  
**Sources:** `GROK_MIGRATION_PROMPT.md`, `GROK_PER_AGENT_TASKS.md`, `GROK_ANIMATION_MIGRATION.md` (+ §6 GitHub audit), `Card System.html`, `screenshots/`.

## Authority

**This package is the new design source of truth.** It **overrides** previously locked standards (lite glass fills, soft-only card shadows, brutal magenta as default CTA, unframed map chrome, “hover-only” card bloom where deep-glass specifies always-on). Older docs (`docs/BOARD_CARD_STANDARD.md`, prior DS notes) remain useful for structure/layout/behavior, but **surface/edge/glow/button/map chrome defer to this package**.

## Scope

**Surface-only** (edge / glow / fill / button chrome). Zero layout, spacing, radii-as-structure, fonts, or type-scale diffs. Bespoke feature motion (§6.2 catalog) is **carried forward untouched**.

## Old → new (one line)

Translucent `#0c0c12@76%` lite glass + soft drop + brutal magenta CTA offsets → **OLED radial black slabs**, **2px black ring**, **always-on accent bloom**, **corner sheen**, **shared rainbow seam at card scale**, **glass buttons**, **debossed map frames**.

## §6 corrections (trust over early prompt sections)

| Topic | Correction |
|-------|------------|
| Card entrance | **`pgDirCardIn`** - 22px / `.55s` / `--ease-out` (PlaceCard already). Not `dirCardIn` 20px/.5s. Alias `dirCardIn` → same keyframe for reference HTML parity. |
| Glass hover | **6px lift** + brightness/saturate/shadow on directory-style cards. `--hover-lift: -2px` stays for **legacy** only. |
| Seam engine | **One system:** `pdx-rainbow-rule` (3px, same as header/PlaceModal). `dirRefract` is an **alias / thinner edge-masked presentation**, not a second engine. |
| Resting glow | Driven by **`--dir-gm`** (or token equivalent). Calm **zeros the multiplier**, does not delete the shadow rule. |
| Feature keyframes | ~80 outside `effects.css` - **do not drop** (aurora, glitch, map RSVP pulse, board, inbox, attendance, avatar breathe, self-injecting suites, `pdxa*` mirrors). |

## Token contract (land first)

| Token / helper | Role |
|----------------|------|
| `--glass-card` / `glass(accent)` | Master accented OLED card |
| `--glass-card-neutral` / `glassNeutral()` | Grey/white bloom (rows, feed, support) |
| `--glass-sheen` | Corner sheen overlay(s) |
| `--refract-seam` / `.pdx-rainbow-rule` | Top prismatic bar (shared engine) |
| `--poster-well` | Image/logo well + scanline + 4px accent floor |
| `--glass-btn` / `--glass-btn-outline` | Primary + secondary glass CTAs (replaces default brutal offset) |
| `--map-surface` / `mapTheme` | OLED frame, grid, deboss, reduced vignette, pin bloom |
| `--edge-deboss` | Nav drawer / folder inset edge |

## Agent order

1. **Foundation** (this pass): `tokens/glass.css`, `ds/glass.ts`, `ds/mapTheme.ts`, `tokens/effects.css` hooks, exports.
2. **Agent 5 Maps** + **Agent 7** (introduces neutral) + **Agent 8** (introduces `--edge-deboss`) - first surface wave.
3. **Agents 1–4** (event / open event / directory / boards) - biggest card impact.
4. **Agents 6, 9–14** - remaining surfaces.

Each agent: own files only · point at shared tokens · match `screenshots/NN-*.png` · search anchor in `Card System.html` · calm + reduced-motion · **no layout reflow**.

## Definition of done (program)

- [ ] All 14 sections match screenshots at card/map chrome level
- [ ] No hard-coded one-off edge/glow values outside tokens
- [ ] Calm zeros bloom (`--dir-gm` / glow mult) and freezes seams
- [ ] `npm run sync:design-system` if portable kit needs the new tokens
- [ ] Layout screenshots / smoke unchanged except surface look

## Current repo baseline (2026-07-16)

- **Lite glass already shipped** in `client/src/components/ds/tokens/glass.css` (`--pdx-glass-fill` @76%, soft shadow) - this migration **supersedes** that recipe.
- **PlaceCard** is the furthest along deep-glass (pgDirCardIn, `--dir-gm` glow, media well scanline, 6px hover).
- **MapPanel** still uses old radial + flowing 3px seams; needs `--map-surface` frame.
- **Button** still brutal magenta offset - glass button variant lands with foundation + agent CTAs.

## Reference

Open `Card System.html` in a browser. Map tiles need network; OLED frame/grid/pins/vignette work offline.
