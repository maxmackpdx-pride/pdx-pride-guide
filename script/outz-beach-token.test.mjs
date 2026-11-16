import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cards = [
  "client/src/components/home/TodayLocationCard.tsx",
  "client/src/components/home/OutzSmallCard.tsx",
  "client/src/components/home/perspective-tunnel/tunnelCards.ts"
];
for (const file of cards) {
  test(file + " keeps beach cyan and stay magenta", () => {
    const source = readFileSync(file, "utf8");
    assert.match(source, /beach: "--neon-cyan"/);
    assert.doesNotMatch(source, /beach: "--neon-magenta"/);
    assert.match(source, /stay: "--neon-magenta"/);
    assert.match(source, /trail: "--neon-orange"/);
  });
}
test("canonical beach metadata remains cyan", () => {
  const source = readFileSync("client/src/lib/outzKinds.ts", "utf8");
  assert.match(source, /beach: \{[^\n]+color: "cyan"/);
});
