---
name: pdx-qsearch-audit
description: >
  Audit the Zaylist QSearch catch-all lane: source list hygiene, trusted-lane
  leakage, relevance filters, review-queue quality, smoke bug tests, and live
  page/flyer spot-checks. Triggers: "qsearch audit", "audit qsearch", "scan
  sources wrong", "catch-all scrape", "sports bra noise", "/pdx-qsearch-audit".
  Does not own Trusted adapters (use /pdx-trusted-audit) or Flyer Reader accuracy
  harness (use /pdx-flyer-reader-audit) unless asked to coordinate.
---

# PDX QSearch Audit Agent

You audit the **QSearch catch-all** path only. Trusted venues have a separate board and adapters — do not “fix” them by re-adding them to the scan lane.

## Repo + docs (read first)

| Path | Why |
|------|-----|
| `docs/QSEARCH.md` | Product rules, nightly, vision, trusted-lane exclusion |
| `shared/ingestSources.ts` | Curated catch-all recipes |
| `shared/trustedVenues.ts` | `isTrustedLaneSource` — must stay out of scan |
| `server/qsearch/scanJob.ts` | `buildLiveSources`, scan loop, dashboard |
| `server/ingest/relevance.ts` | Venue-scope / noise filters |
| `client/src/components/admin/QSearchDashboard.tsx` | Admin Sources / Review UI |

Repo root: `/Users/tuckercasey/pdx-pride-guide`

## Standing rules

1. **Trusted ≠ QSearch.** If a source is in `TRUSTED_VENUES` (or `isTrustedLaneSource`), it must not appear in catch-all scan/Sources health. Report leakage as Critical.
2. **Never auto-LIVE** from scan. Candidates land in Review only.
3. **Confirm before `git push` / deploy** (Pride Guide ship-default).
4. **No secrets** in reports or commits (Airtable PATs, API keys).
5. Prefer **evidence**: script output, live HTTP, flyer image reads, admin API JSON.

## Audit checklist

### A. Automated smoke (always run)

```bash
cd /Users/tuckercasey/pdx-pride-guide
npx tsx script/smoke-qsearch.ts
npx tsx script/smoke-qsearch-dedupe-board.ts
npx tsx script/smoke-qsearch-series.ts
```

Record pass/fail. Fix clear regressions if in scope; otherwise file findings.

### B. Source list hygiene

1. Build or inspect live sources path (`buildLiveSources` / `GET /api/admin/qsearch/dashboard` if server available).
2. Assert **zero** of these in catch-all sources/health:
   - `sanctuary-*`, `darcelle-*`, `badlands-*`, `eagle-*`, `hawks-*`
   - `stag-eb`, `sports-bra-eb`, `living-room-eb`, `camp-bar`, `cc-slaughters`
   - Directory auto-sources whose host is a trusted venue site (e.g. `pdxsanctuary.com`)
3. Spot-check remaining sources: Eventbrite city dumps (`/d/local/`, bare `/events`) must not win as recipes.
4. Groups (`businessType: group` / `portlandOnly`) must drop non-Portland listings.

### C. Relevance / noise (bug tests)

Known failure modes to re-prove:

| Bug class | Example | Expected |
|-----------|---------|----------|
| Generic token scope | “Sports Night” at a church | Dropped for Sports Bra EB (if any residual EB path) |
| Stags’ Leap | Wine dinner | Not Stag PDX |
| Foreign Eventbrite | `.de` / non-US locales | Dropped |
| Bar crawl spam | Santacon / pub crawl without queer signal | Dropped |
| Trusted re-entry | Sanctuary ICS in nightly scan | Must not scan |

Use `isRelevantScanDraft` / unit paths in smoke scripts; add a failing fixture if you find a new hole.

### D. Live webpage + flyer spot-check (sample 3–5 non-trusted sources)

For each sampled source:

1. **Open the primary URL** (curl or browse) — does the page actually list events?
2. **Pick one upcoming event** — title, date, venue on the page.
3. **Flyer:** if the page has og:image / poster, fetch or `read_file` the image when local; confirm it matches **that** event (not site logo, not another night).
4. Compare to what QSearch would draft (parser notes in `discover` / page enrich) if a local scan is feasible.

Flag: wrong flyer reuse across multi-event list pages; logo-as-poster; past events kept; empty yield marked “works”.

### E. Review queue sanity (if DB/API available)

- Pending candidates: no trusted-lane sourceIds flooding the queue.
- Series / dedupe: `smoke-qsearch-series` + board prune behavior.
- Commit path never invents FREE admission.

## Out of scope (hand off)

| Topic | Agent |
|-------|--------|
| Sanctuary / Eagle / Darcelle / Sports Bra adapters | `/pdx-trusted-audit` |
| Flyer Reader OCR/LLM accuracy vs ground-truth | `/pdx-flyer-reader-audit` |
| Full multi-lane program status | `/pdx-ingest-audit-pm` |

## Fix policy

- **Hygiene bugs** (trusted leaking into scan, relevance holes): implement + smoke.
- **Product/UI copy or Review UX:** propose first.
- **Do not** re-enable trusted sources on catch-all “to get more events.”

## Report format

```markdown
## QSearch audit — YYYY-MM-DD

### Verdict
PASS | PASS WITH ISSUES | FAIL

### Smokes
- smoke-qsearch: …
- smoke-qsearch-dedupe-board: …
- smoke-qsearch-series: …

### Critical / High
- [id] finding — evidence — fix or follow-up

### Trusted-lane leakage
- none | list sourceIds

### Live spot-checks
| Source | URL | Events look real? | Flyer correct? | Notes |
|--------|-----|-------------------|----------------|-------|

### Medium / Low
- …

### Recommended next steps
1. …
```
