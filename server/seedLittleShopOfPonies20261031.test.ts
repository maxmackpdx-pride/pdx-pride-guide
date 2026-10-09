import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Database from "better-sqlite3";
import { linkLittleShopOfPoniesCommunity, littleShopOfPonies, PONIES_MIGRATION, seedLittleShopOfPonies20261031 as seed } from "./seedLittleShopOfPonies20261031";

function fixture() {
  const db = new Database(":memory:");
  const source = readFileSync(new URL("./storage.ts", import.meta.url), "utf8");
  db.exec(source.match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);
  db.exec("CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  return db;
}
const now = new Date("2026-10-09T19:00:00Z");

test("publishes once with original poster, owner-confirmed age and sex-positive flag, secret venue and Pacific DST end", () => {
  const db = fixture();
  assert.equal(seed(db, now), 1);
  assert.equal(seed(db, now), 0);
  const row = db.prepare("SELECT * FROM events").get() as any;
  assert.equal(row.status, "LIVE");
  assert.equal(row.age_requirement, "21_PLUS");
  assert.equal(row.is_sex_positive, 1);
  assert.equal(row.lat, null);
  assert.equal(row.lng, null);
  assert.match(row.address, /exact location TBA/);
  assert.equal(row.poster_image_url, littleShopOfPonies.posterImageUrl);
  assert.equal(new Date(row.date_end).getTime() - new Date(row.date_start).getTime(), 7 * 3600000);
  db.close();
});

test("preserves an existing hidden claimed event with a different title and tracked ticket URL", () => {
  const db = fixture();
  seed(db, now);
  db.prepare("DELETE FROM boot_migrations WHERE id = ?").run(PONIES_MIGRATION);
  db.exec("UPDATE events SET title = 'Owner title', venue_name = 'Owner venue', ticket_url = ticket_url || '?utm_source=host', status = 'HIDDEN', claimed_by = 'owner'");
  assert.equal(seed(db, now), 0);
  assert.equal((db.prepare("SELECT count(*) AS n FROM events WHERE status = 'HIDDEN' AND claimed_by = 'owner'").get() as any).n, 1);
  db.close();
});

test("does not resurrect a past event and rolls back a failed insertion", () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON events BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  assert.throws(() => seed(db, now), /test failure/);
  assert.equal((db.prepare("SELECT count(*) AS n FROM boot_migrations").get() as any).n, 0);
  db.exec("DROP TRIGGER fail_insert");
  assert.equal(seed(db, new Date("2026-11-02T12:00:00Z")), 0);
  db.close();
});


test("links the real existing Pink Ponies community once without creating a new identity", () => {
  const db = fixture();
  db.exec("CREATE TABLE communities (id TEXT, slug TEXT, name TEXT); CREATE TABLE community_relationships (community_id TEXT, target_type TEXT, target_id TEXT, relationship_type TEXT, created_at TEXT, PRIMARY KEY (community_id,target_type,target_id,relationship_type))");
  seed(db, now);
  assert.equal(linkLittleShopOfPoniesCommunity(db, now), 0);
  db.exec("INSERT INTO communities VALUES ('existing-pink-ponies', 'pink-ponies', 'Pink Ponies')");
  assert.equal(linkLittleShopOfPoniesCommunity(db, now), 1);
  assert.equal(linkLittleShopOfPoniesCommunity(db, now), 0);
  const link = db.prepare("SELECT * FROM community_relationships").get() as any;
  assert.equal(link.community_id, "existing-pink-ponies");
  assert.equal(link.target_type, "event");
  assert.equal(link.target_id, "1");
  db.close();
});
