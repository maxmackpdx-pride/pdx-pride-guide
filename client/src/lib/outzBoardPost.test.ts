import test from "node:test";
import assert from "node:assert/strict";
import { outzWallToBoardPost, outzBoardIntent } from "./outzBoardPost";
import { pinboardPlacement } from "./pinboardPlacement";

test("buddy and carpool kinds map to board intents", () => {
  assert.equal(outzBoardIntent("HIKE_BUDDY"), "buddy");
  assert.equal(outzBoardIntent("CARPOOL_OFFER"), "ride");
  assert.equal(outzBoardIntent("TRIP_NOTE"), null);
  assert.equal(outzWallToBoardPost({ id: 1, postKind: "TRIP_NOTE" }), null);
});

test("board post keeps the place as the card location", () => {
  const post = outzWallToBoardPost({ id: 7, postKind: "CARPOOL", placeName: "Rooster Rock" })!;
  assert.equal(post.category, "outz");
  assert.equal(post.intent, "ride");
  assert.equal(post.detail, "Rooster Rock");
});

test("pinboard placement is stable and mixes sizes", () => {
  assert.deepEqual(pinboardPlacement("a", false), pinboardPlacement("a", false));
  const sizes = new Set(Array.from({ length: 40 }, (_, i) => pinboardPlacement(`k${i}`, false).small));
  assert.equal(sizes.size, 2);
  assert.equal(pinboardPlacement("x", true).small, true);
});
