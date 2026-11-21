import test from "node:test";
import assert from "node:assert/strict";
import { getAfterzWindow, AFTERZ_OPENS_BEFORE_MS, AFTERZ_CLOSES_AFTER_MS } from "./afterzWindow";
import { parsePacificDateTime } from "./missedConnections";

const start = "2026-11-21T21:00", end = "2026-11-22T02:00";
const s = parsePacificDateTime(start)!, e = parsePacificDateTime(end)!;

test("Afterz opens 72 hours before doors and closes 30 minutes after the end", () => {
  assert.equal(getAfterzWindow(start, end, s - AFTERZ_OPENS_BEFORE_MS - 1)?.state, "before");
  assert.equal(getAfterzWindow(start, end, s - AFTERZ_OPENS_BEFORE_MS)?.state, "open");
  assert.equal(getAfterzWindow(start, end, e + AFTERZ_CLOSES_AFTER_MS - 1)?.state, "open");
  assert.equal(getAfterzWindow(start, end, e + AFTERZ_CLOSES_AFTER_MS)?.state, "closed");
});

test("unknown times stay unknown", () => {
  assert.equal(getAfterzWindow("", end, Date.now()), null);
});
