import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS_INDEX_INLINE_LIMIT, eventsIndexInlineCatalog } from "../server/eventsIndexCatalog.ts";

test("the events index inlines a short sample and drops descriptions", () => {
  const events = Array.from({ length: 120 }, (_, index) => ({
    id: index + 1,
    title: `Night ${index + 1}`,
    description: "x".repeat(2000),
  }));
  const inline = eventsIndexInlineCatalog(events);
  assert.equal(EVENTS_INDEX_INLINE_LIMIT, 40);
  assert.equal(inline.length, 40);
  assert.equal(inline[0].id, 1);
  assert.equal(inline[39].id, 40);
  assert.ok(inline.every((event) => event.description == null));
  assert.ok(JSON.stringify(inline).length < 20_000);
});

test("events that already have no description are copied as they are", () => {
  const inline = eventsIndexInlineCatalog([{ id: 7, title: "Quiet", description: null }]);
  assert.deepEqual(inline, [{ id: 7, title: "Quiet", description: null }]);
});
