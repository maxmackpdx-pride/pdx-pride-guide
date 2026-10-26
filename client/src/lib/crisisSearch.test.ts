import test from "node:test";
import assert from "node:assert/strict";
import { CRISIS_LINES, crisisRowScore, isCrisisQuery, rankForCrisis } from "./crisisSearch";

test("crisis-intent queries are recognized, ordinary ones are not", () => {
  for (const q of ["crisis", "suicide", "hotline", "988", "emergency", "help now", "Help Now", "I want to die", "self harm", "need help NOW", "urgent help"]) assert.equal(isCrisisQuery(q), true, q);
  for (const q of ["", "alberta", "housing", "tin shed", "1988", "emergencyroom9", "yoga"]) assert.equal(isCrisisQuery(q), false, q);
});

test("pinned crisis lines are accurate and complete", () => {
  const byName = Object.fromEntries(CRISIS_LINES.map(l => [l.name, l]));
  assert.equal(CRISIS_LINES[0].tel, "988");
  assert.equal(byName["The Trevor Project"].tel, "18664887386");
  assert.equal(byName["Trans Lifeline"].tel, "18775658860");
  assert.equal(byName["Call to Safety"].tel, "15032355333");
  for (const line of CRISIS_LINES) assert.match(line.source, /^https:\/\//);
});

test("crisis queries put crisis/hotline rows first and drop unrelated ones", () => {
  const rows = [
    { name: "Eviction & housing crisis support", text: "Eviction & housing crisis support rent help" },
    { name: "Crisis hotlines", text: "Crisis hotlines Find specialized crisis and support lines. 24/7" },
    { name: "Garden Cafe", text: "Cafe on Alberta" },
  ];
  const ranked = rankForCrisis(rows, "crisis", r => r.text, () => true);
  assert.equal(ranked[0].name, "Crisis hotlines");
  assert.ok(!ranked.some(r => r.name === "Garden Cafe"));
  assert.deepEqual(rankForCrisis(rows, "cafe", r => r.text, () => true), rows, "non-crisis queries untouched");
  assert.ok(crisisRowScore("988 Suicide & Crisis Lifeline") > crisisRowScore("housing crisis rent"));
});
