import test from "node:test";
import assert from "node:assert/strict";
import { claimFirstRun, firstRunOwner, releaseFirstRun, subscribeFirstRun } from "./firstRunBanner";

test("only one first-run banner owns the slot; the next can claim after release", () => {
  assert.equal(claimFirstRun("welcome"), true);
  assert.equal(claimFirstRun("push"), false, "notification prompt waits for Welcome");
  assert.equal(claimFirstRun("welcome"), true, "re-claim is idempotent");
  let calls = 0;
  const off = subscribeFirstRun(() => { calls += 1; });
  releaseFirstRun("push");
  assert.equal(firstRunOwner(), "welcome", "a non-owner cannot release");
  releaseFirstRun("welcome");
  assert.equal(calls, 1);
  assert.equal(claimFirstRun("push"), true);
  releaseFirstRun("push");
  off();
  assert.equal(firstRunOwner(), null);
});
