import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseMarketplacePrice } from "./marketplace";

test("marketplace prices reject invalid edits as well as new listings", () => {
  for (const price of [-5, 0, "", "no price", Infinity, null, true, [2], {}, 1_000_001]) {
    assert.throws(() => parseMarketplacePrice(price), /between/);
  }
  assert.equal(parseMarketplacePrice("12.35"), 1235);
  assert.equal(parseMarketplacePrice(1), 100);
  assert.equal(parseMarketplacePrice(1_000_000), 100_000_000);
});
