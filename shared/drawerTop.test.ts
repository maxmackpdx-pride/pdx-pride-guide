import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDrawerCalendarDays,
  formatDrawerCountdown,
  nextDrawerEvents,
  remainingToStart,
  type DrawerTopEvent,
} from "./drawerTop";

const now = Date.parse("2026-11-20T12:00:00-08:00");

const events: DrawerTopEvent[] = [
  { id: 1, title: "Yes Coach", dateStart: "2026-11-20T21:00:00", venueName: "Sanctuary", posterImageUrl: "/posters/tucker-archive/yes-coach-apr-2026.jpg" },
  { id: 2, title: "Late show", dateStart: "2026-11-20T23:00:00", venueName: "Holocene" },
  { id: 3, title: "Tomorrow brunch", dateStart: "2026-11-21T11:00:00", venueName: "Diner" },
  { id: 4, title: "Next week", dateStart: "2026-11-25T20:00:00", venueName: "Wonder" },
  { id: 5, title: "Already started", dateStart: "2026-11-20T10:00:00", venueName: "Sanctuary" },
];

test("calendar days are seven Pacific dates with event counts and no title data", () => {
  const days = buildDrawerCalendarDays(events, now);
  assert.equal(days.length, 7);
  assert.equal(days[0].key, "2026-11-20");
  assert.equal(days[0].count, 3);
  assert.equal(days[1].key, "2026-11-21");
  assert.equal(days[1].count, 1);
  assert.equal(days[5].key, "2026-11-25");
  assert.equal(days[5].count, 1);
  assert.ok(days[0].weekday);
  assert.ok(days[0].day);
});

test("countdown remaining matches the Placez hologram units", () => {
  const remaining = remainingToStart("2026-11-21T12:00:00", now);
  assert.ok(remaining);
  assert.equal(remaining.days, 1);
  assert.equal(remaining.hours, 0);
  assert.equal(formatDrawerCountdown(remaining), "1d 00h 00m");
  assert.equal(remainingToStart("2026-11-20T10:00:00", now), null);
});

test("countdown card source is the next three upcoming event names", () => {
  const next = nextDrawerEvents(events, now, 3);
  assert.deepEqual(next.map(event => event.title), ["Yes Coach", "Late show", "Tomorrow brunch"]);
  const onFriday = nextDrawerEvents(events, now, 3, "2026-11-20");
  assert.deepEqual(onFriday.map(event => event.title), ["Yes Coach", "Late show"]);
  assert.ok(!next.some(event => event.title === "Already started"));
});
