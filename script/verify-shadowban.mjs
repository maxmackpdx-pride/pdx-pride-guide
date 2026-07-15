import Database from "better-sqlite3";
const db = new Database(process.env.DATABASE_PATH || "/data/data.db");
const u = db
  .prepare(
    `SELECT id, username, status, shadow_banned AS shadowBanned,
            shadow_ban_reason_label AS reason, shadow_banned_at AS at
     FROM users WHERE LOWER(username) = 'shiteatingdutchman'`,
  )
  .get();
console.log("user", JSON.stringify(u, null, 2));
const m = db
  .prepare(
    `SELECT id, type, event_title, status, created_at
     FROM moderation_requests
     WHERE type = 'ACCOUNT_SHADOWBAN' AND event_title LIKE '%shiteatingdutchman%'
     ORDER BY id DESC LIMIT 3`,
  )
  .all();
console.log("moderation", JSON.stringify(m, null, 2));
