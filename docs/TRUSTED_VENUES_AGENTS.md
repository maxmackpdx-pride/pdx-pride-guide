# Trusted venues multi-agent contract (2026-07-20)

## Goal
1. Parse **Badlands** worker JSON (with date window + photoUrl).
2. Dedicated **Sanctuary** path (ICS + page flyers + series reuse).
3. **Trusted sync** auto-publish (no review queue) for listed venues.
4. **Health store + API** for last sync / last published.
5. **QSearch UI** “Trusted” tab with health indicators.

## Shared registry
`shared/trustedVenues.ts` - single source of truth for Badlands + Sanctuary.

## File ownership (do not edit outside your list)

| Agent | Owns |
|-------|------|
| A Badlands | `server/ingest/parseBadlands.ts`, wire in `server/ingest/index.ts` only, `shared/ingestSources.ts` badlands entry only |
| B Sanctuary | `server/ingest/adapters/sanctuary.ts`, wire sanctuary path in `server/qsearch/scanJob.ts` (minimal), sanctuary notes in `shared/ingestSources.ts` |
| C Trusted sync | `server/qsearch/trustedSync.ts` only (import registry + parsers + commitIngest) |
| D Health + routes | `server/qsearch/trustedHealth.ts`, `server/qsearch/store.ts` trusted table helpers, routes block in `server/routes.ts`, hook nightly in `server/qsearch/nightly.ts` |
| E UI | `client/src/components/admin/QSearchTrusted.tsx`, styles in `qsearch.css`, mount tab in `QSearchDashboard.tsx` only |

## API contract (Agent D + E)

`GET /api/admin/qsearch/trusted` →
```json
{
  "venues": [
    {
      "sourceId": "badlands-api",
      "venueName": "Badlands",
      "calendarPageUrl": "...",
      "feedUrl": "...",
      "fetchMode": "badlands_api",
      "health": "green|yellow|red|unknown",
      "lastSyncAt": "ISO|null",
      "lastSyncOk": true,
      "lastSyncError": null,
      "lastEventCount": 12,
      "lastPublishedAt": "ISO|null",
      "lastPublishedTitle": "Fresh Paint",
      "lastPublishedEventId": 123,
      "consecutiveFails": 0,
      "pollHours": 6,
      "notes": "..."
    }
  ]
}
```

`POST /api/admin/qsearch/trusted/sync` body `{ sourceId?: string }` → run one or all trusted syncs.
`POST /api/admin/qsearch/trusted/sync/:sourceId` → one venue.

## Table `qsearch_trusted_health`
```
source_id TEXT PK
last_sync_at TEXT
last_sync_ok INTEGER
last_sync_error TEXT
last_event_count INTEGER DEFAULT 0
consecutive_fails INTEGER DEFAULT 0
last_published_at TEXT
last_published_title TEXT
last_published_event_id INTEGER
updated_at TEXT
```

## Parse contracts

### Badlands
`GET …/api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`
Body: `{ events: [{ id, title, start, end, description, blurb, photoUrl, location, link }] }`
→ drafts with venueName Badlands, posterImageUrl=photoUrl, parseSource `"badlands"`.

### Sanctuary
ICS primary; enrich each upcoming event page for flyer; series title reuse when og is logo.

## Auto-publish rules (Agent C)
- Dedupe against existing events (title+day+venue / ticket URL).
- Never create past events.
- Status LIVE from registry.
- Record last_published_* on each create.
- Skip if strong duplicate already LIVE/HIDDEN.
