# Design System integration

**Rule:** Only replace surfaces that have a clear DS component spec. Everything else stays as-is until there is a rule.

## Shipped (complete)

### Foundation
- `client/src/components/ds/` — tokens + 18 production components (Avatar excluded)
- Global token import in `main.tsx`, calm mode syncs `data-calm` on `<html>`
- Preview gallery at `/design-preview`

### Filter & admin chrome
- Events day filters, Events search, Directory type/area filters
- Board `FilterChip` / `StickerBadge` via `BoardActiveSection`
- Admin `StatCard` metrics, `Button` / `Badge` on key actions
- About, Legal, 404, ErrorBoundary reload → DS `Button`

### Cards & home (second half)
- **Events** — `ListingCard` adapter wraps DS `PosterCard` (grid) / `EventCard` (list); share, attendance, talent extras preserved
- **Directory** — venue rows use DS `PlaceCard` with linked upcoming events
- **Dashboard hub** — summary chips use DS `StatPill`
- **Home** — DS `Countdown` and `Button` on hero / soft-launch / promo actions (PageHero collage kept)

### Helpers
- `client/src/lib/dsEvent.ts` — event → listing card prop mapping
- `client/src/lib/dsColors.ts` — dashboard accent → DS color tokens
- `client/src/components/ds/adapters/` — production adapters bridging app data to DS components

## Intentionally unchanged

- `EventBoardCard.tsx` (board feed cards outside Events page)
- Full home hero collage → `HeroBanner` (GlitchWord / video overlay)
- Map overlays (`MapPanel` / `MapLegend`) on live Leaflet maps
- Full token merge into `index.css` / expanded `sync:design-system`
- Avatar (explicitly excluded)

## Preview

`npm run dev` → http://localhost:5000/design-preview