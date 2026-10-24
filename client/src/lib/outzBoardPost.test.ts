import test from "node:test";
import assert from "node:assert/strict";
import { outzWallToBoardPost, outzBoardCategory } from "./outzBoardPost";
import { pinboardPlacement } from "./pinboardPlacement";

test("buddy and carpool kinds map to orange board categories", () => {
  assert.equal(outzBoardCategory("HIKE_BUDDY"), "tripbuddy");
  assert.equal(outzBoardCategory("CARPOOL_OFFER"), "carpool");
  assert.equal(outzBoardCategory("TRIP_NOTE"), null);
  assert.equal(outzWallToBoardPost({ id: 1, postKind: "TRIP_NOTE" }), null);
});

test("wall post keeps the place as the card location", () => {
  const post = outzWallToBoardPost({ id: 7, postKind: "CARPOOL", title: "Ride", placeName: "Rooster Rock" })!;
  assert.equal(post.detail, "Rooster Rock");
  assert.equal((post as any).logo, "outzide.png");
});

test("pinboard placement is stable and mixes sizes", () => {
  assert.deepEqual(pinboardPlacement("a", false), pinboardPlacement("a", false));
  const sizes = new Set(Array.from({ length: 40 }, (_, i) => pinboardPlacement(`k${i}`, false).small));
  assert.equal(sizes.size, 2);
  assert.equal(pinboardPlacement("x", true).small, true);
});
