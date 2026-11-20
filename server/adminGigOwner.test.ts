import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("admin gig edits distinguish an omitted owner, a reassignment and removal", async (t) => {
  mkdirSync(".local", { recursive: true });
  const directory = mkdtempSync(path.resolve(".local/admin-gig-owner-"));
  process.env.DATABASE_PATH = path.join(directory, "data.db");
  copyFileSync("data.db", process.env.DATABASE_PATH);
  const { sqlite, storage } = await import("./storage");
  t.after(() => {
    sqlite.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const newUser = sqlite.prepare("INSERT INTO users(username,email,password_hash) VALUES(?,?,?)");
  const first = Number(newUser.run("gig_owner_one", "one@example.test", "test").lastInsertRowid);
  const second = Number(newUser.run("gig_owner_two", "two@example.test", "test").lastInsertRowid);
  const gig = storage.createGigPost({
    postType: "POSTING_GIG", name: "Host", title: "Lighting", description: "Stage lighting",
    contactEmail: "host@example.test", userId: first,
  });
  assert.equal(storage.adminUpdateGigPost(gig.id, { title: "Sound" })?.userId, first);
  assert.equal(storage.adminUpdateGigPost(gig.id, { userId: second })?.userId, second);
  assert.equal(storage.adminUpdateGigPost(gig.id, { userId: null })?.userId, null);
  assert.equal(storage.getGigPostsByUser(second).some(post => post.id === gig.id), false);
});
