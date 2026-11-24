import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { YES_COACH_EVENT_TYPES_MIGRATION, correctYesCoachEventTypes20261124 as correct } from "./correctYesCoachEventTypes20261124";

function fixture(eventTypes = "[]", lockedFields = '["title","dateStart"]') {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE events (id INTEGER PRIMARY KEY, title TEXT, venue_name TEXT, date_start TEXT,
      status TEXT, event_types TEXT, locked_fields TEXT, updated_at TEXT);`);
  db.prepare("INSERT INTO events VALUES (2022, 'Yes Coach: 3-Year Anniversary', 'Sanctuary Club', '2026-11-29T18:00:00', 'LIVE', ?, ?, 'old')")
    .run(eventTypes, lockedFields);
  return db;
}
const now = new Date("2026-11-24T00:00:00Z");
const typesOf = (db: Database.Database) =>
  (db.prepare("SELECT event_types FROM events WHERE id=2022").get() as any).event_types;

test("adds KINK to event 2022 exactly once", () => {
  const db = fixture();
  assert.equal(correct(db, now), 1);
  assert.equal(typesOf(db), '["KINK"]');
  assert.equal(correct(db, now), 0);
  assert.equal(typesOf(db), '["KINK"]');
  db.close();
});

test("preserves existing types and never duplicates KINK", () => {
  const db = fixture('["PARTY"]');
  assert.equal(correct(db, now), 1);
  assert.equal(typesOf(db), '["PARTY","KINK"]');
  db.close();
  const already = fixture('["KINK"]');
  assert.equal(correct(already, now), 0);
  assert.equal(typesOf(already), '["KINK"]');
  already.close();
});

test("skips when identity, status, locks, or stored types do not match", () => {
  for (const change of [
    "title = 'Changed'", "venue_name = 'Other'", "date_start = '2026-11-29T19:00:00'",
    "status = 'HIDDEN'", `locked_fields = '["eventTypes"]'`, `locked_fields = '["event_types"]'`,
    "locked_fields = 'invalid'", "event_types = 'invalid'",
  ]) {
    const db = fixture();
    db.exec(`UPDATE events SET ${change} WHERE id=2022`);
    const before = db.prepare("SELECT * FROM events WHERE id=2022").get();
    assert.equal(correct(db, now), 0, change);
    assert.deepEqual(db.prepare("SELECT * FROM events WHERE id=2022").get(), before, change);
    db.close();
  }
});

test("rolls back the update and the marker if the update fails", () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail BEFORE UPDATE ON events WHEN NEW.id = 2022 BEGIN SELECT RAISE(ABORT, 'update failed'); END");
  assert.throws(() => correct(db, now), /update failed/);
  assert.equal(typesOf(db), "[]");
  assert.equal(db.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(YES_COACH_EVENT_TYPES_MIGRATION), undefined);
  db.close();
});
