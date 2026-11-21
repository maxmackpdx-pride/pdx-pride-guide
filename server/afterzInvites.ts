import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import { moderateFields, moderationMessage } from "@shared/contentModeration";
import { afterzClosesAt } from "@shared/afterzWindow";

import { afterzNights, type NightCatalog } from "./afterzNights";

export { afterzClosesAt } from "@shared/afterzWindow";

type State = "waitlisted" | "pending" | "accepted" | "declined" | "revoked";
type Gathering = {
  id: string;
  hostId: number;
  hostName: string;
  title: string;
  closesAt: number;
};
const requestKey = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(value);

export function registerAfterzInvites(
  app: Express,
  db: Database.Database,
  auth: RequestHandler,
  now = Date.now,
  catalog?: NightCatalog,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS afterz_gatherings (
      id TEXT PRIMARY KEY, host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, closes_at INTEGER NOT NULL, request_key TEXT NOT NULL, UNIQUE(host_id, request_key)
    );
    CREATE INDEX IF NOT EXISTS idx_afterz_closes ON afterz_gatherings(closes_at);
    CREATE TABLE IF NOT EXISTS afterz_guests (
      gathering_id TEXT NOT NULL REFERENCES afterz_gatherings(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL,
      PRIMARY KEY(gathering_id,user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_afterz_guest_user ON afterz_guests(user_id,gathering_id);
    CREATE TABLE IF NOT EXISTS afterz_chat (
      id INTEGER PRIMARY KEY, gathering_id TEXT NOT NULL REFERENCES afterz_gatherings(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at INTEGER NOT NULL,
      request_key TEXT NOT NULL, UNIQUE(gathering_id,sender_id,request_key)
    );
    CREATE TABLE IF NOT EXISTS afterz_private_locations (
      gathering_id TEXT PRIMARY KEY REFERENCES afterz_gatherings(id) ON DELETE CASCADE,
      address TEXT NOT NULL, lat REAL, lng REAL
    );
    CREATE INDEX IF NOT EXISTS idx_afterz_chat_history ON afterz_chat(gathering_id,id);
  `);
  const nights = afterzNights(app, db, auth, now, catalog);
  // No dependency on the connection's foreign_keys setting for room erasure.
  const erase = db.transaction((id: string) => {
    nights.erase(id);
    db.prepare("DELETE FROM afterz_private_locations WHERE gathering_id=?").run(
      id,
    );
    db.prepare("DELETE FROM afterz_chat WHERE gathering_id=?").run(id);
    db.prepare("DELETE FROM afterz_guests WHERE gathering_id=?").run(id);
    db.prepare("DELETE FROM afterz_gatherings WHERE id=?").run(id);
  });
  const expire = () => {
    for (const { id } of db
      .prepare("SELECT id FROM afterz_gatherings WHERE closes_at<=?")
      .all(now()) as { id: string }[])
      erase(id);
  };
  expire();
  const expiry = setInterval(() => {
    expire();
    nights.remind();
  }, 60_000);
  expiry.unref();
  const route = "/api/afterz/gatherings";
  const projection = `SELECT g.id,g.host_id AS hostId,g.title,g.closes_at AS closesAt,
    COALESCE(NULLIF(u.display_name,''),u.username) AS hostName FROM afterz_gatherings g JOIN users u ON u.id=g.host_id`;
  const room = (id: string) =>
    db
      .prepare(
        projection + " WHERE g.id=? AND g.closes_at>? AND u.status='active'",
      )
      .get(id, now()) as Gathering | undefined;
  const blocked = (first: number, second: number) =>
    Boolean(
      db
        .prepare(
          "SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=?) OR (blocker_user_id=? AND blocked_user_id=?) LIMIT 1",
        )
        .get(first, second, second, first),
    );
  const status = (id: string, userId: number) =>
    (
      db
        .prepare(
          "SELECT status FROM afterz_guests WHERE gathering_id=? AND user_id=?",
        )
        .get(id, userId) as { status: State } | undefined
    )?.status;
  const liveUser = (id?: number) =>
    id &&
    db.prepare("SELECT 1 FROM users WHERE id=? AND status='active'").get(id)
      ? id
      : 0;
  app.use(route, (req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    res.vary("Cookie");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (!req.is("application/json") ||
        req.get("Sec-Fetch-Site") === "cross-site")
    )
      return res.status(403).json({ error: "Open this gathering in Zaylist." });
    next();
  });
  app.get(route, auth, (req, res) => {
    const userId = liveUser(req.session.userId);
    if (!userId)
      return res.status(403).json({ error: "An active account is required." });
    const rows = db
      .prepare(
        projection +
          ` LEFT JOIN afterz_guests a ON a.gathering_id=g.id AND a.user_id=?
      WHERE (g.host_id=? OR a.user_id IS NOT NULL) AND g.closes_at>? AND u.status='active' ORDER BY g.closes_at,g.title`,
      )
      .all(userId, userId, now()) as Gathering[];
    res.json(
      rows
        .filter((g) => !blocked(g.hostId, userId))
        .map((g) => ({
          id: g.id,
          title: g.title,
          closesAt: g.closesAt,
          role: g.hostId === userId ? "host" : status(g.id, userId),
        })),
    );
  });
  app.post(route, auth, (req, res) => {
    const userId = req.session.userId!,
      title = String(req.body?.title ?? "").trim(),
      key = req.body?.requestId;
    if (
      req.body?.confirmed18 !== true ||
      !title ||
      title.length > 80 ||
      !requestKey(key)
    )
      return res.status(400).json({
        error:
          "Confirm you are 18 or older and enter a gathering title of up to 80 characters.",
      });
    const decision = moderateFields({ title });
    if (decision.verdict === "BLOCK")
      return res.status(400).json({
        error: moderationMessage(decision.reasons[0]?.category || "ABUSE"),
      });
    const existing = db
      .prepare(
        "SELECT id FROM afterz_gatherings WHERE host_id=? AND request_key=?",
      )
      .get(userId, key) as { id: string } | undefined;
    if (existing) return res.json(existing);
    const eventId = req.body?.eventId;
    const date = req.body?.occurrence;
    let closesAt = afterzClosesAt(now());
    if (eventId != null) {
      const event = Number.isSafeInteger(eventId) && catalog?.event(eventId);
      const times = event && nights.timing(event, date);
      const { capacity, poster, vibe } = req.body;
      if (
        !times ||
        !Number.isSafeInteger(capacity) ||
        capacity < 1 ||
        capacity > 500 ||
        !["chill", "party", "social"].includes(vibe) ||
        (poster != null &&
          !/^\/uploads\/[\w.-]+\.(png|jpe?g|gif|webp)$/i.test(poster))
      ) {
        return res.status(400).json({
          error:
            "Choose an event within three days, a vibe, and 1–500 guest spots.",
        });
      }
      closesAt = times.closesAt;
    }
    const id = randomUUID();
    db.transaction(() => {
      db.prepare(
        "INSERT INTO afterz_gatherings(id,host_id,title,closes_at,request_key) VALUES(?,?,?,?,?)",
      ).run(id, userId, title, closesAt, key);
      if (eventId != null) nights.save(id, eventId, date, req.body);
      nights.confirm(userId);
    })();
    res.status(201).json({ id });
  });
  const find: RequestHandler = (req, res, next) => {
    const g = room(String(req.params.id));
    const actor = liveUser(req.session?.userId);
    const night = g && nights.get(g.id);
    if (
      !g ||
      (night && !nights.live(night)) ||
      (actor && blocked(g.hostId, actor))
    )
      return res
        .status(404)
        .json({ error: "This gathering is closed or unavailable." });
    res.locals.room = g;
    res.locals.actor = actor;
    next();
  };
  const host: RequestHandler = (_req, res, next) =>
    res.locals.actor === res.locals.room.hostId
      ? next()
      : void res
          .status(403)
          .json({ error: "Only the host can manage this gathering." });
  const participant: RequestHandler = (_req, res, next) => {
    const { actor, room: g } = res.locals;
    if (g.hostId !== actor && status(g.id, actor) !== "accepted")
      return res.status(403).json({
        error: "Accepted guests and the host can enter this conversation.",
      });
    next();
  };
  app.get(route + "/:id", find, (_req, res) => {
    const g = res.locals.room as Gathering,
      who = Number(res.locals.actor);
    const role =
      who === g.hostId
        ? "host"
        : who
          ? (status(g.id, who) ?? "guest")
          : "guest";
    const requests =
      role === "host"
        ? db
            .prepare(
              `SELECT a.user_id AS userId,COALESCE(NULLIF(u.display_name,''),u.username) AS name,a.status,EXISTS(SELECT 1 FROM afterz_seconds s WHERE s.gathering_id=a.gathering_id AND s.user_id=a.user_id) AS renewed
      FROM afterz_guests a JOIN users u ON u.id=a.user_id WHERE a.gathering_id=? AND a.status IN ('waitlisted','pending','accepted') AND u.status='active' ORDER BY a.rowid`,
            )
            .all(g.id)
            .filter(
              (row) =>
                !blocked(g.hostId, Number((row as { userId: number }).userId)),
            )
        : undefined;
    res.json({
      id: g.id,
      title: g.title,
      hostName: g.hostName,
      closesAt: g.closesAt,
      role,
      requests,
      ...(who && nights.adult(who) && nights.get(g.id)
        ? {
            night: nights.get(g.id),
            renewed: !!db
              .prepare(
                "SELECT 1 FROM afterz_seconds WHERE gathering_id=? AND user_id=?",
              )
              .get(g.id, who),
          }
        : {}),
    });
  });
  app.post(route + "/:id/request", auth, find, (req, res) => {
    const g = res.locals.room as Gathering,
      who = Number(res.locals.actor);
    if (req.body?.confirmed18 !== true)
      return res
        .status(400)
        .json({ error: "Confirm you are 18 or older to request an invite." });
    if (g.hostId === who)
      return res.status(409).json({ error: "You host this gathering." });
    const previous = status(g.id, who);
    if (previous === "declined" || previous === "revoked")
      return res
        .status(403)
        .json({ error: "The host has closed this request." });
    nights.confirm(who);
    const state = nights.full(g.id) ? "waitlisted" : "pending";
    db.prepare(
      "INSERT OR IGNORE INTO afterz_guests(gathering_id,user_id,status) VALUES(?,?,?)",
    ).run(g.id, who, state);
    res.json({ status: previous ?? state });
  });
  app.post(route + "/:id/second", auth, find, (_req, res) => {
    const { room: g, actor } = res.locals;
    if (status(g.id, actor) !== "waitlisted")
      return res
        .status(409)
        .json({ error: "Only waitlisted guests can renew a request." });
    db.prepare("INSERT OR IGNORE INTO afterz_seconds VALUES(?,?)").run(
      g.id,
      actor,
    );
    res.json({ renewed: true });
  });
  app.post(route + "/:id/capacity", auth, find, host, (req, res) => {
    const capacity = req.body.capacity,
      id = res.locals.room.id;
    if (
      !nights.get(id) ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 500
    )
      return res.status(400).json({ error: "Choose 1–500 guest spots." });
    const changed = db
      .prepare(
        "UPDATE afterz_nights SET capacity=? WHERE gathering_id=? AND ? >= (SELECT COUNT(*) FROM afterz_guests WHERE gathering_id=? AND status='accepted')",
      )
      .run(capacity, id, capacity, id);
    if (!changed.changes)
      return res
        .status(409)
        .json({ error: "Capacity must include confirmed guests." });
    res.json({ capacity });
  });
  app.post(route + "/:id/guests/:userId", auth, find, host, (req, res) => {
    const id = String(req.params.id),
      who = Number(req.params.userId),
      next = req.body?.status;
    if (
      !["accepted", "declined", "revoked"].includes(next) ||
      !liveUser(who) ||
      blocked(who, res.locals.actor)
    )
      return res.status(400).json({ error: "Guest unavailable." });
    const prev = status(id, who);
    if (prev === next) return res.json({ status: next });
    if (
      next === "revoked"
        ? prev !== "accepted"
        : prev !== "pending" && prev !== "waitlisted"
    )
      return res
        .status(409)
        .json({ error: "Guest status changed. Refresh the gathering." });
    if (next === "accepted" && nights.full(id)) {
      db.prepare(
        "UPDATE afterz_guests SET status='waitlisted' WHERE gathering_id=? AND user_id=? AND status='pending'",
      ).run(id, who);
      return res
        .status(409)
        .json({ error: "Room full. This guest is on the waitlist." });
    }
    db.prepare(
      "UPDATE afterz_guests SET status=? WHERE gathering_id=? AND user_id=? AND status=?",
    ).run(next, id, who, prev);
    if (next === "accepted" && nights.full(id))
      db.prepare(
        "UPDATE afterz_guests SET status='waitlisted' WHERE gathering_id=? AND status='pending'",
      ).run(id);
    res.json({ status: next });
  });
  app.post(route + "/:id/leave", auth, find, (_req, res) => {
    db.prepare(
      "DELETE FROM afterz_guests WHERE gathering_id=? AND user_id=? AND status IN ('waitlisted','pending','accepted')",
    ).run(res.locals.room.id, res.locals.actor);
    res.json({ left: true });
  });
  app.post(route + "/:id/close", auth, find, host, (_req, res) => {
    erase(res.locals.room.id);
    res.json({ closed: true });
  });
  const privatePin = route + "/:id/chat/location";
  const readLocation = (id: string) =>
    db
      .prepare(
        "SELECT address, lat, lng FROM afterz_private_locations WHERE gathering_id=?",
      )
      .get(id) as
      | { address: string; lat: number | null; lng: number | null }
      | undefined;
  app.get(privatePin, auth, find, participant, (_req, res) => {
    res.json({
      location: readLocation(res.locals.room.id) ?? null,
      expiresAt: res.locals.room.closesAt,
    });
  });
  app.get(privatePin + "/directions", auth, find, participant, (_req, res) => {
    const location = readLocation(res.locals.room.id);
    if (!location) return res.sendStatus(404);
    const url = new URL("https://maps.apple.com/");
    url.searchParams.set(
      "daddr",
      location.lat !== null && location.lng !== null
        ? [location.lat, location.lng].join(",")
        : location.address,
    );
    res.set("Referrer-Policy", "no-referrer").redirect(302, url.href);
  });
  app.put(privatePin, auth, find, host, (req, res) => {
    const address =
      typeof req.body.address === "string" ? req.body.address.trim() : "";
    const { lat = null, lng = null } = req.body;
    const coordinates = lat !== null || lng !== null;
    if (
      req.body.confirm !== true ||
      address.length > 240 ||
      (!address && !coordinates) ||
      (coordinates &&
        (!Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180))
    ) {
      return res
        .status(400)
        .json({ error: "Confirm a private address or a complete map pin." });
    }
    db.prepare(
      `INSERT INTO afterz_private_locations VALUES(?,?,?,?) ON CONFLICT(gathering_id)
      DO UPDATE SET address=excluded.address,lat=excluded.lat,lng=excluded.lng`,
    ).run(res.locals.room.id, address, lat, lng);
    res.json({ saved: true });
  });
  app.delete(privatePin, auth, find, host, (_req, res) => {
    db.prepare("DELETE FROM afterz_private_locations WHERE gathering_id=?").run(
      res.locals.room.id,
    );
    res.json({ removed: true });
  });
  app.get(route + "/:id/chat", auth, find, participant, (_req, res) => {
    const rows = db
      .prepare(
        `SELECT m.id,m.body,m.created_at AS createdAt,COALESCE(NULLIF(u.display_name,''),u.username) AS name
      FROM afterz_chat m JOIN users u ON u.id=m.sender_id WHERE m.gathering_id=? AND NOT EXISTS
      (SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=m.sender_id)
      OR (b.blocked_user_id=? AND b.blocker_user_id=m.sender_id)) ORDER BY m.id DESC LIMIT 100`,
      )
      .all(res.locals.room.id, res.locals.actor, res.locals.actor);
    res.json(rows.reverse());
  });
  app.post(route + "/:id/chat", auth, find, participant, (req, res) => {
    const text = typeof req.body?.body === "string" ? req.body.body.trim() : "",
      key = req.body?.requestId;
    if (!text || text.length > 1000 || !requestKey(key))
      return res
        .status(400)
        .json({ error: "Enter a message of up to 1,000 characters." });
    const decision = moderateFields({ body: text });
    if (decision.verdict === "BLOCK")
      return res.status(400).json({
        error: moderationMessage(decision.reasons[0]?.category || "ABUSE"),
      });
    db.prepare(
      "INSERT INTO afterz_chat(gathering_id,sender_id,body,created_at,request_key) VALUES(?,?,?,?,?) ON CONFLICT(gathering_id,sender_id,request_key) DO NOTHING",
    ).run(res.locals.room.id, res.locals.actor, text, now(), key);
    res.json({ saved: true });
  });
  return { remind: nights.remind, dispose: () => clearInterval(expiry) };
}
