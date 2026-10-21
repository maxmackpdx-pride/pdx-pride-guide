import test from "node:test";
import assert from "node:assert/strict";
import { timeAgo, timeAgoCoarse } from "./timeAgo";

const now = Date.parse("2026-07-16T20:00:00Z");
const at = (ms: number) => new Date(now - ms).toISOString();
const M = 60_000, H = 60 * M, D = 24 * H;

test("feed style keeps the old boardFeed strings", () => {
  const cases: [number, string][] = [[10_000, "just now"], [5 * M, "5m ago"], [59 * M, "59m ago"], [3 * H, "3h ago"], [47 * H, "47h ago"], [49 * H, "2d ago"], [-30_000, "soon"], [-10 * M, "in 10m"], [-5 * H, "in 5h"], [-72 * H, "in 3d"]];
  for (const [ms, expected] of cases) assert.equal(timeAgo(at(ms), now), expected);
  assert.equal(timeAgo("not a date", now), "");
});

test("profile style keeps the old profile helper strings", () => {
  const cases: [number, string][] = [[2 * H, "today"], [-5 * H, "today"], [3 * D, "3d ago"], [6 * D, "6d ago"], [8 * D, "1w ago"], [29 * D, "4w ago"]];
  for (const [ms, expected] of cases) assert.equal(timeAgoCoarse(at(ms), now), expected);
  assert.equal(timeAgoCoarse(null, now), "");
  assert.equal(timeAgoCoarse(at(40 * D), now), new Date(now - 40 * D).toLocaleDateString([], { month: "short", day: "numeric" }));
});

test("SQLite publication timestamps remain UTC across viewer timezones", () => {
  const previousTimezone = process.env.TZ;
  try {
    for (const timezone of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
      process.env.TZ = timezone;
      assert.equal(timeAgo("2026-07-16 19:00:00", now), "1h ago", timezone);
      assert.equal(timeAgo("2026-07-16 19:00:00.000", now), "1h ago", timezone);
      assert.equal(timeAgoCoarse("2026-07-13 20:00:00", now), "3d ago", timezone);
      assert.equal(timeAgo("2026-07-16T12:00:00-07:00", now), "1h ago", timezone);
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});
