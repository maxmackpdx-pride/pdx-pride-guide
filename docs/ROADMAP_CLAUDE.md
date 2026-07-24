# Standing roadmap — any Claude session picks up from here

Read this first. The repo is the memory; chat sessions are ephemeral.
Rules that always apply: review-queue only (never auto-LIVE), never-invent-FREE,
SSRF guard on fetches, spending caps + kill switch (COSTS.md), tsc error count
must stay at baseline (37), offline smokes must pass before push.

## State (updated 2026-07-24)
- Trusted venues: 10 on the board. Scan-source pruning WAITS for Tucker
  confirming a venue green (incl. flyer coverage) on the live Trusted tab.
- Sports Bra: switched OFF the Eventbrite keyword search (pulled city-wide
  "sports" noise) → official Airtable schedule (fetchMode sports_bra_airtable,
  server/ingest/adapters/sportsBra.ts). Games with no flyer get an
  auto-generated Swedish-minimal poster (server/posters/gamePoster.ts, served
  at GET /api/game-poster). Needs SPORTS_BRA_AIRTABLE_TOKEN on Railway (Tucker
  has the pat token; see docs/SPORTS_BRA_AIRTABLE.md). Falls back to the
  venue-scoped EB feed until the token is set. LIVE FETCH UNTESTED from sandbox
  (Airtable blocked) — verify on Railway after the env var lands.
- Also fixed the venue-scope leak generally: two-token venue match now requires
  the venue name to appear in LOCATION fields, not the event title (a title
  saying "Sports Night" no longer scope-matches The Sports Bra).
- USER FLYER AUTOFILL shipped: POST /api/flyer-autofill + Submit uploader wiring
  — a submitter uploads a poster and OCR+vision fills blank form fields (review
  only; still goes through /api/submit moderation). Caps FLYER_AUTOFILL_USER_DAILY
  (10) / _GLOBAL_DAILY (200) + FLYER_LLM_DISABLED kill switch.
- PROD-CRASH FIXED (my regression): gamePoster.ts read font files at module load;
  prod bundles to one dist/index.cjs so the files weren't there → crash-loop.
  Fonts now inlined as base64 (server/posters/fontData.ts). LESSON: anything that
  reads a bundled-adjacent file at import time breaks prod — inline assets or
  verify by bundling to CJS and running with no sibling files.
- Flyer Reader: Phases 1, 2, 4 done. Validation at 97% (reports/). Vision =
  Gemini free tier via self-discovering provider chain. Phase 3 shipped:
  POST /api/admin/qsearch/flyer-reader/parse with {queue:true} → Review queue.
- CI: flyer-validate.yml grades every parser/flyer change into reports/.

## Done recently
- Scan-pipeline vision UNLOCKED: qsearch/vision.ts now recognizes
  GEMINI_API_KEY (free tier, model proven by validation suite) + honors the
  FLYER_LLM_DISABLED kill switch. Zero-yield scan sources with flyer-only
  pages (Scandals-class) now get vision-read drafts — capped at 2 images per
  source, first success stops. Nightly vision stays gated behind
  QSEARCH_NIGHTLY_VISION=1.
- Phase 5 docs: docs/FLYER_READER.md (API, frontend sample, env table).
- TUCKER confirmed 2026-07-23: Railway bill paid; GEMINI_API_KEY added to
  Railway Variables → live-site vision active. Flyer Reader brief COMPLETE.

## Next (in order, autonomous unless marked TUCKER)
1. TUCKER (housekeeping): rotate GitHub PAT + Groq key when convenient.
2. Watch reports/ after any flyer/parser change; investigate any drop below 90%.
3. When Tucker confirms trusted venues green: prune their scan-lane entries
   from shared/ingestSources.ts (one venue per commit, cite the confirmation).
4. Nice-to-have (ask first — spends money at scale): multi-event flyer mode
   (Eagle monthly schedule class); Sanctuary flyer-coverage recheck on live
   board; UI surface for flyer-reader in QSearchDashboard.

## Ideas parked (Tucker's — not started, discuss before building)
- NEWSLETTER MAILROOM (Tucker, 2026-07-24): a dedicated email address subscribes
  to every directory venue's newsletter; each scan cycle, new emails are parsed
  for events (HTML/JSON-LD links + embedded flyer images through the existing
  Flyer Reader + vision) → Review queue, attributed to the venue. NOT the app's
  "Inbox" (that's user DMs) — name it distinctly (Mailroom/Feed). Reuses:
  ingest pipeline, flyer reader, dedup, review-queue lock, cost caps + kill
  switch. New pieces needed: (1) how mail gets IN — inbound-email provider
  webhook (Mailgun/Postmark/CloudMailin) or IMAP polling of one mailbox;
  (2) one-time signup effort per venue (many use double opt-in confirm clicks);
  (3) relevance/noise filter (merch/promo emails aren't events); (4) hard vision
  caps per email (newsletters are image-heavy → cost). Decision to make first:
  inbound-webhook vs IMAP. Start small: one mailbox, 2–3 venues, prove it.

## How to resume in a fresh session
Token is in the project instructions. Clone, read this file + reports/
flyer-validation-latest.json + git log -10, then do the next unblocked item.
