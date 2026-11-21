import test from "node:test";
import assert from "node:assert/strict";
import { heartLabel } from "./useHearts";

test("one heart vocabulary: interested = save + updates, saved says updates are on", () => {
  assert.equal(heartLabel("Yes Coach", false).label, "Interested in Yes Coach: save it and get updates");
  assert.match(heartLabel("Yes Coach", true).label, /updates on/);
  assert.match(heartLabel("Yes Coach", true).title, /updates on/);
});
