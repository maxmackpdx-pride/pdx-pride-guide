import { createHash, randomUUID } from "node:crypto";
import { hasRegistrationOnlyLocation } from "@shared/registrationOnlyVenue";
import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import type { Event } from "@shared/schema";
import { haversineMeters } from "@shared/geo";
import { parsePacificDateTime } from "@shared/missedConnections";
import type { IStorage } from "./storage";

export type RideNotice = (
  ids: number[],
  sender: number,
  title: string,
  body: string,
  path: string,
  tag: string,
) => void;
type RidePlan = {
  kind: "carpool" | "home" | "afterz";
  meeting: string;
  leaveBy: number | null;
  oneWay: boolean;
  gathering: string | null;
};
type Meta = {
  offer_id: number;
  kind: RidePlan["kind"];
  meeting: string;
  leave_by: number | null;
  one_way: number;
  gathering: string | null;
  departed: number | null;
};
type Offer = {
  id: number;
  driver_id: number;
  area: string;
  event_id: number;
  occurrence: string;
};
const minute = 60_000;
const sessionReference = (sessionId: string) =>
  createHash("sha256").update(sessionId).digest("hex");
const coordsValid = (lat: unknown, lng: unknown) =>
  typeof lat === "number" &&
  Number.isFinite(lat) &&
  Math.abs(lat) <= 90 &&
  typeof lng === "number" &&
  Number.isFinite(lng) &&
  Math.abs(lng) <= 180;

export function registerNightRides(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  auth: RequestHandler,
  scope: RequestHandler,
  path: string,
  notify?: RideNotice,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS night_ride_plans(offer_id INTEGER PRIMARY KEY REFERENCES event_ride_offers(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,meeting TEXT NOT NULL,leave_by INTEGER,one_way INTEGER NOT NULL,gathering TEXT,departed INTEGER);
    CREATE TABLE IF NOT EXISTS night_venue_presence(event_id INTEGER NOT NULL,occurrence TEXT NOT NULL,user_id INTEGER NOT NULL,
      checked_at INTEGER NOT NULL,home_area TEXT NOT NULL,PRIMARY KEY(event_id,occurrence,user_id));
    CREATE TABLE IF NOT EXISTS night_foreground_checks(event_id INTEGER NOT NULL,occurrence TEXT NOT NULL,user_id INTEGER NOT NULL,
      lease TEXT NOT NULL,session_ref TEXT NOT NULL,expires_at INTEGER NOT NULL,checked_at INTEGER,home_area TEXT NOT NULL,PRIMARY KEY(event_id,occurrence,user_id));
    CREATE VIEW IF NOT EXISTS night_matching_presence AS
      SELECT event_id,occurrence,user_id,home_area,checked_at,checked_at+1800000 AS valid_until FROM night_venue_presence
      UNION ALL
      SELECT event_id,occurrence,user_id,home_area,checked_at,MIN(expires_at,checked_at+90000) AS valid_until
      FROM night_foreground_checks WHERE checked_at IS NOT NULL;
    CREATE TABLE IF NOT EXISTS night_ride_notices(offer_id INTEGER NOT NULL,user_id INTEGER NOT NULL,PRIMARY KEY(offer_id,user_id));
    CREATE TABLE IF NOT EXISTS night_ride_watches(offer_id INTEGER NOT NULL,user_id INTEGER NOT NULL,contact_id INTEGER NOT NULL,
      due_at INTEGER NOT NULL,stage INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL,lat REAL,lng REAL,located_at INTEGER,PRIMARY KEY(offer_id,user_id));
    CREATE TABLE IF NOT EXISTS night_watch_contacts(offer_id INTEGER NOT NULL,user_id INTEGER NOT NULL,contact_id INTEGER NOT NULL,PRIMARY KEY(offer_id,user_id,contact_id));
    CREATE INDEX IF NOT EXISTS due_ride_watches ON night_ride_watches(next_at);
  `);
  const plan = (offer: number) =>
    db.prepare("SELECT * FROM night_ride_plans WHERE offer_id=?").get(offer) as
      | Meta
      | undefined;
  const attendance = (eventId: number, user: number) =>
    !!db
      .prepare(
        "SELECT 1 FROM attendances WHERE event_id=? AND user_id=? AND is_active=1 AND (expires_at IS NULL OR expires_at>?)",
      )
      .get(eventId, user, new Date().toISOString());
  const present = (eventId: number, date: string, user: number) =>
    db
      .prepare(
        "SELECT home_area AS area FROM night_matching_presence WHERE event_id=? AND occurrence=? AND user_id=? AND valid_until>? ORDER BY checked_at DESC LIMIT 1",
      )
      .get(eventId, date, user, Date.now()) as { area: string } | undefined;
  const afterzMember = (
    gathering: string,
    eventId: number,
    date: string,
    user: number,
  ) =>
    !!db
      .prepare(
        `SELECT 1 FROM afterz_gatherings g JOIN afterz_nights n ON n.gathering_id=g.id
    WHERE n.event_id=? AND n.occurrence=? AND g.id=? AND g.closes_at>? AND (g.host_id=? OR EXISTS(SELECT 1 FROM afterz_guests a WHERE a.gathering_id=g.id AND a.user_id=? AND a.status='accepted')) AND NOT EXISTS
    (SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=g.host_id) OR (b.blocked_user_id=? AND b.blocker_user_id=g.host_id))`,
      )
      .get(eventId, date, gathering, Date.now(), user, user, user, user);
  const member = (offer: number, user: number) =>
    !!db
      .prepare(
        "SELECT 1 FROM event_ride_requests WHERE offer_id=? AND rider_id=? AND accepted=1",
      )
      .get(offer, user);
  function visible(o: Offer, m: Meta | undefined, user: number) {
    if (!m || m.kind === "carpool" || o.driver_id === user) return true;
    if (
      m.kind === "afterz" &&
      (!m.gathering ||
        !afterzMember(m.gathering, o.event_id, o.occurrence, user))
    )
      return false;
    if (member(o.id, user)) return true;
    if (!attendance(o.event_id, user)) return false;
    const p = present(o.event_id, o.occurrence, user);
    return (
      !!p &&
      (m.kind === "afterz" ||
        p.area.trim().toLowerCase() === o.area.trim().toLowerCase())
    );
  }
  const offer = (id: number) =>
    db.prepare("SELECT * FROM event_ride_offers WHERE id=?").get(id) as
      | Offer
      | undefined;
  function announce() {
    if (!notify) return;
    const offers = db
      .prepare(
        "SELECT offer_id FROM night_ride_plans WHERE kind IN ('afterz','home') AND departed IS NULL AND leave_by>?",
      )
      .all(Date.now()) as { offer_id: number }[];
    for (const id of offers) {
      const o = offer(id.offer_id),
        m = plan(id.offer_id);
      if (!o || !m) continue;
      const event = storage.getEvent(o.event_id);
      if (!event || event.isHouseParty || hasRegistrationOnlyLocation(event))
        continue;
      const candidates = db
        .prepare(
          `SELECT DISTINCT p.user_id FROM night_matching_presence p JOIN users u ON u.id=p.user_id AND u.status='active'
        WHERE p.event_id=? AND p.occurrence=? AND p.user_id<>? AND p.valid_until>? AND NOT EXISTS(SELECT 1 FROM night_ride_notices n WHERE n.offer_id=? AND n.user_id=p.user_id)`,
        )
        .all(o.event_id, o.occurrence, o.driver_id, Date.now(), o.id) as {
        user_id: number;
      }[];
      const ids = candidates
        .map((c) => c.user_id)
        .filter(
          (u) =>
            visible(o, m, u) &&
            !storage.getMemberBlockStatus(u, o.driver_id).interactionBlocked,
        );
      if (!ids.length) continue;
      notify(
        ids,
        o.driver_id,
        m.kind === "afterz" ? "A ride to Afterz" : "A ride home",
        "A group ride is leaving in " +
          Math.max(1, Math.ceil((m.leave_by! - Date.now()) / minute)) +
          " min.",
        "/events/" + o.event_id + "?night=rides",
        "ride-" + o.id,
      );
      db.transaction(() => {
        for (const user of ids)
          db.prepare(
            "INSERT OR IGNORE INTO night_ride_notices VALUES(?,?)",
          ).run(o.id, user);
      })();
    }
  }
  function watches() {
    const now = Date.now();
    const due = db
      .prepare(
        "SELECT * FROM night_ride_watches WHERE next_at<=? ORDER BY next_at LIMIT 100",
      )
      .all(now) as {
      offer_id: number;
      user_id: number;
      contact_id: number;
      stage: number;
      lat: number | null;
      lng: number | null;
      located_at: number | null;
    }[];
    for (const w of due) {
      const e = offer(w.offer_id);
      if (w.stage < 3) {
        notify?.(
          [w.user_id],
          0,
          "Ride check-in due",
          "Open your safety check and confirm you arrived.",
          "/events/" + (e?.event_id ?? "") + "?night=safety",
          "ride-check-" + w.offer_id + "-" + w.stage,
        );
        db.prepare(
          "UPDATE night_ride_watches SET next_at=?,stage=stage+1 WHERE offer_id=? AND user_id=?",
        ).run(now + minute, w.offer_id, w.user_id);
      } else {
        const rider = storage.getUserById(w.user_id);
        const contacts = (
          db
            .prepare(
              "SELECT contact_id FROM night_watch_contacts WHERE offer_id=? AND user_id=?",
            )
            .all(w.offer_id, w.user_id) as { contact_id: number }[]
        ).map((c) => c.contact_id);
        if (!contacts.length) contacts.push(w.contact_id);
        db.transaction(() => {
          for (const contactId of contacts) {
            const contact = storage.getUserById(contactId);
            if (
              contact?.status === "active" &&
              rider?.status === "active" &&
              !storage.getMemberBlockStatus(w.user_id, contactId)
                .interactionBlocked
            ) {
              const position =
                w.lat != null && w.lng != null && w.located_at
                  ? " Last shared location at " +
                    new Date(w.located_at).toISOString() +
                    ": https://maps.apple.com/?ll=" +
                    w.lat +
                    "," +
                    w.lng
                  : " No location was shared.";
              storage.sendMessage(
                w.user_id,
                contactId,
                "Missed ride check-in",
                rider.username +
                  " asked Zaylist to notify you if they missed their ride check-in." +
                  position,
                { contextType: "THREAD" },
              );
            }
          }
          db.prepare(
            "DELETE FROM night_watch_contacts WHERE offer_id=? AND user_id=?",
          ).run(w.offer_id, w.user_id);
          db.prepare(
            "DELETE FROM night_ride_watches WHERE offer_id=? AND user_id=?",
          ).run(w.offer_id, w.user_id);
        })();
      }
    }
    db.prepare("DELETE FROM night_foreground_checks WHERE expires_at<=?").run(
      now,
    );
    db.prepare("DELETE FROM night_venue_presence WHERE checked_at<=?").run(
      now - 30 * minute,
    );
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  if (notify) {
    timer = setInterval(() => {
      try {
        watches();
        announce();
      } catch (err) {
        console.error("[night] ride notification check failed", err);
      }
    }, 30_000);
    timer.unref();
  }
  const clearManual = db.prepare(
    "DELETE FROM night_venue_presence WHERE event_id=? AND occurrence=? AND user_id=?",
  );
  const clearForeground = db.prepare(
    "DELETE FROM night_foreground_checks WHERE event_id=? AND occurrence=? AND user_id=?",
  );
  const allowCheck: RequestHandler = (req, res, next) => {
    const event = res.locals.event as Event;
    const now = Date.now();
    const start = parsePacificDateTime(event.dateStart);
    const end = parsePacificDateTime(event.dateEnd);
    if (
      event.isHouseParty ||
      hasRegistrationOnlyLocation(event) ||
      !coordsValid(event.lat, event.lng)
    )
      return void res
        .status(409)
        .json({ error: "GPS check-in is unavailable for this event." });
    if (
      start == null ||
      end == null ||
      now < start - 30 * minute ||
      now >= end + 30 * minute ||
      !attendance(event.id, req.session.userId!)
    )
      return void res
        .status(409)
        .json({ error: "RSVP and check in during this event." });
    res.locals.checkUntil = Math.min(end + 30 * minute, now + 60 * minute);
    next();
  };
  app.post(
    path + "/presence/foreground",
    auth,
    scope,
    allowCheck,
    (req, res) => {
      const { area, consent } = req.body;
      if (consent !== true || typeof area !== "string" || area.length > 80)
        return res
          .status(400)
          .json({ error: "Choose automatic check-in for this event." });
      const eventId = res.locals.event.id,
        date = res.locals.date,
        user = req.session.userId!;
      const lease = randomUUID(),
        expiresAt = res.locals.checkUntil;
      db.transaction(() => {
        clearManual.run(eventId, date, user);
        db.prepare(
          `INSERT INTO night_foreground_checks(event_id,occurrence,user_id,lease,session_ref,expires_at,home_area)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(event_id,occurrence,user_id)
        DO UPDATE SET lease=excluded.lease,session_ref=excluded.session_ref,expires_at=excluded.expires_at,checked_at=NULL,home_area=excluded.home_area`,
        ).run(
          eventId,
          date,
          user,
          lease,
          sessionReference(req.sessionID),
          expiresAt,
          area.trim(),
        );
      })();
      res.json({ lease, expiresAt });
    },
  );
  app.delete(path + "/presence/foreground/:lease", auth, (req, res) => {
    // Revocation is allowed even if this event subsequently becomes private.
    db.prepare(
      "DELETE FROM night_foreground_checks WHERE lease=? AND user_id=? AND session_ref=?",
    ).run(
      req.params.lease,
      req.session.userId!,
      sessionReference(req.sessionID),
    );
    res.json({ removed: true });
  });
  app.post(path + "/presence", auth, scope, allowCheck, (req, res) => {
    const event = res.locals.event as Event,
      date = res.locals.date,
      user = req.session.userId!;
    const { lat, lng, accuracy, area, lease } = req.body;
    const now = Date.now();
    const near =
      coordsValid(lat, lng) &&
      typeof accuracy === "number" &&
      Number.isFinite(accuracy) &&
      accuracy >= 0 &&
      accuracy <= 150 &&
      haversineMeters({ lat, lng }, { lat: event.lat!, lng: event.lng! }) <=
        250;
    if (lease !== undefined) {
      if (typeof lease !== "string") return res.sendStatus(400);
      const check = db
        .prepare(
          `UPDATE night_foreground_checks SET checked_at=?
        WHERE event_id=? AND occurrence=? AND user_id=? AND lease=? AND session_ref=? AND expires_at>?`,
        )
        .run(
          near ? now : null,
          event.id,
          date,
          user,
          lease,
          sessionReference(req.sessionID),
          now,
        );
      if (!check.changes)
        return res.status(410).json({ error: "Automatic check-in has ended." });
      return res.json({ near });
    }
    if (!near)
      return res
        .status(400)
        .json({ error: "An accurate location near the venue is needed." });
    if (typeof area !== "string" || area.length > 80)
      return res
        .status(400)
        .json({ error: "Enter your destination neighborhood." });
    db.transaction(() => {
      clearForeground.run(event.id, date, user);
      db.prepare(
        `INSERT INTO night_venue_presence VALUES(?,?,?,?,?) ON CONFLICT(event_id,occurrence,user_id)
        DO UPDATE SET checked_at=excluded.checked_at,home_area=excluded.home_area`,
      ).run(event.id, date, user, now, area.trim());
    })();
    res.json({ expiresAt: now + 30 * minute });
  });
  app.delete(path + "/presence", auth, scope, (req, res) => {
    const args = [res.locals.event.id, res.locals.date, req.session.userId!];
    clearManual.run(...args);
    clearForeground.run(...args);
    res.json({ removed: true });
  });
  const ridePath = path + "/rides/:ride";
  const participant: RequestHandler = (req, res, next) => {
    const o = offer(Number(req.params.ride)),
      user = req.session.userId!;
    if (
      !o ||
      o.event_id !== res.locals.event.id ||
      o.occurrence !== res.locals.date ||
      storage.getMemberBlockStatus(user, o.driver_id).interactionBlocked ||
      (o.driver_id !== user && !member(o.id, user)) ||
      !visible(o, plan(o.id), user)
    )
      return res.status(404).json({ error: "Ride unavailable." });
    res.locals.rideOffer = o;
    next();
  };
  app.post(ridePath + "/depart", auth, scope, participant, (req, res) => {
    const o = res.locals.rideOffer as Offer;
    if (o.driver_id !== req.session.userId)
      return res
        .status(403)
        .json({ error: "Only the driver can start this ride." });
    const accepted = db
      .prepare(
        "SELECT r.rider_id FROM event_ride_requests r JOIN users u ON u.id=r.rider_id WHERE r.offer_id=? AND r.accepted=1 AND u.status='active'",
      )
      .all(o.id) as { rider_id: number }[];
    if (
      accepted.filter(
        (r) =>
          visible(o, plan(o.id), r.rider_id) &&
          !storage.getMemberBlockStatus(r.rider_id, o.driver_id)
            .interactionBlocked,
      ).length < 2 ||
      req.body.metTogether !== true ||
      !res.locals.open
    )
      return res.status(409).json({
        error:
          "Meet in view of others with at least two confirmed passengers before leaving.",
      });
    const started = db
      .prepare(
        "UPDATE night_ride_plans SET departed=? WHERE offer_id=? AND departed IS NULL",
      )
      .run(Date.now(), o.id);
    if (!started.changes)
      return res.status(409).json({ error: "This offer cannot start." });
    res.json({ departed: true });
  });
  app.post(ridePath + "/watch", auth, scope, participant, (req, res) => {
    const o = res.locals.rideOffer as Offer,
      user = req.session.userId!,
      { contact, minutes, lat, lng } = req.body;
    const names =
      typeof contact === "string"
        ? [
            ...new Set(
              contact
                .split(",")
                .map((s) => s.trim().replace(/^@/, ""))
                .filter(Boolean),
            ),
          ]
        : [];
    const recipients = names.map((name) => storage.getUserByUsername(name));
    if (
      names.length < 1 ||
      names.length > 3 ||
      recipients.some(
        (person) =>
          !person ||
          person.id === user ||
          person.status !== "active" ||
          storage.getMemberBlockStatus(user, person.id).interactionBlocked ||
          !storage.isFollowing(user, person.id) ||
          !storage.isFollowing(person.id, user),
      )
    )
      return res.status(400).json({
        error: "Choose one to three trusted members you mutually follow.",
      });
    if (
      !Number.isInteger(minutes) ||
      minutes < 5 ||
      minutes > 180 ||
      ((lat != null || lng != null) && !coordsValid(lat, lng)) ||
      req.body.consent !== true
    )
      return res
        .status(400)
        .json({ error: "Confirm the safety check and choose 5–180 minutes." });
    const now = Date.now(),
      due = now + minutes * minute;
    db.transaction(() => {
      db.prepare(
        "DELETE FROM night_watch_contacts WHERE user_id=? AND offer_id=?",
      ).run(user, o.id);
      for (const person of recipients)
        db.prepare("INSERT INTO night_watch_contacts VALUES(?,?,?)").run(
          o.id,
          user,
          person!.id,
        );
      db.prepare(
        `INSERT INTO night_ride_watches VALUES(?,?,?,?,0,?,?,?,?) ON CONFLICT(offer_id,user_id) DO UPDATE SET contact_id=excluded.contact_id,due_at=excluded.due_at,stage=0,next_at=excluded.next_at,lat=excluded.lat,lng=excluded.lng,located_at=excluded.located_at`,
      ).run(
        o.id,
        user,
        recipients[0]!.id,
        due,
        due,
        lat ?? null,
        lng ?? null,
        lat != null ? now : null,
      );
    })();
    res.json({ dueAt: due });
  });
  app.get("/api/night/ride-checks", auth, (req, res) => {
    res.set("Cache-Control", "private, no-store");
    res.json(
      db
        .prepare(
          "SELECT offer_id AS ride,due_at AS dueAt,stage,(lat IS NOT NULL) AS shareLocation FROM night_ride_watches WHERE user_id=? ORDER BY due_at",
        )
        .all(req.session.userId!),
    );
  });
  app.put("/api/night/ride-checks/:ride/location", auth, (req, res) => {
    const { lat, lng } = req.body;
    if (!coordsValid(lat, lng))
      return res.status(400).json({ error: "Invalid location." });
    const result = db
      .prepare(
        "UPDATE night_ride_watches SET lat=?,lng=?,located_at=? WHERE user_id=? AND offer_id=? AND lat IS NOT NULL",
      )
      .run(lat, lng, Date.now(), req.session.userId!, Number(req.params.ride));
    if (!result.changes)
      return res
        .status(404)
        .json({ error: "No location-sharing check is active." });
    res.json({ updated: true });
  });
  app.delete("/api/night/ride-checks/:ride", auth, (req, res) => {
    db.prepare(
      "DELETE FROM night_ride_watches WHERE user_id=? AND offer_id=?",
    ).run(req.session.userId!, Number(req.params.ride));
    db.prepare(
      "DELETE FROM night_watch_contacts WHERE user_id=? AND offer_id=?",
    ).run(req.session.userId!, Number(req.params.ride));
    res.json({ ended: true });
  });
  return {
    dispose: () => clearInterval(timer),
    endForegroundChecks: (userId: number, sessionId: string) =>
      db
        .prepare(
          "DELETE FROM night_foreground_checks WHERE user_id=? AND session_ref=?",
        )
        .run(userId, sessionReference(sessionId)),
    announce,
    watches,
    present,
    plan,
    offer,
    visible,
    parse(
      body: Record<string, unknown>,
      e: Event,
      date: string,
      user: number,
    ): RidePlan | string | undefined {
      if (!body.kind) return undefined; // A previously published client can still offer an ordinary carpool.
      const { kind, meeting, leaveBy, oneWay, gathering } = body;
      if (kind !== "carpool" && kind !== "home" && kind !== "afterz")
        return "Choose a ride type.";
      if (!Number.isInteger(body.seats) || Number(body.seats) < 2)
        return "Offer at least two passenger seats for a group ride.";
      if (
        typeof meeting !== "string" ||
        meeting.length > 100 ||
        (kind !== "afterz" && meeting.trim().length < 2)
      )
        return "Choose a visible public meeting place.";
      const departure =
        typeof leaveBy === "number" && Number.isFinite(leaveBy)
          ? leaveBy
          : null;
      const end = parsePacificDateTime(e.dateEnd);
      if (
        (!departure && (oneWay !== true || kind !== "carpool")) ||
        (departure != null &&
          (departure <= Date.now() ||
            end == null ||
            departure > end + 30 * minute))
      )
        return "Choose a future leave-by time within this occurrence, or a one-way carpool.";
      // Arriving and departing (home) carpools can both be posted in advance
      // (Tucker, t336u); a ride home needs the poster to be Going. Afterz rides
      // still need a verified presence at the venue.
      if (kind === "home" && !attendance(e.id, user))
        return "Mark yourself Going before offering a ride home.";
      if (
        kind === "afterz" &&
        (!attendance(e.id, user) || !present(e.id, date, user))
      )
        return "Verify your location at the venue before offering a ride.";
      if (
        kind === "afterz" &&
        (typeof gathering !== "string" ||
          !afterzMember(gathering, e.id, date, user))
      )
        return "Choose an Afterz gathering you host or have joined.";
      return {
        kind,
        meeting: meeting.trim(),
        leaveBy: departure,
        oneWay: oneWay === true,
        gathering: kind === "afterz" ? String(gathering) : null,
      };
    },
    save(id: number, m: RidePlan) {
      db.prepare("INSERT INTO night_ride_plans VALUES(?,?,?,?,?,?,NULL)").run(
        id,
        m.kind,
        m.meeting,
        m.leaveBy,
        Number(m.oneWay),
        m.gathering,
      );
    },
    erase(id: number) {
      db.prepare("DELETE FROM night_ride_plans WHERE offer_id=?").run(id);
      db.prepare("DELETE FROM night_ride_notices WHERE offer_id=?").run(id);
    },
    peers(id: number, viewer: number) {
      return (
        db
          .prepare(
            `SELECT u.username FROM event_ride_requests r JOIN users u ON u.id=r.rider_id WHERE r.offer_id=? AND r.accepted=1 AND u.status='active'
      AND NOT EXISTS(SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=u.id) OR (blocked_user_id=? AND blocker_user_id=u.id))`,
          )
          .all(id, viewer, viewer) as { username: string }[]
      ).map((row) => ({
        username: row.username,
        photoUrl: storage.getUserByUsername(row.username)?.photoUrl ?? null,
      }));
    },
  };
}
