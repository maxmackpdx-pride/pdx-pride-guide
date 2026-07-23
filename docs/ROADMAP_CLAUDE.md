# Standing roadmap — any Claude session picks up from here

Read this first. The repo is the memory; chat sessions are ephemeral.
Rules that always apply: review-queue only (never auto-LIVE), never-invent-FREE,
SSRF guard on fetches, spending caps + kill switch (COSTS.md), tsc error count
must stay at baseline (37), offline smokes must pass before push.

## State (updated 2026-07-23)
- Trusted venues: 10 on the board. Scan-source pruning WAITS for Tucker
  confirming a venue green (incl. flyer coverage) on the live Trusted tab.
- Flyer Reader: Phases 1, 2, 4 done. Validation at 97% (reports/). Vision =
  Gemini free tier via self-discovering provider chain. Phase 3 shipped:
  POST /api/admin/qsearch/flyer-reader/parse with {queue:true} → Review queue.
- CI: flyer-validate.yml grades every parser/flyer change into reports/.

## Next (in order, autonomous unless marked TUCKER)
1. Phase 5 wrap: README section for Flyer Reader API + frontend sample
   snippet for QSearch admin (small, docs-only).
2. TUCKER: add GEMINI_API_KEY to Railway Variables → wakes /parse in
   production AND the dormant qsearch/vision.ts features.
3. TUCKER: pay Railway bill (site survival), rotate GitHub PAT + Groq key.
4. Watch reports/ after any flyer/parser change; investigate any drop below 90%.
5. When Tucker confirms trusted venues green: prune their scan-lane entries
   from shared/ingestSources.ts (one venue per commit, cite the confirmation).
6. Nice-to-have (ask first — spends money at scale): multi-event flyer mode
   (Eagle monthly schedule class); Sanctuary flyer-coverage recheck on live
   board; UI surface for flyer-reader in QSearchDashboard.

## How to resume in a fresh session
Token is in the project instructions. Clone, read this file + reports/
flyer-validation-latest.json + git log -10, then do the next unblocked item.
