import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { createEventSaves } from "./eventSaves";

test("private schedule saves are idempotent and isolated between accounts", () => {
  const db = new Database(":memory:");
  try {
    const saves = createEventSaves(db);
    saves.save(1, 20); saves.save(1, 20); saves.save(2, 20); saves.save(2, 21);
    assert.deepEqual(saves.ids(1), [20]);
    assert.deepEqual(saves.ids(2), [20, 21]);
    saves.remove(1, 20);
    assert.deepEqual(saves.ids(1), []);
    assert.deepEqual(saves.ids(2), [20, 21]);
    assert.deepEqual(createEventSaves(db).ids(2), [20, 21]);
  } finally { db.close(); }
});
