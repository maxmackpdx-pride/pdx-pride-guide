import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, countCss } from "./token-guard.mjs";

test("counts raw hexes and local mono stacks, not comments or tokens", () => {
  const c = countCss("/* #fff */ .a{color:#ff00cc;background:#0c0c0f80;font-family:ui-monospace,monospace} .b{font-family:var(--font-mono)} #main{}");
  assert.deepEqual(c, { hex: 2, mono: 1 });
});

test("a count above baseline fails, equal or lower passes", () => {
  assert.deepEqual(compare({ "a.css": { hex: 3, mono: 0 } }, { "a.css": { hex: 3, mono: 0 } }), []);
  assert.equal(compare({ "a.css": { hex: 4, mono: 0 } }, { "a.css": { hex: 3, mono: 0 } }).length, 1);
  assert.equal(compare({ "new.css": { hex: 0, mono: 1 } }, {}).length, 1);
});
