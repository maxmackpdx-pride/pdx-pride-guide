# Standing roadmap - any Claude session picks up from here

Read this first. The repo is the memory; chat sessions are ephemeral.
Rules that always apply: review-queue only (never auto-LIVE), never-invent-FREE,
SSRF guard on fetches, spending caps + kill switch (COSTS.md), tsc error count
must stay at baseline (37), offline smokes must pass before push.

## NEXT page - approved founder direction (implementation context)

**Status:** founder direction, approved for the current NEXT page.
**Owner:** Tucker.
**Recorded:** 2026-08-03.

This section records product and implementation context for the Zaylist NEXT
page. It is not a second Foundation and does not replace Foundation chapters,
decision records, or the canonical Design System. Durable platform rules remain
owned by the canonical Zaylist Foundation; visual tokens, component anatomy,
motion, and identity construction remain owned by the canonical Design System.

### Why the page exists

NEXT should make Zaylist's direction understandable without pretending every
idea is already built or promising dates that one founder cannot responsibly
guarantee. It should connect the live platform to a small family of future
products, show how each one helps people find or care for one another, and give
the community a direct way to influence what comes next.

Product goals:

- Tell one coherent story: Zaylist grows from finding what is happening into
  finding people, places, groups, plans, and privacy-respecting connection.
- Distinguish current, pilot, and planned work with plain status language.
- Let each concept feel memorable while preserving one Zaylist family.
- Keep the roadmap credible for a solo founder: no dates, fake certainty, or
  implied parallel teams.
- Invite ideas without exposing owner identity, personal contact details, or
  the private route by which submissions are reviewed.

### Seven-card roadmap narrative

The order is deliberate. It begins with an implemented proof, moves into shared
community infrastructure, then expands through private connection, spontaneous
nightlife, casual gathering, travel, and finally community authorship.

| Card | Product role | Public status | Narrative job |
|------|--------------|---------------|---------------|
| 01 - ZAYHAUS / HAUSING | Find people and rooms through compatibility, boundaries, access, pets, timing, and budget. | Complete | Start with a real product and demonstrate that Zaylist can support consequential connection, not only discovery. |
| 02 - Z/SPACE | Give an existing group one place for events, updates, resources, and opportunities. | Planned pilot | Move from individual discovery to durable community infrastructure. |
| 03 - ZAYDARK | Support private, consent-led adult self-expression and discovery with progressive disclosure. | Just coming | Put the most trust-sensitive concept early enough to be explicit: privacy is product behavior, not a disclaimer. |
| 04 - AFTERZ | Share a short-lived next stop when the night moves. | Planned | Extend the live-event moment through a small, expiring signal rather than a permanent feed. |
| 05 - ZENEGADES | Make a lightweight gathering with time, capacity, and a location that may stay private. | Planned | Turn community intent into a casual plan without forcing a full event listing. |
| 06 - Z/OUT | Find companions for trails, campgrounds, road trips, and weekends through practical compatibility. | Planned | Carry the people-first matching model outside nightlife and outside Portland. |
| 07 - Your idea | Submit what Zaylist should build next. | Your turn | End with participation: the roadmap is directional, not closed. |

These cards explain product directions, not delivery commitments. Status copy
must remain accurate as implementation changes.

### Idea submission and owner privacy

The final card is a public idea form. The human promise is simple: submit an
idea and receive a clear success or retry state. The interface must not mention
the Owner Desk, a personal email address, the shared admin queue, or internal
routing. The current approved implementation reuses `POST /api/contact/message`
with the existing contact protections and sends the result to the private owner
review surface.

Required boundaries:

- Collect only the minimum current fields: name, reply email, and idea.
- Keep the existing honeypot, rate limit, server validation, length caps, and
  generic public error response.
- Include the source page for context without displaying private routing.
- Do not claim an idea will be built, answered, or reviewed by a larger team.
- Do not publish owner contact data in client code, response payloads, metadata,
  or page copy.
- Owner-only read and resolve permissions remain server-enforced; a hidden label
  in the interface is never a privacy or authorization control.

### Product logo family

ZAYHAUS, Z/SPACE, ZAYDARK, AFTERZ, ZENEGADES, and Z/OUT are a related logo
family under Zaylist, not independent brands. Their supplied lockups may give
each concept a distinct voice, but PRIME ZAY and the approved ZAYLIST master do
not drift. Secondary wording may vary only inside the identity rules and
candidate-approval process owned by the canonical Design System. The NEXT page
uses approved supplied artwork; it does not redraw, recolor, or promote a new
master logo through page implementation.

### Contained roadmap-card principles

The cards are self-contained product chapters laid over one continuous roadmap
wallpaper. The wallpaper and route motifs remain fixed and visually bold behind
the sequence; they must not be reset or hidden by a separate decorative
backdrop on every card.

- One shared card frame, axes, metadata rhythm, status position, and content
  hierarchy make the seven concepts read as one journey.
- Each product gets one contained motif tied to its actual idea. Motifs support
  recognition and stay behind readable copy; they do not become controls or
  imply shipped functionality.
- Logo, motif, description, detail, and optional action occupy stable regions so
  one card's content does not change the whole sequence geometry.
- A restrained Fluent 2 influence is allowed only as a small usability polish:
  clearer surface depth, predictable interactive states, and stronger content
  grouping. It must not replace Zaylist glass, type, color, or motion language.
- Status always uses text as well as the small blinking dot. The dot may draw
  attention, but never carries status alone; calm mode and
  `prefers-reduced-motion` remove the blink without removing meaning.
- The idea card uses a white accent to mark a handoff to the community. It still
  shares the same card family and must not turn into an unrelated light theme.
- Rainbow flow belongs to the stationary journey behind the cards, not as a
  repeated animated seam or bloom on every card.
- Wide and compact layouts are separate acceptance cases. Preserve reading
  order, visible focus, field labels, error/success announcements, and at least
  44 by 44 CSS pixel interactive targets.

### Current Founder Priority

Keep the seven-card story truthful and easy to scan, verify the private idea
submission from card to owner-only review, and preserve the fixed wallpaper
motifs across wide and compact layouts before adding more roadmap concepts or
decorative motion.

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
  (Airtable blocked) - verify on Railway after the env var lands.
- Also fixed the venue-scope leak generally: two-token venue match now requires
  the venue name to appear in LOCATION fields, not the event title (a title
  saying "Sports Night" no longer scope-matches The Sports Bra).
- USER FLYER AUTOFILL shipped: POST /api/flyer-autofill + Submit uploader wiring
  - a submitter uploads a poster and OCR+vision fills blank form fields (review
  only; still goes through /api/submit moderation). Caps FLYER_AUTOFILL_USER_DAILY
  (10) / _GLOBAL_DAILY (200) + FLYER_LLM_DISABLED kill switch.
- PROD-CRASH FIXED (my regression): gamePoster.ts read font files at module load;
  prod bundles to one dist/index.cjs so the files weren't there → crash-loop.
  Fonts now inlined as base64 (server/posters/fontData.ts). LESSON: anything that
  reads a bundled-adjacent file at import time breaks prod - inline assets or
  verify by bundling to CJS and running with no sibling files.
- Flyer Reader: Phases 1, 2, 4 done. Validation at 97% (reports/). Vision =
  Gemini free tier via self-discovering provider chain. Phase 3 shipped:
  POST /api/admin/qsearch/flyer-reader/parse with {queue:true} → Review queue.
- CI: flyer-validate.yml grades every parser/flyer change into reports/.

## Done recently
- Scan-pipeline vision UNLOCKED: qsearch/vision.ts now recognizes
  GEMINI_API_KEY (free tier, model proven by validation suite) + honors the
  FLYER_LLM_DISABLED kill switch. Zero-yield scan sources with flyer-only
  pages (Scandals-class) now get vision-read drafts - capped at 2 images per
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
4. Nice-to-have (ask first - spends money at scale): multi-event flyer mode
   (Eagle monthly schedule class); Sanctuary flyer-coverage recheck on live
   board; UI surface for flyer-reader in QSearchDashboard.

## Ideas parked (Tucker's - not started, discuss before building)
- NEWSLETTER MAILROOM (Tucker, 2026-07-24): a dedicated email address subscribes
  to every directory venue's newsletter; each scan cycle, new emails are parsed
  for events (HTML/JSON-LD links + embedded flyer images through the existing
  Flyer Reader + vision) → Review queue, attributed to the venue. NOT the app's
  "Inbox" (that's user DMs) - name it distinctly (Mailroom/Feed). Reuses:
  ingest pipeline, flyer reader, dedup, review-queue lock, cost caps + kill
  switch. New pieces needed: (1) how mail gets IN - inbound-email provider
  webhook (Mailgun/Postmark/CloudMailin) or IMAP polling of one mailbox;
  (2) one-time signup effort per venue (many use double opt-in confirm clicks);
  (3) relevance/noise filter (merch/promo emails aren't events); (4) hard vision
  caps per email (newsletters are image-heavy → cost). Decision to make first:
  inbound-webhook vs IMAP. Start small: one mailbox, 2–3 venues, prove it.

## How to resume in a fresh session
Token is in the project instructions. Clone, read this file + reports/
flyer-validation-latest.json + git log -10, then do the next unblocked item.
