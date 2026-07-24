# Design System integration

**Rule:** Only replace surfaces that have a clear DS component spec. Everything else stays as-is until there is a rule.

## Live site is truth

**Canonical design rules:** [`docs/LIVE_DESIGN_STANDARD.md`](./LIVE_DESIGN_STANDARD.md)

Production React + CSS on `master` / zaylist.com supersede portable previews, sandbox HTML, and the deep-glass migration handoff. If a document conflicts with live, **fix the document**.

### Surface chrome (deep-glass / OLED-neon) - shipped

Deep-glass is the **canonical** card/map/button surface standard. It **overrides** prior lite-glass + default brutal-CTA look.

| Piece | Path |
|-------|------|
| Glass tokens | `client/src/components/ds/tokens/glass.css` |
| Effects (sticker-only brutal; motion) | `client/src/components/ds/tokens/effects.css` |
| Helpers | `client/src/components/ds/glass.ts` · `mapTheme.ts` |
| Components | `client/src/components/ds/*` (Button, PosterCard, PlaceCard, …) |
| Migration archive | `docs/handoffs/deep-glass-2026-07-16/` (**historical** - do not re-run as open agents) |

Layout, spacing, fonts, and type scale stay on the modular token files. Feature motion outside glass is preserved.

**Claude Design / agents:** Prefer live components + `glass.css` for chrome. Use `design-system/` (tokens + previews + `EVENTS_GUIDE.md`) as a **portable color/type kit**, not a second chrome system.

## Source of truth chain

```
LIVE SITE (master / Railway)
        ↑
shared/eventWeek.ts              day codes, dates, day colors, RSVP reserved hex
client/src/components/ds/tokens/*   modular production tokens (glass = chrome)
client/src/index.css             legacy + app chrome vars still in use
        ↓  npm run sync:design-system
design-system/tokens/tokens.css  portable colors/days (not a second glass system)
design-system/previews/*.html    samples - must not reintroduce retired CTAs
```

Before every push that touches colors, Pride week, or global CSS:

```bash
npm run sync:design-system
git add design-system/
```

If chrome/behavior rules change, also update `docs/LIVE_DESIGN_STANDARD.md`.

## Shipped (complete)

### Foundation
- `client/src/components/ds/` - tokens + production components (Avatar excluded)
- Global token import in `main.tsx`, calm mode syncs `data-calm` on `<html>`
- Live sandbox: `/design-preview` (`DesignSystemSandbox.tsx`)
- Portable kit: `design-system/` (README, EVENTS_GUIDE, AVATARS_GUIDE, previews)

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
- Avatar system (see `design-system/AVATARS_GUIDE.md` - excluded from React DS)

## Design rules (quick - full list in LIVE_DESIGN_STANDARD)

- **Cards:** deep-glass (`--glass-card*`), black ring + neon edge, sheen, radius ~14px on glass cards
- **CTAs:** glass buttons; solid primary uses accent fill + dark type `#050506` (white on CockBlock red)
- **Claim:** pure cyan fill + soft cyan offset - not yellow-rim brutal
- **Maps:** debossed frame, no outer bloom
- **Display:** Barlow Condensed 700–900 uppercase; body Inter
- **One neon per element**; day colors are data (`var(--day-*)`); lime `#CCFF00` reserved for primary action / RSVP where specified
- **Motion:** ~150ms hover; entrances `pgDirCardIn`; calm / reduced-motion kills ambient pulse
- **Nav:** do not restyle without explicit user request

## Previews (`design-system/previews/`)

First line carries `@dsCard group="…"` for Claude Design indexing. Previews are **samples** - if they show brutal default CTAs or flat cards, treat as stale and match live components instead.

## Preview (app)

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
- Treat `docs/handoffs/deep-glass-2026-07-16/GROK_PER_AGENT_TASKS.md` as open work (migration complete)
