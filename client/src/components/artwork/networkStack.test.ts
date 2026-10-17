import test from "node:test";
import assert from "node:assert/strict";
import { NETWORK_ORIENTATIONS, networkStack } from "./networkStack";

test("consecutive cards use different sets and orientations across cycle boundaries", () => {
  const cards = Array.from({ length: 128 }, (_, index) => networkStack(index));
  for (let index = 1; index < cards.length; index++) {
    assert.notEqual(cards[index].set, cards[index - 1].set, `set at card ${index}`);
    assert.notEqual(cards[index].orientation, cards[index - 1].orientation, `orientation at card ${index}`);
  }
});

test("each uploaded stack gets every supported orientation in eight consecutive cards", () => {
  for (let first = 0; first < 64; first += 8) {
    const cards = Array.from({ length: 8 }, (_, index) => networkStack(first + index));
    for (const set of ["a", "b"]) {
      assert.deepEqual(
        new Set(cards.filter(card => card.set === set).map(card => card.orientation)),
        new Set(NETWORK_ORIENTATIONS),
      );
    }
  }
});
