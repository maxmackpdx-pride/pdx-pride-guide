# Owner Decisions: Download Definition and Homepage Wordmark

Decided: 2026-08-04 by Tucker (authority tier 1, founder direction)
Recorded: 2026-08-04T13:24:02Z by Claude
Status: resolved
Visibility: internal-shareable

## Decision 1: verified download and adoption definition

Resolves CONFLICT-DOWNLOAD-ADOPTION and BLOCK-DOWNLOAD-DEFINITION.

Approved definition: a verified adoption event is one server-confirmed successful file download with full delivery confirmation. Count it as adoption within a 90-day window.

Constraint: report no adoption or conversion numbers until this measurement is implemented and verified. No other numbers until it is in place.

Follow-up (not yet done): implement and verify the server-side full-delivery confirmation event, then wire it to the 90-day count. Owner of implementation to be confirmed (Analytics and Conversion role is not yet created).

## Decision 2: homepage wordmark

Resolves CONFLICT-HOMEPAGE-WORDMARK and BLOCK-HOMEPAGE-WORDMARK.

Ruling: the invisible homepage wordmark is a bug. Restore the existing wordmark treatment and keep it visible. It is not an intentional exception and not an identity change.

Follow-up (not yet done): diagnose the invisibility root cause on the homepage and restore visible rendering against the existing standard. Do not normalize or reuse the invisible treatment.

## Ledger changes made with this decision

- conflicts.json: both conflicts set to resolved with resolution text and resolvedBy Tucker.
- current-context.json: activeBlockers cleared, both moved to resolvedBlockers; added FACT-DOWNLOAD-DEFINITION; activePriority.measurementStatus set to definition-approved, implementation-pending.
- events.jsonl: appended two decision_changed events (actor Tucker).

No git commit or push performed by this note. No production or homepage code changed by this note.
