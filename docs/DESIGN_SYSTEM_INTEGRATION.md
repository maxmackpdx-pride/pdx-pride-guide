# Design System integration

**Rule:** Only replace product surfaces that have a clear DS component spec. Everything else stays as-is until the guide covers it.

## Design guide is truth

| Layer | Path |
|-------|------|
| **Design guide (SoT)** | [`design-system/`](../design-system/) · https://maxmackpdx-pride.github.io/zaylist-design-system/ |
| **Production trap list** | [`docs/LIVE_DESIGN_STANDARD.md`](./LIVE_DESIGN_STANDARD.md) (must not contradict the guide) |
| **Implementation** | `client/src/components/ds/**`, page CSS |

The old portable kit (`EVENTS_GUIDE.md`, single-file `tokens/tokens.css`, `previews/*.html`) is **removed**. Do not recreate it.

### Surface chrome (deep-glass / OLED-neon) - shipped in product

Deep-glass is the **canonical** card/map/button surface standard (see guide glass / card system panels).

| Piece | Path |
|-------|------|
| Guide tokens / specimens | `design-system/tokens/`, `design-system/guidelines/` |
| Live glass tokens | `client/src/components/ds/tokens/glass.css` |
| Effects (sticker-only brutal; motion) | `client/src/components/ds/tokens/effects.css` |
| Helpers | `client/src/components/ds/glass.ts` · `mapTheme.ts` |
| Components | `client/src/components/ds/*` (Button, PosterCard, PlaceCard, …) |
| Migration archive | `docs/handoffs/deep-glass-2026-07-16/` (**historical**) |

**Agents:** Read the design guide first. Implement with live components + `glass.css`. Never invent chrome that fights the guide.

## Source of truth chain

```
design-system/  (+ public Pages)
        = written standard + specimens
        ↓
client/src/components/ds/tokens/*   modular production tokens (glass = chrome)
client/src/components/ds/*          React components
shared/eventWeek.ts                 day codes / day colors (data)
        ↑  product implements guide; mark guide "queued" when ahead
npm run sync:design-system          mirrors zaylist-design-system checkout → design-system/
```

Refresh the in-repo guide from the public package:

```bash
npm run sync:design-system
git add design-system/
```

If chrome/behavior rules change, update the **design guide** (and `LIVE_DESIGN_STANDARD.md` trap list if needed).

## Shipped (complete)

### Foundation
- Design guide: `design-system/` (index shell, tokens, guidelines, components, brand-guide, app-face)
- Public shareable guide: https://maxmackpdx-pride.github.io/zaylist-design-system/
- `client/src/components/ds/` - production components
- Global token import in `main.tsx`, calm mode syncs `data-calm` on `<html>`
- Dev gallery only: `/design-preview` (`DesignSystemSandbox.tsx`) — not a second design guide

### Modular tokens (`client/src/components/ds/tokens/`)

| File | Contents |
|------|----------|
| `fonts.css` | Barlow Condensed + Inter loads |
| `colors.css` | Surfaces, neons, day colors, gradients, semantic tags/categories |
| `typography.css` | Display / chrome / body / meta scales |
| `layout.css` | 4px space scale, radii, z-index, content widths |
| `effects.css` | Soft depth, glows, motion; **brutal offsets = sticker-only** |
| `glass.css` | **Canonical surface chrome** (cards, sheen, poster-well, glass-btn, map) |
| `base.css` | Reset, focus ring, rainbow rule, marker chip |
| `index.css` | Imports all of the above |

### Production components (`client/src/components/ds/`)

| Component | Role |
|-----------|------|
| `Button` | **Glass CTA** (default glass / solid fill / outline) - **not** brutal magenta offset |
| `Badge` | Status / count badges |
| `FilterChip` | Events / directory / board filter pills |
| `StickerBadge` | Board sticker labels |
| `PosterCard` | Events **grid** board card (deep-glass, 2:3 flyer well, day `--c`) |
| `EventCard` | Events **list** row |
| `PlaceCard` | Directory venue card (rainbow top seam + category neon edge) |
| `SearchInput` | Filter search field |
| `SectionHeader` | Section kicker + title |
| `StatCard` / `StatPill` | Admin / hub metrics |
| `Countdown` | Pride week countdown |
| `Divider` | Rainbow / hard rules |
| `HeroBanner` | Collage / banner hero shell |
| `Logo` | Brand lockup |
| `Marquee` | Scrolling ticker band |
| `MapPanel` / `MapLegend` | Map chrome helpers (live Leaflet uses mapTheme) |
| `IconButton` | Icon-only control |
| `adapters/ListingCard` | Bridges app event data → PosterCard / EventCard |

### Ads (live components)

| Component | Role |
|-----------|------|
| `ads/PosterAdCard` | Events grid affiliate/poster ads (same chrome as board) |
| `ads/FeedAdCard` | Hub news-feed ads |
| `admin/ads/AdBuilder` | WYSIWYG builder - must preview those components |

Templates / brand accents: `client/src/lib/adTypes.ts` (`AD_BRAND_PRIMARY`).

### Filter & admin chrome
- Events day filters, Events search, Directory type/area filters
- Board `FilterChip` / `StickerBadge` via `BoardActiveSection`
- Admin `StatCard` metrics, `Button` / `Badge` on key actions

### Cards & home
- **Events** - `ListingCard` → `PosterCard` / `EventCard`; claim sticker + share; **no** dead Event details row on grid
- **Directory** - `PlaceCard` with linked upcoming events
- **Rainbow top seam** - required on clickable cards (see `docs/BOARD_CARD_STANDARD.md`)
- **Dashboard hub** - `StatPill` summary chips

### Helpers
- `client/src/lib/dsEvent.ts` - event → listing card prop mapping
- `client/src/lib/dsColors.ts` - dashboard accent → DS color tokens
- `client/src/components/ds/adapters/` - production adapters
- `shared/missedConnections.ts` - `getEventScheduleTiming` / `isEventSchedulePast` for board past; MC window stays separate

## Intentionally unchanged / partial

- Full home hero collage → not fully on `HeroBanner` (GlitchWord / video overlay)
- Full merge of every legacy class in `index.css` into DS tokens only
- Avatar system (see design guide avatars / brand panels - not all rings are React DS components)

## Design rules (quick)

Full written standard: **`design-system/`** (guidelines + tokens). Production traps: `LIVE_DESIGN_STANDARD.md`.

- **Cards:** deep-glass (`--glass-card*`), black ring + neon edge, sheen
- **CTAs:** glass buttons; solid primary uses accent fill + dark type `#050506` (white on CockBlock red)
- **Claim:** pure cyan fill + soft cyan offset - not yellow-rim brutal
- **Maps:** debossed frame, no outer bloom
- **Display:** Barlow Condensed 700–900 uppercase; body Inter
- **One neon per element**; day colors are data (`var(--day-*)`); lime `#CCFF00` reserved for primary action / RSVP where specified
- **Motion:** ~150ms hover; entrances `pgDirCardIn`; calm / reduced-motion kills ambient pulse
- **Nav:** do not restyle without explicit user request

## View the guide

```bash
cd design-system && python3 -m http.server 8765
# → http://localhost:8765/
# or https://maxmackpdx-pride.github.io/zaylist-design-system/
```

Dev component gallery only (not the design guide):

```bash
npm run dev
# → http://localhost:5000/design-preview
```

## Do not

- Invent day colors or an 8th Pride day
- Use `#CCFF00` as a day accent
- Put day colors on schedule event cards (column header only)
- Ship UI that hard-codes day hexes where `var(--day-*)` belongs
- Grow the DS with one-off components that lack a live component path
- Restore retired global rules listed in `LIVE_DESIGN_STANDARD.md`
- Recreate the old portable kit (`EVENTS_GUIDE.md`, `previews/*.html` as a second SoT)
- Treat `docs/handoffs/deep-glass-2026-07-16/GROK_PER_AGENT_TASKS.md` as open work (migration complete)
