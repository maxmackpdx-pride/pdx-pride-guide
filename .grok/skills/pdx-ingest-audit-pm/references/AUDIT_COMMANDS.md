# Ingest audit — command cheat sheet

Run from repo root: `/Users/tuckercasey/pdx-pride-guide`

## Offline smokes (no API keys required)

```bash
npx tsx script/smoke-qsearch.ts
npx tsx script/smoke-qsearch-dedupe-board.ts
npx tsx script/smoke-qsearch-series.ts
npx tsx script/smoke-trusted-new-venues.ts
npx tsx script/smoke-trusted-flyers.ts
npx tsx script/smoke-sports-bra.ts
npx tsx script/smoke-flyer-reader.ts
```

Optional Tesseract:

```bash
SMOKE_OCR=1 npx tsx script/smoke-flyer-reader.ts
```

## Flyer Reader graded harness (needs network + vision/text keys)

```bash
# Full set (uses GROQ_API_KEY / GEMINI_API_KEY)
npx tsx script/validate-flyers.ts --json reports/flyer-validation-audit.json

# Cap spend
FLYER_VALIDATE_MAX=8 npx tsx script/validate-flyers.ts --limit 8 --json reports/flyer-validation-audit.json
```

Kill switch: `FLYER_LLM_DISABLED=1`

## Live truth URLs (trusted)

| Venue | Start here |
|-------|------------|
| Sanctuary | https://pdxsanctuary.com/events/calendar/sanctuary/ics/ · https://pdxsanctuary.com/calendar/ |
| Sports Bra | https://thesportsbraofficial.com/pages/portland |
| Eagle | https://www.eagleportland.com/what-s-happening |
| Darcelle | https://darcellexv.com/events/ |
| Hawks | https://www.hawkspdx.com/hawks-events |
| Badlands | https://www.badlandsportland.com/calendar |
| Stag | Eventbrite organizer in `trustedVenues.ts` |
| Camp Bar | https://campbarpdx.com |
| CC Slaughters | https://www.ccslaughterspdx.com/ |
| Living Room | https://livingroomwinespdx.com |

## Ground-truth flyers

- Labels: `flyers/ground-truth.json`
- Images: `flyers/*.{jpg,webp}`
- Always `read_file` the image before scoring opinions

## Code anchors

| Concern | File |
|---------|------|
| Trusted lane filter | `shared/trustedVenues.ts` → `isTrustedLaneSource` |
| Catch-all source build | `server/qsearch/scanJob.ts` → `buildLiveSources` |
| Relevance / noise | `server/ingest/relevance.ts` |
| Sanctuary flyers | `server/ingest/adapters/sanctuary.ts` |
| Sports Bra | `server/ingest/adapters/sportsBra.ts` |
| Flyer structure | `server/flyerReader/parse.ts` |
| QSearch vision | `server/qsearch/vision.ts` |

## Product locks

- Scan/sync/reader → **Review queue**, never auto-LIVE
- Never invent FREE admission
- Confirm before `git push` / Railway deploy
