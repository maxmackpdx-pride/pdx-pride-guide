import assert from "node:assert/strict";
import test from "node:test";
import { beachCheckinToScheduleEvent, eventListingToScheduleEvent } from "./scheduleEvents";
import type { EventListing } from "@shared/multiDayEvents";

test("a September beach plan appears on its actual calendar day", () => {
  const event = beachCheckinToScheduleEvent({ id: 9, beachId: "rooster-rock", calendarDate: "2026-09-20", arrivalHour: 13, departHour: 17 });
  assert.ok(event);
  assert.equal(event.day, "SUN");
  assert.equal(event.calendarDate, "2026-09-20");
  assert.equal(event.kind, "beach");
});

test("the schedule derives the weekday from dates instead of stale intake metadata", () => {
  const event = eventListingToScheduleEvent({
    id: 1, dayOfWeek: "FRI", title: "Autumn Dance", dateStart: "2026-09-20T20:00", dateEnd: "2026-09-20T23:00",
    venueName: "Test venue", admission: "FREE", ageRequirement: "ALL_AGES", eventTypes: "[]", description: "Test",
  } as EventListing);
  assert.ok(event);
  assert.equal(event.day, "SUN");
  assert.equal(event.calendarDate, "2026-09-20");
});
