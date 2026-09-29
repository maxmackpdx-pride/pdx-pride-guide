import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import Database from "better-sqlite3";
import corrections from "./posterAudit20260928.json";
import { seedPosterAudit20260928 } from "./seedPosterAudit20260928";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE events (id INTEGER PRIMARY KEY, title TEXT, venue_name TEXT,
    date_start TEXT, poster_image_url TEXT, claimed_by TEXT, locked_fields TEXT DEFAULT '[]',
    description TEXT DEFAULT 'preserve', updated_at TEXT);
    CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT);`);
  const insert = db.prepare("INSERT INTO events (id, title, venue_name, date_start, poster_image_url) VALUES (?, ?, ?, ?, ?)");
  for (const c of corrections) insert.run(c.id, c.title, c.venueName, c.date + "T19:00:00", c.previousPoster);
  return db;
}

test("applies the complete reviewed poster manifest once without changing event data", () => {
  const db = fixture();
  const before = db.prepare("SELECT id, title, venue_name, date_start, description FROM events ORDER BY id").all();
  assert.equal(new Set(corrections.map(c => c.id)).size, corrections.length);
  assert.ok(corrections.every(c => !/sanctuary|eagle|badlands|peacock|peakcock/i.test(c.venueName)));
  for (const c of corrections) assert.ok(existsSync(new URL(`../client/public${c.posterImageUrl}`, import.meta.url)), c.posterImageUrl);
  assert.equal(seedPosterAudit20260928(db), corrections.length);
  assert.equal(seedPosterAudit20260928(db), 0);
  assert.deepEqual(db.prepare("SELECT id, title, venue_name, date_start, description FROM events ORDER BY id").all(), before);
  for (const c of corrections) assert.equal((db.prepare("SELECT poster_image_url FROM events WHERE id = ?").get(c.id) as any).poster_image_url, c.posterImageUrl);
  db.close();
});

test("preserves excluded, claimed, locked, changed, and nonmatching records", () => {
  const db = fixture();
  const changes = ["venue_name = 'Sanctuary'", "venue_name = 'Eagle Portland'", "venue_name = 'Badlands'", "venue_name = 'Peacock PDX'",
    "claimed_by = 'owner'", `locked_fields = '["posterImageUrl"]'`, "poster_image_url = '/owner-new-poster.jpg'", "title = 'Changed event'", "date_start = '2028-01-01'", "locked_fields = 'invalid'", `locked_fields = '["poster_image_url"]'`];
  const protectedIds = corrections.slice(0, changes.length).map(c => c.id);
  changes.forEach((sql, i) => db.prepare(`UPDATE events SET ${sql} WHERE id = ?`).run(protectedIds[i]));
  const before = protectedIds.map(id => db.prepare("SELECT * FROM events WHERE id = ?").get(id));
  assert.equal(seedPosterAudit20260928(db), corrections.length - changes.length);
  assert.deepEqual(protectedIds.map(id => db.prepare("SELECT * FROM events WHERE id = ?").get(id)), before);
  db.close();
});

test("accepts API defaults backed by NULL and rolls back the entire batch on failure", () => {
  const db = fixture();
  const c = corrections.find(c => c.previousPoster?.startsWith("/placeholders/"))!;
  db.prepare("UPDATE events SET poster_image_url = NULL WHERE id = ?").run(c.id);
  db.exec(`CREATE TRIGGER fail_update BEFORE UPDATE ON events WHEN OLD.id = ${corrections[2].id} BEGIN SELECT RAISE(ABORT, 'test failure'); END;`);
  const before = db.prepare("SELECT * FROM events ORDER BY id").all();
  assert.throws(() => seedPosterAudit20260928(db), /test failure/);
  assert.deepEqual(db.prepare("SELECT * FROM events ORDER BY id").all(), before);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM boot_migrations").get() as any).n, 0);
  db.exec("DROP TRIGGER fail_update");
  assert.equal(seedPosterAudit20260928(db), corrections.length);
  assert.equal((db.prepare("SELECT poster_image_url FROM events WHERE id = ?").get(c.id) as any).poster_image_url, c.posterImageUrl);
  db.close();
});
