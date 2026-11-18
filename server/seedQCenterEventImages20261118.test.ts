import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { resolveEventPosterUrl } from "../shared/eventPoster";
import images from "./qCenterEventImages20261118.json";
import { Q_CENTER_IMAGES_MIGRATION, seedQCenterEventImages20261118 as seed } from "./seedQCenterEventImages20261118";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE events (id INTEGER PRIMARY KEY, title TEXT, venue_name TEXT, date_start TEXT,
      status TEXT, source TEXT, poster_image_url TEXT, claimed_by TEXT, submitted_by TEXT,
      locked_fields TEXT, updated_at TEXT);`);
  const insert = db.prepare("INSERT INTO events VALUES (?, ?, 'Q Center', ?, 'LIVE', 'qsearch-3', NULL, NULL, NULL, '[]', 'old')");
  for (const image of images) insert.run(image.id, image.title, image.date);
  return db;
}
const now = new Date("2026-11-18T00:00:00Z");

test("adds each source image to its exact posterless event once, including the vigil", () => {
  const db = fixture();
  assert.equal(seed(db, now), images.length);
  for (const image of images) {
    const url = (db.prepare("SELECT poster_image_url FROM events WHERE id=?").get(image.id) as any).poster_image_url;
    assert.equal(url, image.image);
    assert.equal(resolveEventPosterUrl(image.id, url), image.image);
  }
  assert.ok(images.some(image => image.id === 2249 && image.slug === "trans-day-of-remembrance-vigil"));
  assert.equal(seed(db, now), 0);
  db.close();
});

test("does not overwrite artwork, claimed or submitted events, locks, or a changed occurrence", () => {
  for (const change of [
    "poster_image_url = '/uploads/new.jpg'", "claimed_by = 'owner'", "submitted_by = 'owner'",
    `locked_fields = '["posterImageUrl"]'`, `locked_fields = '["poster_image_url"]'`, "locked_fields = 'invalid'",
    "title = 'Changed'", "venue_name = 'Other'", "date_start = '2026-11-21T17:30:00'",
    "status = 'HIDDEN'", "source = 'admin_seeded'",
  ]) {
    const db = fixture();
    db.exec(`UPDATE events SET ${change} WHERE id=2249`);
    const before = db.prepare("SELECT * FROM events WHERE id=2249").get();
    assert.equal(seed(db, now), images.length - 1, change);
    assert.deepEqual(db.prepare("SELECT * FROM events WHERE id=2249").get(), before, change);
    db.close();
  }
});

test("rolls back all image updates and the marker if an update fails", () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail BEFORE UPDATE ON events WHEN NEW.id = 2249 BEGIN SELECT RAISE(ABORT, 'update failed'); END");
  assert.throws(() => seed(db, now), /update failed/);
  assert.equal((db.prepare("SELECT count(*) AS n FROM events WHERE poster_image_url IS NOT NULL").get() as any).n, 0);
  assert.equal(db.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(Q_CENTER_IMAGES_MIGRATION), undefined);
  db.close();
});
