import assert from "node:assert/strict";
import test from "node:test";
import { isFounderApprovedEndEstimate } from "./qsearchFounderEndEstimates";

test("only Tucker's exact ONYX bar-night cutoff is approved", () => {
  const values = {
    venueName: "Eagle Portland",
    address: "835 N Lombard St, Portland, OR 97217",
    dateStart: "2026-10-22T19:00:00-07:00",
    dateEnd: "2026-10-23T01:30:00-07:00",
  };
  const key = "onyx-pnw-come-together-bar-night-2026-10-22";
  assert.equal(isFounderApprovedEndEstimate(key, values), true);
  assert.equal(isFounderApprovedEndEstimate(key, { ...values, dateEnd: "2026-10-23T02:00:00-07:00" }), false);
  assert.equal(isFounderApprovedEndEstimate(key, { ...values, venueName: "Other Venue" }), false);
  assert.equal(isFounderApprovedEndEstimate("onyx-pnw-come-together-bar-night-2026-11-26", values), false);
  assert.equal(isFounderApprovedEndEstimate("unrelated-eagle-event", values), false);
});
