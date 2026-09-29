import test from "node:test";
import assert from "node:assert/strict";
import { toPacificWallClock } from "./dates";

test("local feed times stay Pacific wall clock whatever the server time zone", () => {
  assert.equal(toPacificWallClock("2026-09-12 20:00:00"), "2026-09-12T20:00:00");
  assert.equal(toPacificWallClock("2026-09-12 20:00"), "2026-09-12T20:00:00");
  assert.equal(toPacificWallClock("2026-09-12T20:00"), "2026-09-12T20:00:00");
  assert.equal(toPacificWallClock("20260912T200000"), "2026-09-12T20:00:00");
});

test("times that carry a zone convert to Pacific", () => {
  assert.equal(toPacificWallClock("2026-09-13T03:00:00Z"), "2026-09-12T20:00:00");
  assert.equal(toPacificWallClock("2026-09-12T23:00:00-04:00"), "2026-09-12T20:00:00");
  assert.equal(toPacificWallClock("20260913T030000Z"), "2026-09-12T20:00:00");
});
