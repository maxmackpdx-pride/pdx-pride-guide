# Meta AI audit handoff — 2026-07-25 / 2026-07-26

Source: Meta AI + Grok confirmation against `zaylist-events-upcoming-2026-07-25.json` (245 LIVE).

## Fixed
- UNKNOWN admission = 0 (DOOR_FEE 216 / TICKETED 27 / FREE 2)

## Cleanup (soft-hide)
See `cleanup_prod_2026-07-25.sql` (SQLite-ready) and `.meta-prisma.sql` (Meta's original shape).

| Kind | IDs | Action |
|------|-----|--------|
| Garbage Hardstyle | 376 | HIDDEN |
| Garbage Molalla Survival | 377 | HIDDEN |
| Garbage Beer Runs | 365, 368, 381 | HIDDEN |
| Dupe Oliver Tree | keep 337, hide 355 | |
| Dupe Charli XCX | keep 315, hide 316, 356 | |
| Dupe Club Petal | keep 317, hide 357 | |
| Dupe Live Nude Mammals | keep 325, hide 358 | |
| Dupe OPW | keep 383, hide 386 | |

## Validation (17 missing Eventbrite)
All structure-ok; posters present; Bar Cala **2703 NE Alberta**.

## Review import
`zaylist-review-import-candidates.json` — full 17 candidates from verified missing file.
`source_gaps`: Q Center only (not invented). Crush Bar = **CLOSED_PERMANENT_2025-01-01** (successor Peacock PDX year-round source `peacock-pdx`).

## workers.dev ticket URLs
~60 in upcoming / ~110 if past included — Badlands proxy; replace with real venue/IG later.
