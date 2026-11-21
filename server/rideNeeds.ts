import type Database from "better-sqlite3";
import type { Express, RequestHandler, Response } from "express";
import type { IStorage } from "./storage";
import { createCircleOf, type SocialCircle } from "./socialCircle";

/**
 * Ride needs (owner, Nov 20): "I NEED A RIDE" posts shown as NEEDS A RIDE
 * wide-short cards in Ridez. Two audiences:
 *  - people going to the same event (need posted from that event card), and
 *  - anyone within NEED_RADIUS_MI who needs a ride right now (posted in the last
 *    NEED_NOW_MS, e.g. at a bar a block away).
 * Exact coordinates never leave the server: cards get a neighborhood, a rounded
 * distance, and the bloom flags (same event / same Afterz) plus the circle bucket.
 */
export const NEED_RADIUS_MI = 2;
export const NEED_NOW_MS = 3 * 3600_000;
const minute = 60_000;

export type RideNeedCard = {
  id: number;
  user: string;
  photoUrl: string | null;
  area: string;
  direction: "arriving" | "departing" | "now";
  mine: boolean;
  sameEvent: boolean;
  sameAfterz: boolean;
  circle: SocialCircle;
  distanceMi: number | null;
};

type NeedRow = { id: number; user_id: number; username: string; event_id: number | null; occurrence: string | null; direction: string; area: string; lat: number | null; lng: number | null; created_at: number };

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 3958.8, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

const validCoord = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function createRideNeeds(db: Database.Database, storage: IStorage) {
  db.exec(`CREATE TABLE IF NOT EXISTS ride_needs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER, occurrence TEXT, direction TEXT NOT NULL, area TEXT NOT NULL,
    lat REAL, lng REAL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS ride_needs_one_per_place ON ride_needs(user_id, IFNULL(event_id,0), IFNULL(occurrence,''));
    CREATE INDEX IF NOT EXISTS ride_needs_by_event ON ride_needs(event_id, occurrence);
    CREATE INDEX IF NOT EXISTS ride_needs_by_time ON ride_needs(expires_at);`);

  const blocked = (a: number, b: number) => storage.getMemberBlockStatus(a, b).interactionBlocked;
  /** Both are host or accepted guest of the same still-open Afterz gathering. */
  const sameAfterz = (a: number, b: number) => {
    try {
      return !!db.prepare(`SELECT 1 FROM afterz_gatherings g WHERE g.closes_at>@now
        AND (g.host_id=@a OR EXISTS(SELECT 1 FROM afterz_guests x WHERE x.gathering_id=g.id AND x.user_id=@a AND x.status='accepted'))
        AND (g.host_id=@b OR EXISTS(SELECT 1 FROM afterz_guests y WHERE y.gathering_id=g.id AND y.user_id=@b AND y.status='accepted')) LIMIT 1`)
        .get({ now: Date.now(), a, b });
    } catch { return false; } // Afterz tables absent (isolated tests)
  };

  return {
    /** Upsert the viewer's need for a place (event occurrence or a bare location). */
    post(user: number, need: { eventId: number | null; occurrence: string | null; direction: string; area: string; lat: number | null; lng: number | null; expiresAt: number }) {
      db.transaction(() => {
        db.prepare("DELETE FROM ride_needs WHERE user_id=? AND IFNULL(event_id,0)=? AND IFNULL(occurrence,'')=?").run(user, need.eventId ?? 0, need.occurrence ?? "");
        db.prepare("INSERT INTO ride_needs(user_id,event_id,occurrence,direction,area,lat,lng,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)")
          .run(user, need.eventId, need.occurrence, need.direction, need.area, need.lat, need.lng, Date.now(), need.expiresAt);
      })();
    },
    remove(user: number, eventId: number | null, occurrence: string | null) {
      return db.prepare("DELETE FROM ride_needs WHERE user_id=? AND IFNULL(event_id,0)=? AND IFNULL(occurrence,'')=?")
        .run(user, eventId ?? 0, occurrence ?? "").changes > 0;
    },
    /** Cards for a viewer: same event occurrence, plus anyone within the radius who needs a ride now. */
    list(viewer: number, scope: { eventId?: number; occurrence?: string; at?: { lat: number; lng: number } | null }): RideNeedCard[] {
      const now = Date.now();
      const rows = db.prepare(`SELECT n.*, u.username FROM ride_needs n JOIN users u ON u.id=n.user_id
        WHERE u.status='active' AND n.expires_at>? ORDER BY n.created_at DESC LIMIT 400`).all(now) as NeedRow[];
      const circleOf = createCircleOf(storage, viewer);
      const at = scope.at && validCoord(scope.at.lat, scope.at.lng) ? scope.at : null;
      const out: RideNeedCard[] = [];
      for (const n of rows) {
        if (n.user_id !== viewer && blocked(viewer, n.user_id)) continue;
        const same = scope.eventId != null && n.event_id === scope.eventId && n.occurrence === scope.occurrence;
        const dist = at && n.lat != null && n.lng != null ? milesBetween(at, { lat: n.lat, lng: n.lng }) : null;
        const nearNow = dist != null && dist <= NEED_RADIUS_MI && n.created_at > now - NEED_NOW_MS;
        if (!same && !nearNow) continue;
        out.push({
          id: n.id, user: n.username, photoUrl: (storage.getUserById(n.user_id) as { photoUrl?: string | null } | undefined)?.photoUrl ?? null, area: n.area,
          direction: n.direction === "departing" ? "departing" : n.direction === "arriving" ? "arriving" : "now",
          mine: n.user_id === viewer, sameEvent: same, sameAfterz: n.user_id !== viewer && sameAfterz(viewer, n.user_id),
          circle: circleOf(n.user_id), distanceMi: same || dist == null ? null : Math.round(dist * 10) / 10,
        });
      }
      return out.slice(0, 60);
    },
    validCoord,
  };
}

export type RideNeeds = ReturnType<typeof createRideNeeds>;

/** Location-only needs (no event), for the Ridez drawer (#117): POST/DELETE/GET /api/ridez/needs. */
export function registerRideNeedRoutes(app: Express, needs: RideNeeds, requireAuth: RequestHandler, moderate: (res: Response, board: string, fields: Record<string, string>) => boolean) {
  app.post("/api/ridez/needs", requireAuth, (req, res) => {
    const { lat, lng } = req.body ?? {};
    const area = typeof req.body?.area === "string" ? req.body.area.trim() : "";
    if (!needs.validCoord(lat, lng) || area.length < 2 || area.length > 80)
      return res.status(400).json({ error: "Share where you are and a neighborhood (2–80 characters)." });
    if (moderate(res, "Ride need", { area })) return;
    needs.post(req.session.userId!, { eventId: null, occurrence: null, direction: "now", area, lat, lng, expiresAt: Date.now() + NEED_NOW_MS });
    res.status(201).json({ ok: true });
  });
  app.delete("/api/ridez/needs/me", requireAuth, (req, res) => {
    needs.remove(req.session.userId!, null, null);
    res.json({ ok: true });
  });
  app.get("/api/ridez/needs", requireAuth, (req, res) => {
    const lat = Number(req.query.lat), lng = Number(req.query.lng);
    res.setHeader("Cache-Control", "private, no-store");
    if (!needs.validCoord(lat, lng)) return res.status(400).json({ error: "lat and lng required" });
    res.json({ needs: needs.list(req.session.userId!, { at: { lat, lng } }), radiusMi: NEED_RADIUS_MI });
  });
}

export const NEED_EXPIRY_AFTER_END_MS = 30 * minute;
