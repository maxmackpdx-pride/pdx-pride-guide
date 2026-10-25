import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyPicks, todaysUpcomingEvents } from "../client/src/lib/homeToday";

const rows = Array.from({ length: 40 }, (_, i) => ({ id: `row-${i}` }));

test("daily picks are stable within a Pacific day and rotate on the next", () => {
  const a = dailyPicks(rows, "2026-10-25", r => r.id).map(r => r.id);
  assert.deepEqual(a, dailyPicks([...rows].reverse(), "2026-10-25", r => r.id).map(r => r.id));
  assert.equal(a.length, 3);
  assert.notDeepEqual(a, dailyPicks(rows, "2026-10-26", r => r.id).map(r => r.id));
});

test("today's events drop off once they end, use the Pacific day, and sort by start", () => {
  // 2026-10-25 14:00 Pacific (PDT, UTC-7)
  const now = Date.parse("2026-10-25T21:00:00Z");
  const events = [
    { id: "late", dateStart: "2026-10-25T20:00:00", dateEnd: "2026-10-26T02:00:00" },
    { id: "ended", dateStart: "2026-10-25T10:00:00", dateEnd: "2026-10-25T12:00:00" },
    { id: "now", dateStart: "2026-10-25T13:00:00", dateEnd: "2026-10-25T16:00:00" },
    { id: "tomorrow", dateStart: "2026-10-26T09:00:00", dateEnd: "2026-10-26T11:00:00" },
    // 00:30 UTC on the 26th is 17:30 Pacific on the 25th: still today in Portland.
    { id: "utc-rollover", dateStart: "2026-10-26T00:30:00Z", dateEnd: "2026-10-26T03:00:00Z" },
  ];
  assert.deepEqual(todaysUpcomingEvents(events, now, "2026-10-25").map(e => e.id), ["now", "utc-rollover", "late"]);
  assert.deepEqual(todaysUpcomingEvents(events, now + 3 * 3600_000, "2026-10-25").map(e => e.id), ["utc-rollover", "late"]);
});
