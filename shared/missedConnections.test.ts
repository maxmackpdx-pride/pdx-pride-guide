import assert from "node:assert/strict";
import test from "node:test";
import { pacificCalendarDate, parsePacificDateTime, getEventScheduleTiming, missedConnectionClosesAt } from "./missedConnections";
import { expandMultiDayEvents } from "./multiDayEvents";
import { eventDatesError } from "./eventIntakeDates";
import type { Event } from "./schema";

test("Pacific wall times use the actual summer or winter offset, including midnight", () => {
  assert.equal(parsePacificDateTime("2026-07-20T00:00"), Date.parse("2026-07-20T07:00:00Z"));
  assert.equal(parsePacificDateTime("2026-12-20T00:00"), Date.parse("2026-12-20T08:00:00Z"));
  assert.equal(pacificCalendarDate("2026-12-20T00:00"), "2026-12-20");
  assert.equal(parsePacificDateTime("2026-12-20T18:15:30.125"), Date.parse("2026-12-21T02:15:30.125Z"));
  assert.equal(parsePacificDateTime("2026-12-20"), Date.parse("2026-12-20T08:00:00Z"));
});

test("explicit offsets and UTC timestamps retain their stated instant", () => {
  for (const value of ["2026-12-20T18:00:00Z", "2026-12-20T18:00:00-07:00", "2026-12-20T18:00:00-0800", "2026-12-20T18:00:00+02:00"]) {
    assert.equal(parsePacificDateTime(value), Date.parse(value));
  }
});

test("spring-forward wall times skip the missing hour without changing real overnight duration", () => {
  const before = parsePacificDateTime("2026-03-08T01:30")!;
  const after = parsePacificDateTime("2026-03-08T03:30")!;
  assert.equal(before, Date.parse("2026-03-08T09:30:00Z"));
  assert.equal(after, Date.parse("2026-03-08T10:30:00Z"));
  assert.equal(after - before, 3600000);
  assert.equal(parsePacificDateTime("2026-03-08T02:30"), null);
  assert.ok(eventDatesError({ dateStart: "2026-03-08T02:30", dateEnd: "2026-03-08T04:00" }));
});

test("fall-back ambiguity picks the earlier occurrence while explicit offsets select either one", () => {
  assert.equal(parsePacificDateTime("2026-11-01T01:30"), Date.parse("2026-11-01T08:30:00Z"));
  assert.equal(parsePacificDateTime("2026-11-01T01:30-08:00"), Date.parse("2026-11-01T09:30:00Z"));
  assert.equal(parsePacificDateTime("2026-11-01T02:30"), Date.parse("2026-11-01T10:30:00Z"));
  assert.equal(parsePacificDateTime("2026-11-01T02:30")! - parsePacificDateTime("2026-11-01T00:30")!, 3 * 3600000);
});

test("a winter date-only tip expands to one listing on the selected day", () => {
  const event = { id: 1, title: "Winter tip", venueName: "Test venue", dayOfWeek: "SUN", dateStart: "2026-12-20T00:00", dateEnd: "2026-12-20T23:59" } as Event;
  const listings = expandMultiDayEvents([event]);
  assert.equal(listings.length, 1);
  assert.equal(listings[0].dayOfWeek, "SUN");
  assert.equal(pacificCalendarDate(listings[0].dateStart), "2026-12-20");
  assert.equal(pacificCalendarDate(listings[0].dateEnd), "2026-12-20");
});

test("Tonight boundaries remain 18:00–06:00 Pacific in winter and across both DST changes", () => {
  const ranges = [
    ["2026-12-20T18:00", "2026-12-21T06:00", "2026-12-21T02:00:00Z", "2026-12-21T14:00:00Z", 12],
    ["2026-07-20T18:00", "2026-07-21T06:00", "2026-07-21T01:00:00Z", "2026-07-21T13:00:00Z", 12],
    ["2026-03-07T18:00", "2026-03-08T06:00", "2026-03-08T02:00:00Z", "2026-03-08T13:00:00Z", 11],
    ["2026-10-31T18:00", "2026-11-01T06:00", "2026-11-01T01:00:00Z", "2026-11-01T14:00:00Z", 13],
  ] as const;
  for (const [start, end, expectedStart, expectedEnd, hours] of ranges) {
    assert.equal(parsePacificDateTime(start), Date.parse(expectedStart));
    assert.equal(parsePacificDateTime(end), Date.parse(expectedEnd));
    assert.equal(parsePacificDateTime(end)! - parsePacificDateTime(start)!, hours * 3600000);
  }
});

test("invalid calendar dates and times cannot silently roll into another date", () => {
  for (const value of ["2026-02-30T10:00", "2026-09-20T24:00", "2026-09-20T10:60", "not a date", "", null, undefined, 123, {}]) {
    assert.equal(parsePacificDateTime(value as string), null);
  }
});

test("event timing and seven-day post windows use the corrected winter instant", () => {
  const start = "2026-12-20T18:00";
  const end = "2026-12-20T20:00";
  assert.equal(getEventScheduleTiming(start, end, Date.parse("2026-12-21T01:30:00Z")), "upcoming");
  assert.equal(getEventScheduleTiming(start, end, Date.parse("2026-12-21T02:30:00Z")), "live");
  assert.equal(getEventScheduleTiming(start, end, Date.parse("2026-12-21T04:00:00Z")), "past");
  assert.equal(missedConnectionClosesAt(start, end), "2026-12-28T04:00:00.000Z");
});
