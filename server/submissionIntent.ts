import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

/** A caller retries one logical submit with the same key until it receives its receipt. */
export function runSubmissionIntent<T>(db: Database.Database, userId: number, key: string | undefined, body: unknown, submit: () => T): T {
  if (!key) return db.transaction(submit).immediate();
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(key)) throw Object.assign(new Error("Invalid submission key"), {status: 400});
  const digest = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  db.exec(`CREATE TABLE IF NOT EXISTS submission_receipts (
    user_id INTEGER NOT NULL, request_key TEXT NOT NULL, payload_hash TEXT NOT NULL,
    receipt TEXT NOT NULL, PRIMARY KEY(user_id, request_key)
  )`);
  return db.transaction(() => {
    const old = db.prepare("SELECT payload_hash, receipt FROM submission_receipts WHERE user_id=? AND request_key=?").get(userId, key) as {payload_hash: string; receipt: string} | undefined;
    if (old) {
      if (old.payload_hash !== digest) throw Object.assign(new Error("This submission changed. Submit it as a new request."), {status: 409});
      return JSON.parse(old.receipt) as T;
    }
    const result = submit();
    db.prepare("INSERT INTO submission_receipts VALUES (?,?,?,?)").run(userId, key, digest, JSON.stringify(result));
    return result;
  }).immediate();
}
