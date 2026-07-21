# QSearch

Admin event intelligence for Pride Guide PDX. **Discover + draft only.** Review supports **Approve LIVE** or **Stage HIDDEN**. Never auto-LIVE without human approve.

**Route:** `/admin?tab=qsearch`  
**Branch work:** `feature/phase4-ingest`

## Product locks

| Rule | Detail |
|------|--------|
| Location | Own admin tab only (not under All Events) |
| Publish | Human select + `confirm: true` → `commitIngest` / approve |
| Approve status | Human chooses `LIVE` or `HIDDEN` on approve (API: `status` body; never auto) |
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
7. Wix media normalized: `wix:image://` URIs and `/v1/fill/w_63…` thumbnails → original `static.wixstatic.com/media/{id}` (Eagle)

### Trusted flyer hardening (2026-07)

- **Sanctuary real-URL harvest** — slugs are never guessed first: the `/events/` index (plus pagination, ≤5 pages) is fetched and real hrefs (WP collision suffixes + `/YYYY-MM-DD/` occurrence paths) are matched to ICS drafts by title tokens + day (`matchSanctuaryIndexUrl`). Slug inference remains fallback only. Wrong-day occurrence URLs are rejected (wrong night → wrong flyer).
- **Cross-run series flyer memory** — when a draft has no art, series art is reused from this batch first, then from existing board events (`seriesPosterHints` from trustedSync). Logos never qualify.
- **No silent failures** — event-page enrich failures and enrich-budget drops now leave warning breadcrumbs on the draft; enrich budget spends soonest-first.
- **Flyer coverage in health** — trusted sync records `flyerCount`; dashboard derives `flyerCoverage`, and green degrades to yellow when coverage < 0.5 on ≥3 drafts (`deriveTrustedHealth`). A venue must hold green *including coverage* before its scrape sources are pruned.

### Trusted wave 2 — directory audit (2026-07-21)

Directory audit: every `queer_owned` bar/venue was assessed for trusted promotion.
Promoted (structured feed + flyers, dedicated adapters):

| Venue | sourceId | Mode | Feed | Policy |
|-------|----------|------|------|--------|
| Darcelle XV Showplace | `darcelle-tribe` | `darcelle_tribe` | Tribe REST (paginated, `image.url` flyers) + ICS `?ical=1` fallback | 21_PLUS default + verify breadcrumb (all-ages/brunch) |
| Hawks PDX | `hawks-json` | `hawks_squarespace` | Squarespace `?format=json` (paginated, `assetUrl` posters) | 21_PLUS default + verify breadcrumb (18+ nights); sex-positive/nudity/KINK always stamped (Sanctuary-style, enforced again at publish) |

Not promotable yet (no structured event source — stays in scan lane):
CC Slaughters (HTML+WP posters), Scandals East (Zyrosite gallery, needs OCR),
Silverado (SQS archive stale; live = IG/FB), Camp Bar (static weeklies),
Peacock (html/JS cards + IG), Back 2 Earth (no events feed), The Nest Lounge
(IG-only), Stag PDX (Eventbrite organizer — third-party; candidate for a
future `eventbrite` fetchMode). Queer-owned wine bars/cafes (Living Room
Wines, Stem, Coffee Beer…) excluded as not LGBTQ-exclusive nightlife venues.

**Scrape sources NOT pruned yet** — per migration rule, `darcelle-tribe` /
`darcelle-ics` / `hawks-json` stay in INGEST_SOURCES until both venues hold
green (incl. flyer coverage) on the live Trusted board.

### Sanctuary flyer fix v2 — sitemap slug map + honest coverage (2026-07-21)

Live finding: Sanctuary runs **Sugar Calendar**, whose /events/ list paginates
via JS (no hrefs) — the index harvest could only ever see ~1 week (~9 events)
while the ICS holds months, so everything past week one leaned on series-flyer
reuse. Fixes:

- **WP sitemap harvest is now the primary slug map** — `wp-sitemap-posts-sc_event-N.xml`
  (index-file discovery fallback) lists EVERY event page URL server-side, no
  pagination. Index page still contributes dated occurrence URLs; slug
  inference remains last-resort.
- **Duplicate-series tie-break** — same series key ("game-bang-2" vs
  "game-bang-blanket-forts-3-2") resolves toward the highest WP collision
  suffix (newest page = current flyer); tiny bonus, never outweighs
  title-overlap or day match.
- **Coverage counts FRESH flyers only** (`countFreshFlyerDrafts`) — series-reuse
  backfill still displays but no longer counts toward flyer coverage, so the
  health board exposes the real acquisition rate instead of reuse masking it.

### Trusted wave 3 — generic-mode promotions + declarative venuePolicy (2026-07-21)

`TrustedVenueDef.venuePolicy` (applied by `server/ingest/venuePolicy.ts`, runs
after any dedicated adapter policy): declarative age / sex-positive /
never-invent-FREE rules — **new venues scale via data, not code**.

Promoted via fetchMode `generic` (existing discover pipeline; relevance guards
already venue-scope Eventbrite — incl. Stag ≠ Stags' Leap and sports+bra
token rules):

| Venue | sourceId | Source | Policy |
|-------|----------|--------|--------|
| Stag PDX | `stag-eb` | Eventbrite organizer | 21_PLUS |
| The Sports Bra | `sports-bra-eb` | Eventbrite venue-scoped | age NOT forced (note-only: verify per event) |
| Living Room Wines | `living-room-eb` | Eventbrite organizer | 21_PLUS |
| Camp Bar PDX | `camp-bar` | Static #events HTML | 21_PLUS |
| CC Slaughters | `cc-slaughters` | HTML + WP posters | 21_PLUS |

These five are **scrape-grade sources on the trusted board** — the flyer
coverage + yield health is the probation gate. 12h poll (vs 6h for feed-grade).
Scan-lane entries stay until each holds green.

## Recurring ↔ duplicate checks

When a scrape is weekly/monthly **or** matches catalog:

| Catalog pattern | Flag |
|-----------------|------|
| Multiple instances same title/venue/weekday | **Catalog already series** — skip create; optional flyer/time refresh |
| Single one-off listing | **Needs recurring update** — update that event, don’t stack a second host |
| Scrape weekly + catalog one-off | Candidate unselected + action note for human |

## Vision (how flyer reading works)

There is **no custom/local mini-model**. Flyer OCR uses a **cloud vision API**:

| Env | Model default |
|-----|----------------|
| `XAI_API_KEY` | `grok-2-vision-latest` (or `QSEARCH_VISION_MODEL`) |
| `OPENAI_API_KEY` | `gpt-4o-mini` |

- `POST /api/admin/qsearch/vision` — `{ imageUrl, venueHint? }` (https or `/uploads/…`)
- `POST /api/admin/qsearch/vision/upload` — multipart `flyers` (1–12 images) + optional `venueHint`
- Low confidence (&lt;0.55) unselected by default
- **Scan:** optional `tryVision` samples page images when structured parse is empty

Without those keys, calendar **HTML/JSON/ICS** still work; flyer-from-image does not.

## Instagram assist

- **URL only:** `POST /api/admin/qsearch/instagram` `{ mode: "url", url }` — post link or direct image CDN  
- Tries public OG image (often blocked) then vision on the image  
- **Graph:** Meta Business Discovery when tokens set  
- **Never** full unauth Instagram scrape  

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

## Flyer Reader (GitHub-sourced OCR — Phase 1 shipped 2026-07-21)

Server-side flyer parsing inside this app (no separate service — one Railway
deploy). `server/flyerReader/`:

- **Source**: flyers live in the repo `flyers/` folder — loaded disk-first
  (ships with the deploy), GitHub API fallback (`GITHUB_FLYERS_REPO`,
  optional `GITHUB_TOKEN`). Paths strictly confined to `flyers/`.
- **OCR**: sharp preprocess (rotate/grayscale/normalize/upscale-to-1200px)
  → tesseract.js (pure WASM, lazy worker, traineddata cached in
  `TESSERACT_CACHE_DIR`, default /tmp/tesseract).
- **Endpoint**: `POST /api/admin/qsearch/flyer-reader/ocr` (admin) —
  `{githubPath}` or small `{imageBase64}` → `{text, confidence, preprocessMs, ocrMs}`.
- **Roadmap**: Phase 2 structured parsing reuses `qsearch/vision.ts` (LLM
  already configured via XAI/OpenAI envs); Phase 3 QSearch Scans hooks;
  Phase 4 validation harness scores parses against `flyers/ground-truth.json`
  (see `flyers/README.md` + example) using `exports/` event data; Phase 5
  persistence + docs.

```bash
npx tsx script/smoke-flyer-reader.ts        # offline: paths + preprocessing
SMOKE_OCR=1 npx tsx script/smoke-flyer-reader.ts  # + real Tesseract (network)
```

## Smoke

```bash
# parsers + non-event + past filter + recurring dups
npx tsx script/smoke-ingest.ts

# trusted flyer hardening (offline fixtures: index harvest, URL match, wix, reuse, health)
npx tsx script/smoke-trusted-flyers.ts

# Darcelle + Hawks + wave-3 venues (offline fixtures: parse, policy, declarative venuePolicy)
npx tsx script/smoke-trusted-new-venues.ts

# QSearch offline + live API (server must be on :5050)
npx tsx script/smoke-qsearch.ts

# server
PORT=5050 npm run dev

# login then:
# open http://localhost:5050/admin?tab=qsearch
# Scan now → watch progress → Review queue → Approve LIVE or Stage HIDDEN
```

Login (local smoke DB): `tucker_pdmax` / `smoketest`
