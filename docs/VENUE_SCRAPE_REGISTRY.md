# Venue scrape registry

Companion overview for **exact hit URLs** in [`VENUE_SCRAPE_EXACT_URLS.md`](./VENUE_SCRAPE_EXACT_URLS.md).

## How ingest uses this

| Layer | Role |
|--------|------|
| `docs/VENUE_SCRAPE_EXACT_URLS.md` | Human-readable “where exactly to look” |
| `shared/ingestSources.ts` | Curated presets + helpers to merge live directory websites |
| `GET /api/admin/events/ingest/sources` | Curated list **+ every active Place with a website** |
| `server/ingest/*` | Fetch + parse (JSON-LD, ICS, Squarespace `?format=json`, Tribe REST, Wix `warmupData`) |

**Directory auto-wire:** any Place in the Queer Directory with a `website` appears under **Directory · auto** in the ingest tool. Hosts already covered by a curated specialized feed stay on the curated chip only. Preview can expand `/events`, `?format=json`, and Tribe REST paths when the homepage is empty.

**Safety:** preview → commit; default **HIDDEN**; strong duplicates skipped. No auto-LIVE from scrapes.

## Tiers (priority)

1. **Tier 1** - queer venues, direct feeds (ICS / JSON / structured HTML)
2. **Tier 2** - music rooms with queer bookings (Bandsintown, Tixr, RA)
3. **Tier 3** - community / seasonal (Pride org, Q Center, Eventbrite venue searches)
4. **Aggregators** - dragpdx, QSC, EverOut, pdx-events, Bandsintown city
5. **Meta-only** - IG/FB; no stable public URL yet

## Parser capability matrix (current)

| Format | Support |
|--------|---------|
| JSON-LD `Event` / `ItemList` | Yes |
| ICS / VCALENDAR | Yes |
| Squarespace `?format=json` | Yes |
| The Events Calendar (Tribe) REST | Yes |
| Wix `warmupData` embed | Partial (best-effort) |
| Flyer vision / IG | No (human or later phase) |
| Headless Partiful host profiles | No (single `/e/{id}` may still work via HTML/JSON-LD) |

## Ops notes

- **Badlands worker** requires a browser-like `User-Agent` (server fetch sets one).
- **Scandals** Squarespace feed: expect stale; verify IG.
- **dragpdx.com**: partnership ask before automated pull.
- **Portland Pride** slug rolls yearly (`2026-…` → `2027-…`).
- **Geo-filter** Partiful / multi-city networks (Seattle bleed).

## Updating

1. Edit exact URLs in `VENUE_SCRAPE_EXACT_URLS.md`
2. Mirror active ingest targets in `shared/ingestSources.ts`
3. Smoke: `npx tsx script/smoke-ingest.ts`
