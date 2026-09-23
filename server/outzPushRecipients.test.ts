import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

mkdirSync(".local", { recursive: true });
const dir = mkdtempSync(path.resolve(".local/outz-push-test-"));
process.env.DATABASE_PATH = path.join(dir, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite } = await import("./storage");
const { getOutzChatPushRecipients, getOutzWallPostOwner } = await import("./outzSocial");
after(() => { sqlite.close(); rmSync(dir, { recursive: true, force: true }); });

test("OUTZ chat alerts reach only other active, visible room members", () => {
  const sender = 900001;
  const active = 900002;
  const anonymous = 900003;
  const expired = 900004;
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO outz_checkins(user_id,place_id,arrival_hour,depart_hour,calendar_date,is_anonymous,is_active,expires_at,created_at)
    VALUES (?,'push-room',10,13,'2099-01-01',?,1,?,?)
  `);
  insert.run(sender, 0, future, now);
  insert.run(active, 0, future, now);
  insert.run(anonymous, 1, future, now);
  insert.run(expired, 0, past, now);
  assert.deepEqual(getOutzChatPushRecipients("push-room", sender), [active]);
  assert.deepEqual(getOutzChatPushRecipients("another-room", sender), []);
});

test("OUTZ wall comment targets its post author", () => {
  const result = sqlite.prepare(`
    INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,created_at)
    VALUES ('push-room',900002,'TRIP_NOTE','Trip note',?)
  `).run(new Date().toISOString());
  assert.deepEqual(getOutzWallPostOwner(Number(result.lastInsertRowid)), { userId: 900002, placeId: "push-room" });
  assert.equal(getOutzWallPostOwner(-1), undefined);
});
