import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { BLENDED_ART_PLACE_IDS } from "../client/src/lib/outzBlendedArt";
import { MISSED_CONNECTION_KIND, OUTZ_BLENDED_PLACE_IDS, missedConnectionBodyError } from "@shared/outzBlendedIds";
import { DEMO_ACCOUNT } from "@shared/demo";

mkdirSync(".local", { recursive: true });
const dir = mkdtempSync(path.resolve(".local/outz-board-demo-test-"));
process.env.DATABASE_PATH = path.join(dir, "data.db");
if (existsSync("data.db")) copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite } = await import("./storage");
// The demo account exists in production; make sure it exists here before outzSocial seeds on import.
sqlite.prepare("INSERT OR IGNORE INTO users(username,email,password_hash,display_name) VALUES(?,?,?,?)").run(DEMO_ACCOUNT, "demo@zaylist.local", "", "Rowan");
const { getOutzBoardPosts, getOutzWallPosts, createOutzWallPost, OUTZ_BOARD_KINDS, anonymizeMissedConnection } = await import("./outzSocial");
const { OUTZ_BOARD_DEMO_POSTS, OUTZ_BOARD_DEMO_MIGRATION, seedOutzBoardDemo, OUTZ_BOARD_MISSED_DEMO_POSTS, OUTZ_BOARD_MISSED_DEMO_MIGRATION, seedOutzBoardMissedDemo } = await import("./outzBoardDemo");
after(() => { sqlite.close(); rmSync(dir, { recursive: true, force: true }); });
const demoId = (sqlite.prepare("SELECT id FROM users WHERE username=?").get(DEMO_ACCOUNT) as { id: number }).id;

test("boot seeds exactly the demo posts for the demo account, once", () => {
  const rows = sqlite.prepare("SELECT * FROM outz_wall_posts WHERE user_id=?").all(demoId) as any[];
  assert.equal(rows.length, OUTZ_BOARD_DEMO_POSTS.length + OUTZ_BOARD_MISSED_DEMO_POSTS.length);
  assert.equal(OUTZ_BOARD_DEMO_POSTS.length, 10);
  assert.ok(sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(OUTZ_BOARD_DEMO_MIGRATION));
  assert.deepEqual(seedOutzBoardDemo(sqlite), [], "marker makes it a no-op");
  // even without the marker, existing rows are skipped (insert-only, no duplicates, no updates)
  sqlite.prepare("DELETE FROM boot_migrations WHERE id=?").run(OUTZ_BOARD_DEMO_MIGRATION);
  assert.deepEqual(seedOutzBoardDemo(sqlite), []);
  assert.equal((sqlite.prepare("SELECT COUNT(*) n FROM outz_wall_posts WHERE user_id=?").get(demoId) as any).n, 13);
});

test("the missed-connection demo seed is its own additive, idempotent marker", () => {
  assert.equal(OUTZ_BOARD_MISSED_DEMO_POSTS.length, 3);
  assert.ok(sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(OUTZ_BOARD_MISSED_DEMO_MIGRATION));
  assert.notEqual(OUTZ_BOARD_MISSED_DEMO_MIGRATION, OUTZ_BOARD_DEMO_MIGRATION);
  assert.deepEqual(seedOutzBoardMissedDemo(sqlite), []);
  sqlite.prepare("DELETE FROM boot_migrations WHERE id=?").run(OUTZ_BOARD_MISSED_DEMO_MIGRATION);
  assert.deepEqual(seedOutzBoardMissedDemo(sqlite), [], "existing rows are skipped");
  assert.equal((sqlite.prepare("SELECT COUNT(*) n FROM outz_wall_posts WHERE user_id=? AND post_kind=?").get(demoId, MISSED_CONNECTION_KIND) as any).n, 3);
  for (const p of OUTZ_BOARD_MISSED_DEMO_POSTS) {
    assert.equal(p.postKind, MISSED_CONNECTION_KIND);
    assert.ok(BLENDED_ART_PLACE_IDS.includes(p.placeId), p.placeId);
    assert.equal(missedConnectionBodyError(p.body), null);
  }
  const created = (sqlite.prepare("SELECT created_at c FROM outz_wall_posts WHERE post_kind=?").all(MISSED_CONNECTION_KIND) as any[]).map(r => r.c);
  assert.ok(created.every(c => c.startsWith("2020-")));
});

test("MISSED_CONNECTION is a board kind; server blended ids mirror the client registry; contact info is rejected", () => {
  assert.ok(OUTZ_BOARD_KINDS.includes(MISSED_CONNECTION_KIND));
  assert.deepEqual([...OUTZ_BLENDED_PLACE_IDS].sort(), [...BLENDED_ART_PLACE_IDS].sort());
  assert.equal(missedConnectionBodyError("You held the trail gate on Saturday morning. Hope the hike was great."), null);
  for (const bad of ["email me at a@b.com", "dm @someone", "see https://x.test", "visit foo.com", "call 503 555 0142"]) assert.ok(missedConnectionBodyError(bad), bad);
});

test("demo posts only use blended-art places, board kinds, and carry no contact details", () => {
  for (const p of OUTZ_BOARD_DEMO_POSTS) {
    assert.ok(BLENDED_ART_PLACE_IDS.includes(p.placeId), p.placeId);
    assert.ok(["HIKE_BUDDY", "CAMP_BUDDY", "LOOKING_FOR_COMPANY", "CARPOOL_OFFER", "CARPOOL_REQUEST"].includes(p.postKind));
    assert.ok(p.body.length > 40 && p.body.length < 300);
    assert.doesNotMatch(p.body, /@|https?:|www\.|\d{3}[-. )]\d{3,4}/i, "no emails, links or phone numbers");
  }
  assert.ok(new Set(OUTZ_BOARD_DEMO_POSTS.map(p => p.postKind)).size >= 4);
});

test("board returns demos flagged isDemo, below real posts, regardless of age; not on place walls or 'mine'", () => {
  const real = Number(sqlite.prepare("INSERT INTO users(username,email,password_hash) VALUES('demo_test_real','demo_test_real@example.test','x')").run().lastInsertRowid);
  sqlite.prepare("INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,trip_date,created_at) VALUES('silver-falls',?,'HIKE_BUDDY','Real post',NULL,?)").run(real, new Date().toISOString());
  const board = getOutzBoardPosts();
  assert.equal(board.length, 14);
  assert.equal(board[0].body, "Real post");
  assert.equal(board[0].isDemo, false);
  assert.ok(board.slice(1).every(r => r.isDemo === true));
  assert.equal(getOutzBoardPosts(real, true).length, 1, "mine only: no demos");
  assert.equal(getOutzWallPosts("silver-falls").some(r => r.userId === demoId), false, "place walls hide demo cards");
  assert.equal(getOutzWallPosts("silver-falls").length, 1);
});

test("board lists real missed connections anonymously (owner still sees themselves) and flags demo ones", () => {
  const author = Number(sqlite.prepare("INSERT INTO users(username,email,password_hash,display_name) VALUES('mc_author','mc_author@example.test','x','Real Name')").run().lastInsertRowid);
  const { id } = createOutzWallPost({ placeId: "rooster-rock", userId: author, postKind: MISSED_CONNECTION_KIND, body: "Blue kayak, wave at the dock.\nCrossed paths: Sunday", tripDate: null });
  const row = getOutzBoardPosts().find(r => r.id === id)!;
  assert.equal(row.postKind, MISSED_CONNECTION_KIND);
  assert.equal(row.displayName, "Anonymous");
  assert.equal(row.username, "anonymous");
  assert.equal(row.isDemo, false);
  assert.equal(getOutzBoardPosts(author).find(r => r.id === id)!.displayName, "Real Name");
  assert.equal(getOutzWallPosts("rooster-rock").find(r => r.id === id)!.displayName, "Anonymous");
  assert.equal(getOutzBoardPosts().filter(r => r.postKind === MISSED_CONNECTION_KIND && r.isDemo).length, 3);
  assert.equal(anonymizeMissedConnection({ postKind: "HIKE_BUDDY", displayName: "Kept" }).displayName, "Kept");
});
