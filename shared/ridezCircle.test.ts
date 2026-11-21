import assert from "node:assert/strict";
import test from "node:test";
import { inRidezCircle } from "./ridezCircle";

test("Ridez circle keeps you and friends; FOF also keeps friends of friends", () => {
  assert.equal(inRidezCircle("everybody", "everybody"), true);
  assert.equal(inRidezCircle("fof", "everybody"), true);
  assert.equal(inRidezCircle("you", "friends"), true);
  assert.equal(inRidezCircle("friend", "friends"), true);
  assert.equal(inRidezCircle("fof", "friends"), false);
  assert.equal(inRidezCircle("everybody", "friends"), false);
  assert.equal(inRidezCircle("fof", "fof"), true);
  assert.equal(inRidezCircle("everybody", "fof"), false);
});
