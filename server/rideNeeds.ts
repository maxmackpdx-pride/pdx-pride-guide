import type Database from "better-sqlite3";
import type { Express, RequestHandler, Response } from "express";
import type { IStorage } from "./storage";
import { createCircleOf, type SocialCircle } from "./socialCircle";
import type { RideNotice } from "./nightRides";

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
    CREATE INDEX IF NOT EXISTS ride_needs_by_time ON ride_needs(expires_at);
    CREATE TABLE IF NOT EXISTS ride_need_responses (
      need_id INTEGER NOT NULL REFERENCES ride_needs(id) ON DELETE CASCADE, driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL, lat REAL, lng REAL, located_at INTEGER, arrived_at INTEGER, PRIMARY KEY(need_id, driver_id));`);

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
    need(id: number) {
      return db.prepare("SELECT * FROM ride_needs WHERE id=? AND expires_at>?").get(id, Date.now()) as NeedRow | undefined;
    },
    /** Driver says I'M COMING. Returns false when already on record (no repeat notice). */
    coming(needId: number, driver: number, at: { lat: number; lng: number } | null) {
      return db.prepare(`INSERT INTO ride_need_responses(need_id,driver_id,created_at,lat,lng,located_at) VALUES(?,?,?,?,?,?)
        ON CONFLICT(need_id,driver_id) DO NOTHING`).run(needId, driver, Date.now(), at?.lat ?? null, at?.lng ?? null, at ? Date.now() : null).changes > 0;
    },
    withdraw(needId: number, driver: number) {
      return db.prepare("DELETE FROM ride_need_responses WHERE need_id=? AND driver_id=?").run(needId, driver).changes > 0;
    },
    locate(needId: number, driver: number, at: { lat: number; lng: number }) {
      return db.prepare("UPDATE ride_need_responses SET lat=?,lng=?,located_at=? WHERE need_id=? AND driver_id=?").run(at.lat, at.lng, Date.now(), needId, driver).changes > 0;
    },
    arrived(needId: number, driver: number) {
      return db.prepare("UPDATE ride_need_responses SET arrived_at=? WHERE need_id=? AND driver_id=? AND arrived_at IS NULL").run(Date.now(), needId, driver).changes > 0;
    },
    /** Completed rides a member has given: offers with an accepted rider that left or whose night passed, plus arrived need rides. */
    ridesGiven(driver: number) {
      const today = new Date().toISOString().slice(0, 10);
      let offers = 0;
      try {
        offers = (db.prepare(`SELECT count(*) AS n FROM event_ride_offers o WHERE o.driver_id=?
          AND EXISTS(SELECT 1 FROM event_ride_requests r WHERE r.offer_id=o.id AND r.accepted=1)
          AND (o.occurrence<? OR EXISTS(SELECT 1 FROM night_ride_plans p WHERE p.offer_id=o.id AND p.departed IS NOT NULL))`).get(driver, today) as { n: number }).n;
      } catch { offers = 0; }
      const needs = (db.prepare("SELECT count(*) AS n FROM ride_need_responses WHERE driver_id=? AND arrived_at IS NOT NULL").get(driver) as { n: number }).n;
      return offers + needs;
    },
    /** Rider side: who is coming to each of my live needs. Rounded distance only, never coordinates. */
    whosComing(rider: number): WhosComing[] {
      const mine = db.prepare("SELECT * FROM ride_needs WHERE user_id=? AND expires_at>? ORDER BY created_at DESC").all(rider, Date.now()) as NeedRow[];
      return mine.map(n => ({
        needId: n.id, area: n.area, eventId: n.event_id, direction: (n.direction === "departing" ? "departing" : n.direction === "arriving" ? "arriving" : "now") as RideNeedCard["direction"],
        drivers: (db.prepare(`SELECT r.*, u.username FROM ride_need_responses r JOIN users u ON u.id=r.driver_id
          WHERE r.need_id=? AND u.status='active' ORDER BY r.created_at`).all(n.id) as (ResponseRow & { username: string })[])
          .filter(r => !blocked(rider, r.driver_id))
          .map(r => ({
            user: r.username,
            photoUrl: (storage.getUserById(r.driver_id) as { photoUrl?: string | null } | undefined)?.photoUrl ?? null,
            ridesGiven: this.ridesGiven(r.driver_id),
            distanceMi: r.lat != null && r.lng != null && n.lat != null && n.lng != null ? Math.round(milesBetween({ lat: r.lat, lng: r.lng }, { lat: n.lat, lng: n.lng }) * 10) / 10 : null,
            locatedAt: r.located_at, since: r.created_at, arrived: r.arrived_at != null,
          })),
      }));
    },
  };
}

type ResponseRow = { need_id: number; driver_id: number; created_at: number; lat: number | null; lng: number | null; located_at: number | null; arrived_at: number | null };
export type WhosComing = {
  needId: number; area: string; eventId: number | null; direction: RideNeedCard["direction"];
  drivers: { user: string; photoUrl: string | null; ridesGiven: number; distanceMi: number | null; locatedAt: number | null; since: number; arrived: boolean }[];
};

export type RideNeeds = ReturnType<typeof createRideNeeds>;

/** Location-only needs (no event), for the Ridez drawer (#117): POST/DELETE/GET /api/ridez/needs. */
export function registerRideNeedRoutes(app: Express, needs: RideNeeds, storage: IStorage, requireAuth: RequestHandler, moderate: (res: Response, board: string, fields: Record<string, string>) => boolean,
  opts: { notify?: RideNotice; startWatch?: (key: number, user: number, body: Record<string, unknown>) => { error: string } | { dueAt: number } } = {}) {
  const coord = (body: Record<string, unknown> | undefined) => (body && validCoord(body.lat, body.lng) ? { lat: body.lat as number, lng: body.lng as number } : null);
  /** Needs a live need the driver may answer (not their own, not blocked). */
  const answerable = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => {
    const need = needs.need(Number(req.params.id));
    const me = req.session.userId!;
    if (!need || need.user_id === me || storage.getMemberBlockStatus(me, need.user_id).interactionBlocked) {
      res.status(404).json({ error: "Ride need unavailable" });
      return null;
    }
    return need;
  };
  const link = (need: { event_id: number | null }) => (need.event_id ? `/events/${need.event_id}?night=rides` : "/inbox");
  // I'M COMING (owner, Nov 20): the driver tells the rider; in-app inbox note + push to the rider only.
  app.post("/api/ridez/needs/:id/coming", requireAuth, (req, res) => {
    const need = answerable(req, res);
    if (!need) return;
    const me = req.session.userId!, driver = storage.getUserById(me);
    if (!needs.coming(need.id, me, coord(req.body))) return res.json({ ok: true, already: true });
    const title = `@${driver?.username ?? "A driver"} is coming`;
    const body = `@${driver?.username ?? "A driver"} saw that you need a ride from ${need.area} and is on the way. Open Ridez to see who's coming.`;
    storage.sendMessage(me, need.user_id, title, body, { contextType: "THREAD" });
    opts.notify?.([need.user_id], me, title, "Open Ridez to see who's coming.", link(need), `need-coming-${need.id}-${me}`);
    res.status(201).json({ ok: true });
  });
  app.delete("/api/ridez/needs/:id/coming", requireAuth, (req, res) => {
    needs.withdraw(Number(req.params.id), req.session.userId!);
    res.json({ ok: true });
  });
  app.put("/api/ridez/needs/:id/coming/location", requireAuth, (req, res) => {
    const at = coord(req.body);
    if (!at) return res.status(400).json({ error: "Invalid location." });
    if (!needs.locate(Number(req.params.id), req.session.userId!, at)) return res.status(404).json({ error: "You haven't said you're coming." });
    res.json({ updated: true });
  });
  app.post("/api/ridez/needs/:id/coming/arrived", requireAuth, (req, res) => {
    const need = answerable(req, res);
    if (!need) return;
    const me = req.session.userId!;
    if (!needs.arrived(need.id, me)) return res.status(409).json({ error: "Say I'M COMING first (or arrival already sent)." });
    const driver = storage.getUserById(me);
    opts.notify?.([need.user_id], me, `@${driver?.username ?? "Your driver"} is here`, "Your ride has arrived.", link(need), `need-arrived-${need.id}-${me}`);
    res.json({ arrived: true });
  });
  // Rider side: who's coming (avatar, rides given, rounded distance for the ETA).
  app.get("/api/ridez/needs/mine/coming", requireAuth, (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ needs: needs.whosComing(req.session.userId!) });
  });
  // Safety check-in for a need ride: the existing ride-check (reminders, trusted contacts, escalation).
  app.post("/api/ridez/needs/:id/watch", requireAuth, (req, res) => {
    const need = needs.need(Number(req.params.id));
    const me = req.session.userId!;
    if (!need || need.user_id !== me) return res.status(404).json({ error: "Ride need unavailable" });
    if (!needs.whosComing(me).some(n => n.needId === need.id && n.drivers.length)) return res.status(409).json({ error: "Start a check-in once someone is coming." });
    if (!opts.startWatch) return res.status(503).json({ error: "Safety check-in unavailable" });
    const result = opts.startWatch(-need.id, me, req.body ?? {});
    if ("error" in result) return res.status(400).json(result);
    res.json({ ...result, check: -need.id });
  });
  // Fuel estimate inputs (estimate only; configurable, no live price source wired).
  app.get("/api/ridez/fuel", (_req, res) => res.json(fuelConfig()));
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

/** Fuel estimate inputs (owner, Nov 20). No keyless public Portland gas-price API is wired, so the
 *  price is a configurable constant (RIDEZ_GAS_PRICE_USD) and the UI always labels it "est.". */
export function fuelConfig() {
  const price = Number(process.env.RIDEZ_GAS_PRICE_USD);
  const mpg = Number(process.env.RIDEZ_AVG_MPG);
  return {
    pricePerGallon: Number.isFinite(price) && price > 0 ? price : 4.5,
    mpg: Number.isFinite(mpg) && mpg > 0 ? mpg : 25,
    source: Number.isFinite(price) && price > 0 ? "configured" : "default-constant",
    label: "est.",
  };
}
