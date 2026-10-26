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

test("age filters: verified policies map to their chips and unverified is never all-ages", () => {
  const age = (ageRequirement: string) => eventListingToScheduleEvent({
    id: 2, dayOfWeek: "SUN", title: "Age test", dateStart: "2026-09-20T20:00", dateEnd: "2026-09-20T23:00",
    venueName: "Test venue", admission: "FREE", ageRequirement, eventTypes: "[]", description: "Test",
  } as EventListing)?.age;
  assert.equal(age("ALL_AGES"), "all-ages");
  assert.equal(age("18_PLUS"), "18+");
  assert.equal(age("21_PLUS"), "21+");
  assert.equal(age("UNVERIFIED"), "age unverified");
});
