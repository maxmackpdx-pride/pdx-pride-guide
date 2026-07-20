# QSearch

Admin event intelligence for Pride Guide PDX. **Discover + draft only.** Default commit status is **HIDDEN**. Never auto-LIVE.

**Route:** `/admin?tab=qsearch`  
**Branch work:** `feature/phase4-ingest`

## Product locks

| Rule | Detail |
|------|--------|
| Location | Own admin tab only (not under All Events) |
| Publish | Human select + `confirm: true` → `commitIngest` / approve |
| Default status | `HIDDEN` (schema + `createEvent` footgun guard; LIVE only when explicit) |
| Candidates | `qsearch_*` tables only — never touch `events` until human commit |
| Directory auto | Registers sources + scan targets; no silent publish |
| Curated feeds | Prefer specialized URLs for known hosts over plain homepages |
| dragpdx | Opt-in only (`POST /api/admin/qsearch/dragpdx-opt-in`) |
| Instagram | No unauth scrape; paste assist + optional Meta Business Discovery (Bearer token) |
| FB Events API | Out of scope |
| SSRF | `server/ingest/ssrf.ts` on all fetch paths (http/https, DNS private-IP block, redirect re-check) |
| **Groups** | **Portland-metro events only** — multi-city brands (e.g. Bearracuda) drop SF/Seattle/etc. (`portlandOnly` / `businessType: group`) |

## Architecture

| Layer | Path |
|-------|------|
| Source registry | `shared/ingestSources.ts` |
| Bar/venue recipes (32) | `docs/BAR_VENUE_SCAN_RECIPES.md` |
| Parsers | `server/ingest/*` |
| Yield discovery | `server/qsearch/discover.ts` |
| Scan + persist | `server/qsearch/scanJob.ts`, `store.ts` |
| Recurring / conflicts | `server/qsearch/analyze.ts` |
| Nightly | `server/qsearch/nightly.ts` |
| Vision | `server/qsearch/vision.ts` |
| IG assist | `server/qsearch/instagram.ts` |
| UI | `client/src/components/admin/QSearchDashboard.tsx` |

## Nightly schedule

- **When:** hour `03` America/Los_Angeles (checked every 60s).
- **Enable:** production default **on**; set `QSEARCH_NIGHTLY=1` to force on, `QSEARCH_NIGHTLY=0` to disable.
- **Priority:** never-scanned → failing/zero-yield → Tier 1 + Eventbrite city → rest (cap ~40).
- **Output:** SQLite `qsearch_candidates` with `status=pending` (review queue), not LIVE.
- **Optional vision on nightly:** `QSEARCH_NIGHTLY_VISION=1`.
- **Manual nightly priority:** `POST /api/admin/qsearch/scan/nightly-now`.
- **Railway:** runs inside the web dyno via `startQSearchNightly()` (same process as prompt scheduler). Single concurrent scan.

## Yield ladder

For each source, QSearch tries:

1. Admin **recipe URL** override  
2. Last **resolved_url** that worked  
3. Primary registry/directory URL  
4. Path expand (`/events`, `?format=json`, Tribe REST, …)  
5. HTML discovery (ICS/webcal, alternate calendar links, Google public ical, events links)  
6. Optional vision sample of flyer-ish images (`tryVision`)

Persisted on `qsearch_source_health`:

- `resolved_url`, `recipe_url`, `winning_parser`
- `yield_status`: `works | discovery_needed | zero_yield | needs_recipe | meta_only | dead | unscanned`
- `zero_yield_streak` (demote chronic zeros)

## Flyers (full quality)

Flyers are first-class. On parse + commit QSearch:

1. Prefers **largest** image from JSON-LD / Tribe sizes / Squarespace assets (not thumbnails)
2. Strips common resize params (SQ format=, WP `-300x200`)
3. Falls back to `og:image` when event has no image
4. **Downloads** remote flyers into `/uploads/qsearch-flyer-*.{jpg,png,webp}` when possible
5. Review queue shows poster thumb; “Missing flyer” / “Flyer saved” badges
6. Commit always re-enriches poster before write

## Recurring ↔ duplicate checks

When a scrape is weekly/monthly **or** matches catalog:

| Catalog pattern | Flag |
|-----------------|------|
| Multiple instances same title/venue/weekday | **Catalog already series** — skip create; optional flyer/time refresh |
| Single one-off listing | **Needs recurring update** — update that event, don’t stack a second host |
| Scrape weekly + catalog one-off | Candidate unselected + action note for human |

## Vision

- `POST /api/admin/qsearch/vision` with `{ imageUrl, venueHint?, sourceUrl? }`
- Needs `XAI_API_KEY` or `OPENAI_API_KEY` (optional `QSEARCH_VISION_MODEL`)
- `parseSource: vision`; low confidence (&lt;0.55) unselected by default
- Poster = image URL (also captured full-quality when possible)
- **Scan default:** sample flyers if structured parse empty (`tryVision` default on)

## Instagram assist

- **Paste:** caption and/or image URL → caption parse and/or vision  
- **Graph:** `META_PAGE_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` → Business Discovery  
- **Never** scrapes `instagram.com` unauthenticated  

## Admin API surface

| Method | Path |
|--------|------|
| GET | `/api/admin/qsearch/dashboard` |
| GET | `/api/admin/qsearch/queue` |
| POST | `/api/admin/qsearch/scan` | body: `{ includePastEvents?, tryVision?, sourceIds?, onlyFailing?, onlyNew?, … }` — **past off by default** |
| GET | `/api/admin/qsearch/scan/:jobId` |
| POST | `/api/admin/qsearch/scan/:jobId/cancel` |
| POST | `/api/admin/qsearch/scan/nightly-now` |
| POST | `/api/admin/qsearch/approve` |
| POST | `/api/admin/qsearch/vision` |
| POST | `/api/admin/qsearch/instagram` |
| POST | `/api/admin/qsearch/sources/:id/recipe` |
| POST | `/api/admin/qsearch/sources/ack-new` |
| POST | `/api/admin/qsearch/dragpdx-opt-in` |
| POST | `/api/admin/events/ingest/preview` (manual one-URL) |
| POST | `/api/admin/events/ingest/commit` |

## Past events

- **Default:** scan results **exclude past** nights (`includePastEvents: false`).
- UI checkbox **Include past events** on QSearch hero passes `includePastEvents: true`.
- Weekly/monthly series still form; the representative date is the **next upcoming** occurrence when past is excluded.

## Smoke

```bash
# parsers + non-event + past filter + recurring dups
npx tsx script/smoke-ingest.ts

# QSearch offline + live API (server must be on :5050)
npx tsx script/smoke-qsearch.ts

# server
PORT=5050 npm run dev

# login then:
# open http://localhost:5050/admin?tab=qsearch
# Scan now → watch progress → Review queue → Approve as HIDDEN
```

Login (local smoke DB): `tucker_pdmax` / `smoketest`
