import assert from "node:assert/strict";
import test from "node:test";
import { inRidezCircle, RIDEZ_CIRCLES } from "./ridezCircle";

test("Ridez circle labels are plain words, not abbreviations", () => {
  assert.deepEqual(RIDEZ_CIRCLES.map(option => option.label), ["Everybody", "Friends", "Friends of friends"]);
  assert.ok(!RIDEZ_CIRCLES.some(option => option.short === "FOF" || /FOF/.test(option.label)));
});

test("Ridez circle keeps you and friends; friends of friends also keeps their friends", () => {
  assert.equal(inRidezCircle("everybody", "everybody"), true);
  assert.equal(inRidezCircle("fof", "everybody"), true);
  assert.equal(inRidezCircle("you", "friends"), true);
  assert.equal(inRidezCircle("friend", "friends"), true);
  assert.equal(inRidezCircle("fof", "friends"), false);
  assert.equal(inRidezCircle("everybody", "friends"), false);
  assert.equal(inRidezCircle("fof", "fof"), true);
  assert.equal(inRidezCircle("everybody", "fof"), false);
});
