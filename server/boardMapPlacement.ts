import { isBoardArchived } from "./boardArchive";
import { withinHousingBounds } from "../shared/housing";
import { RESOURCE_MAP_ENTRIES } from "../client/src/lib/resourceMap";
import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import { resolveBusinessLocations } from "../shared/businessLocations";

const DAY = 86400000;
const TABLES = { gigz: "gig_posts", giftz: "gifting_posts", sellz: "sellz_posts", mizzed: "missed_connections", houz: "housing_posts" } as const;
type Board = keyof typeof TABLES;
export type Placement = { lat: number; lng: number; days: number; venueId?: number | null; keepUntil?: string };
type Stored = { lat: number; lng: number; firstPlacedAt: string; expiresAt: string; venueId: number | null };
export type Waypoint = { lat: number; lng: number; name: string; venueId?: number };

export function initializeBoardMapPlacement(db: Database.Database, now = new Date()) {
  db.exec(`CREATE TABLE IF NOT EXISTS board_map_locations (board TEXT NOT NULL, post_id INTEGER NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, PRIMARY KEY(board,post_id))`);
  const columns = new Set((db.prepare("PRAGMA table_info(board_map_locations)").all() as {name:string}[]).map(c => c.name));
  db.transaction(() => {
    for (const [name, type] of [["first_placed_at", "TEXT"], ["expires_at", "TEXT"], ["venue_id", "INTEGER"]]) {
      if (!columns.has(name)) db.exec(`ALTER TABLE board_map_locations ADD COLUMN ${name} ${type}`);
    }
    // Older explicit shares had no clock; grant one bounded initial window, once.
    if (!columns.has("first_placed_at")) db.prepare("UPDATE board_map_locations SET first_placed_at=?, expires_at=? WHERE first_placed_at IS NULL")
      .run(now.toISOString(), new Date(+now + 14 * DAY).toISOString());
  })();
}
export function placementWindow(firstPlacedAt: string | undefined, now = new Date()) {
  const first = firstPlacedAt ? Date.parse(firstPlacedAt) : +now;
  const initialEnd = first + 14 * DAY;
  const renewal = +now >= initialEnd;
  return { renewal, maxDays: renewal ? 5 : Math.max(1, Math.ceil((initialEnd - +now) / DAY)), initialEnd };
}
export function readPlacement(db: Database.Database, board: string, id: number): Stored | undefined {
  return db.prepare("SELECT lat,lng,first_placed_at AS firstPlacedAt,expires_at AS expiresAt,venue_id AS venueId FROM board_map_locations WHERE board=? AND post_id=?").get(board,id) as Stored | undefined;
}
export function validatePlacement(value: unknown, blockers: Waypoint[] = [], allowedVenueId?: number | null, housing = false): Placement | null {
  if (value == null) return null;
  const p = value as Placement;
  if (typeof p.lat !== "number" || typeof p.lng !== "number" || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || (housing ? !withinHousingBounds(p.lat,p.lng) : p.lat < 45.2 || p.lat > 45.85 || p.lng < -123.15 || p.lng > -122.15))
    throw new Error(housing ? "Choose a point in the Portland metro through Salem region." : "Choose a point in the Portland metro area.");
  const days = p.days ?? 7;
  if (!Number.isInteger(days) || days < 1 || days > 14) throw new Error("Choose between 1 and 14 days.");
  if (p.venueId != null && (!allowedVenueId || p.venueId !== allowedVenueId)) throw new Error("That venue is not linked to this post.");
  if (p.venueId != null) {
    const venue = blockers.find(w => w.venueId === p.venueId && distanceMetres(w,p) < 2);
    if (!venue) throw new Error("Choose the linked venue’s map point.");
  } else if (blockers.some(w => distanceMetres(w,p) < 18)) throw new Error("Move the pin away from the existing waypoint. Try a nearby cross street.");
  return {lat:p.lat,lng:p.lng,days,venueId:p.venueId || null, ...(typeof p.keepUntil==="string"?{keepUntil:p.keepUntil}:{})};
}
export function distanceMetres(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
  return Math.hypot((a.lat-b.lat)*111320,(a.lng-b.lng)*111320*Math.cos(a.lat*Math.PI/180));
}
export function savePlacement(db: Database.Database, board: string, id: number, p: Placement | null, now = new Date()) {
  return db.transaction(() => {
    const previous = readPlacement(db,board,id);
    if (!p) {
      // Keep the first-placement clock even when the pin is removed.
      if (previous) db.prepare("UPDATE board_map_locations SET expires_at=? WHERE board=? AND post_id=?").run(now.toISOString(),board,id);
      else db.prepare("INSERT INTO board_map_locations(board,post_id,lat,lng,first_placed_at,expires_at) VALUES (?,?,0,0,'',?)").run(board,id,now.toISOString());
      return;
    }
    const window = placementWindow(previous?.firstPlacedAt,now);
    if (p.days > window.maxDays) throw new Error(`Choose up to ${window.maxDays} days${window.renewal ? " for this replacement" : " in your original 14-day window"}.`);
    if (p.keepUntil && (p.keepUntil!==previous?.expiresAt || Date.parse(p.keepUntil)<=+now)) throw new Error("The placement changed. Reload it before editing.");
    const expires = p.keepUntil ? Date.parse(p.keepUntil) : window.renewal ? +now+p.days*DAY : Math.min(+now+p.days*DAY,window.initialEnd);
    db.prepare(`INSERT INTO board_map_locations(board,post_id,lat,lng,first_placed_at,expires_at,venue_id) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(board,post_id) DO UPDATE SET lat=excluded.lat,lng=excluded.lng,expires_at=excluded.expires_at,venue_id=excluded.venue_id,first_placed_at=CASE WHEN board_map_locations.first_placed_at IS NULL OR board_map_locations.first_placed_at='' THEN excluded.first_placed_at ELSE board_map_locations.first_placed_at END`)
      .run(board,id,p.lat,p.lng,previous?.firstPlacedAt || now.toISOString(),new Date(expires).toISOString(),p.venueId || null);
  })();
}
export function registerBoardPlacement(app: Express, db: Database.Database, requireAuth: RequestHandler, storage: any) {
  initializeBoardMapPlacement(db);
  const waypoints = (): Waypoint[] => [
    ...RESOURCE_MAP_ENTRIES.flatMap(entry=>entry.locations.map(p=>({...p,name:entry.org.name}))),
    ...storage.getBusinesses().filter((b:any) => b.active).flatMap((b:any) => resolveBusinessLocations(b).map(p => ({...p,name:b.name,venueId:b.id}))),
    ...storage.getEvents({status:"LIVE"}).filter((e:any) => e.isPublic && !e.isPrivate && !e.isHouseParty).map((e:any) => ({lat:e.lat,lng:e.lng,name:e.venueName || e.title})),
  ].filter(p => typeof p.lat === "number" && typeof p.lng === "number" && Number.isFinite(p.lat) && Number.isFinite(p.lng)) as Waypoint[];
  const linkedVenue = (post:any) => post.place_id || (post.event_id ? (() => {
    const event=storage.getEvent(post.event_id);
    return storage.getBusinesses().find((b:any) => b.active && b.name.trim().toLowerCase()===event?.venueName?.trim().toLowerCase())?.id;
  })() : null);
  // Replace existing venue extensions without extending their original lifetime.
  const legacy = db.prepare(`SELECT * FROM missed_connections p WHERE p.status IN ('ACTIVE','ARCHIVED')
    AND (p.place_id IS NOT NULL OR p.event_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM board_map_locations m WHERE m.board='mizzed' AND m.post_id=p.id)`).all() as any[];
  for (const post of legacy) {
    const created=new Date(post.created_at),venueId=linkedVenue(post);
    if (!Number.isFinite(+created)) continue;
    const point=waypoints().find(w=>w.venueId===venueId);
    if(point) savePlacement(db,"mizzed",post.id,{...point,venueId,days:14},created);
  }
  const owner = (board:string,id:number,userId:number) => {
    if (!Object.hasOwn(TABLES,board) || !Number.isSafeInteger(id) || id<1) return null;
    const post = db.prepare(`SELECT * FROM ${TABLES[board as Board]} WHERE id=? AND user_id=?`).get(id,userId) as any;
    return post;
  };
  const save = (board:string,id:number,point:Placement|null) => db.transaction(()=>{
    savePlacement(db,board,id,point);
    if(board==="mizzed" && point){
      const placement=readPlacement(db,board,id)!;
      db.prepare(`UPDATE missed_connections SET status='ACTIVE',closes_at=CASE WHEN closes_at IS NULL OR datetime(closes_at)<datetime(@expires) THEN @expires ELSE closes_at END
        WHERE id=@id AND (status='ACTIVE' OR (status='ARCHIVED' AND datetime(closes_at)<=datetime('now')))`)
        .run({id,expires:placement.expiresAt});
    }
  })();
  const canPlace = (board:string,post:any) => {
    if(isBoardArchived(db,board==="houz"?"housing":board as any,post.id))return false;
    if(board==="gigz")return ['LIVE','PENDING'].includes(post.status) && !post.is_remote;
    if(board==="houz")return ['ACTIVE','FILLED'].includes(post.status) && !post.hidden && !post.gone;
    if(board==="mizzed")return post.status==='ACTIVE' || (post.status==='ARCHIVED' && Date.parse(post.closes_at)<=Date.now());
    if(board==="sellz")return ['ACTIVE','RESERVED'].includes(post.status) && (post.status==='RESERVED' || !post.expires_at || Date.parse(post.expires_at)>Date.now());
    return ['OPEN','THREE_INTERESTED','POSTER_CHOOSING','PICKUP_PENDING','REOPENED','LOOKING','OFFER_PENDING'].includes(post.status) && (post.status==='PICKUP_PENDING' || !post.expires_at || Date.parse(post.expires_at)>Date.now());
  };
  app.get("/api/board-map-waypoints", (_req,res) => {res.setHeader("Cache-Control","no-store");res.json(waypoints());});
  app.get("/api/boards/:board/posts/:id/map-location", requireAuth, (req,res) => {
    const board=String(req.params.board),id=Number(req.params.id),post=owner(board,id,req.session.userId!);
    if (!post) return res.status(404).json({error:"Your post could not be found."});
    const placement=readPlacement(db,board,id),window=placementWindow(placement?.firstPlacedAt);
    res.setHeader("Cache-Control","private, no-store");
    const venueId=board==="mizzed"?linkedVenue(post):null;
    res.json({canPlace:canPlace(board,post),reopensPost:board==="mizzed"&&post.status==="ARCHIVED",pending:board==="gigz"&&post.status==="PENDING",placement:placement?.firstPlacedAt ? placement : null,...window,venue:venueId?waypoints().find(w=>w.venueId===venueId):null});
  });
  app.put("/api/boards/:board/posts/:id/map-location", requireAuth, (req,res) => {
    const board=String(req.params.board),id=Number(req.params.id),post=owner(board,id,req.session.userId!);
    if (!post) return res.status(404).json({error:"Your post could not be found."});
    try {
      if(req.body.mapLocation!=null && !canPlace(board,post)) return res.status(400).json({error:"This post is closed, unavailable, or remote. Update the post before placing it on Mapz."});
      const point=validatePlacement(req.body.mapLocation,waypoints(),board==="mizzed"?linkedVenue(post):null,board==="houz");
      save(board,id,point);
      res.setHeader("Cache-Control","private, no-store");res.json({placement:readPlacement(db,board,id) || null});
    } catch(e:any) {res.status(400).json({error:e.message});}
  });
  return {
    validate: (value: unknown, venueId?: number | null, housing = false) => {const point=validatePlacement(value,waypoints(),venueId,housing);if(point)delete point.keepUntil;return point;},
    save,
    venuePoint: (placeId?:number|null,eventId?:number|null) => {
      const venueId=linkedVenue({place_id:placeId,event_id:eventId});
      const point=waypoints().find(w=>w.venueId===venueId);
      return point?{lat:point.lat,lng:point.lng,venueId,days:14}:null;
    },
  };
}
