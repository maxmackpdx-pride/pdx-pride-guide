/**
 * One-shot: shadow-ban a user by username on the DB at DATABASE_PATH.
 * Usage: DATABASE_PATH=/data/data.db node script/shadowban-user.mjs shiteatingdutchman
 */
import Database from "better-sqlite3";

const username = (process.argv[2] || "").trim().replace(/^@/, "").toLowerCase();
if (!username) {
  console.error("Usage: node script/shadowban-user.mjs <username>");
  process.exit(1);
}

const dbPath = process.env.DATABASE_PATH || "data.db";
const db = new Database(dbPath);

for (const col of [
  "shadow_banned INTEGER NOT NULL DEFAULT 0",
  "shadow_ban_reason_code TEXT",
  "shadow_ban_reason_label TEXT",
  "shadow_ban_note TEXT",
  "shadow_ban_until TEXT",
  "shadow_banned_at TEXT",
  "shadow_banned_by_user_id INTEGER",
]) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
  } catch {
    /* already exists */
  }
}

const u = db
  .prepare(
    `SELECT id, username, status, shadow_banned AS shadowBanned, email
     FROM users WHERE LOWER(username) = ?`,
  )
  .get(username);

if (!u) {
  console.error("NOT_FOUND", username);
  process.exit(2);
}

console.log("before", JSON.stringify(u));

let actorId = u.id;
const owner =
  db
    .prepare(
      `SELECT id, username FROM users WHERE LOWER(username) = 'tucker_pdmax' LIMIT 1`,
    )
    .get() ||
  db
    .prepare(
      `SELECT id, username FROM users WHERE LOWER(username) LIKE 'tucker%' LIMIT 1`,
    )
    .get();
if (owner?.id) actorId = owner.id;

const now = new Date().toISOString();
db.prepare(
  `UPDATE users SET
    shadow_banned = 1,
    shadow_ban_reason_code = ?,
    shadow_ban_reason_label = ?,
    shadow_ban_note = ?,
    shadow_ban_until = NULL,
    shadow_banned_at = ?,
    shadow_banned_by_user_id = ?
   WHERE id = ?`,
).run(
  "OTHER",
  "Other community standards / legal concern",
  "Owner-requested shadow ban",
  now,
  actorId,
  u.id,
);

try {
  db.prepare(
    `INSERT INTO moderation_requests
      (type, event_id, event_title, requester_name, requester_email, proof, status, created_at)
     VALUES (?, 0, ?, ?, ?, ?, 'PENDING', ?)`,
  ).run(
    "ACCOUNT_SHADOWBAN",
    `@${u.username}`,
    owner?.username || "site_owner",
    "owner@zaylist.com",
    [
      "Action: shadowban",
      `By: @${owner?.username || "owner"} (ops script)`,
      "Reason: Other community standards / legal concern (OTHER)",
      "Until: indefinite",
      "Note: Owner-requested shadow ban",
      `Profile: /u/${encodeURIComponent(u.username)}`,
    ].join("\n"),
    now,
  );
  console.log("moderation_request: ok");
} catch (e) {
  console.log("moderation_request: skip", String(e?.message || e));
}

const after = db
  .prepare(
    `SELECT id, username, status, shadow_banned AS shadowBanned,
            shadow_ban_reason_label AS reason, shadow_banned_at AS at
     FROM users WHERE id = ?`,
  )
  .get(u.id);
console.log("after", JSON.stringify(after));
console.log("SHADOWBAN_OK");
