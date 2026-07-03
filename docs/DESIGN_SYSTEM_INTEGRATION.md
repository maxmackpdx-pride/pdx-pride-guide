# Design System integration (in progress)

**Rule:** Only replace surfaces that have a clear DS component spec. Everything else stays as-is until there is a rule.

## Shipped (~50%)

- **Foundation:** `client/src/components/ds/` (tokens + 18 components, Avatar excluded), global token import in `main.tsx`, calm mode syncs `data-calm` on `<html>`
- **Filter chrome:** Events day filters, Events search, Directory type/area filters, board `FilterChip` / `StickerBadge` via `BoardActiveSection`
- **Admin:** `StatCard` metrics, `Button` / `Badge` on key actions
- **Static:** About, Legal, 404, ErrorBoundary reload → DS `Button`
- **Preview:** `/design-preview` sandbox gallery

## Not yet integrated (leave unchanged for now)

- Event grid/list cards (`EventBoardCard`, `Events.tsx` poster cards)
- Home hero, promo panels, countdown
- Hub / Dashboard stat pills
- Directory venue cards (`PlaceCard`)
- Map overlays (`MapPanel` / `MapLegend`) beyond existing Leaflet UI
- Full token merge into `index.css` / `sync:design-system` expansion

## Preview

`npm run dev` → http://localhost:5000/design-preview