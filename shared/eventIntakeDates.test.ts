import assert from "node:assert/strict";
import test from "node:test";
import { eventDatesError, moveEventStart } from "./eventIntakeDates";
import { prideDayFromDate } from "./eventWeek";
import { expandMultiDayEvents, isMultiDayFestival } from "./multiDayEvents";
import type { Event } from "./schema";

test("rescheduling a night preserves its overnight end without historical date resets", () => {
  const moved = moveEventStart({ dateStart: "2026-09-12T21:00", dateEnd: "2026-09-13T02:00" }, "2026-09-20T21:00");
  assert.deepEqual(moved, { dateStart: "2026-09-20T21:00", dateEnd: "2026-09-21T02:00" });
  assert.equal(prideDayFromDate(moved.dateStart), "SUN");
  assert.equal(isMultiDayFestival(moved.dateStart, moved.dateEnd), false);
  assert.equal(eventDatesError(moved), null);
});

test("rescheduling preserves wall-clock dates across the winter time change", () => {
  assert.deepEqual(
    moveEventStart({ dateStart: "2026-10-31T21:00", dateEnd: "2026-11-01T02:00" }, "2026-11-07T21:00"),
    { dateStart: "2026-11-07T21:00", dateEnd: "2026-11-08T02:00" },
  );
  assert.equal(prideDayFromDate("2026-12-20T00:00"), "SUN");
  assert.equal(prideDayFromDate("2026-12-20T07:00:00Z"), "SAT");
  assert.equal(prideDayFromDate("2026-02-30T10:00"), "");
});

test("a first start selection does not invent an end time; invalid ranges cannot submit", () => {
  assert.deepEqual(moveEventStart({ dateStart: "", dateEnd: "" }, "2026-09-20T20:00"), {
    dateStart: "2026-09-20T20:00", dateEnd: "",
  });
  assert.ok(eventDatesError({ dateStart: "", dateEnd: "" }));
  assert.ok(eventDatesError({ dateStart: "2026-09-20T20:00", dateEnd: "2026-09-20T20:00" }));
  assert.ok(eventDatesError({ dateStart: "2026-09-20T20:00", dateEnd: "2026-07-18T02:00" }));
  assert.equal(eventDatesError({ dateStart: "2026-09-20T20:00", dateEnd: "2026-09-20T23:00" }), null);
});

test("a stale stored weekday cannot override the published event's actual calendar date", () => {
  const event = {
    id: 1, title: "Autumn Dance", venueName: "Test venue", dayOfWeek: "FRI",
    dateStart: "2026-09-20T20:00", dateEnd: "2026-09-20T23:00",
  } as Event;
  const listings = expandMultiDayEvents([event]);
  assert.equal(listings.length, 1);
  assert.equal(listings[0].dayOfWeek, "SUN");
  assert.equal(listings[0].dateStart, event.dateStart);
});
