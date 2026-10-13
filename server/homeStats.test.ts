import test from "node:test";
import assert from "node:assert/strict";
import { homeCatalogCounts } from "./homeStats";
import type { Event } from "../shared/schema";

const event = (id: number, dateStart: string, dateEnd: string | null = null, extra = {}) => ({
  id, title: `Event ${id}`, venueName: "Test venue", status: "LIVE", dateStart, dateEnd, ...extra,
}) as Event;

test("counts the same seven Pacific dates as Eventz, with unknown ends and deduplication", () => {
  const now = Date.parse("2026-10-13T19:00:00Z"); // noon Tuesday in Portland
  const rows = [
    event(1, "2026-10-13T10:00:00"), // unknown end: still on Eventz
    event(2, "2026-10-13T10:00:00", "2026-10-13T11:00:00"), // finished
    event(3, "2026-10-19T23:30:00"), // seventh calendar day, all of it
    event(4, "2026-10-20T09:00:00"), // eighth day, inside old rolling window
    event(5, "2026-10-14T20:00:00"),
    event(6, "2026-10-14T20:00:00", null, { title: "Event 5" }), // duplicate
    event(7, "2026-10-14T20:00:00", null, { status: "HIDDEN" }),
    event(8, "bad-date"),
  ];
  assert.equal(homeCatalogCounts(rows, [], now).eventCount, 3);
});

test("seven-day window stays on Pacific calendar dates across fall DST", () => {
  const now = Date.parse("2026-10-30T19:00:00Z");
  assert.equal(homeCatalogCounts([
    event(1, "2026-11-05T23:59:00"),
    event(2, "2026-11-06T00:00:00"),
  ], [], now).eventCount, 1);
});

test("Home Placez includes Needz and community listings, and excludes inactive records", () => {
  const places = [
    { name: "Bar", type: "bar", active: true },
    { name: "Local pro", type: "service", active: true },
    { name: "Inactive", type: "shop", active: false },
    { name: "Group", type: "group", active: true },
    { name: "Care", type: "healthcare", active: true },
    { name: "Charity", type: "nonprofit", active: true },
    { name: "Outside In", type: "service", active: true },
  ];
  assert.equal(homeCatalogCounts([], places).placesCount, 6);
});
