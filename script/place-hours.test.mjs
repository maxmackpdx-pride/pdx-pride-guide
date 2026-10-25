import test from "node:test";
import assert from "node:assert/strict";
import { placeHoursClauses } from "../client/src/lib/placeHours.ts";

test("hours wrap on commas and keep a time range together", () => {
  assert.deepEqual(
    placeHoursClauses("Mon–Fri 8am–10pm, Sat–Sun 8am–8pm"),
    ["Mon–Fri 8am–10pm", "Sat–Sun 8am–8pm"],
  );
  assert.deepEqual(placeHoursClauses("  Daily 4pm–2am  "), ["Daily 4pm–2am"]);
  assert.deepEqual(placeHoursClauses(""), []);
});
