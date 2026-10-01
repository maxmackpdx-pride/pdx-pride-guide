import test from "node:test";
import assert from "node:assert/strict";
import { eventsTonightWindow, isEventTonight } from "./eventsTonight";

const time = (value: string) => Date.parse(value);
test("Portland night stays on yesterday until exactly 2 a.m.", () => {
  const before = time("2026-10-01T01:59:59-07:00");
  const after = time("2026-10-01T02:00:00-07:00");
  assert.equal(eventsTonightWindow(before).start, time("2026-09-30T18:00:00-07:00"));
  assert.equal(eventsTonightWindow(after).start, time("2026-10-01T18:00:00-07:00"));
  assert.equal(eventsTonightWindow(before).nextReset, after);
});
test("counts evening overlap and late starts, excludes daytime and next night", () => {
  const now = time("2026-10-01T01:00:00-07:00");
  assert.ok(isEventTonight({ dateStart: "2026-09-30T17:00:00", dateEnd: "2026-09-30T19:00:00" }, now));
  assert.ok(isEventTonight({ dateStart: "2026-10-01T01:30:00" }, now));
  assert.ok(!isEventTonight({ dateStart: "2026-09-30T12:00:00" }, now));
  assert.ok(!isEventTonight({ dateStart: "2026-10-01T02:00:00" }, now));
  assert.ok(!isEventTonight({ dateStart: "invalid" }, now));
});
test("DST reset handles spring's missing hour and both fall 1 a.m. hours", () => {
  assert.equal(eventsTonightWindow(time("2026-03-08T01:59:00-08:00")).nextReset, time("2026-03-08T03:00:00-07:00"));
  for (const offset of ["-07:00", "-08:00"]) {
    assert.equal(eventsTonightWindow(time(`2026-11-01T01:30:00${offset}`)).nextReset, time("2026-11-01T02:00:00-08:00"));
  }
});
