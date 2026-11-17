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
