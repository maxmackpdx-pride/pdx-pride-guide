import assert from "node:assert/strict";
import test from "node:test";
import { formatWindStat } from "@shared/nudeBeaches";

test("calm wind is the speed only", () => {
  assert.deepEqual(formatWindStat("0 mph"), { value: "0", label: "Wind · mph" });
});

test("a compass direction stays in front of the speed", () => {
  assert.deepEqual(formatWindStat("ENE 2 mph"), { value: "ENE 2", label: "Wind · mph" });
  assert.deepEqual(formatWindStat("NNE 10 to 15 mph"), { value: "NNE 10 to 15", label: "Wind · mph" });
});

test("missing wind stays a dash", () => {
  assert.deepEqual(formatWindStat("  "), { value: "-", label: "Wind" });
  assert.deepEqual(formatWindStat("Calm"), { value: "Calm", label: "Wind" });
});
