import { test } from "node:test";
import assert from "node:assert/strict";
import { mapListingKey, matchesMapEvent } from "./mapLayerFilters";

const now = Date.parse("2026-09-20T18:00:00-07:00");
const event = (dateStart: string, dateEnd: string, tags = "[]") => ({ dateStart, dateEnd, eventTypes: tags });
test("Tonight is Portland's current day, not the upcoming three weeks", () => {
  assert.equal(matchesMapEvent(event("2026-09-20T20:00:00", "2026-09-21T02:00:00"), "tonight", null, "", "", now), true);
  assert.equal(matchesMapEvent(event("2026-09-21T20:00:00", "2026-09-22T02:00:00"), "tonight", null, "", "", now), false);
  assert.equal(matchesMapEvent(event("2026-09-20T12:00:00", "2026-09-20T16:00:00"), "tonight", null, "", "", now), false);
});
test("Soon includes live events and the next 90 minutes", () => {
  for (const start of ["2026-09-20T17:00:00", "2026-09-20T19:30:00"]) assert.equal(matchesMapEvent(event(start, "2026-09-20T22:00:00"), "soon", null, "", "", now), true);
  assert.equal(matchesMapEvent(event("2026-09-20T19:31:00", "2026-09-20T22:00:00"), "soon", null, "", "", now), false);
});
test("Category tags combine with the chosen time filter and fail safely", () => {
  assert.equal(matchesMapEvent(event("2026-09-20T20:00:00", "2026-09-21T02:00:00", '["DANCE"]'), "tonight", "DANCE", "", "", now), true);
  assert.equal(matchesMapEvent(event("2026-09-20T20:00:00", "2026-09-21T02:00:00", '["DANCE"]'), "tonight", "DRAG", "", "", now), false);
  assert.equal(matchesMapEvent(event("2026-09-20T20:00:00", "2026-09-21T02:00:00", "invalid"), "tonight", "DANCE", "", "", now), false);
});
test("Custom range includes overnight events, accepts reversed ranges", () => {
  const overnight = event("2026-09-20T23:00:00", "2026-09-21T02:00:00");
  assert.equal(matchesMapEvent(overnight, "custom", null, "2026-09-21", "2026-09-21", now), true);
  assert.equal(matchesMapEvent(overnight, "custom", null, "2026-09-22", "2026-09-20", now), true);
  assert.equal(matchesMapEvent(overnight, "custom", null, "", "", now), false);
});
test("Invalid dates and already-ended events do not appear as upcoming", () => {
  assert.equal(matchesMapEvent(event("invalid", "invalid"), "default", null, "", "", now), false);
  assert.equal(matchesMapEvent(event("2026-09-19T20:00:00", "2026-09-19T22:00:00"), "default", null, "", "", now), false);
});
test("Tonight follows Portland even when UTC has rolled into tomorrow", () => {
  const latePortland = Date.parse("2026-09-21T04:00:00Z");
  assert.equal(matchesMapEvent(event("2026-09-20T22:00:00", "2026-09-21T02:00:00"), "tonight", null, "", "", latePortland), true);
  assert.equal(matchesMapEvent(event("2026-09-21T22:00:00", "2026-09-22T02:00:00"), "tonight", null, "", "", latePortland), false);
});
test("Upcoming applies the 21-day horizon and excludes invalid DST wall times", () => {
  assert.equal(matchesMapEvent(event("2026-10-12T20:00:00", "2026-10-12T22:00:00"), "default", null, "", "", now), false);
  assert.equal(matchesMapEvent(event("2026-03-08T02:30:00", "2026-03-08T04:00:00"), "default", null, "", "", Date.parse("2026-03-08T00:00:00-08:00")), false);
});
test("Housing and board listings with equal numeric ids have different selection keys", () => {
  const keys = ["The Haüz", "Gigz", "Giftz", "Sellz"].map(board => mapListingKey(board, 9));
  assert.equal(new Set(keys).size, 4);
});
