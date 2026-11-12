import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NEEDZ_CATEGORY_ACCENTS, NEEDZ_DEFAULT_FILTERS, NEEDZ_NEEDS, NEEDZ_NEED_COUNTS, NEEDZ_ROWS, NEEDZ_TALK_LINES, buildDeck } from "./needzDeckModel";

test("NEEDZ Decks excludes clubs and groups (Find Your People)", () => {
  assert.ok(NEEDZ_ROWS.length > 50);
  assert.ok(NEEDZ_ROWS.every(row => row.category.id !== "community"));
  assert.equal(new Set(NEEDZ_ROWS.map(row => row.id)).size, NEEDZ_ROWS.length);
  assert.ok(NEEDZ_ROWS.some(row => row.org.name === "Food banks & pantries"));
});

test("every accent is a design token and healthcare is red", () => {
  const tokens = readFileSync("client/src/components/ds/tokens/colors.css", "utf8");
  const accents = [...Object.values(NEEDZ_CATEGORY_ACCENTS), ...NEEDZ_NEEDS.map(need => need.color), ...NEEDZ_ROWS.map(row => row.color)];
  for (const accent of accents) {
    const name = accent.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
    assert.ok(name, `not a bare token: ${accent}`);
    assert.match(tokens, new RegExp(`${name}\\s*:`), `token missing from colors.css: ${name}`);
  }
  for (const id of ["doctor", "testing", "coverage"]) assert.equal(NEEDZ_NEEDS.find(need => need.id === id)?.color, "var(--neon-red)");
  assert.equal(NEEDZ_CATEGORY_ACCENTS.health, "var(--neon-red)");
  assert.equal(NEEDZ_CATEGORY_ACCENTS.safety, "var(--yellow)");
});

test("need counts are real and the default deck is everything in directory order", () => {
  for (const need of NEEDZ_NEEDS) assert.equal(NEEDZ_NEED_COUNTS[need.id], NEEDZ_ROWS.filter(need.test).length);
  assert.ok(NEEDZ_NEED_COUNTS.food > 0);
  assert.deepEqual(buildDeck(NEEDZ_DEFAULT_FILTERS).map(row => row.id), NEEDZ_ROWS.map(row => row.id));
  const today = buildDeck({ ...NEEDZ_DEFAULT_FILTERS, when: "today" });
  const firstNonWalkIn = today.findIndex(row => !row.walkIn);
  assert.ok(today.slice(firstNonWalkIn).every(row => !row.walkIn), "walk-ins first for Today");
});

test("talk lines label 988 in plain words and include 911", () => {
  assert.equal(NEEDZ_TALK_LINES[0].tel, "988");
  assert.match(NEEDZ_TALK_LINES[0].detail, /Suicide & Crisis Lifeline/);
  assert.ok(NEEDZ_TALK_LINES.some(line => line.tel === "911"));
});
