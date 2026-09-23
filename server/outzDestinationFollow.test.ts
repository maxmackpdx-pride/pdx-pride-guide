import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

mkdirSync(".local", { recursive: true });
const directory = mkdtempSync(path.resolve(".local/outz-follows-"));
process.env.DATABASE_PATH = path.join(directory, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite, storage } = await import("./storage");
const { createOutzWallPost, followOutzDestination, isFollowingOutzDestination, unfollowOutzDestination } = await import("./outzSocial");
// Storage starts this seed import during boot; finish it before closing the fixture DB.
await import("./qsearch/seedMissingYearround");
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

const user = (name: string) => Number(sqlite.prepare("INSERT INTO users(username,email,password_hash) VALUES(?,?,?)")
  .run(`follow_${name}`, `${name}@outz-follow.test`, "test-only").lastInsertRowid);
const viewer = user("viewer"), stranger = user("stranger"), author = user("author");

test("destination follows place public wall posts in the member Hub, then stops on unfollow", () => {
  createOutzWallPost({ placeId: "rooster-rock", userId: author, postKind: "TRIP_NOTE", body: "Trail is muddy today", tripDate: null });
  assert.equal(storage.getHubFeed({ viewerUserId: viewer, tab: "posts" }).items.some(item => item.kind === "outz"), false);
  followOutzDestination(viewer, "rooster-rock", "Rooster Rock");
  assert.equal(isFollowingOutzDestination(viewer, "rooster-rock"), true);
  const items = storage.getHubFeed({ viewerUserId: viewer, tab: "posts" }).items;
  const post = items.find(item => item.kind === "outz" && item.text === "Trail is muddy today");
  assert.equal(post?.action, "Posted at Rooster Rock");
  assert.equal(post?.link, "/outzide?place=rooster-rock&wall=1");
  assert.equal(storage.getHubFeed({ viewerUserId: stranger, tab: "posts" }).items.some(item => item.id === post?.id), false);
  assert.equal(storage.getHubFeed({ tab: "posts" }).items.some(item => item.kind === "outz"), false);
  storage.blockMember(viewer, author);
  assert.equal(storage.getHubFeed({ viewerUserId: viewer, tab: "posts" }).items.some(item => item.id === post?.id), false);
  storage.unblockMember(viewer, author);
  unfollowOutzDestination(viewer, "rooster-rock");
  assert.equal(isFollowingOutzDestination(viewer, "rooster-rock"), false);
  assert.equal(storage.getHubFeed({ viewerUserId: viewer, tab: "posts" }).items.some(item => item.id === post?.id), false);
});
