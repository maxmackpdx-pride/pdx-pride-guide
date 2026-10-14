import { isBoardArchived } from "./boardArchive";
import type Database from "better-sqlite3";

const boards = ["housing", "gigz", "giftz", "sellz", "mizzed"] as const;
export type SavedBoard = (typeof boards)[number];
export const isSavedBoard = (value: string): value is SavedBoard =>
  boards.includes(value as SavedBoard);

/** Private bookmarks. Existing Housing/Sellz saves remain the single source of truth. */
export function createBoardSaves(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS board_saves (
    user_id INTEGER NOT NULL, board TEXT NOT NULL, post_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id,board,post_id)
  )`);
  const visibleSql: Record<SavedBoard, string> = {
    housing:
      "SELECT 1 FROM housing_posts WHERE id = ? AND status IN ('ACTIVE','FILLED') AND hidden = 0 AND gone = 0",
    gigz: "SELECT 1 FROM gig_posts WHERE id = ? AND status = 'LIVE'",
    giftz:
      "SELECT 1 FROM gifting_posts WHERE id = ? AND status IN ('OPEN','THREE_INTERESTED','POSTER_CHOOSING','PICKUP_PENDING','REOPENED','LOOKING','OFFER_PENDING') AND (status = 'PICKUP_PENDING' OR expires_at IS NULL OR datetime(expires_at) > datetime('now'))",
    sellz:
      "SELECT 1 FROM sellz_posts WHERE id = ? AND status IN ('ACTIVE','RESERVED') AND (status = 'RESERVED' OR expires_at IS NULL OR datetime(expires_at) > datetime('now'))",
    mizzed:
      "SELECT 1 FROM missed_connections WHERE id = ? AND status = 'ACTIVE' AND (closes_at IS NULL OR datetime(closes_at) > datetime('now'))",
  };
  return {
    ids(userId: number): string[] {
      const rows = db
        .prepare(
          `SELECT board, post_id FROM board_saves WHERE user_id = @user
        UNION SELECT 'housing', post_id FROM housing_saves WHERE user_id = @user
        UNION SELECT 'sellz', post_id FROM sellz_saves WHERE user_id = @user`,
        )
        .all({ user: userId }) as { board: SavedBoard; post_id: number }[];
      return rows.map((row) => `${row.board}:${row.post_id}`);
    },
    isPublic(board: SavedBoard, id: number): boolean {
      return !isBoardArchived(db,board,id) && !!db.prepare(visibleSql[board]).get(id);
    },
    save(userId: number, board: SavedBoard, id: number) {
      if (board === "housing" || board === "sellz") {
        const table = board === "housing" ? "housing_saves" : "sellz_saves";
        const posts = board === "housing" ? "housing_posts" : "sellz_posts";
        db.prepare(
          `INSERT OR IGNORE INTO ${table} (user_id,post_id,created_at,seen_updated_at)
          SELECT ?,id,?,updated_at FROM ${posts} WHERE id = ?`,
        ).run(userId, new Date().toISOString(), id);
      } else
        db.prepare(
          "INSERT OR IGNORE INTO board_saves (user_id,board,post_id) VALUES (?,?,?)",
        ).run(userId, board, id);
    },
    remove(userId: number, board: SavedBoard, id: number) {
      if (board === "housing" || board === "sellz") {
        const table = board === "housing" ? "housing_saves" : "sellz_saves";
        db.prepare(
          `DELETE FROM ${table} WHERE user_id = ? AND post_id = ?`,
        ).run(userId, id);
      } else
        db.prepare(
          "DELETE FROM board_saves WHERE user_id = ? AND board = ? AND post_id = ?",
        ).run(userId, board, id);
    },
  };
}
