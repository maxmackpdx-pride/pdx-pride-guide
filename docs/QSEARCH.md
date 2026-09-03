# QSearch

The original QSEARCH scraper and fine-tuned model are archived. The historical
implementation notes below remain available as source-path and failure-pattern
memory only; its scheduler and AI scrub must not be restarted.

QSearch 2.0 is the current agent-led workflow. It researches broadly and may
publish narrowly under its evidence, identity, lock, mistake-test, and rollback
contract. The legacy admin queue described below remains **discover + draft
only** and never auto-publishes.

**Route:** `/admin?tab=qsearch`  
**Branch work:** `feature/phase4-ingest`

## Product locks

| Rule | Detail |
|------|--------|
| Location | Own admin tab only (not under All Events) |
| Publish | Human select + `confirm: true` → `commitIngest` / approve |
| Approve status | Human chooses `LIVE` or `HIDDEN` on approve (API: `status` body; never auto) |
| Candidates | `qsearch_*` tables only - never touch `events` until human commit |
| Directory auto | Registers sources + scan targets; no silent publish |
| Curated feeds | Prefer specialized URLs for known hosts over plain homepages |
| dragpdx | Opt-in only (`POST /api/admin/qsearch/dragpdx-opt-in`) |
| Instagram | No unauth scrape; paste assist + optional Meta Business Discovery (Bearer token) |
| FB Events API | Out of scope |
| SSRF | `server/ingest/ssrf.ts` on all fetch paths (http/https, DNS private-IP block, redirect re-check) |
| **Groups** | **Portland-metro events only** - multi-city brands (e.g. Bearracuda) drop SF/Seattle/etc. (`portlandOnly` / `businessType: group`) |

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

## QSearch 2.0 scoped agent access

QSearch 2.0 does not borrow a Tucker/admin browser session. It authenticates
with one dedicated, revocable bearer credential that is accepted only by
`/api/admin/event-research/*`. That credential does **not** create an admin
session and cannot open unrelated admin routes.

- Railway stores `QSEARCH_AGENT_TOKEN` for the production API.
- The local runner reads the same credential from `QSEARCH_AGENT_TOKEN` or the
  macOS Keychain service `zaylist-qsearch-agent-api`, account `qsearch-2`.
- The token must never appear in prompts, source memory, URLs, command
  arguments, logs, reports, or repository files.
- A missing credential or a `401` stops production writes and is reported as an
  access failure; it is not a reason to fall back to cookies or weaken admin
  authentication.

Use the scoped client so the credential is added internally:

```bash
node script/qsearch-agent-api.mjs source-memory
node script/qsearch-agent-api.mjs events 2026-09-01
node script/qsearch-agent-api.mjs changes 50
```

### Evidence control plane (production active)

QSearch 2.0 now has a backward-compatible evidence control plane. The existing
source-memory and event commands remain valid; the additions make an agent run
measurable, individually reversible, and reviewable without reviving the
archived scraper.

| Capability | Scoped client command |
|---|---|
| Begin/finish an auditable run | `begin-run`, `finish-run` |
| Record source coverage and cadence | `mark-source`, `schedule-source` |
| Store field-level provenance | `record-evidence` |
| Maintain canonical identities | `upsert-identity` |
| Preserve material disagreement | `record-conflict`, `resolve-item` |
| Queue durable uncertainty | `queue-review`, `resolve-item` |
| Track exact-event artwork | `record-media` |
| Model recurring series/occurrences | `upsert-series` |
| Maintain and run mistake cases | `upsert-mistake-test`, `record-mistake-result` |
| Evaluate the publication gate | `decision-gate` |
| Learn from accepted/rejected outcomes | `record-outcome` |
| Inspect the control state | `control` |

Event create/change payloads also support `dryRun`, `idempotencyKey`, and
`runId`. The event write, field-evidence receipts, rollback ledger, and
idempotency response are one SQLite transaction: partial success rolls back.
The decision gate blocks on missing field evidence, open material conflicts,
unpassed active mistake tests, and (when requested) fewer than two independent
sources per field.

These commands are deployed in product commit `9679555a`; Railway deployment
`ae309828-0f40-4d40-880a-9606afa91d11` reached `SUCCESS`, and the live scoped
control endpoint passed its least-privilege probe. The active heartbeat may use
the control plane while retaining the same dedicated credential boundary.

Mutation commands accept JSON from a file or standard input:

```bash
node script/qsearch-agent-api.mjs record-path -
node script/qsearch-agent-api.mjs create-event -
node script/qsearch-agent-api.mjs change-event EVENT_ID -
node script/qsearch-agent-api.mjs rollback ROLLBACK_TOKEN
```

Event creation/correction requires current field-level evidence receipts, a
specific reason, passed mistake tests, and—for corrections—the exact
`updatedAt` value read before the write. Claimed or human-submitted events and
human-locked fields are rejected. Every accepted mutation receives an
append-only change record and rollback token. QSearch may revise a lock created
by its own prior correction, but never a human-owned lock. A `LIVE` event must
also have its exact address and complete publication fields; incomplete
candidates stay `HIDDEN` for review.

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

- **Sanctuary real-URL harvest** - slugs are never guessed first: the `/events/` index (plus pagination, ≤5 pages) is fetched and real hrefs (WP collision suffixes + `/YYYY-MM-DD/` occurrence paths) are matched to ICS drafts by title tokens + day (`matchSanctuaryIndexUrl`). Slug inference remains fallback only. Wrong-day occurrence URLs are rejected (wrong night → wrong flyer).
- **Cross-run series flyer memory** - when a draft has no art, series art is reused from this batch first, then from existing board events (`seriesPosterHints` from trustedSync). Logos never qualify.
- **No silent failures** - event-page enrich failures and enrich-budget drops now leave warning breadcrumbs on the draft; enrich budget spends soonest-first.
- **Flyer coverage in health** - trusted sync records `flyerCount`; dashboard derives `flyerCoverage`, and green degrades to yellow when coverage < 0.5 on ≥3 drafts (`deriveTrustedHealth`). A venue must hold green *including coverage* before its scrape sources are pruned.

### Trusted wave 2 - directory audit (2026-07-21)

Directory audit: every `queer_owned` bar/venue was assessed for trusted promotion.
Promoted (structured feed + flyers, dedicated adapters):

| Venue | sourceId | Mode | Feed | Policy |
|-------|----------|------|------|--------|
| Darcelle XV Showplace | `darcelle-tribe` | `darcelle_tribe` | Tribe REST (paginated, `image.url` flyers) + ICS `?ical=1` fallback | 21_PLUS default + verify breadcrumb (all-ages/brunch) |
| Hawks PDX | `hawks-json` | `hawks_squarespace` | Squarespace `?format=json` (paginated, `assetUrl` posters) | 21_PLUS default + verify breadcrumb (18+ nights); sex-positive/nudity/KINK always stamped (Sanctuary-style, enforced again at publish) |

Not promotable yet (no structured event source - stays in scan lane):
CC Slaughters (HTML+WP posters), Scandals East (Zyrosite gallery, needs OCR),
Silverado (SQS archive stale; live = IG/FB), Camp Bar (static weeklies),
Peacock (html/JS cards + IG), Back 2 Earth (no events feed), The Nest Lounge
(IG-only), Stag PDX (Eventbrite organizer - third-party; candidate for a
future `eventbrite` fetchMode). Queer-owned wine bars/cafes (Living Room
Wines, Stem, Coffee Beer…) excluded as not LGBTQ-exclusive nightlife venues.

**Trusted lane is excluded from QSearch catch-all** (2026-07-25): any source in
`TRUSTED_VENUES` (plus sibling recipes like `sanctuary-calendar` / `darcelle-ics`,
and directory auto-links on the same venue host) is filtered out of scan +
Sources health UI via `isTrustedLaneSource`. Registry rows may still exist in
`INGEST_SOURCES` for docs/recipes; the catch-all scan never runs them. Use the
Trusted board Sync controls instead.

### Sanctuary flyer fix v2 - sitemap slug map + honest coverage (2026-07-21)

Live finding: Sanctuary runs **Sugar Calendar**, whose /events/ list paginates
via JS (no hrefs) - the index harvest could only ever see ~1 week (~9 events)
while the ICS holds months, so everything past week one leaned on series-flyer
reuse. Fixes:

- **WP sitemap harvest is now the primary slug map** - `wp-sitemap-posts-sc_event-N.xml`
  (index-file discovery fallback) lists EVERY event page URL server-side, no
  pagination. Index page still contributes dated occurrence URLs; slug
  inference remains last-resort.
- **Duplicate-series tie-break** - same series key ("game-bang-2" vs
  "game-bang-blanket-forts-3-2") resolves toward the highest WP collision
  suffix (newest page = current flyer); tiny bonus, never outweighs
  title-overlap or day match.
- **Coverage counts FRESH flyers only** (`countFreshFlyerDrafts`) - series-reuse
  backfill still displays but no longer counts toward flyer coverage, so the
  health board exposes the real acquisition rate instead of reuse masking it.

### Trusted wave 3 - generic-mode promotions + declarative venuePolicy (2026-07-21)

`TrustedVenueDef.venuePolicy` (applied by `server/ingest/venuePolicy.ts`, runs
after any dedicated adapter policy): declarative age / sex-positive /
never-invent-FREE rules - **new venues scale via data, not code**.

Promoted through dedicated Trusted adapters and policies:

| Venue | sourceId | Source | Policy |
|-------|----------|--------|--------|
| Stag PDX | `stag-eb` | `eventbrite_org` (upcomingEvents embed) | 21_PLUS |
| Living Room Wines | `living-room-eb` | `eventbrite_org` | 21_PLUS; each event must explicitly establish LGBTQ+ relevance |
| Camp Bar PDX | `camp-bar` | `camp_bar_html` weeklies → 6 weeks | 21_PLUS |
| CC Slaughters | `cc-slaughters` | `cc_slaughters_html` weeklies (ADVERTICAL lineup-only, posters null) | 21_PLUS |
| Triangle Recreation Camp (Camp TRC) | `camp-trc` | `camp_trc_html` homepage Event Calendar (WA; login-gated WA detail pages) | 21_PLUS |

Dedicated parsers (2026-07-26): Eventbrite org JSON embed, Camp weekly
columns, CC homepage nights. No longer rely on generic discover for these.
They are excluded from the QSearch catch-all (trusted-lane filter).

### Event relevance and identity (2026-07-29)

- An event at an **exact verified LGBTQ+ venue** (for example Badlands) is
  relevant even when the individual listing does not repeat LGBTQ+ keywords.
- Founder-locked trusted dedicated LGBTQ+ venues are Sanctuary Club, Eagle
  Portland, Badlands, The Sports Bra, Q Center, Steam Portland, Camp Bar PDX,
  Darcelle XV Showplace, CC Slaughters, Hawks PDX, and Scandals East. Their
  official calendars establish LGBTQ+ relevance for every verified event there.
  Do not require separate event-specific LGBTQ+ proof; publish after the exact
  identity and normal date/time/link/duplicate/artwork evidence gates pass.
  Tucker's shorthand `the Eagle` means Eagle Portland and `Camp` means Camp Bar
  PDX.
- Scandals East's current trusted identity is `827 NE Alberta St, Portland, OR
  97211`. Its former downtown/Harvey Milk location stays blocked and must never
  be reattached through a shared-word or stale-address match.
- An event at an **ordinary venue** is relevant only when the title or
  description explicitly establishes LGBTQ+ relevance or a queer host.
- Venue/directory attachment requires exact venue identity, an exact directory
  address, or the official website host. Shared words and partial-name tokens
  do not attach a venue.
- Group attachment requires the full organization name, an exact curated alias,
  or the exact group source identity. `Portland Leather` is not an alias for
  Portland Leather Alliance; `PLA` alone is accepted only in an event title.
- The Sports Bra is a founder-locked dedicated lesbian/LGBTQ+ venue. Its
  official calendar establishes LGBTQ+ relevance for every event there; never
  require separate event-specific LGBTQ+ proof or downgrade the classification.
  Keep exact Portland identity/address checks. Direct scraping remains disabled
  until its schedule can be read reliably, so use official-site and authorized
  signed-in browser research.

## AI scrub (LLM candidate cleaning)

> **Paused 2026-07-29:** the generic cloud-model scrub is hard-disabled in
> code while the intended custom fine-tuned QSearch model is rebuilt. Setting
> `QSEARCH_SCRUB_LLM=1` does not override the pause. Deterministic filtering,
> scraping, Trusted sync, and human Review continue normally.

A semantic pass over scan candidates *after* the cheap deterministic filters
(`server/qsearch/scrubLlm.ts`). Reuses the flyer-reader text-LLM chain
(`flyerLlmConfigured`: Groq → xAI → OpenAI, honoring `FLYER_LLM_DISABLED`) — **no
new keys**. One classifier call per candidate returns relevance + noise, safety
flags, category, cleaned fields, and a dedup verdict.

| Env | Effect |
|-----|--------|
| `QSEARCH_SCRUB_LLM=1` | Enable the scrub (off ⇒ pure passthrough, scan output identical) |
| `QSEARCH_SCRUB_MAX` | Max candidates classified per scan (default 60; overflow untouched) |
| `QSEARCH_SCRUB_FLYER_VISION=1` | Enable vision flyer QA (verify + repair, `verifyFlyer.ts`) |
| `QSEARCH_SCRUB_FLYER_MAX` | Max candidates flyer-checked per scan (default 40) |
| `QSEARCH_SCRUB_FLYER_PAGES` | Max suspect candidates whose event page is re-fetched for more images (default 15) |
| `FLYER_LLM_DISABLED=1` | Hard kill — disables scrub, flyer QA, and all paid LLM/vision |

**Vision flyer QA** (`QSEARCH_SCRUB_FLYER_VISION=1`, uses `visionConfigured`):
- **Verify** — for each candidate with a poster, a vision call reads the flyer and
  scores how well it matches the event (`draft.flyerMatch` + reason). Flags "Flyer
  mismatch" / "Looks like a logo" / wrong-date in Review. **Flag-only — never
  auto-strips** a poster (a wrong flyer is the human's call).
- **Repair** — when a candidate has no poster or a suspect one, it vision-checks the
  in-memory alternatives (cross-source bundle + series-mate posters) first, then
  **re-fetches the event page** (SSRF-guarded, budget-limited) for more images — the deep
  Sanctuary wrong-day fix. Cheapest-first; attaches the first that clears the match bar.
  Never attaches a wrong guess.
- **Remove flyer** — a logo-flagged poster gets a one-tap *Remove flyer* in Review
  (`POST /api/admin/qsearch/queue/clear-flyer {id}`). Manual, never automatic.
- Smoke: `npx tsx script/smoke-qsearch-flyer.ts` (mocked vision + page fetch, offline).

Behavior:
- **Relevance 0–1 + reason** on every scrubbed draft (`draft.relevanceScore` /
  `relevanceReason`); `<0.5` auto-deselects; **`<0.2` AND not-an-event auto-drops**
  to `status='ai_dropped'` — surfaced in Review as **AI-dropped (N)** with one-tap
  **Restore** (`POST /api/admin/qsearch/queue/restore {id}`). Never a silent delete.
- **Safety flags** (`ageRequirement`/`isSexPositive`/`eventTypes` KINK) filled only
  on catch-all drafts that have none — never overrides a trusted `venuePolicy` stamp.
- **Field cleanup**: weak `"TBA"` venue / broken title / stub description replaced
  when the model is confident; original kept in a warning breadcrumb.
- **Dedup band**: only firms up the uncertain middle (`submissionMatch` score 48–72);
  a "different" verdict clears the false duplicate flag.
- Any per-candidate failure leaves that candidate untouched. Smoke:
  `npx tsx script/smoke-qsearch-scrub.ts` (mocked LLM, offline).

## Recurring ↔ duplicate checks

When a scrape is weekly/monthly **or** matches catalog:

| Catalog pattern | Flag |
|-----------------|------|
| Multiple instances same title/venue/weekday | **Catalog already series** - skip create; optional flyer/time refresh |
| Single one-off listing | **Needs recurring update** - update that event, don’t stack a second host |
| Scrape weekly + catalog one-off | Candidate unselected + action note for human |

## Vision (how flyer reading works)

There is **no custom/local mini-model**. Flyer OCR uses a **cloud vision API**:

| Env | Model default |
|-----|----------------|
| `XAI_API_KEY` | `grok-2-vision-latest` (or `QSEARCH_VISION_MODEL`) |
| `OPENAI_API_KEY` | `gpt-4o-mini` |

- `POST /api/admin/qsearch/vision` - `{ imageUrl, venueHint? }` (https or `/uploads/…`)
- `POST /api/admin/qsearch/vision/upload` - multipart `flyers` (1–12 images) + optional `venueHint`
- Low confidence (&lt;0.55) unselected by default
- **Scan:** optional `tryVision` samples page images when structured parse is empty

Without those keys, calendar **HTML/JSON/ICS** still work; flyer-from-image does not.

## Instagram assist

- **URL only:** `POST /api/admin/qsearch/instagram` `{ mode: "url", url }` - post link or direct image CDN  
- Tries public OG image (often blocked) then vision on the image  
- **Graph:** Meta Business Discovery when tokens set  
- **Never** full unauth Instagram scrape  

## Admin API surface

| Method | Path |
|--------|------|
| GET | `/api/admin/qsearch/dashboard` |
| GET | `/api/admin/qsearch/queue` |
| POST | `/api/admin/qsearch/scan` | body: `{ includePastEvents?, tryVision?, sourceIds?, onlyFailing?, onlyNew?, … }` - **past off by default** |
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

## Flyer Reader (GitHub-sourced OCR - Phase 1 shipped 2026-07-21)

Server-side flyer parsing inside this app (no separate service - one Railway
deploy). `server/flyerReader/`:

- **Source**: flyers live in the repo `flyers/` folder - loaded disk-first
  (ships with the deploy), GitHub API fallback (`GITHUB_FLYERS_REPO`,
  optional `GITHUB_TOKEN`). Paths strictly confined to `flyers/`.
- **OCR**: sharp preprocess (rotate/grayscale/normalize/upscale-to-1200px)
  → tesseract.js (pure WASM, lazy worker, traineddata cached in
  `TESSERACT_CACHE_DIR`, default /tmp/tesseract).
- **Endpoint**: `POST /api/admin/qsearch/flyer-reader/ocr` (admin) -
  `{githubPath}` or small `{imageBase64}` → `{text, confidence, preprocessMs, ocrMs}`.
- **Phase 2 (shipped)**: `POST /api/admin/qsearch/flyer-reader/parse` -
  `{githubPath | imageBase64 | rawText}` → OCR (skipped when rawText given)
  → LLM structuring → brief schema JSON (title, start_date, end_date, time,
  venue, address, description, url, qr_info, confidence, raw_text) + an
  `IngestEventDraft` (parseSource `flyer-reader`) ready for the Review queue.
  LLM order: `GROQ_API_KEY` (preferred, `FLYER_LLM_MODEL` default
  llama-3.3-70b-versatile) → XAI/OpenAI envs → deterministic heuristic
  fallback (low confidence + warning; never breaks). Confidence blends LLM
  self-report with OCR quality. Never-invent-FREE applies to drafts.
- **Vision hybrid (title lever, r2)**: when the flyer image is available and
  a vision model is configured, `structureFlyer` sends the IMAGE (downscaled
  1024px JPEG) to the vision model with OCR text as a hint - stylized display
  type never survives Tesseract ("Gaylabration" → "Reorder"). Providers:
  Groq `FLYER_VISION_MODEL` (default llama-4-scout-17b-16e-instruct) → XAI
  grok-2-vision → OpenAI. Any failure falls back to the text path with a
  breadcrumb. /parse endpoint + validator are vision-first automatically.
- **Phase 4 harness (shipped, needs your flyers)**: `npx tsx
  script/validate-flyers.ts [--limit N] [--json report.json]` - runs the
  full pipeline over every entry in `flyers/ground-truth.json`, scores
  fields (fuzzy title/venue, exact day, ±30min time, street-number address,
  hostname url), prints per-field + overall accuracy, exits non-zero under
  70%. This is the ongoing test suite for parser changes.
- **Remaining**: Phase 3 QSearch Scans hooks (wire /parse into the existing
  batch flyer upload → review queue flow); Phase 5 persistence + rate
  limits + frontend samples.

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

# QSearch relevance + exact venue/group identity
npx tsx script/smoke-qsearch-identity.ts

# Regression guard: Sports Bra scraper stays disabled
npx tsx script/smoke-sports-bra.ts

# QSearch offline + live API (server must be on :5050)
npx tsx script/smoke-qsearch.ts

# server
PORT=5050 npm run dev

# login then:
# open http://localhost:5050/admin?tab=qsearch
# Scan now → watch progress → Review queue → Approve LIVE or Stage HIDDEN
```

Login (local smoke DB): `tucker_pdmax` / `smoketest`
