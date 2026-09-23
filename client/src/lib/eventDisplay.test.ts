import assert from "node:assert/strict";
import test from "node:test";
import { eventDateLabel, eventTimeLabel } from "./eventDisplay";
import { parsePacificEventTime } from "./countdown";

test("event displays agree for Pacific wall times and explicit UTC, in summer and winter", () => {
  for (const [wall, utc] of [["2026-07-15T19:30:00", "2026-07-16T02:30:00Z"], ["2026-12-15T19:30:00", "2026-12-16T03:30:00Z"]]) {
    assert.equal(parsePacificEventTime(wall), Date.parse(utc));
    assert.equal(eventTimeLabel(wall), "7:30 PM");
    assert.equal(eventTimeLabel(wall), eventTimeLabel(utc));
    assert.equal(eventDateLabel(wall), eventDateLabel(utc));
  }
});
test("invalid and nonexistent spring-forward times never render as today's event", () => {
  for (const value of ["", "not-a-date", "2026-03-08T02:30:00"]) {
    assert.equal(parsePacificEventTime(value), null);
    assert.equal(eventTimeLabel(value), "Time to be announced");
    assert.equal(eventDateLabel(value), "Date to be announced");
  }
});
