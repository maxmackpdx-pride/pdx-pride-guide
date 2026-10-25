import test from "node:test";
import assert from "node:assert/strict";
import { outzWallToBoardPost, outzBoardIntent } from "./outzBoardPost";
import { intentLabels } from "./allBoards";
import { pinboardPlacement } from "./pinboardPlacement";

test("buddy and carpool kinds map to board intents", () => {
  assert.equal(outzBoardIntent("HIKE_BUDDY"), "buddy");
  assert.equal(outzBoardIntent("CARPOOL_OFFER"), "ride");
  assert.equal(outzBoardIntent("MISSED_CONNECTION"), "missed");
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

test("missed connection posts map to the missed intent, kind label and place card", () => {
  const post = outzWallToBoardPost({ id: 9, postKind: "MISSED_CONNECTION", placeName: "Silver Falls", body: "Green shell, South Falls." })!;
  assert.equal(post.category, "outz");
  assert.equal(post.intent, "missed");
  assert.equal(post.title, "Missed connection");
  assert.equal(intentLabels.missed, "Missed connections");
  assert.equal(post.detail, "Silver Falls");
});
