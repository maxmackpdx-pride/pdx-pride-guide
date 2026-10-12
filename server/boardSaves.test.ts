import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { createBoardSaves, isSavedBoard } from "./boardSaves";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE housing_posts(id INTEGER,status TEXT,hidden INTEGER,gone INTEGER,updated_at TEXT);
 CREATE TABLE housing_saves(user_id INTEGER,post_id INTEGER,created_at TEXT,seen_updated_at TEXT,UNIQUE(user_id,post_id));
 CREATE TABLE sellz_posts(id INTEGER,status TEXT,expires_at TEXT,updated_at TEXT);
 CREATE TABLE sellz_saves(user_id INTEGER,post_id INTEGER,created_at TEXT,seen_updated_at TEXT,UNIQUE(user_id,post_id));
 CREATE TABLE gig_posts(id INTEGER,status TEXT);
 CREATE TABLE gifting_posts(id INTEGER,status TEXT,expires_at TEXT);
 CREATE TABLE missed_connections(id INTEGER,status TEXT,closes_at TEXT);
 INSERT INTO housing_posts VALUES(1,'ACTIVE',0,0,'2026-10-12'),(2,'ACTIVE',1,0,''),(3,'ACTIVE',0,1,'');
 INSERT INTO sellz_posts VALUES(1,'ACTIVE','2999-01-01','2026-10-12'),(2,'ACTIVE','2000-01-01',''),(3,'RESERVED','2000-01-01','');
 INSERT INTO gig_posts VALUES(1,'LIVE'),(2,'PENDING');
 INSERT INTO gifting_posts VALUES(1,'OPEN','2999-01-01'),(2,'OPEN','2000-01-01'),(3,'PICKUP_PENDING','2000-01-01');
 INSERT INTO missed_connections VALUES(1,'ACTIVE',NULL),(2,'ACTIVE','2000-01-01'),(3,'ARCHIVED',NULL);`);
  return { db, saves: createBoardSaves(db) };
}
test("private bookmarks are idempotent, scoped to the user, and isolated across boards", () => {
  const { db, saves } = fixture();
  saves.save(1, "giftz", 1);
  saves.save(1, "giftz", 1);
  saves.save(1, "gigz", 1);
  saves.save(2, "giftz", 1);
  assert.deepEqual(new Set(saves.ids(1)), new Set(["giftz:1", "gigz:1"]));
  saves.remove(1, "giftz", 1);
  saves.remove(1, "giftz", 1);
  assert.deepEqual(saves.ids(1), ["gigz:1"]);
  assert.deepEqual(saves.ids(2), ["giftz:1"]);
  db.close();
});
test("combined Housing and Sellz bookmarks use the native save tables in both directions", () => {
  const { db, saves } = fixture();
  saves.save(1, "housing", 1);
  saves.save(1, "sellz", 1);
  saves.save(1, "housing", 1);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM housing_saves").get().n,
    1,
  );
  assert.equal(
    db.prepare("SELECT seen_updated_at AS seen FROM sellz_saves").get().seen,
    "2026-10-12",
  );
  db.prepare("DELETE FROM housing_saves WHERE user_id = 1").run();
  assert.deepEqual(saves.ids(1), ["sellz:1"]);
  db.prepare("INSERT INTO housing_saves(user_id,post_id) VALUES (1,1)").run();
  assert.deepEqual(new Set(saves.ids(1)), new Set(["sellz:1", "housing:1"]));
  db.close();
});
test("visibility follows publication, hidden state, and expiry without revealing private posts", () => {
  const { db, saves } = fixture();
  for (const board of [
    "housing",
    "gigz",
    "giftz",
    "sellz",
    "mizzed",
  ] as const) {
    assert.equal(saves.isPublic(board, 1), true, board);
    assert.equal(saves.isPublic(board, 2), false, board);
    assert.equal(saves.isPublic(board, 999), false, board);
  }
  assert.equal(saves.isPublic("housing", 3), false);
  assert.equal(saves.isPublic("mizzed", 3), false);
  assert.equal(saves.isPublic("giftz", 3), true);
  assert.equal(saves.isPublic("sellz", 3), true);
  assert.equal(isSavedBoard("__proto__"), false);
  assert.equal(isSavedBoard("housing"), true);
  db.close();
});
