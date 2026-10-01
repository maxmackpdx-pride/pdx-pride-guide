import type Database from "better-sqlite3";

/** Private schedule saves. Deliberately separate from public attendance. */
export function createEventSaves(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS event_saves (
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id)
  )`);
  return {
    ids(userId: number): number[] {
      return (db.prepare("SELECT event_id FROM event_saves WHERE user_id = ? ORDER BY created_at DESC, event_id").all(userId) as { event_id: number }[]).map(row => row.event_id);
    },
    save(userId: number, eventId: number) {
      db.prepare("INSERT OR IGNORE INTO event_saves (user_id, event_id) VALUES (?, ?)").run(userId, eventId);
    },
    remove(userId: number, eventId: number) {
      db.prepare("DELETE FROM event_saves WHERE user_id = ? AND event_id = ?").run(userId, eventId);
    },
  };
}
