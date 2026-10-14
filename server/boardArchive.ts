import type Database from "better-sqlite3";
import { isDemoAuthor } from "../shared/demo";

export const ARCHIVE_BOARDS = ["housing", "gigz", "giftz", "sellz", "mizzed"] as const;
export type ArchiveBoard = typeof ARCHIVE_BOARDS[number];
const sources: Record<ArchiveBoard, string> = { housing: "housing_posts", gigz: "gig_posts", giftz: "gifting_posts", sellz: "sellz_posts", mizzed: "missed_connections" };
const DAY = 86400000;
const removed = new Set(["REMOVED", "DELETED", "REJECTED"]);
export type BoardMemory = { board: ArchiveBoard; postId: number; type: string; title: string; createdAt: string | null; archivedAt: string; purgedAt: string | null };
export type BoardArchiveEntry = BoardMemory & { purgeAt: string };
type Row = Record<string, any>;
const hasTable = (db: Database.Database, table: string) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
const hasColumn = (db: Database.Database, table: string, column: string) => hasTable(db, table) && (db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).some(c => c.name === column);
const archiveTables = new WeakSet<Database.Database>();
const hasArchiveTable = (db: Database.Database) => {
 if(archiveTables.has(db))return true;
 if(!hasTable(db,"board_post_archives"))return false;
 archiveTables.add(db);return true;
};
const canonical = (board: string): ArchiveBoard | null => board === "houz" ? "housing" : ARCHIVE_BOARDS.includes(board as ArchiveBoard) ? board as ArchiveBoard : null;

/** Storage and map readers can call this before lifecycle registration/migration. */
export function isBoardArchived(db: Database.Database, board: string, postId: number): boolean {
 const key = canonical(board);
 return !!key && hasArchiveTable(db) && !!db.prepare("SELECT 1 FROM board_post_archives WHERE board=? AND post_id=?").get(key, postId);
}

/** One lookup per board; safe during storage startup before archive registration. */
export function withoutArchivedPosts<T extends {id:number}>(db: Database.Database, board: string, rows: T[]): T[] {
 const key=canonical(board);
 if(!key || !rows.length || !hasArchiveTable(db))return rows;
 const ids=new Set((db.prepare("SELECT post_id FROM board_post_archives WHERE board=?").all(key) as {post_id:number}[]).map(row=>row.post_id));
 return rows.filter(row=>!ids.has(Number(row.id)));
}

/** Calendar year in UTC, clamping leap day to February 28 of the next year. */
export function boardArchivePurgeAt(archivedAt: string): string {
 const date = new Date(archivedAt);
 if (!Number.isFinite(+date)) throw new Error("Invalid archive date.");
 const month = date.getUTCMonth();
 date.setUTCFullYear(date.getUTCFullYear() + 1);
 if (date.getUTCMonth() !== month) date.setUTCDate(0);
 return date.toISOString();
}
const dateValue = (value: unknown): string | null => {
 if (typeof value !== "string" || !value.trim()) return null;
 const date = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value) ? value.replace(" ","T")+"Z" : value);
 return Number.isFinite(+date) ? date.toISOString() : null;
};
function memory(row: Row): BoardMemory {
 return {board:row.board,postId:row.post_id,type:row.post_type,title:row.title,createdAt:row.created_at,archivedAt:row.archived_at,purgedAt:row.purged_at};
}
function entry(row: Row): BoardArchiveEntry { return {...memory(row),purgeAt:boardArchivePurgeAt(row.archived_at)}; }

export function createBoardArchive(db: Database.Database) {
 db.exec(`CREATE TABLE IF NOT EXISTS board_post_archives (
  board TEXT NOT NULL, post_id INTEGER NOT NULL, owner_id INTEGER NOT NULL,
  post_type TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT,
  archived_at TEXT NOT NULL, purged_at TEXT, PRIMARY KEY(board,post_id)
 ); CREATE INDEX IF NOT EXISTS board_post_archives_owner ON board_post_archives(owner_id,archived_at);
 CREATE INDEX IF NOT EXISTS board_post_archives_purge ON board_post_archives(purged_at,archived_at);
 CREATE TABLE IF NOT EXISTS board_archive_upload_cleanup(upload_path TEXT PRIMARY KEY,queued_at TEXT NOT NULL);`);
 const existing = (board: ArchiveBoard, id: number) => db.prepare("SELECT * FROM board_post_archives WHERE board=? AND post_id=?").get(board,id) as Row | undefined;
 const isDemo = (post: Row) => {
  const user = hasTable(db,"users") ? db.prepare("SELECT * FROM users WHERE id=?").get(post.user_id) as Row | undefined : undefined;
  return isDemoAuthor({username:user?.username,displayName:user?.display_name}) || isDemoAuthor({username:user?.username,displayName:post.name});
 };
 const removeMap = (board: ArchiveBoard, id: number) => {
  if (hasTable(db,"board_map_locations")) db.prepare("DELETE FROM board_map_locations WHERE board IN (?,?) AND post_id=?").run(board,board==="housing"?"houz":board,id);
 };
 const archive = db.transaction((board: ArchiveBoard, postId: number, userId: number, now = new Date()): BoardArchiveEntry => {
  if (!ARCHIVE_BOARDS.includes(board) || !Number.isSafeInteger(postId) || postId <= 0 || !Number.isSafeInteger(userId) || userId <= 0) throw new Error("Post not found.");
  if (!Number.isFinite(+now)) throw new Error("Invalid archive date.");
  const prior = existing(board,postId);
  if (prior) { if (prior.owner_id !== userId) throw new Error("Post not found."); return entry(prior); }
  const table = sources[board];
  const post = hasTable(db,table) ? db.prepare(`SELECT * FROM ${table} WHERE id=? AND user_id=?`).get(postId,userId) as Row | undefined : undefined;
  if (!post || removed.has(String(post.status).toUpperCase())) throw new Error("Post not found.");
  if (isDemo(post)) throw new Error("Guide examples cannot be archived.");
  const title = String(board==="housing" ? post.headline || post.name || "Housing post" : post.title || "Board post").trim().slice(0,160);
  const type = String(board==="housing" ? post.type || board : post.post_type || board).slice(0,64);
  db.prepare("INSERT INTO board_post_archives(board,post_id,owner_id,post_type,title,created_at,archived_at) VALUES (?,?,?,?,?,?,?)")
   .run(board,postId,userId,type,title,dateValue(post.created_at),now.toISOString());
  db.prepare(`UPDATE ${table} SET status='ARCHIVED' WHERE id=? AND user_id=?`).run(postId,userId);
  removeMap(board,postId);
  return entry(existing(board,postId)!);
 });
 const deleteBy = (table: string, column: string, id: number) => {
  if (hasColumn(db,table,column)) db.prepare(`DELETE FROM ${table} WHERE ${column}=?`).run(id);
 };
 const nullBy = (table: string, column: string, id: number) => {
  if (hasColumn(db,table,column)) db.prepare(`UPDATE ${table} SET ${column}=NULL WHERE ${column}=?`).run(id);
 };
 const queueUploads = (post: Row | undefined, now: Date) => {
  if(!post)return;
  let photos:unknown=[];
  try{photos=JSON.parse(post.photo_urls || "[]");}catch{/* Legacy malformed photo lists do not prevent retention cleanup. */}
  const candidates=[post.image_url,post.photo_url,...(Array.isArray(photos)?photos:[])];
  for(const value of candidates){
   if(typeof value!=="string" || !value.startsWith("/uploads/"))continue;
   const path=value.split(/[?#]/)[0];
   // Queue paths only; an independent global-reference check must precede unlink.
   let decoded:string;try{decoded=decodeURIComponent(path);}catch{continue;}
   if(decoded.includes("\\")||decoded.includes("\0")||decoded.split("/").some(part=>part===".."||part==="."))continue;
   db.prepare("INSERT OR IGNORE INTO board_archive_upload_cleanup(upload_path,queued_at) VALUES (?,?)").run(path,now.toISOString());
  }
 };
 const purge = db.transaction((row: Row, now: Date) => {
  const board = row.board as ArchiveBoard, id = row.post_id as number, table = sources[board];
  if (row.purged_at || +now < Date.parse(boardArchivePurgeAt(row.archived_at))) return false;
  queueUploads(hasTable(db,table)?db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as Row|undefined:undefined,now);
  if(board==="housing"&&hasColumn(db,"housing_members","photo_url")){
   for(const member of db.prepare("SELECT photo_url FROM housing_members WHERE post_id=?").all(id) as Row[])queueUploads(member,now);
  }
  // Clear root-to-interest references before removing children (also safe with FKs enabled).
  if (hasColumn(db,table,"selected_interest_id")) db.prepare(`UPDATE ${table} SET selected_interest_id=NULL WHERE id=?`).run(id);
  if (board==="housing") {
   nullBy("housing_posts","around_post_id",id);
   nullBy("housing_places","managed_post_id",id);
   if (hasTable(db,"housing_places")) {
    const places=db.prepare("SELECT id FROM housing_places WHERE post_id=?").all(id) as {id:number}[];
    for (const place of places) for (const child of ["housing_place_comments","housing_place_reactions"]) deleteBy(child,"place_id",place.id);
   }
   for (const child of ["housing_members","housing_saves","housing_requests","housing_places","housing_dates","housing_reports"]) deleteBy(child,"post_id",id);
  }
  if (board==="giftz") for (const child of ["gifting_interests","gifting_reports"]) deleteBy(child,"post_id",id);
  if (board==="sellz") for (const child of ["sellz_interests","sellz_reports","sellz_saves"]) deleteBy(child,"post_id",id);
  const kinds:Record<ArchiveBoard,string[]>={housing:["HOUSING","HOUZ"],gigz:["GIG"],giftz:["GIFTING"],sellz:["SELLZ"],mizzed:["SPOTTED","MIZZED"]};
  for(const child of ["content_likes","content_replies"]) if(hasColumn(db,child,"content_type")&&hasColumn(db,child,"content_id")) {
   for(const kind of kinds[board])db.prepare(`DELETE FROM ${child} WHERE content_type=? AND content_id=?`).run(kind,id);
  }
  for (const child of ["board_saves","board_post_motifs"]) if(hasTable(db,child))db.prepare(`DELETE FROM ${child} WHERE board IN (?,?) AND post_id=?`).run(board,board==="housing"?"houz":board,id);
  removeMap(board,id);
  // Inbox messages, shared uploads and Mizzed reveal/participant metadata are
  // independent conversation records. Never delete them with a post.
  if(hasTable(db,table))db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  db.prepare("UPDATE board_post_archives SET purged_at=? WHERE board=? AND post_id=? AND purged_at IS NULL").run(now.toISOString(),board,id);
  return true;
 });
 const sweep = (now = new Date()) => {
  if (!Number.isFinite(+now)) throw new Error("Invalid archive date.");
  let archived=0,purged=0;
  for (const board of ARCHIVE_BOARDS) {
   const table=sources[board];
   if(!hasTable(db,table))continue;
   const posts=db.prepare(`SELECT p.* FROM ${table} p WHERE NOT EXISTS (SELECT 1 FROM board_post_archives a WHERE a.board=? AND a.post_id=p.id)`).all(board) as Row[];
   for(const post of posts) {
    const created=dateValue(post.created_at);
    if(!created || +now-Date.parse(created)<90*DAY || removed.has(String(post.status).toUpperCase()) || isDemo(post))continue;
    if(!Number.isSafeInteger(post.user_id)||post.user_id<=0)continue;
    archive(board,post.id,post.user_id,now);archived++;
   }
  }
  for(const row of db.prepare("SELECT * FROM board_post_archives WHERE purged_at IS NULL").all() as Row[])if(purge(row,now))purged++;
  return {archived,purged};
 };
 return {
  archive,
  isArchived:(board:string,id:number)=>isBoardArchived(db,board,id),
  list:(userId:number):BoardArchiveEntry[] => (db.prepare("SELECT * FROM board_post_archives WHERE owner_id=? AND purged_at IS NULL ORDER BY archived_at DESC,board,post_id").all(userId) as Row[]).map(entry),
  memories:(userId:number):BoardMemory[] => (db.prepare("SELECT * FROM board_post_archives WHERE owner_id=? ORDER BY archived_at DESC,board,post_id").all(userId) as Row[]).map(memory),
  sweep,
 };
}
