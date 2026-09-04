import assert from "node:assert/strict";
import { sqlite, storage } from "../server/storage";
import { getEventResearchSourceMemory, recordEventResearchPath } from "../server/eventResearchMemory";
import {
  beginResearchRun,
  enqueueResearchReview,
  ensureEventResearchControlTables,
  evaluateDecisionGate,
  finishResearchRun,
  getResearchControlState,
  markRunSource,
  recordConflict,
  recordFieldEvidence,
  recordMediaProvenance,
  recordDecisionOutcome,
  recordMistakeTestResult,
  resolveResearchItem,
  setSourceSchedule,
  upsertEntityIdentity,
  upsertEventSeries,
  upsertMistakeTest,
} from "../server/eventResearchControl";

if (process.env.ALLOW_QSEARCH_TEST_DB !== "1" || !process.env.DATABASE_PATH) {
  throw new Error("Run only with ALLOW_QSEARCH_TEST_DB=1 and a disposable DATABASE_PATH.");
}

// Migration must work on the copied existing database and remain idempotent.
ensureEventResearchControlTables();
ensureEventResearchControlTables();
const gateEvent = storage.getEvents({})[0];
assert.ok(gateEvent, "copied database provides an existing event for decision-gate tests");
const testEventId = gateEvent.id;

assert.equal(recordEventResearchPath({
  sourceKey: "official-test",
  label: "Official Test",
  url: "https://example.com/events",
  outcome: "success",
  navigationRecipe: "official events page",
}).ok, true);
sqlite.prepare(`
  UPDATE agent_event_source_paths SET last_checked_at = ? WHERE source_key = ?
`).run("2026-01-01T00:00:00.000Z", "official-test");

const run = beginResearchRun({ coverageWindowHours: 48 });
assert.equal(run.ok, true);
assert.ok(run.sourcesDue >= 1);
assert.equal(markRunSource({ runId: run.runId, sourceKey: "official-test", url: "https://example.com/events", outcome: "success" }).ok, true);
assert.equal(setSourceSchedule({ sourceKey: "official-test", url: "https://example.com/events", checkIntervalHours: 12, volatility: "high" }).ok, true);
assert.equal(recordEventResearchPath({ runId: run.runId, sourceKey: "healing-test", label: "Healing Test", url: "https://example.com/healing", outcome: "success", navigationRecipe: "official calendar > events" }).ok, true);
assert.equal(recordEventResearchPath({ runId: run.runId, sourceKey: "healing-test", label: "Healing Test", url: "https://example.com/healing", outcome: "failure", navigationRecipe: "broken route", error: "404" }).ok, true);
assert.equal(recordEventResearchPath({ runId: run.runId, sourceKey: "healing-test", label: "Healing Test", url: "https://example.com/healing", outcome: "failure", navigationRecipe: "still broken", error: "404" }).ok, true);
let healedPath = getEventResearchSourceMemory().learnedPathMemory.find((item: any) => item.sourceKey === "healing-test");
assert.equal(healedPath?.status, "broken");
assert.equal(healedPath?.lastSuccessfulRecipe, "official calendar > events", "failures preserve last successful recipe");
assert.equal(recordEventResearchPath({ runId: run.runId, sourceKey: "healing-test", label: "Healing Test", url: "https://example.com/healing", outcome: "success", navigationRecipe: "official calendar > current events" }).ok, true);
healedPath = getEventResearchSourceMemory().learnedPathMemory.find((item: any) => item.sourceKey === "healing-test");
assert.equal(healedPath?.status, "active");
assert.equal(healedPath?.lastSuccessfulRecipe, "official calendar > current events");
const finished = finishResearchRun({ runId: run.runId, eventsAudited: 12, summary: { discovered: 2 }, regression: { passed: 5, failed: 0 } });
assert.equal(finished.ok, true);
if (finished.ok) assert.equal(finished.coverage.percent, 100);
assert.equal(finishResearchRun({ runId: run.runId }).ok, false, "a run cannot finish twice");

const identity = upsertEntityIdentity({
  entityKey: "venue:sports-bra-portland",
  entityType: "venue",
  canonicalName: "The Sports Bra",
  aliases: ["Sports Bra"],
  anchors: { address: "2512 NE Broadway, Portland, OR" },
  officialUrls: ["https://thesportsbraofficial.com/"],
  classification: "founder_locked_dedicated_lgbtq",
  scope: { mapEligible: true, metro: "Portland" },
  evidenceUrl: "https://thesportsbraofficial.com/",
});
assert.equal(identity.ok, true);
assert.equal(upsertEntityIdentity({
  entityKey: "venue:sports-bra-portland",
  entityType: "venue",
  canonicalName: "The Sports Bra",
  anchors: { address: "401 SW 5th Avenue" },
  officialUrls: ["https://thesportsbraofficial.com/"],
  evidenceUrl: "https://thesportsbraofficial.com/",
}).ok, false, "canonical identity anchors require optimistic concurrency");
assert.equal(upsertEntityIdentity({
  entityKey: "venue:bad",
  entityType: "venue",
  canonicalName: "Bad",
  evidenceUrl: "file:///tmp/not-authoritative",
}).ok, false, "non-http identity evidence is rejected");

const evidence = recordFieldEvidence({
  runId: run.runId,
  eventId: testEventId,
  field: "address",
  observedValue: "2512 NE Broadway, Portland, OR",
  sourceUrl: "https://thesportsbraofficial.com/",
  sourceOwner: "The Sports Bra",
  evidenceType: "official_site",
  authorityLevel: "primary",
  checkedAt: new Date().toISOString(),
});
assert.equal(evidence.ok, true);
assert.equal(recordFieldEvidence({
  eventId: testEventId,
  field: "address",
  observedValue: "bad",
  sourceUrl: "javascript:alert(1)",
  checkedAt: new Date().toISOString(),
}).ok, false);

const conflict = recordConflict({
  runId: run.runId,
  eventId: testEventId,
  field: "address",
  values: ["2512 NE Broadway", "401 SW 5th Avenue"],
  receiptIds: evidence.ok ? [evidence.receiptId] : [],
  material: true,
  recommendedAction: "Keep hidden until exact identity is reconciled.",
});
assert.equal(conflict.ok, true);
assert.equal(recordConflict({ field: "address", values: ["one"] }).ok, false);

const review = enqueueResearchReview({
  runId: run.runId,
  eventId: testEventId,
  reasonCode: "identity-conflict",
  detail: "Official venue identity conflicts with the stored address.",
  missingEvidence: ["exact event venue confirmation"],
  evidenceUrls: ["https://thesportsbraofficial.com/"],
  priority: "high",
});
assert.equal(review.ok, true);

const media = recordMediaProvenance({
  eventId: testEventId,
  occurrenceDate: "2027-01-14",
  sourceUrl: "https://example.com/events/142",
  mediaUrl: "https://example.com/posters/142.jpg",
  ocrText: "TEST EVENT JAN 14",
  classification: "event-flyer",
  exactEventMatch: true,
});
assert.equal(media.ok, true);
assert.equal(recordMediaProvenance({ sourceUrl: "bad", mediaUrl: "bad", classification: "logo" }).ok, false);

const mistake = upsertMistakeTest({
  testKey: "sports-bra-wrong-address",
  title: "Do not attach a Sports Bra event at the wrong address",
  misleadingInput: { venueName: "The Sports Bra", address: "401 SW 5th Avenue" },
  evidence: { officialAddress: "2512 NE Broadway" },
  expected: { decision: "review" },
  forbidden: { decision: "publish" },
});
assert.equal(mistake.ok, true);
const gateInput = { eventId: testEventId, fields: ["address"], proposedValues: { address: "2512 NE Broadway, Portland, OR" } };
const blockedGate = evaluateDecisionGate(gateInput);
assert.equal(blockedGate.ok, true);
if (blockedGate.ok) assert.equal(blockedGate.publishable, false, "unpassed mistake tests block publishing");
assert.equal(recordMistakeTestResult({ testKey: "sports-bra-wrong-address", passed: true }).ok, true);
const approvedGate = evaluateDecisionGate(gateInput);
assert.equal(approvedGate.ok, true);
if (approvedGate.ok) assert.equal(approvedGate.publishable, false, "material conflict still blocks publishing");
assert.equal(resolveResearchItem({ kind: "conflict", id: conflict.ok ? conflict.conflictId : "", resolution: "Official identity confirmed; stale address rejected." }).ok, true);
assert.equal(resolveResearchItem({ kind: "review", id: review.ok ? review.reviewId : "", resolution: "Exact official source reconciled." }).ok, true);
const clearedGate = evaluateDecisionGate(gateInput);
assert.equal(clearedGate.ok, true);
if (clearedGate.ok) assert.equal(clearedGate.publishable, true);

assert.equal(recordFieldEvidence({
  runId: run.runId,
  eventId: testEventId,
  field: "dateStart",
  observedValue: gateEvent.dateStart,
  sourceUrl: "https://example.com/events/exact-occurrence",
  checkedAt: new Date().toISOString(),
}).ok, true);
const camelCaseGate = evaluateDecisionGate({
  eventId: testEventId,
  fields: ["dateStart"],
  proposedValues: { dateStart: gateEvent.dateStart },
});
assert.equal(camelCaseGate.ok, true);
if (camelCaseGate.ok) {
  assert.equal(camelCaseGate.publishable, true, "camel-case event fields match their evidence receipts");
  assert.deepEqual(camelCaseGate.mismatchedEvidence, []);
}

assert.equal(upsertEventSeries({
  seriesKey: "series:test-fridays",
  canonicalTitle: "Test Fridays",
  recurrenceRule: "FREQ=WEEKLY;BYDAY=FR",
  officialUrl: "https://example.com/test-fridays",
  occurrence: {
    eventId: testEventId,
    date: "2027-01-15",
    status: "confirmed",
    exactArtFingerprint: media.ok ? media.fingerprint : null,
    evidenceUrl: "https://example.com/test-fridays/2027-01-15",
    checkedAt: new Date().toISOString(),
  },
}).ok, true);
assert.equal(recordDecisionOutcome({
  runId: run.runId,
  eventId: testEventId,
  decision: "review",
  outcome: "corrected-by-tucker",
  reason: "The address mismatch became a permanent regression case.",
  regressionCandidate: true,
}).ok, true);

const state = getResearchControlState();
assert.ok(state.runs.some(item => item.id === run.runId));
assert.ok(!state.openConflicts.some(item => item.id === (conflict.ok ? conflict.conflictId : "")));
assert.ok(!state.reviewQueue.some(item => item.id === (review.ok ? review.reviewId : "")));
assert.ok(state.identities.some(item => item.entity_key === "venue:sports-bra-portland"));
assert.ok(state.mistakeTests.some(item => item.test_key === "sports-bra-wrong-address"));
assert.ok(state.eventSeries.some(item => item.series_key === "series:test-fridays"));
assert.ok(state.recentDecisionOutcomes.some(item => item.event_id === testEventId));

console.log("All QSearch control-plane migration, coverage, evidence, conflict, review, media, and mistake-test checks passed.");
