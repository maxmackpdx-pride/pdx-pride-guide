import type { Database } from "better-sqlite3";
import { boardMotifOptions, type BoardMotifCategory } from "../shared/boardMotifs";
const initialized = new WeakSet<Database>();
function initialize(db: Database) {
  if (initialized.has(db)) return;
  db.exec("CREATE TABLE IF NOT EXISTS board_post_motifs (board TEXT NOT NULL, post_id INTEGER NOT NULL, motif_choice TEXT NOT NULL, PRIMARY KEY(board,post_id))");
  initialized.add(db);
}
export function validateBoardMotif(board: BoardMotifCategory, value: unknown): string {
  if (value == null) return "default";
  if (typeof value !== "string" || !boardMotifOptions[board].some(option => option.id === value)) throw new Error("Choose an artwork option for this board.");
  return value;
}
export function saveBoardMotif(db: Database, board: BoardMotifCategory, postId: number, choice: string) {
  const validated = validateBoardMotif(board,choice);
  initialize(db);
  db.prepare("INSERT INTO board_post_motifs(board,post_id,motif_choice) VALUES (?,?,?) ON CONFLICT(board,post_id) DO UPDATE SET motif_choice=excluded.motif_choice").run(board,postId,validated);
}
export function readBoardMotif(db: Database, board: BoardMotifCategory, postId: number): string {
  initialize(db);
  const row = db.prepare("SELECT motif_choice AS choice FROM board_post_motifs WHERE board=? AND post_id=?").get(board,postId) as {choice:string}|undefined;
  return row?.choice || "default";
}
