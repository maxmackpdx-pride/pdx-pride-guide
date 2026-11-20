import test, { after } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const temporary = mkdtempSync(path.join(tmpdir(), "zaylist-queue-cases-"));
process.env.DATABASE_PATH = path.join(temporary, "cases.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite, storage } = await import("./storage");
const { getAdminQueueAggregate } = await import("./adminOps");

after(() => {
  sqlite.close();
  rmSync(temporary, { recursive: true, force: true });
});

test("the aggregate and search identify a promoter application by its user", () => {
  const name = "Disposable promoter case";
  const email = "queue-promoter@example.invalid";
  const userId = Number(sqlite.prepare("INSERT INTO users(username,display_name,email,password_hash,promoter_status) VALUES(?,?,?,'unused','pending')")
    .run("queue-promoter", name, email).lastInsertRowid);
  const submissionId = Number(sqlite.prepare(`INSERT INTO submissions(type,title,description,venue_name,date_start,date_end,submitter_name,submitter_email)
    VALUES('PROMOTER_APPLICATION',?,'Synthetic','','','',?,?)`).run(name, name, email).lastInsertRowid);
  const results = storage.adminGlobalSearch(name).queue;
  assert.deepEqual(results.map(row => [row.kind, row.id]), [["promoter", userId]]);
  const { raw } = getAdminQueueAggregate();
  assert.ok(raw.promoters.some(row => row.id === userId && row.submissionId === submissionId));
  assert.ok(!raw.submissions.some(row => row.id === submissionId));
});

test("an active flagged gift retains its report count through both storage readers", () => {
  const user = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as {id: number};
  const insert = sqlite.prepare(`INSERT INTO gifting_posts(user_id,title,description,category,neighborhood,pickup_preference,expires_at,report_count,status)
    VALUES(?,?,'Synthetic','Art','Test','At event','2099-11-19',2,?)`);
  const initial = storage.countAdminGiftingFlagged();
  const id = Number(insert.run(user.id, "Open case", "OPEN").lastInsertRowid);
  insert.run(user.id, "Completed case", "GIFTED");
  const aggregate = getAdminQueueAggregate();
  assert.equal(aggregate.raw.giftingPosts.find(row => row.id === id)?.reportCount, 2);
  assert.equal(storage.getGiftingPost(id)?.reportCount, 2);
  assert.equal(aggregate.buckets.giftingFlagged, initial + 1);
  assert.equal(aggregate.breakdown.giftingFlagged, initial + 1);
});
