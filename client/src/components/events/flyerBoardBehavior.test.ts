import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fanSlots, isPosterActivation } from "./flyerBoardBehavior";

const source = readFileSync(new URL("./FlyerBoard.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./FlyerBoard.css", import.meta.url), "utf8");

test("poster keyboard activation ignores nested share/save controls", () => {
  for (const key of ["Enter", " "]) {
    assert.equal(isPosterActivation(key, true), true);
    assert.equal(isPosterActivation(key, false), false);
  }
  assert.equal(isPosterActivation("Escape", true), false);
  assert.match(source, /isPosterActivation\(ev.key, ev.target === ev.currentTarget\)/);
});

test("every nonempty fan has the selected post at front, including 1–4 posts", () => {
  assert.deepEqual(fanSlots(0, 0), []);
  for (let count = 1; count <= 8; count++) {
    for (let selected = 0; selected < count; selected++) {
      const slots = fanSlots(count, selected);
      assert.equal(slots.length, Math.min(count, 5));
      assert.equal(new Set(slots.map(s => s.index)).size, slots.length);
      assert.equal(slots.find(s => s.offset === 0)?.index, selected);
      assert.ok(slots.every(s => s.index >= 0 && s.index < count));
    }
  }
});

test("paper trim stays behind poster artwork and its controls", () => {
  assert.match(css, /\.fb-art\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/);
});

test("refresh does not reset pagination or override caller ordering", () => {
  assert.match(source, /\[props.paginationKey, pastView\]/);
  assert.doesNotMatch(source, /\[events, pastView\]\);/);
  assert.doesNotMatch(source, /(?:nowItems|laterItems|weekendItems|ahead|mixed)\.sort\(/);
});

test("connections never spill into another event at the same venue", async () => {
  const { connectionsByEvent } = await import("./flyerBoardBehavior");
  const a = { id: 1, eventId: 10, venueHint: "Same venue" };
  const b = { id: 2, eventId: 11, venueHint: "Same venue" };
  const map = connectionsByEvent([a, b, a, { id: 3, eventId: null, venueHint: "Same venue" }]);
  assert.deepEqual(map.get(10), [a]);
  assert.deepEqual(map.get(11), [b]);
  assert.equal(map.size, 2);
});

test("fan uses modal focus management and does not promise archived visibility", () => {
  assert.match(source, /<Dialog.Root open/);
  assert.match(source, /<Dialog.Content asChild/);
  assert.match(source, /returnFocus.current\?\.focus\(\)/);
  assert.match(source, /node.inert = offset !== 0/);
  assert.match(source, /aria-label="Close mizzed connections"/);
  assert.match(source, /getMissedConnectionWindow\(listing.dateStart, listing.dateEnd, tick\)/);
  assert.doesNotMatch(source, /STILL READABLE|stays readable here even after/);
});

test("whole board escapes the shared fixed-size card dimensions", () => {
  assert.match(css, /\.fb-root\.boardz-punk-scope\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/);
  assert.match(source, /<Dialog.Portal>/);
});
