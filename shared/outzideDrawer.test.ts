import assert from "node:assert/strict";
import test from "node:test";
import type { DrawerTopEvent } from "./drawerTop";
import {
  featuredFromFeeds,
  isOfferedCarpool,
  nextOutzideCountdown,
  type OutzideCountdownItem,
} from "./outzideDrawer";

const now = Date.parse("2026-11-20T12:00:00-08:00");

const events: DrawerTopEvent[] = [
  { id: 1, title: "Yes Coach", dateStart: "2026-11-20T21:00:00", venueName: "Sanctuary" },
  { id: 2, title: "Late show", dateStart: "2026-11-20T23:00:00", venueName: "Holocene" },
  { id: 3, title: "Tomorrow brunch", dateStart: "2026-11-21T11:00:00", venueName: "Diner" },
  { id: 4, title: "Already started", dateStart: "2026-11-20T10:00:00", venueName: "Sanctuary" },
];

test("only offered carpools are featured, not ride requests", () => {
  assert.equal(isOfferedCarpool({ id: "beach-carpool:1", kind: "carpool", title: "Offering a ride" }), true);
  assert.equal(isOfferedCarpool({ id: "beach-carpool:2", kind: "carpool", title: "Looking for a ride" }), false);
  assert.equal(isOfferedCarpool({ id: 3, kind: "checkin", title: "Offering a ride" }), false);
});

test("countdown mixes buddy events and offered carpools with next up", () => {
  const featured = featuredFromFeeds(
    [{ id: 80, title: "Rooster Rock hang", dateStart: "2026-11-20T16:00:00", venueName: "Rooster Rock", poster: "/posters/tucker-archive/yes-coach-apr-2026.jpg", place: "rooster-rock" }],
    [
      { id: "beach-carpool:9", kind: "carpool", title: "Offering a ride", tripDate: "2026-11-20", dateStart: "2026-11-20T18:00:00", placeName: "Rooster Rock", href: "/outzide/rooster-rock" },
      { id: "beach-carpool:10", kind: "carpool", title: "Looking for a ride", tripDate: "2026-11-20", placeName: "Sauvie Island" },
    ],
  );
  const next = nextOutzideCountdown(events, featured, now, 3);
  assert.deepEqual(next.map(item => `${item.kind}:${item.title}`), [
    "buddy:Rooster Rock hang",
    "carpool:Offering a ride",
    "event:Yes Coach",
  ]);
  assert.ok(!next.some(item => item.title === "Already started" || item.title === "Looking for a ride"));
});

test("a buddy event that is also in the event list keeps the featured kind", () => {
  const featured: OutzideCountdownItem[] = [
    { id: 1, title: "Yes Coach", dateStart: "2026-11-20T21:00:00", venueName: "Sanctuary", kind: "buddy" },
  ];
  const next = nextOutzideCountdown(events, featured, now, 3);
  assert.equal(next[0].kind, "buddy");
  assert.equal(next[0].title, "Yes Coach");
  assert.equal(next.length, 3);
});
