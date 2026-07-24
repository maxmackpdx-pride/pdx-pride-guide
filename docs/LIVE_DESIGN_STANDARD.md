# Live design standard (source of truth)

**As of 2026-07-16, the live product is the design standard.**

| Priority | What | Path |
|----------|------|------|
| **1 — Truth** | Production React + CSS on `master` / zaylist.com | `client/src/components/ds/**`, page CSS, adapters |
| **2 — Tokens** | Modular production tokens | `client/src/components/ds/tokens/` especially **`glass.css`** |
| **3 — Portable kit** | Claude Design export (must not invent chrome) | `design-system/` via `npm run sync:design-system` |
| **Archive** | Migration package + screenshots | `docs/handoffs/deep-glass-2026-07-16/` |

If a doc, preview HTML, sandbox, or handoff **disagrees with live**, **live wins**. Update the doc; do not “fix” production back to an outdated rule.

---

## Do not re-introduce (global traps)

These used to be “the rules.” They are **retired** as defaults. Agents must not restore them sitewide.

| Retired default | Live rule instead |
|-----------------|-------------------|
| Brutal magenta offset as **default CTA** (`4px 4px 0` magenta) | **Glass buttons** — `.pdx-glass-btn` / `.pdxBtn` / solid fill, black ring, **no outer neon bloom** |
| Lite-glass translucent cards + hard `#2b2b2b` only | **Deep-glass** — `--glass-card*`, black ring + neon edge, sheen, poster-well |
| Map outer neon bloom / thick glow frame | **Debossed map well** — thin black rim + inward hole (`--map-frame-shadow`); no outer bloom |
| Sitewide cyan “pull” above bottom nav | **Removed**; hub drawer grip only |
| Claim chip = yellow rim + magenta offset brutal sticker | **Claim this event** = pure `#00FFFF` fill, dark type `#050506`, soft cyan offset `3px 3px 0 rgba(0,255,255,.35)` (no yellow border) |
| “Event details →” dead text on grid cards | **Omit**; card click opens modal |
| Board “past” = missed-connection 7-day window | **Past** = scheduled `dateEnd` passed (`isEventSchedulePast` / `getEventScheduleTiming`) |
| Mr. S ad primary `#ff0033` (red) | Mr. S = **cyan** `#19e3ff`; CockBlock = **red** `#ff1f1f` |
| Ads that don’t match grid/feed | Builder must use **`PosterAdCard` / `FeedAdCard`** + live templates in `lib/adTypes.ts` |
| Day color on primary RSVP | RSVP / primary action accent stays **lime** `#CCFF00` where reserved; day colors are data only |
| Touch nav chrome without explicit ask | **Nav locked** unless user requests — black outlines; cyan for active/handle only |

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
- Templates: `templateDraft()` in `client/src/lib/adTypes.ts` — CockBlock red, Mr. S cyan.
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
- See archive `GROK_ANIMATION_MIGRATION.md` only for inventory — do not re-migrate.

---

## Source chain for agents

```
LIVE SITE (master / Railway)
        ↑
client/src/components/ds/tokens/glass.css   ← surface chrome SoT
client/src/components/ds/*                  ← React components
client/src/pages/*.css · component CSS      ← page chrome
        ↓  npm run sync:design-system
design-system/tokens/tokens.css             ← colors/days portable only
design-system/previews/*                    ← must not override glass recipes
```

Before inventing a new global rule:

1. Look at **production component CSS** for that surface.
2. Prefer a token in `glass.css` / `effects.css` over a one-off.
3. If you change a global default, update **this file** in the same commit.

---

## Related docs (role)

| Doc | Role after this standard |
|-----|---------------------------|
| `docs/LIVE_DESIGN_STANDARD.md` | **This file** — superseding global rules |
| `docs/DESIGN_SYSTEM_INTEGRATION.md` | Integration map + component inventory (defers here for chrome) |
| `docs/BOARD_CARD_STANDARD.md` | Board triad / rainbow seam / feed structure |
| `docs/handoffs/deep-glass-2026-07-16/` | **Historical** migration package — not active work orders |
| `design-system/EVENTS_GUIDE.md` | Event system structure; chrome → live components |
| `AGENTS.md` | Ship rules + points here for design SoT |

---

## Quick agent checklist

- [ ] CTA uses glass-btn / pdxBtn — **not** default brutal offset  
- [ ] Card uses glass-card + sheen + rebind — **not** flat `#0b0b0b` + only `#2b2b2b`  
- [ ] Map frame debossed — **no** outer bloom  
- [ ] Claim sticker cyan soft-offset — **no** yellow rim  
- [ ] Grid ads/events match live components  
- [ ] Past events only under PAST  
- [ ] Nav untouched unless asked  
- [ ] Docs updated if a global default changes  
