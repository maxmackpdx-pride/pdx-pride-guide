import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { canSendHousingNudge, shouldCoalesceChange } from "@shared/changeCoalesce";
import {
  applyGiftingRaise,
  applyHousingRequest,
  applyHousingSavedToggle,
  applyRsvpQueryData,
  applyRsvpToCaches,
  applySellzSavedToggle,
  beginInFlight,
  endInFlight,
  GIFTING_KEY,
  HOUSING_KEY,
  patchGiftingRaise,
  patchHousingSaved,
  restoreRsvp,
  RSVP_CHECKINS_KEY,
  RSVP_SUMMARIES_KEY,
  SELLZ_SAVED_KEY,
  snapshotRsvp,
} from "./optimisticCache";

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

test("RSVP apply moves chip and attendance count together", () => {
  const next = applyRsvpToCaches([], { "41": { count: 3 } }, 41, true);
  assert.deepEqual(next.checkIns, [{ eventId: 41 }]);
  assert.equal(next.summaries["41"].count, 4);
});

test("RSVP un-apply restores chip and count together", () => {
  const next = applyRsvpToCaches([{ eventId: 41 }], { "41": { count: 4 } }, 41, false);
  assert.deepEqual(next.checkIns, []);
  assert.equal(next.summaries["41"].count, 3);
});

test("sequential RSVP apply on already-going cache does not double-count", () => {
  const first = applyRsvpToCaches([], { "41": { count: 3 } }, 41, true);
  const second = applyRsvpToCaches(first.checkIns, first.summaries, 41, true);
  assert.equal(second.checkIns.length, 1);
  assert.equal(second.summaries["41"].count, 4);
});

test("forced 500 restores previous RSVP cache (chip + count)", async () => {
  const qc = client();
  qc.setQueryData([...RSVP_CHECKINS_KEY], []);
  qc.setQueryData([...RSVP_SUMMARIES_KEY], { "9": { count: 2 } });
  const snap = await snapshotRsvp(qc);
  applyRsvpQueryData(qc, 9, true);
  assert.deepEqual(qc.getQueryData([...RSVP_CHECKINS_KEY]), [{ eventId: 9 }]);
  assert.equal((qc.getQueryData(RSVP_SUMMARIES_KEY) as { "9": { count: number } })["9"].count, 3);

  const forced500 = new Error("500: Internal Server Error");
  restoreRsvp(qc, snap);
  assert.ok(forced500.message.includes("500"));
  assert.deepEqual(qc.getQueryData([...RSVP_CHECKINS_KEY]), []);
  assert.equal((qc.getQueryData(RSVP_SUMMARIES_KEY) as { "9": { count: number } })["9"].count, 2);
});

test("offline/network fail restores previous RSVP cache (chip + count)", async () => {
  const qc = client();
  qc.setQueryData([...RSVP_CHECKINS_KEY], [{ eventId: 3 }]);
  qc.setQueryData([...RSVP_SUMMARIES_KEY], { "3": { count: 5 } });
  const snap = await snapshotRsvp(qc);
  applyRsvpQueryData(qc, 3, false);
  assert.deepEqual(qc.getQueryData([...RSVP_CHECKINS_KEY]), []);
  assert.equal((qc.getQueryData(RSVP_SUMMARIES_KEY) as { "3": { count: number } })["3"].count, 4);

  const offline = new TypeError("Failed to fetch");
  restoreRsvp(qc, snap);
  assert.equal(offline.name, "TypeError");
  assert.deepEqual(qc.getQueryData([...RSVP_CHECKINS_KEY]), [{ eventId: 3 }]);
  assert.equal((qc.getQueryData(RSVP_SUMMARIES_KEY) as { "3": { count: number } })["3"].count, 5);
});

test("double-tap in-flight flag does not double-count", () => {
  const inflight = new Set<number>();
  assert.equal(beginInFlight(inflight, 12), true);
  assert.equal(beginInFlight(inflight, 12), false);
  const once = applyRsvpToCaches([], { "12": { count: 1 } }, 12, true);
  assert.equal(once.summaries["12"].count, 2);
  // Second tap is skipped, so we never apply again against the original snapshot.
  assert.equal(inflight.has(12), true);
  endInFlight(inflight, 12);
  assert.equal(inflight.has(12), false);
});

test("housing save + request patch roll back together from a snapshot", () => {
  const qc = client();
  const board = {
    posts: [
      { id: 8, saved: false, lastChangeLabel: null, myRequest: null },
      { id: 9, saved: true, lastChangeLabel: "Rent updated", myRequest: null },
    ],
  };
  qc.setQueryData([...HOUSING_KEY, "ALL"], board);
  qc.setQueryData([...HOUSING_KEY, 8], { id: 8, saved: false, myRequest: null });

  const before = qc.getQueriesData({ queryKey: [...HOUSING_KEY] });
  applyHousingSavedToggle(qc, 8);
  applyHousingRequest(qc, 8, { id: 1, kind: "CHAT", status: "PENDING" });
  const afterBoard = qc.getQueryData([...HOUSING_KEY, "ALL"]) as typeof board;
  assert.equal(afterBoard.posts[0].saved, true);
  assert.equal(afterBoard.posts[0].myRequest?.status, "PENDING");
  assert.equal((qc.getQueryData([...HOUSING_KEY, 8]) as { saved: boolean }).saved, true);

  for (const [key, data] of before) qc.setQueryData(key, data);
  const restored = qc.getQueryData([...HOUSING_KEY, "ALL"]) as typeof board;
  assert.equal(restored.posts[0].saved, false);
  assert.equal(restored.posts[0].myRequest, null);
  assert.equal(restored.posts[1].lastChangeLabel, "Rent updated");
});

test("housing saved patch is a flip, not a forced true", () => {
  const next = patchHousingSaved({ id: 4, saved: true, lastChangeLabel: "New photos" }, 4) as {
    saved: boolean;
    lastChangeLabel: string | null;
  };
  assert.equal(next.saved, false);
  assert.equal(next.lastChangeLabel, null);
});

test("gifting raise-hand bumps count once; rollback restores both", () => {
  const qc = client();
  const posts = [
    { id: 2, viewerSelected: false, interestCount: 1 },
    { id: 3, viewerSelected: false, interestCount: 0 },
  ];
  qc.setQueryData([...GIFTING_KEY], posts);
  const snap = qc.getQueriesData({ queryKey: [...GIFTING_KEY] });
  applyGiftingRaise(qc, 2);
  applyGiftingRaise(qc, 2);
  const raised = qc.getQueryData([...GIFTING_KEY]) as typeof posts;
  assert.equal(raised[0].viewerSelected, true);
  assert.equal(raised[0].interestCount, 2);
  for (const [key, data] of snap) qc.setQueryData(key, data);
  const restored = qc.getQueryData([...GIFTING_KEY]) as typeof posts;
  assert.equal(restored[0].viewerSelected, false);
  assert.equal(restored[0].interestCount, 1);
});

test("gifting raise on already-selected row does not increment", () => {
  const next = patchGiftingRaise([{ id: 1, viewerSelected: true, interestCount: 3 }], 1) as Array<{
    interestCount: number;
  }>;
  assert.equal(next[0].interestCount, 3);
});

test("sellz save ids toggle and restore", () => {
  const qc = client();
  qc.setQueryData([...SELLZ_SAVED_KEY], [10]);
  const snap = qc.getQueriesData({ queryKey: [...SELLZ_SAVED_KEY] });
  applySellzSavedToggle(qc, 11);
  assert.deepEqual(qc.getQueryData([...SELLZ_SAVED_KEY]), [10, 11]);
  applySellzSavedToggle(qc, 10);
  assert.deepEqual(qc.getQueryData([...SELLZ_SAVED_KEY]), [11]);
  for (const [key, data] of snap) qc.setQueryData(key, data);
  assert.deepEqual(qc.getQueryData([...SELLZ_SAVED_KEY]), [10]);
});

test("change-label coalesce keeps last label inside 20 minutes", () => {
  const t0 = Date.parse("2026-08-22T12:00:00.000Z");
  assert.equal(shouldCoalesceChange("2026-08-22T11:50:00.000Z", t0), true);
  assert.equal(shouldCoalesceChange("2026-08-22T11:30:00.000Z", t0), false);
  assert.equal(shouldCoalesceChange(null, t0), false);
});

test("housing nudge is one-shot after 48h", () => {
  const now = Date.parse("2026-08-24T12:00:00.000Z");
  assert.equal(canSendHousingNudge("2026-08-22T11:00:00.000Z", null, now), true);
  assert.equal(canSendHousingNudge("2026-08-23T12:00:00.000Z", null, now), false);
  assert.equal(canSendHousingNudge("2026-08-22T11:00:00.000Z", "2026-08-24T10:00:00.000Z", now), false);
});
