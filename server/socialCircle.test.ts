import assert from "node:assert/strict";
import { test } from "node:test";
import { createCircleOf } from "./socialCircle";
import { inRidezCircle } from "@shared/ridezCircle";

test("social circle buckets: you, mutual friend, friend of a friend, everybody", () => {
  const edges = new Set(["1>2", "2>1", "2>3", "3>2", "1>4", "5>6", "6>5"]);
  const storage = {
    isFollowing: (a: number, b: number) => edges.has(`${a}>${b}`),
    getFollowingList: (u: number) => [...edges].filter(e => e.startsWith(`${u}>`)).map(e => ({ id: Number(e.split(">")[1]) })),
  } as never;
  const circleOf = createCircleOf(storage, 1);
  assert.equal(circleOf(1), "you");
  assert.equal(circleOf(2), "friend");
  assert.equal(circleOf(3), "fof");
  assert.equal(circleOf(4), "everybody", "one-way follow is not a friend");
  assert.equal(circleOf(6), "everybody");
  assert.equal(circleOf(null), "everybody");
});

test("ridez circle filter keeps the right rides", () => {
  assert.deepEqual(["you", "friend", "fof", "everybody", null].map(t => inRidezCircle(t as never, "friends")), [true, true, false, false, false]);
  assert.deepEqual(["you", "friend", "fof", "everybody", null].map(t => inRidezCircle(t as never, "fof")), [true, true, true, false, false]);
  assert.ok(["you", "friend", "fof", "everybody", null].every(t => inRidezCircle(t as never, "everybody")));
});
