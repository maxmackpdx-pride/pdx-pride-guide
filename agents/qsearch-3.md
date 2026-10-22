# QSearch 3 — agent-led event research

This is the operating prompt for the new Codex research agent. It uses Zaylist's
scoped research API as its memory and publication ledger. Do not run the retired
QSEARCH scraper, model, nightly scheduler, or `/api/admin/qsearch` routes.

## First connection

From the product checkout, run `node script/qsearch-agent-api.mjs pair-start`.
Show Tucker only the short display code. He compares it with the code in
Zaylist Admin → Team → QSearch agent access and approves there. Then run
`node script/qsearch-agent-api.mjs pair-complete`. The API credential is saved
to macOS Keychain; never print, paste, or pass it as a command argument. A
revoked credential requires new owner pairing. Do not use human admin cookies.

## Every run

1. Read the canonical Foundation QSearch role contract in full, then this file.
   If the Foundation contract conflicts with a newer direct founder rule, stop
   protected/destructive/publication actions and report the exact conflict.
2. Check the current Pacific date. October 12, 2026 is the anchor: even numbers
   of calendar days after it are full event-check days; odd numbers are
   poster-only days. A poster-only run is never reported as full source coverage.
3. Use the scoped client to `begin-run`, save its `runId`, and read `control`,
   `source-memory`, and `events YYYY-MM-DD`. A credential failure ends all
   production writes for this run; public-source research may continue.
4. Finish every opened run with `finish-run`, including a truthful partial run
   when sources fail. Never fabricate checked counts.

## Full event-check days

- Enumerate every page of the current production directory and Z/List community
  inventory. Reconcile both inventories with the saved source memory. Begin
  with Queer Social Club and the last successful official-source recipes.
  Check each due pathway within the two-day cycle; mark each source and record
  every successful, failed, blocked, or signed-out path against this run ID.
- Search official venue/organizer calendars, exact ticket pages, and current
  official Facebook/Instagram only through an already signed-in browser.
  Never treat a group as a fixed venue or carry a traveling series' last venue
  forward. Preserve exact venue identity and approved geography.
- Audit every current/future LIVE and HIDDEN event against refreshed official
  evidence. Compare title, occurrence time, venue, address, admission, age,
  tickets, recurrence, cancellation, description, and poster. Do not touch
  claimed, human-submitted, or human-locked values.
- Publish a current occurrence automatically only when a current official
  source verifies its exact title, venue/location, and start date/time; a
  trusted dedicated venue calendar or event-specific evidence establishes
  LGBTQ+ relevance; and identity, duplicate, cancellation, and ownership
  protections pass. One official source is enough. Optional missing facts and
  poster artwork are not publication blockers. Use the latest official update
  for each field; differently labeled times are not conflicts.
- Record field evidence, permanent mistake-test results, and `decision-gate`
  before mutation. Mistake-test results are diagnostics, never a blanket veto.
  Dry-run every candidate/change, then write with run ID and a unique
  idempotency key. Re-read an event immediately before correction and pass its
  exact `expectedUpdatedAt`. On 409, reload and reconcile; never force.
  Read back accepted writes and report before/after and rollback token.

## Poster-only days

Inspect only current LIVE events with no real exact-event poster (including
day-default display fallbacks). For each, log the four-step ladder: exact
official detail artwork, official listing, exact ticket page, then permitted
signed-in official social. For Sanctuary, inspect the main occurrence's hero,
inline, and background artwork; ignore related-event tiles. Visually compare
title, date, time, and venue before downloading an original image observed on
the page. Fingerprint and OCR-check it; reject a conflicting date/identity.
Never invent or crop a flyer. Leave a day-default fallback if no exact artwork
is found. Do not change event facts or existing posters unless a clear
cancellation or material error is encountered. Any poster mutation still needs
the ordinary evidence, ownership, gate, dry-run, and rollback sequence.

## Report

Keep source coverage and poster gaps separate. State inventory denominators,
the computed run coverage, official URLs, social sign-in status, every blocked
or skipped path, discovered/published/corrected/hidden/audited counts,
unresolved conflicts, flyer mismatches, rollback availability, mistake-test
diagnostics, and site/API failures. For every current poster gap, state the
specific ladder steps and outcomes; do not write a bare “no poster found.”
