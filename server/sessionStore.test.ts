import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { BetterSqliteSessionStore } from "./sessionStore";

test("periodic pruning removes expired sessions without a server restart", async () => {
  const db = new Database(":memory:");
  const store = new BetterSqliteSessionStore(db, 5);
  try {
    const insert = db.prepare("INSERT INTO express_sessions VALUES (?, ?, ?)");
    insert.run("expired", "{}", Date.now() - 1);
    insert.run("active", "{}", Date.now() + 60_000);
    const deadline = Date.now() + 2000;
    while (db.prepare("SELECT 1 FROM express_sessions WHERE sid = 'expired'").get() && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.deepEqual(db.prepare("SELECT sid FROM express_sessions").all(), [{ sid: "active" }]);
  } finally {
    store.close();
    db.close();
  }
});
