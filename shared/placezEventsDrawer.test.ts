import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cameraToBounds,
  carpoolDirection,
  formatMizzedCountdown,
  hasAttachedPlans,
  isPastAttendedEvent,
  isUpcomingEvent,
  mizzedClosesAtMs,
  mizzedEventHref,
  mizzedWindowOpen,
  parseEventQueryId,
  planExtensionLines,
  pointInBounds,
} from "./placezEventsDrawer";

test("carpoolDirection labels arriving and departing only", () => {
  assert.equal(carpoolDirection("carpool"), "Arriving");
  assert.equal(carpoolDirection("home"), "Departing");
  assert.equal(carpoolDirection("afterz"), null);
  assert.equal(carpoolDirection(undefined), null);
});

test("plan extension lines are stylized text without counts", () => {
  const lines = planExtensionLines({
    gigz: [{ id: 1, title: "Door host" }],
    carpools: [
      { id: 2, direction: "Arriving", area: "Alberta", role: "driver" },
      { id: 3, direction: "Departing", area: "Division", role: "rider" },
    ],
    afterz: [{ id: "g1", title: "After hours", role: "host" }],
  });
  assert.deepEqual(lines, [
    "Gigz · Door host",
    "Arriving · Alberta",
    "Departing · Division",
    "Afterz · After hours",
  ]);
  assert.equal(hasAttachedPlans({ gigz: [], carpools: [], afterz: [] }), false);
  assert.equal(
    hasAttachedPlans({ gigz: [{ id: 1, title: "Door host" }], carpools: [], afterz: [] }),
    true,
  );
});

test("mizzed countdown uses the seven-day swipe-flow close window", () => {
  const start = "2026-11-13T21:00:00";
  const end = "2026-11-14T02:00:00";
  const closes = mizzedClosesAtMs(start, end);
  assert.ok(closes);
  // Seven days after the end, in UTC from the Pacific wall-time helper.
  assert.equal(formatMizzedCountdown(closes!, closes! - 2 * 24 * 60 * 60 * 1000), "2d left");
  assert.equal(formatMizzedCountdown(closes!, closes! + 1000), "Mizzed closed");
  assert.equal(mizzedWindowOpen(start, end, closes! - 1000), true);
  assert.equal(mizzedWindowOpen(start, end, closes!), false);
  assert.equal(isPastAttendedEvent(start, end, Date.parse("2026-11-20T12:00:00Z")), true);
  assert.equal(isUpcomingEvent(start, end, Date.parse("2026-11-10T12:00:00Z")), true);
});

test("mizzed event href and query parsing", () => {
  assert.equal(mizzedEventHref(42), "/mizzed?event=42");
  assert.equal(parseEventQueryId("42"), 42);
  assert.equal(parseEventQueryId("0"), null);
  assert.equal(parseEventQueryId("12e1"), null);
});

test("camera bounds include places on screen and exclude those off screen", () => {
  const bounds = cameraToBounds(
    { center: [-122.6757, 45.5241], zoom: 15.25, pitch: 45 },
    390,
    844,
  );
  assert.ok(bounds);
  assert.equal(pointInBounds(45.5241, -122.6757, bounds!), true);
  assert.equal(pointInBounds(47.6, -122.3, bounds!), false);
  assert.equal(pointInBounds(null, -122.67, bounds!), false);
  assert.equal(cameraToBounds({ center: [-122.67, 45.52], zoom: 14 }, 0, 400), null);
});
