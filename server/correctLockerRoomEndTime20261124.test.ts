import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { LOCKER_ROOM_END_TIME_MIGRATION, correctLockerRoomEndTime20261124 as correct } from "./correctLockerRoomEndTime20261124";

function fixture(dateEnd: string | null = "") {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE events (id INTEGER PRIMARY KEY, title TEXT, venue_name TEXT, date_start TEXT,
      status TEXT, date_end TEXT, updated_at TEXT);`);
  db.prepare("INSERT INTO events VALUES (824, 'The Locker Room', 'Eagle Portland', '2026-11-27T21:00:00-08:00', 'LIVE', ?, 'old')")
    .run(dateEnd);
  return db;
}
const now = new Date("2026-11-24T00:00:00Z");
const endOf = (db: Database.Database) =>
  (db.prepare("SELECT date_end FROM events WHERE id=824").get() as any).date_end;

test("fills the blank end time with the series 02:00 close, exactly once", () => {
  const db = fixture();
  assert.equal(correct(db, now), 1);
  assert.equal(endOf(db), "2026-11-28T02:00:00-08:00");
  assert.equal(correct(db, now), 0);
  assert.equal(endOf(db), "2026-11-28T02:00:00-08:00");
  db.close();
});

test("also fills a NULL end time, but never overwrites a set one", () => {
  const db = fixture(null);
  assert.equal(correct(db, now), 1);
  assert.equal(endOf(db), "2026-11-28T02:00:00-08:00");
  db.close();
  const set = fixture("2026-11-28T01:00:00-08:00");
  assert.equal(correct(set, now), 0);
  assert.equal(endOf(set), "2026-11-28T01:00:00-08:00");
  set.close();
});

test("skips when identity or status does not match", () => {
  for (const change of [
    "title = 'Changed'", "venue_name = 'Other'", "date_start = '2026-11-27T20:00:00-08:00'",
    "status = 'HIDDEN'",
  ]) {
    const db = fixture();
    db.exec(`UPDATE events SET ${change} WHERE id=824`);
    const before = db.prepare("SELECT * FROM events WHERE id=824").get();
    assert.equal(correct(db, now), 0, change);
    assert.deepEqual(db.prepare("SELECT * FROM events WHERE id=824").get(), before, change);
    db.close();
  }
});

test("rolls back the update and the marker if the update fails", () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail BEFORE UPDATE ON events WHEN NEW.id = 824 BEGIN SELECT RAISE(ABORT, 'update failed'); END");
  assert.throws(() => correct(db, now), /update failed/);
  assert.equal(endOf(db), "");
  assert.equal(db.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(LOCKER_ROOM_END_TIME_MIGRATION), undefined);
  db.close();
});
