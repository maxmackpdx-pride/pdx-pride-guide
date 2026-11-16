import test from "node:test";
import assert from "node:assert/strict";
import { syncMotifRecipes } from "./sync-motif-recipes";

test("BUILD_OFFLINE publishes checked local snapshot without calling fetch", async () => {
  const previous = process.env.BUILD_OFFLINE;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  process.env.BUILD_OFFLINE = "1";
  globalThis.fetch = async () => { requests++; throw new Error("Network forbidden in offline test"); };
  try {
    const release = await syncMotifRecipes();
    assert.ok(release.length > 0);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.BUILD_OFFLINE;
    else process.env.BUILD_OFFLINE = previous;
  }
});
