import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

if (process.env.ALLOW_QSEARCH_TEST_DB !== "1" || !process.env.DATABASE_PATH) {
  throw new Error("Run only with ALLOW_QSEARCH_TEST_DB=1 and a disposable DATABASE_PATH.");
}

const { storage } = await import("../server/storage");
const { createEventFromResearch, rollbackEventResearchChange } = await import("../server/eventResearchMemory");
const {
  beginResearchRun, finishResearchRun, evaluateDecisionGate, recordFieldEvidence,
  recordConflict, enqueueResearchReview, upsertMistakeTest,
} = await import("../server/eventResearchControl");

const run = beginResearchRun({});
assert.equal(run.ok, true);
if (!run.ok) throw Error(run.error);
const candidateKey = `candidate:publish-simple:${randomUUID()}`;
const sourceUrl = "https://example.com/current-official-event";
const title = `Simple publish ${randomUUID()}`;
const event = { title, venueName: "Verified Test Venue", dateStart: "2027-11-15T19:00:00" };
const fields = Object.keys(event);
const gate = (proposedValues: Record<string, unknown> = event, key = candidateKey) => {
  const result = evaluateDecisionGate({ candidateKey: key, runId: run.runId, fields: Object.keys(proposedValues), proposedValues, requireIndependentVerification: true });
  assert.equal(result.ok, true);
  if (!result.ok) throw Error(result.error);
  return result;
};
assert.equal(gate().publishable, false, "the three required facts still need a source");
const checkedAt = new Date().toISOString();
for (const [field, observedValue] of Object.entries(event)) {
  assert.equal(recordFieldEvidence({ runId: run.runId, entityKey: candidateKey, field, observedValue, sourceUrl, checkedAt }).ok, true);
}
assert.equal(gate().publishable, true, "one official source is enough for title, location, and start time");
assert.deepEqual(gate().insufficientIndependentVerification, []);

assert.equal(upsertMistakeTest({ testKey: "simple-publish-unpassed", title: "Diagnostic-only test", misleadingInput: {}, evidence: {}, expected: {}, forbidden: {} }).ok, true);
assert.equal(gate().publishable, true, "an unpassed diagnostic test does not hold a good event");
const conflict = recordConflict({ runId: run.runId, candidateKey, field: "description", values: ["old", "new"], material: true });
assert.equal(conflict.ok, true);
assert.equal(enqueueResearchReview({ runId: run.runId, candidateKey, reasonCode: "optional-detail", detail: "Optional admission is unverified." }).ok, true);
assert.equal(gate().publishable, true, "optional conflicts and review notes do not hold publication");

const later = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();
assert.equal(recordFieldEvidence({ runId: run.runId, entityKey: candidateKey, field: "title", observedValue: "Old title", sourceUrl, checkedAt: later(1) }).ok, true);
assert.equal(gate().publishable, false, "the newest conflicting title wins over an earlier match");
assert.equal(recordFieldEvidence({ runId: run.runId, entityKey: candidateKey, field: "title", observedValue: title, sourceUrl, checkedAt: later(2) }).ok, true);
assert.equal(gate().publishable, true, "a newer correction restores publication without erasing history");
assert.equal(recordFieldEvidence({ runId: run.runId, entityKey: candidateKey, field: "status", observedValue: "CANCELED", sourceUrl, checkedAt: later(3) }).ok, true);
assert.equal(gate().publishable, false, "a current cancellation blocks LIVE publication");
assert.equal(recordFieldEvidence({ runId: run.runId, entityKey: candidateKey, field: "status", observedValue: "LIVE", sourceUrl, checkedAt: later(4) }).ok, true);
assert.equal(gate().publishable, true);

const receipts = fields.map(field => ({ field, sourceUrl, checkedAt }));
const input = { candidateKey, runId: run.runId, event, evidenceReceipts: receipts, reason: "Publish the three official facts and leave other details unverified.", mistakeTestsPassed: false, idempotencyKey: randomUUID() };
const preview = createEventFromResearch({ ...input, dryRun: true });
assert.equal(preview.ok, true);
const created = createEventFromResearch({ ...input, dryRun: false });
assert.equal(created.ok, true);
if (!created.ok) throw Error(created.error);
assert.equal(created.event.description, "Unverified");
assert.equal(created.event.dateEnd, "");
assert.equal(created.event.ageRequirement, "UNVERIFIED");
assert.equal(created.event.admission, "UNKNOWN");
assert.equal(created.event.status, "LIVE");
assert.ok(created.rollback.available);
assert.equal(storage.getEvent(created.event.id)?.title, title);
const replay = createEventFromResearch({ ...input, dryRun: false });
assert.equal(replay.ok, true);
assert.equal(gate({ ...event, status: "LIVE" }, `candidate:wrong-identity-${randomUUID()}`).publishable, false, "another candidate cannot borrow receipts");
const duplicateKey = `candidate:duplicate:${randomUUID()}`;
for (const [field, observedValue] of Object.entries(event)) recordFieldEvidence({ runId: run.runId, entityKey: duplicateKey, field, observedValue, sourceUrl, checkedAt });
assert.equal(gate(event, duplicateKey).publishable, false, "exact duplicate stays blocked");
assert.equal(rollbackEventResearchChange(created.rollback.token).ok, true);
assert.equal(storage.getEvent(created.event.id)?.status, "HIDDEN");
assert.equal(finishResearchRun({ runId: run.runId }).ok, true);
console.log("QSearch simple publish: three required facts, unknown optional fields, latest source, cancellation, duplicate, and rollback passed.");
