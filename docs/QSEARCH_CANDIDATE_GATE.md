# QSearch candidate creation gate

New event creation now has a pre-ID evidence target. Existing event changes keep
their existing `eventId` gate, optimistic concurrency, lock checks, and scoped
authentication. A candidate is not a hidden placeholder event.

## Before creation

1. Begin a research run and choose one stable canonical `candidateKey` for the
   exact occurrence, for example `candidate:sanctuary:2026-10-04:sinful-sunday-market`.
   Use lowercase letters/digits, colon, hyphen, or underscore; maximum 160
   characters. Do not reuse another occurrence's or venue's key.
2. Record each field with `record-evidence -`, supplying `entityKey` equal to that
   exact candidate key, the current `runId`, no `eventId`, its exact
   `observedValue`, current `checkedAt`, and a real official `sourceUrl`.
   `authorityLevel` must be `primary`. Every supplied field needs two distinct
   sources that actually agree on its value. A duplicate URL, contradictory
   second source, fabricated URL variant, or another run's receipt does not pass.
   The newest receipt for each normalized field/source wins (checked date, then
   creation/insertion order); an old agreement cannot overrule a newer conflict.
   Any current primary-source disagreement blocks the affected field, even if
   two other URLs agree and no separate conflict row has yet been recorded.
   Source identity drops fragments and known tracking parameters (`utm_*`,
   `fbclid`, `gclid`, `dclid`, `msclkid`) and normalizes query order. Meaningful
   occurrence selectors such as Eagle's `?date=` are preserved. Different URLs
   still require real matching evidence; normalization is not permission to
   manufacture source variants.
3. Record material candidate conflicts using `record-conflict -` with
   `candidateKey` and no `eventId`; use the same key on `queue-review -`.
   All open material candidate conflicts and open candidate review items block
   creation, including compound-field conflicts. Resolve only with real evidence
   or explicit founder direction. Do not clear an item merely to pass a gate.
4. Record actual current-run results for every active permanent mistake test.
5. Call `decision-gate -` with this shape:

```json
{
  "candidateKey": "candidate:source:date:occurrence",
  "runId": "CURRENT_RUN_ID",
  "fields": ["title", "description", "venueName", "address", "dateStart", "dateEnd", "ageRequirement", "admission", "status"],
  "proposedValues": {
    "title": "VERIFIED TITLE",
    "description": "VERIFIED DESCRIPTION",
    "venueName": "VERIFIED EXACT VENUE",
    "address": "VERIFIED EXACT ADDRESS",
    "dateStart": "VERIFIED START DATE-TIME",
    "dateEnd": "VERIFIED END DATE-TIME",
    "ageRequirement": "21_PLUS",
    "admission": "UNKNOWN",
    "status": "LIVE"
  },
  "requireIndependentVerification": true
}
```

This illustrates the shape, not researched event facts. Use only evidenced values.
The gate automatically includes all supplied and required creation fields, so
omitting a field from `fields` cannot bypass its proof. Every creation contains
high-risk date/identity/status fields; independent verification cannot be disabled
in candidate mode. Evidence must be within 30 days, primary, and recorded under
the active run and exact candidate key. Required facts, matching values, active
mistake results, conflicts/review, and existing title/venue/date/start-minute
duplicates are checked. Only `ok:true` plus `publishable:true` is an approval.

`title`, `description`, `venueName`, `dateStart`, `dateEnd`, `ageRequirement`,
`admission`, and `status` remain required even for HIDDEN records. LIVE also
requires an exact address. Unknown end time or age is not a reason to invent one.
All existing creation field validation still applies in the mutation preview.

## Scoped creation

Use `create-event -` with `{candidateKey, runId, event, evidenceReceipts, reason,
mistakeTestsPassed:true, dryRun:true}`. `event` must match the evidenced proposed
values; use arrays for `eventTypes`, and preserve nulls as nulls. The ordinary
mutation receipt array remains required: one `{field, sourceUrl, checkedAt,
note?}` per supplied field. It is separate from the durable candidate evidence.

A correct preview has `operation:create_preview`, `event.id:null`, and no event
or rollback ledger mutation. After reviewing it, send the complete input with
`dryRun:false` and a unique caller-generated `idempotencyKey`. Creation evaluates
the current gate again inside the event/evidence/rollback transaction; a previous
approval does not permit a changed or newly conflicted candidate. No `eventId`,
`approved:true`, `lockedFields`, or lock override belongs in a create request.

Successful creation returns the new event, `candidateKey`, evidence receipt IDs,
and rollback token. Candidate evidence and its conflict/review history are
associated with the new event atomically. Creation remains `source:qsearch-2`;
its supplied fields are QSearch-owned locks. Re-read and retain the returned
rollback token. Idempotency replay needs the exact same payload; a changed
payload with the same key is rejected. Created-event rollback hides rather than
deletes the event.

## Verification

`script/smoke-event-research-candidate.ts` runs only with
`ALLOW_QSEARCH_TEST_DB=1` and an explicit disposable `DATABASE_PATH`. It covers
legacy-column migration, evidence/run/value/key scope, required fields,
independent proof, conflicts and review, current mistake results, dry-run and
commit rechecks, array/null values, unchanged lock boundaries, duplicate checks,
idempotency, evidence association, and atomic rollback. It is included in the
existing predeploy test sequence. These tests never research or publish events.
