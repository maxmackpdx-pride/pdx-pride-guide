import session from "express-session";
import type { SessionData } from "express-session";

const { Store } = session;
import type Database from "better-sqlite3";

/** Persist login sessions on the same SQLite volume as user data. */
export class BetterSqliteSessionStore extends Store {
  private readonly getStmt;
  private readonly setStmt;
  private readonly destroyStmt;
  private readonly pruneStmt;

  constructor(db: Database.Database) {
    super();
    db.exec(`
      CREATE TABLE IF NOT EXISTS express_sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expired INTEGER NOT NULL
      )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS express_sessions_expired_idx ON express_sessions(expired)`);
    this.getStmt = db.prepare(
      `SELECT sess FROM express_sessions WHERE sid = ? AND expired > ?`,
    );
    this.setStmt = db.prepare(
      `INSERT OR REPLACE INTO express_sessions (sid, sess, expired) VALUES (?, ?, ?)`,
    );
    this.destroyStmt = db.prepare(`DELETE FROM express_sessions WHERE sid = ?`);
    this.pruneStmt = db.prepare(`DELETE FROM express_sessions WHERE expired <= ?`);
    this.pruneStmt.run(Date.now());
  }

  get(sid: string, callback: (err: unknown, session?: SessionData | null) => void) {
    try {
      const row = this.getStmt.get(sid, Date.now()) as { sess: string } | undefined;
      callback(null, row ? (JSON.parse(row.sess) as SessionData) : null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    try {
      const maxAge = session.cookie?.maxAge ?? 7 * 24 * 60 * 60 * 1000;
      this.setStmt.run(sid, JSON.stringify(session), Date.now() + maxAge);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    try {
      this.destroyStmt.run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    this.set(sid, session, callback);
  }
}