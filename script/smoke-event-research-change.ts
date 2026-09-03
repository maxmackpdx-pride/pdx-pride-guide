import assert from "node:assert/strict";
import { storage } from "../server/storage";
import {
  applyEventResearchEventChange,
  createEventFromResearch,
  listEventResearchChanges,
  rollbackEventResearchChange,
} from "../server/eventResearchMemory";

if (process.env.ALLOW_QSEARCH_TEST_DB !== "1" || !process.env.DATABASE_PATH) {
  throw new Error("Run only with ALLOW_QSEARCH_TEST_DB=1 and a disposable DATABASE_PATH.");
}

const checkedAt = new Date().toISOString();
const sourceUrl = "https://example.com/official-qsearch-test-event";
const base = storage.createEvent({
  title: "QSearch Auth Test Event",
  description: "A disposable event used to test evidence-backed updates and rollback.",
  venueName: "QSearch Test Venue",
  address: "1 Test Ave, Portland, OR 97201",
  neighborhood: "Test",
  lat: 45.5,
  lng: -122.6,
  dateStart: "2027-01-14T19:00:00",
  dateEnd: "2027-01-14T21:00:00",
  dayOfWeek: "THURSDAY",
  ageRequirement: "21_PLUS",
  eventTypes: "[]",
  admission: "DOOR_FEE",
  ticketUrl: sourceUrl,
  isPublic: true,
  isPrivate: false,
  isHouseParty: false,
  isSexPositive: false,
  nudityOk: false,
  posterImageUrl: null,
  status: "HIDDEN",
  source: "qsearch-auth-smoke",
  isClaimable: false,
  claimedBy: null,
  submittedBy: null,
  adminNotes: null,
  lockedFields: "[]",
});

const preview = applyEventResearchEventChange(base.id, {
  expectedUpdatedAt: base.updatedAt,
  patch: { venueName: "QSearch Preview Venue" },
  evidenceReceipts: [
    { field: "venueName", sourceUrl, checkedAt, note: "Dry-run exact identity." },
  ],
  reason: "Preview the exact venue correction without writing it.",
  mistakeTestsPassed: true,
  dryRun: true,
});
assert.equal(preview.ok, true);
if (!preview.ok) throw new Error(preview.error);
assert.equal(preview.dryRun, true);
assert.equal(storage.getEvent(base.id)?.venueName, "QSearch Test Venue", "dry-run leaves storage unchanged");

const firstChangeInput = {
  expectedUpdatedAt: base.updatedAt,
  patch: { venueName: "QSearch Corrected Venue" },
  evidenceReceipts: [
    { field: "venueName", sourceUrl, checkedAt, note: "Exact official identity." },
  ],
  reason: "Correct the exact venue identity from its official event page.",
  mistakeTestsPassed: true,
  idempotencyKey: "smoke-change-venue-1",
};
const changed = applyEventResearchEventChange(base.id, firstChangeInput);
assert.equal(changed.ok, true);
if (!changed.ok) throw new Error(changed.error);
assert.equal(changed.event.venueName, "QSearch Corrected Venue");
assert.deepEqual(changed.event.lockedFields, ["venueName"]);
assert.equal(changed.rollback.available, true);
assert.deepEqual(changed.beforeValues, { venueName: "QSearch Test Venue" });
assert.deepEqual(changed.afterValues, { venueName: "QSearch Corrected Venue" });
const replayed = applyEventResearchEventChange(base.id, firstChangeInput);
assert.equal(replayed.ok, true);
if (!replayed.ok) throw new Error(replayed.error);
assert.equal(replayed.idempotentReplay, true);
assert.equal(replayed.rollback.token, changed.rollback.token);
const reusedForDifferentMutation = applyEventResearchEventChange(base.id, {
  ...firstChangeInput,
  expectedUpdatedAt: changed.event.updatedAt,
  patch: { venueName: "Different Mutation" },
});
assert.equal(reusedForDifferentMutation.ok, false);
if (!reusedForDifferentMutation.ok) assert.equal(reusedForDifferentMutation.status, 409);

const changedAgain = applyEventResearchEventChange(base.id, {
  expectedUpdatedAt: changed.event.updatedAt,
  patch: { venueName: "QSearch Verified Venue" },
  evidenceReceipts: [
    { field: "venueName", sourceUrl, checkedAt, note: "Newer exact official identity." },
  ],
  reason: "Revise QSearch's own prior correction from newer official evidence.",
  mistakeTestsPassed: true,
});
assert.equal(changedAgain.ok, true, "QSearch can revise a lock created by its own prior change");
if (!changedAgain.ok) throw new Error(changedAgain.error);
assert.equal(changedAgain.event.venueName, "QSearch Verified Venue");

const stale = applyEventResearchEventChange(base.id, {
  expectedUpdatedAt: base.updatedAt,
  patch: { venueName: "Stale Change" },
  evidenceReceipts: [{ field: "venueName", sourceUrl, checkedAt }],
  reason: "This stale update must be rejected before changing any data.",
  mistakeTestsPassed: true,
});
assert.equal(stale.ok, false);
if (!stale.ok) assert.equal(stale.status, 409);

const rollbackAgain = rollbackEventResearchChange(changedAgain.rollback.token);
assert.equal(rollbackAgain.ok, true);
if (!rollbackAgain.ok) throw new Error(rollbackAgain.error);
assert.equal(rollbackAgain.event.venueName, "QSearch Corrected Venue");

const humanLocked = storage.createEvent({
  ...base,
  id: undefined,
  title: "QSearch Human Lock Test Event",
  lockedFields: "[\"venueName\"]",
  source: "admin_seeded",
} as any);
const rejectedHumanLock = applyEventResearchEventChange(humanLocked.id, {
  expectedUpdatedAt: humanLocked.updatedAt,
  patch: { venueName: "Agent Must Not Overwrite" },
  evidenceReceipts: [{ field: "venueName", sourceUrl, checkedAt }],
  reason: "This must be rejected because a human owns the locked venue field.",
  mistakeTestsPassed: true,
});
assert.equal(rejectedHumanLock.ok, false);
if (!rejectedHumanLock.ok) assert.equal(rejectedHumanLock.status, 409);

const createEvent = {
  title: "QSearch Created Test Event",
  description: "A disposable event used to test evidence-backed creation and rollback.",
  venueName: "QSearch Test Venue",
  address: "1 Test Ave, Portland, OR 97201",
  dateStart: "2027-01-15T19:00:00",
  dateEnd: "2027-01-15T21:00:00",
  ageRequirement: "21_PLUS",
  admission: "FREE",
  status: "LIVE",
};
const created = createEventFromResearch({
  event: createEvent,
  evidenceReceipts: Object.keys(createEvent).map(field => ({ field, sourceUrl, checkedAt })),
  reason: "Create a verified test event with complete official field receipts.",
  mistakeTestsPassed: true,
});
assert.equal(created.ok, true);
if (!created.ok) throw new Error(created.error);
assert.equal(created.event.status, "LIVE");
assert.equal(created.event.source, "qsearch-2");

const { address: _omittedAddress, ...withoutAddress } = createEvent;
const missingAddress = { ...withoutAddress, title: "QSearch Missing Address" };
const rejectedPublish = createEventFromResearch({
  event: missingAddress,
  evidenceReceipts: Object.keys(missingAddress).map(field => ({ field, sourceUrl, checkedAt })),
  reason: "A LIVE event without an exact address must not publish automatically.",
  mistakeTestsPassed: true,
});
assert.equal(rejectedPublish.ok, false);
if (!rejectedPublish.ok) assert.equal(rejectedPublish.status, 400);

const createRollback = rollbackEventResearchChange(created.rollback.token);
assert.equal(createRollback.ok, true);
if (!createRollback.ok) throw new Error(createRollback.error);
assert.equal(createRollback.event.status, "HIDDEN");

const changes = listEventResearchChanges(10);
assert.ok(changes.some(change => change.eventId === base.id && change.rolledBackAt));
assert.ok(changes.some(change => change.eventId === created.event.id && change.rolledBackAt));
assert.ok(changes.every(change => typeof change.rollbackToken === "string"));
assert.ok(changes.every(change => change.afterValues && typeof change.afterValues === "object"));

console.log("All QSearch event-change and rollback checks passed.");
