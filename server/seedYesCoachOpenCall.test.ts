import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { linkAnniversaryOpenCall } from "./seedYesCoachOpenCall";

test("the requested open call follows its owner and occurrence without taking over unrelated records", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE boot_migrations(id TEXT PRIMARY KEY,applied_at TEXT);
    CREATE TABLE gig_posts(id INTEGER PRIMARY KEY,title TEXT,user_id INTEGER,business_id INTEGER,gig_date TEXT,post_type TEXT);
    CREATE TABLE businesses(id INTEGER PRIMARY KEY,name TEXT,owner_id INTEGER);
    CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT);
    CREATE TABLE events(id INTEGER PRIMARY KEY,title TEXT,date_start TEXT,venue_name TEXT,claimed_by TEXT);
    CREATE TABLE event_hosts(event_id INTEGER,user_id INTEGER,role TEXT);
    CREATE TABLE event_gig_links(gig_id INTEGER PRIMARY KEY,event_id INTEGER,occurrence TEXT);
    INSERT INTO users VALUES(17,'Tucker_PDmaX');
    INSERT INTO businesses VALUES(33,'Sanctuary Club',99),(93,'Yes Coach Productions',17);
    INSERT INTO events VALUES(2022,'Yes Coach: 3-Year Anniversary','2026-11-29T18:00:00','Sanctuary Club',NULL);
    INSERT INTO gig_posts VALUES(18,'Open Call: Contribute an Idea',NULL,33,'2026-11-29','POSTING_GIG');
    INSERT INTO event_hosts VALUES(2022,29,'PRIMARY');
  `);
  const assign = (event: number, user: number) => {
    db.prepare("INSERT INTO event_hosts VALUES(?,?,'PRIMARY')").run(event, user);
  };
  try {
    assert.equal(linkAnniversaryOpenCall(db, assign), false);
    db.exec("DELETE FROM event_hosts; UPDATE businesses SET owner_id=29 WHERE id=93;");
    assert.equal(linkAnniversaryOpenCall(db, assign), false);
    db.exec("UPDATE businesses SET owner_id=17 WHERE id=93;");
    assert.throws(() => linkAnniversaryOpenCall(db, () => { throw new Error("assignment failed"); }));
    assert.equal(db.prepare("SELECT user_id FROM gig_posts").pluck().get(), null);
    assert.equal(linkAnniversaryOpenCall(db, assign), true);
    assert.equal(db.prepare("SELECT user_id FROM gig_posts").pluck().get(), 17);
    assert.deepEqual(db.prepare("SELECT * FROM event_gig_links").get(), { gig_id:18, event_id:2022, occurrence:"2026-11-29" });
    db.exec("UPDATE gig_posts SET user_id=NULL; DELETE FROM event_gig_links;");
    assert.equal(linkAnniversaryOpenCall(db, assign), false);
    assert.equal(db.prepare("SELECT user_id FROM gig_posts").pluck().get(), null);
    assert.equal(db.prepare("SELECT count(*) FROM event_gig_links").pluck().get(), 0);
  } finally { db.close(); }
});
