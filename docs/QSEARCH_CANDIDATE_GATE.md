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
   Use primary authority and the exact observed value. One official source is
   sufficient. The latest primary observation for a field determines its
   current value. Receipts must be within 30 days.
3. For publication without artwork, inspect each supplied official source URL
   and the ticket URL. Record a primary `artwork-review` receipt with the
   value `no-official-image` for each page you inspected. A blocked or failed
   page requires further review. For FetLife, record `public-access` =
   `public` and `lgbtq-relevance` = `explicit` on the exact occurrence page
   with a short excerpt from the listing. Verified Portland Sanctuary events
   receive standing relevance approval. An explicit `organizer-credit` for
   `Portland Leather Alliance` with a quoted credit also establishes relevance.
   The public-access receipt still applies in both cases. Record genuine
   conflicts and open review items against the same candidate key.
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
The gate checks every submitted fact and the required title, venue and start time.
A LIVE listing also needs a verified address. It can inherit a single matching
directory location. A private or vetted location uses “Register for address”
with no coordinates. The same checks apply when a HIDDEN event is republished.
Supply the current run ID and use the event ID for republication evidence.
Unknown end time, age, admission and other optional facts can stay unverified.
Review any `uncheckedArtworkPages` or `missingFetlifeEvidence` before writing.
A successful gate returns both `ok:true` and `publishable:true`.

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
associated with the new event atomically. Creation records `source:qsearch-3`;
its supplied fields are QSearch-owned locks. Re-read and retain the returned
rollback token. Idempotency replay needs the exact same payload; a changed
payload with the same key is rejected. Created-event rollback hides rather than
deletes the event.

## Verification

`script/smoke-event-research-candidate.ts` runs only with
`ALLOW_QSEARCH_TEST_DB=1` and an explicit disposable `DATABASE_PATH`. It covers
legacy-column migration, evidence/run/value/key scope, required fields,
one-source proof, address inheritance, FetLife screening, poster review, dry-run and
commit rechecks, array/null values, unchanged lock boundaries, duplicate checks,
idempotency, evidence association, and atomic rollback. It is included in the
existing predeploy test sequence. These tests never research or publish events.
