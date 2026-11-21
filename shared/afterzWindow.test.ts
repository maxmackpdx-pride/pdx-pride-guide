import assert from "node:assert/strict";
import test from "node:test";
import {
  afterzClosesAt,
  afterzOpensAt,
  afterzVibeLabel,
  afterzWindowState,
  isAfterzWindowOpen,
} from "./afterzWindow";

test("Afterz closes at 6 AM Pacific on each side of the clock change", () => {
  for (const [at, closes] of [
    ["2026-03-08T09:00:00Z", "2026-03-08T13:00:00Z"],
    ["2026-11-01T08:00:00Z", "2026-11-01T14:00:00Z"],
    ["2026-11-02T14:00:00Z", "2026-11-03T14:00:00Z"],
  ]) {
    assert.equal(afterzClosesAt(Date.parse(at)), Date.parse(closes));
  }
});

test("the Afterz map window is 9 PM to 6 AM Pacific", () => {
  const afternoon = Date.parse("2026-11-20T15:00:00-08:00");
  const evening = Date.parse("2026-11-20T21:00:00-08:00");
  const late = Date.parse("2026-11-21T02:00:00-08:00");
  const morning = Date.parse("2026-11-21T06:00:00-08:00");
  assert.equal(isAfterzWindowOpen(afternoon), false);
  assert.equal(afterzOpensAt(afternoon), Date.parse("2026-11-20T21:00:00-08:00"));
  assert.equal(afterzClosesAt(afternoon), Date.parse("2026-11-21T06:00:00-08:00"));
  assert.equal(isAfterzWindowOpen(evening), true);
  assert.equal(isAfterzWindowOpen(late), true);
  assert.equal(isAfterzWindowOpen(morning), false);
  const state = afterzWindowState(afternoon);
  assert.equal(state.open, false);
  assert.equal(state.startLocal, "21:00");
  assert.equal(state.endLocal, "06:00");
  assert.equal(state.timeZone, "America/Los_Angeles");
});

test("vibe labels match the host form", () => {
  assert.equal(afterzVibeLabel("social"), "Hang out");
  assert.equal(afterzVibeLabel("chill"), "Chill / relax");
  assert.equal(afterzVibeLabel("party"), "The party continues");
});
