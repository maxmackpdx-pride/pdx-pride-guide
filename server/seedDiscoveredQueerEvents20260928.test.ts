import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Database from "better-sqlite3";
import { discoveredQueerEvents20260928 } from "./discoveredQueerEvents20260928";
import { DISCOVERED_QUEER_EVENTS_MIGRATION, seedDiscoveredQueerEvents20260928 } from "./seedDiscoveredQueerEvents20260928";

function fixture() {
  const db = new Database(":memory:");
  const source = readFileSync(new URL("./storage.ts", import.meta.url), "utf8");
  db.exec(source.match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);
  db.exec("CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  return db;
}
const now = new Date("2026-09-28T19:00:00Z");

test("publishes exactly 17 approved dates as live, unclaimed, claimable events once", () => {
  const db = fixture();
  assert.equal(discoveredQueerEvents20260928.length, 17);
  assert.equal(seedDiscoveredQueerEvents20260928(db, now), 17);
  assert.equal(seedDiscoveredQueerEvents20260928(db, now), 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM events WHERE status = 'LIVE' AND source = 'admin_seeded' AND is_claimable = 1 AND claimed_by IS NULL AND submitted_by IS NULL").get().n, 17);
  assert.equal(db.prepare("SELECT count(*) AS n FROM events WHERE date_start < '2026-09-28'").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM events WHERE date_end = ''").get().n, 14);
  db.close();
});

test("does not overwrite or duplicate existing claimed and hidden listings", () => {
  const db = fixture();
  seedDiscoveredQueerEvents20260928(db, now);
  db.prepare("DELETE FROM boot_migrations WHERE id = ?").run(DISCOVERED_QUEER_EVENTS_MIGRATION);
  db.exec("UPDATE events SET status = 'HIDDEN', claimed_by = 'owner', description = 'Owner edited', is_claimable = 0");
  assert.equal(seedDiscoveredQueerEvents20260928(db, now), 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM events WHERE description = 'Owner edited' AND status = 'HIDDEN' AND claimed_by = 'owner'").get().n, 17);
  db.close();
});

test("failed batch rolls back both additions and marker", () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail_batch BEFORE INSERT ON events WHEN (SELECT count(*) FROM events) = 1 BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  assert.throws(() => seedDiscoveredQueerEvents20260928(db, now), /test failure/);
  assert.equal(db.prepare("SELECT count(*) AS n FROM events").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM boot_migrations").get().n, 0);
  db.close();
});

test("a later fresh deployment does not resurrect past dates", () => {
  const db = fixture();
  assert.equal(seedDiscoveredQueerEvents20260928(db, new Date("2027-01-01T12:00:00Z")), 0);
  db.close();
});
