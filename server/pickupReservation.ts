import type { Database } from "better-sqlite3";

export type PickupBoard = "GIFTING" | "SELLZ";

const boardTables = {
  GIFTING: { posts:"gifting_posts", interests:"gifting_interests", active:"PICKUP_PENDING", prefix:"Gifting pickup: ", open:["OPEN","THREE_INTERESTED","POSTER_CHOOSING","LOOKING","OFFER_PENDING","REOPENED"] },
  SELLZ: { posts:"sellz_posts", interests:"sellz_interests", active:"RESERVED", prefix:"Reserved for you: ", open:["ACTIVE","RESERVED"] },
} as const;

export function initPickupNotices(db: Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS pickup_notices (
    board TEXT NOT NULL, interest_id INTEGER NOT NULL, body TEXT NOT NULL, message_id INTEGER,
    PRIMARY KEY(board,interest_id)
  )`);
  for (const [board,{posts,interests,active}] of Object.entries(boardTables)) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${posts}_close_pickup AFTER UPDATE OF selected_interest_id,status ON ${posts}
      WHEN OLD.selected_interest_id IS NOT NULL
        AND (NEW.selected_interest_id IS NOT OLD.selected_interest_id OR NEW.status != '${active}')
      BEGIN
        DELETE FROM pickup_notices WHERE board='${board}' AND interest_id=OLD.selected_interest_id;
      END;
      CREATE TRIGGER IF NOT EXISTS ${interests}_remove_pickup AFTER DELETE ON ${interests}
      BEGIN
        DELETE FROM pickup_notices WHERE board='${board}' AND interest_id=OLD.id;
      END;
      CREATE TRIGGER IF NOT EXISTS ${posts}_remove_pickup AFTER DELETE ON ${posts}
      BEGIN
        DELETE FROM pickup_notices WHERE board='${board}' AND interest_id=OLD.selected_interest_id;
      END;
    `);
  }
}

type Reservation = {
  title:string; owner:number; postStatus:string; selectedId:number|null;
  interestId:number; recipient:number; interestStatus:string; createdAt:string; postId:number;
};

function reservation(db:Database, board:PickupBoard, interestId:number) {
  const {posts,interests} = boardTables[board];
  return db.prepare(`SELECT p.title, p.user_id AS owner, p.status AS postStatus, p.selected_interest_id AS selectedId,
    i.id AS interestId, i.user_id AS recipient, i.status AS interestStatus, i.created_at AS createdAt, p.id AS postId
    FROM ${interests} i JOIN ${posts} p ON p.id=i.post_id WHERE i.id=?`).get(interestId) as Reservation|undefined;
}

function legacyMessage(db:Database, board:PickupBoard, item:Reservation) {
  return db.prepare(`SELECT id FROM messages WHERE from_user_id=? AND to_user_id=? AND context_type=? AND context_id=?
    AND subject LIKE ? AND created_at>=? ORDER BY id DESC LIMIT 1`).get(
    item.owner,item.recipient,board,item.postId,boardTables[board].prefix+"%",item.createdAt,
  ) as {id:number}|undefined;
}

export function pickupPending(db: Database, board: PickupBoard, interestId: number): boolean {
  const item = reservation(db,board,interestId);
  if (!item || item.selectedId !== interestId || item.postStatus !== boardTables[board].active) return false;
  const row = db.prepare("SELECT message_id FROM pickup_notices WHERE board=? AND interest_id=?").get(board,interestId) as {message_id:number|null}|undefined;
  return row ? row.message_id === null : !legacyMessage(db,board,item);
}

/** Commit the winner first so retrying an interrupted notice cannot choose a different person. */
export function reservePickup<T>(db:Database, board:PickupBoard, postId:number, interestId:number, actor:number, body:string,
  select:()=>T, send:(to:number,subject:string,body:string)=>{id:number}) {
  const config = boardTables[board];
  const selected = db.transaction(() => {
    const item = reservation(db,board,interestId);
    if (!item || item.postId !== postId) throw new Error("Response not found");
    if (item.owner !== actor) throw new Error("Not your listing");
    const retry = item.selectedId === interestId && item.interestStatus === "SELECTED";
    if (retry && item.postStatus !== config.active) throw new Error("The pickup has already closed.");
    if (!retry && (item.selectedId || item.interestStatus !== "INTERESTED" || !(config.open as readonly string[]).includes(item.postStatus))) {
      throw new Error("This response is no longer available for selection. Refresh the listing.");
    }
    const result = retry ? {id:interestId,userId:item.recipient,user_id:item.recipient,status:"SELECTED"} : select();
    if (!result) throw new Error("Response not found");
    const prior = retry ? legacyMessage(db,board,item) : undefined;
    db.prepare("INSERT OR IGNORE INTO pickup_notices(board,interest_id,body,message_id) VALUES (?,?,?,?)")
      .run(board,interestId,prior ? "" : body,prior?.id ?? null);
    return {result, subject:config.prefix+item.title, recipient:item.recipient};
  }).immediate();
  try {
    db.transaction(() => {
      const row = db.prepare("SELECT body,message_id FROM pickup_notices WHERE board=? AND interest_id=?").get(board,interestId) as {body:string;message_id:number|null}|undefined;
      if (!row || row.message_id !== null) return;
      const message = send(selected.recipient,selected.subject,row.body);
      db.prepare("UPDATE pickup_notices SET message_id=?,body='' WHERE board=? AND interest_id=?").run(message.id,board,interestId);
    }).immediate();
  } catch { return {...selected.result, pickupNoticePending:true}; }
  return {...selected.result, pickupNoticePending:false};
}
