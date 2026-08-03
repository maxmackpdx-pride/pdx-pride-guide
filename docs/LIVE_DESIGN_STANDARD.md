# Live design standard (implementation checklist)

**Design guide (written standard + specimens):** [`design-system/`](../design-system/) and the public site [Zaylist Design System](https://maxmackpdx-pride.github.io/zaylist-design-system/). That package is the **source of truth for design rules**. Do not maintain a second kit.

**This file** is the **production trap list** for agents shipping React/CSS: what not to re-introduce, and where chrome lives in code. It must **not contradict** `design-system/`. If it does, fix this file (or product), not invent a third guide.

| Priority | What | Path |
|----------|------|------|
| **1 - Design guide** | Written standard + specimens | `design-system/` · https://maxmackpdx-pride.github.io/zaylist-design-system/ |
| **2 - Implementation** | Production React + CSS | `client/src/components/ds/**`, page CSS, adapters |
| **3 - Token modules (code)** | Live token files used by the app | `client/src/components/ds/tokens/` especially **`glass.css`** |
| **Archive** | Migration package + screenshots | `docs/handoffs/deep-glass-2026-07-16/` |

If an old handoff, sandbox, or removed portable preview **disagrees with the design guide**, **the design guide wins**. If product code disagrees with the guide, either ship product to match or mark the guide panel **queued**.

---

## Do not re-introduce (global traps)

These used to be “the rules.” They are **retired** as defaults. Agents must not restore them sitewide.

| Retired default | Live rule instead |
|-----------------|-------------------|
| Brutal magenta offset as **default CTA** (`4px 4px 0` magenta) | **Glass buttons** - `.pdx-glass-btn` / `.pdxBtn` / solid fill, black ring, **no outer neon bloom** |
| Lite-glass translucent cards + hard `#2b2b2b` only | **Deep-glass** - `--glass-card*`, black ring + neon edge, sheen, poster-well |
| Map outer neon bloom / thick glow frame | **Debossed map well** - thin black rim + inward hole (`--map-frame-shadow`); no outer bloom |
| Sitewide cyan “pull” above bottom nav | **Removed**; hub drawer grip only |
| Claim chip = yellow rim + magenta offset brutal sticker | **Claim this event** = pure `#00FFFF` fill, dark type `#050506`, soft cyan offset `3px 3px 0 rgba(0,255,255,.35)` (no yellow border) |
| “Event details →” dead text on grid cards | **Omit**; card click opens modal |
| Board “past” = missed-connection 7-day window | **Past** = scheduled `dateEnd` passed (`isEventSchedulePast` / `getEventScheduleTiming`) |
| Mr. S ad primary `#ff0033` (red) | Mr. S = **cyan** `#19e3ff`; CockBlock = **red** `#ff1f1f` |
| Ads that don’t match grid/feed | Builder must use **`PosterAdCard` / `FeedAdCard`** + live templates in `lib/adTypes.ts` |
| Day color on primary RSVP | RSVP / primary action accent stays **lime** `#CCFF00` where reserved; day colors are data only |
| Touch nav chrome without explicit ask | **Nav locked** unless user requests - black outlines; cyan for active/handle only |

`--brutal-shadow*` tokens may remain for **intentional stickers** only. Never wire them as the default for buttons, tickets, Shop Now, or “I’ll be there.”

---

## Canonical surface recipes (implementation)

| Recipe | Token / class | Used for |
|--------|---------------|----------|
| Accented card | `--glass-card-*` + `.pdx-glass-rebind` + local `--c` | Event board, places, boards, ads |
| Neutral card | `--glass-card-neutral-*` | Work rows, neutral panels |
| Poster media | `--poster-well-*` / `.pdx-poster-well` | Flyer wells, ad media |
| Primary CTA | `.pdx-glass-btn--solid` or `.pdxBtn--solid` | Tickets, Shop Now, filled actions |
| Default glass CTA | `.pdx-glass-btn` / `.pdxBtn` | Secondary glass controls |
| Map frame | `--map-frame-shadow`, mapTheme | Events / directory / beach maps |
| Map key / legend | `.map-legend` / `.directory-map-key` / `.pdxLegend` → **neutral deep-glass** (`--glass-card-neutral-*`) | All maps; pin swatches unchanged; no lime/cyan panel bloom |
| Claim sticker | `.pdxBoard__claim-tag` / `.event-card-meta-tag--claim` | Unclaimed listings only |
| Rainbow top seam | `.pdx-rainbow-rule` / card `::before` | Clickable cards (see board standard) |

**Accent contract:** set `--c` (and rebind with `.pdx-glass-rebind`) per instance. Day colors → event cards; board accents → gigs/gifts/spotted; brand accents → ads.

---

## Events board (behavior + chrome)

- **Main grid / map** = upcoming + live only (`!isEventSchedulePast`).
- **PAST chip** = ended listings only.
- **No** decorative Event details row on grid.
- Share = icon control, not a fake link chip.
- Open event: Flags / Tags / About glass panels; tickets = solid glass.

## Ads (grid + feed)

- Live components: `PosterAdCard`, `FeedAdCard` (+ legacy hard-coded affiliate cards must match them).
- Templates: `templateDraft()` in `client/src/lib/adTypes.ts` - CockBlock red, Mr. S cyan.
- Builder preview must render those same components (WYSIWYG).
- Shop Now = solid brand fill; **dark type on cyan/lime**, **white type on CockBlock red**.

## Boards (gigs / gifts / spotted)

- Structure + overlay triad still in `docs/BOARD_CARD_STANDARD.md`.
- Chrome = deep-glass (not old flat zine slabs).
- Motifs sit **above** sheen, visible; ISO/Looking dashed edges per live CSS.

## Maps

- Debossed OLED frame; keys = OLED panel chrome, pin **shapes** preserved.
- No sitewide outer map bloom.

## Motion

- Prefer existing tokens + `pgDirCardIn` entrances.
- Calm / `prefers-reduced-motion` kill ambient pulses and seam animation (bar may stay static).
- See archive `GROK_ANIMATION_MIGRATION.md` only for inventory - do not re-migrate.

## Homepage front door

- The homepage is not a carousel. It uses one full-bleed Welcome scene followed by seven responsive Zaylist world cards.
- Mobile is the governing composition: a vertical reading order with no arrows, dots, clipped utility panels, or hidden product content.
- Current founder order starts with Nude Beaches, then Events, Places, Haüsing, Gifting, Gig Board, and Missed Connections.
- The Nude Beaches world shows live Rooster Rock air, water, wind, and river conditions over its neutral gray topographic motif.
- The existing site navigation remains outside the homepage pattern and must not be duplicated inside it.
- Each world uses the deep-glass shell with one `--c` accent. Calm Mode removes ambient video and bloom while preserving every route and label.
- Homepage world cards carry only a restrained Fluent 2 undertone: quiet inner highlight, composed corner, low elevation, and one-pixel hover lift. Do not import Fluent palette or replace deep glass.
- The outer Events world is the flyer stage, with no inset card or reserved bands. The flyer covers the full surface from top edge to bottom edge; header, event information, and position controls overlay that single image. It advances through upcoming events unless Calm Mode or reduced motion is active.
- The Events flyer stage always shows its active position counter and rail. When local upcoming data is empty, it uses the canonical `HOME_STAGE_DEMO_SAMPLES.events` fallback from the repository.
- The Places world uses a low-contrast Portland street-and-river map motif behind the directory story.
- Places includes a 40-business square app-tile launcher sourced from `/api/directory`: 8 columns by 5 rows on larger screens and 5 columns by 8 rows on phones.
- Haüsing, Gifting, Gigs, and Missed Connections use full-card object motifs at a stronger register than the river and Places maps: house floor plan, gift-box blueprint, pinned bulletin board, and lost/found/looking notices respectively.
- On mobile, the homepage hands directly into the footer. The footer owns dock clearance; do not insert a second dock-height spacer after the final homepage seam.

---

## Source chain for agents

```
design-system/  (+ public Pages guide)
        = written standard + specimens (SoT for design)
        ↓  implement in product
client/src/components/ds/tokens/*   ← live token modules (glass, colors, …)
client/src/components/ds/*          ← React components
client/src/pages/*.css              ← page chrome
        ↑  if product drifts, fix product or mark guide "queued"
npm run sync:design-system          ← mirror from zaylist-design-system checkout only
```

Before inventing a new global rule:

1. Check **`design-system/guidelines/`** and **`design-system/tokens/`**.
2. Look at **production component CSS** for that surface.
3. Prefer a token in `glass.css` / `effects.css` over a one-off.
4. If you change a global default, update the **design guide** (and this trap list if needed) in the same ship.

---

## Related docs (role)

| Doc | Role |
|-----|------|
| `design-system/` | **Design guide** - source of truth for the system |
| `docs/LIVE_DESIGN_STANDARD.md` | **This file** - production trap list / implementation notes |
| `docs/DESIGN_SYSTEM_INTEGRATION.md` | How product maps to the guide |
| `docs/BOARD_CARD_STANDARD.md` | Board triad / rainbow seam / feed structure |
| `docs/handoffs/deep-glass-2026-07-16/` | **Historical** migration package - not active work orders |
| `AGENTS.md` | Ship rules + points at the design guide |

---

## Quick agent checklist

- [ ] CTA uses glass-btn / pdxBtn - **not** default brutal offset  
- [ ] Card uses glass-card + sheen + rebind - **not** flat `#0b0b0b` + only `#2b2b2b`  
- [ ] Map frame debossed - **no** outer bloom  
- [ ] Claim sticker cyan soft-offset - **no** yellow rim  
- [ ] Grid ads/events match live components  
- [ ] Past events only under PAST  
- [ ] Nav untouched unless asked  
- [ ] Docs updated if a global default changes  
