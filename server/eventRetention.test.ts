import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { eventRetentionCutoff, isExpiredEvent } from "./eventRetention";
import { parsePacificDateTime } from "@shared/missedConnections";

const now = Date.parse("2026-09-23T18:00:00Z");
test("calendar-month cutoff respects Pacific dates, month ends and leap years", () => {
  assert.equal(eventRetentionCutoff(now), parsePacificDateTime("2026-06-23"));
  assert.equal(eventRetentionCutoff(Date.parse("2026-06-01T02:00:00Z")), parsePacificDateTime("2026-02-28"));
  assert.equal(eventRetentionCutoff(Date.parse("2024-05-31T18:00:00Z")), parsePacificDateTime("2024-02-29"));
});
test("retains cutoff day, ongoing, future and invalid schedules", () => {
  const cutoff = eventRetentionCutoff(now);
  assert.ok(isExpiredEvent("2026-06-22T20:00", "2026-06-22T23:59:59", cutoff));
  assert.ok(isExpiredEvent("2026-01-01", "", cutoff));
  for (const [start, end] of [
    ["2026-06-22T20:00", "2026-06-23T00:00"],
    ["2026-06-01", "2026-10-01"], ["2026-10-01", "2026-10-02"],
    ["bad", "2026-01-01"], ["2026-01-01", "bad"], ["2026-02-30", "2026-03-01"],
    ["2026-10-01", "2026-01-01"],
  ]) assert.equal(isExpiredEvent(start, end, cutoff), false, `${start} / ${end}`);
});

mkdirSync(".local", { recursive: true });
const directory = mkdtempSync(path.resolve(".local/event-retention-"));
process.env.DATABASE_PATH = path.join(directory, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { storage, sqlite } = await import("./storage");
// Let the existing asynchronous boot seed finish before closing the disposable DB.
await import("./qsearch/seedMissingYearround");
await new Promise<void>(resolve => setImmediate(resolve));
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });
const insert = sqlite.prepare("INSERT INTO events (title, description, venue_name, date_start, date_end) VALUES ('Retention fixture','Fixture','Fixture',?,?)");
const old = Number(insert.run("2026-06-01", "2026-06-02").lastInsertRowid);
const future = Number(insert.run("2026-10-01", "2026-10-02").lastInsertRowid);
sqlite.prepare("INSERT INTO attendances (event_id, handle, message, avatar_seed) VALUES (?, 'Fixture', '', '')").run(old);
sqlite.prepare("INSERT INTO event_hosts (event_id, user_id) VALUES (?, 1)").run(old);
sqlite.prepare("INSERT INTO event_chat_messages (event_id, user_id, body) VALUES (?, 1, 'Fixture')").run(old);
sqlite.prepare("INSERT INTO hub_feed_posts (user_id, post_type, event_id) VALUES (1, 'EVENT', ?)").run(old);

test("deletion rolls back dependent rows if any cleanup fails", () => {
  sqlite.exec("CREATE TRIGGER block_retention BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT, 'retention test'); END");
  assert.throws(() => storage.purgeExpiredEvents(now), /retention test/);
  assert.ok(sqlite.prepare("SELECT id FROM events WHERE id=?").get(old));
  assert.ok(sqlite.prepare("SELECT id FROM attendances WHERE event_id=?").get(old));
  sqlite.exec("DROP TRIGGER block_retention");
});
test("deletes expired occurrences and dependents, retains future occurrences and community posts", () => {
  assert.ok(storage.purgeExpiredEvents(now) > 0);
  assert.equal(sqlite.prepare("SELECT id FROM events WHERE id=?").get(old), undefined);
  assert.ok(sqlite.prepare("SELECT id FROM events WHERE id=?").get(future));
  for (const table of ["attendances", "event_hosts", "event_chat_messages"])
    assert.equal(sqlite.prepare(`SELECT id FROM ${table} WHERE event_id=?`).get(old), undefined);
  assert.ok(sqlite.prepare("SELECT id FROM hub_feed_posts WHERE post_type='EVENT' AND event_id IS NULL").get());
  assert.equal(storage.purgeExpiredEvents(now), 0);
});
