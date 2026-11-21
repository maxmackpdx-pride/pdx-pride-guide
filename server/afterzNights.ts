import { hasRegistrationOnlyLocation } from "@shared/registrationOnlyVenue";
import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import type { Event } from "@shared/schema";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import {
  pacificCalendarDate,
  parsePacificDateTime,
} from "@shared/missedConnections";
import { afterzWindowState } from "@shared/afterzWindow";

export type NightCatalog = {
  events: () => Event[];
  event: (id: number) => Event | undefined;
  notify: (users: number[], host: number, title: string, id: string) => void;
};
export type Night = {
  gatheringId: string;
  eventId: number;
  occurrence: string;
  capacity: number;
  poster: string | null;
  vibe: string;
  sexPositive: number;
  nudityOk: number;
  glow: number;
};
const hour = 3_600_000;
const rows =
  "gathering_id AS gatheringId,event_id AS eventId,occurrence,capacity,poster,vibe,sex_positive AS sexPositive,nudity_ok AS nudityOk,glow";

export function afterzNights(
  app: Express,
  db: Database.Database,
  auth: RequestHandler,
  now: () => number,
  catalog?: NightCatalog,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS afterz_adult_members (user_id INTEGER PRIMARY KEY,confirmed_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS afterz_nights (
      gathering_id TEXT PRIMARY KEY REFERENCES afterz_gatherings(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL, occurrence TEXT NOT NULL, capacity INTEGER NOT NULL,
      poster TEXT, vibe TEXT NOT NULL, sex_positive INTEGER NOT NULL, nudity_ok INTEGER NOT NULL, glow INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS afterz_by_event ON afterz_nights(event_id,occurrence);
    CREATE TABLE IF NOT EXISTS afterz_seconds (gathering_id TEXT NOT NULL,user_id INTEGER NOT NULL,
      PRIMARY KEY(gathering_id,user_id));
    CREATE TABLE IF NOT EXISTS afterz_consent (event_id INTEGER NOT NULL,user_id INTEGER NOT NULL,
      source TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(event_id,user_id,source));
    CREATE TABLE IF NOT EXISTS afterz_reminders(gathering_id TEXT NOT NULL,user_id INTEGER NOT NULL,
      PRIMARY KEY(gathering_id,user_id));
  `);
  const get = (id: string) =>
    db
      .prepare("SELECT " + rows + " FROM afterz_nights WHERE gathering_id=?")
      .get(id) as Night | undefined;
  const timing = (event: Event, date: string) => {
    if (
      event.status !== "LIVE" ||
      !hasPublicEventFlags(event) ||
      event.isHouseParty
    )
      return;
    const e = expandMultiDayEvents([event]).find(
      (e) => pacificCalendarDate(e.dateStart) === date,
    );
    if (!e) return;
    const start = parsePacificDateTime(e.dateStart),
      end = parsePacificDateTime(e.dateEnd);
    if (
      start == null ||
      end == null ||
      now() < start - 72 * hour ||
      now() >= end + hour / 2
    )
      return;
    return { start, closesAt: end + hour / 2 };
  };
  const live = (night: Night) => {
    const e = catalog?.event(night.eventId);
    return e && timing(e, night.occurrence) ? e : undefined;
  };
  const adult = (user: number) =>
    !!db
      .prepare("SELECT 1 FROM afterz_adult_members WHERE user_id=?")
      .get(user);
  const confirm = (user: number) =>
    db
      .prepare("INSERT OR IGNORE INTO afterz_adult_members VALUES(?,?)")
      .run(user, now());
  app.post("/api/afterz/discovery", auth, (req, res) => {
    if (req.body.confirmed18 !== true)
      return res
        .status(400)
        .json({ error: "Confirm you are at least 18 to discover Afterz." });
    confirm(req.session.userId!);
    res.json({ confirmed: true });
  });
  app.get("/api/afterz/window", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(afterzWindowState(now()));
  });
  app.get("/api/afterz/nights", auth, (req, res) => {
    res.set("Cache-Control", "private, no-store");
    const viewer = req.session.userId!;
    if (!adult(viewer)) return res.json([]);
    const nights = db
      .prepare(
        `SELECT n.*,g.title,g.host_id AS host,g.closes_at AS closesAt,g.id,
      COALESCE(NULLIF(u.display_name,''),u.username) AS hostName,
      COALESCE(a.status,'guest') AS role FROM afterz_nights n JOIN afterz_gatherings g ON n.gathering_id=g.id
      JOIN users u ON u.id=g.host_id AND u.status='active'
      LEFT JOIN afterz_guests a ON a.gathering_id=g.id AND a.user_id=?
      WHERE g.closes_at>? AND COALESCE(a.status,'') NOT IN ('declined','revoked') AND NOT EXISTS
      (SELECT 1 FROM member_blocks WHERE (blocker_user_id=g.host_id AND blocked_user_id=?)
        OR (blocked_user_id=g.host_id AND blocker_user_id=?)) ORDER BY g.host_id=? DESC,g.closes_at LIMIT 200`,
      )
      .all(viewer, now(), viewer, viewer, viewer) as {
      id: string;
      event_id: number;
      occurrence: string;
      title: string;
      closesAt: number;
      role: string;
      host: number;
      hostName: string;
      poster: string | null;
      vibe: string;
      glow: number;
      sex_positive: number;
    }[];
    res.json(
      nights.flatMap((n) => {
        const event = catalog?.event(n.event_id);
        if (!event || !timing(event, n.occurrence)) return [];
        return [
          {
            id: n.id,
            title: n.title,
            eventId: event.id,
            eventTitle: event.title,
            venue: event.venueName,
            hostName: n.hostName,
            lat:
              hasRegistrationOnlyLocation(event) || event.isHouseParty
                ? null
                : event.lat,
            lng:
              hasRegistrationOnlyLocation(event) || event.isHouseParty
                ? null
                : event.lng,
            closesAt: n.closesAt,
            poster: n.poster,
            vibe: n.vibe,
            glow: !!n.glow,
            sexPositive: !!n.sex_positive,
            role: n.host === viewer ? "host" : n.role,
          },
        ];
      }),
    );
  });
  app.get("/api/afterz/eligible-events", auth, (_req, res) => {
    res.set("Cache-Control", "private, no-store");
    // Filter the time span before expanding multi-day entries.
    const events = (catalog?.events() ?? []).filter((e) => {
      const end = parsePacificDateTime(e.dateEnd),
        start = parsePacificDateTime(e.dateStart);
      return (
        end != null &&
        start != null &&
        end + hour / 2 > now() &&
        start <= now() + 72 * hour
      );
    });
    res.json(
      events.flatMap((e) =>
        expandMultiDayEvents([e]).flatMap((o) => {
          const date = pacificCalendarDate(o.dateStart);
          return date && timing(e, date)
            ? [{ id: e.id, title: e.title, date }]
            : [];
        }),
      ),
    );
  });
  app.put("/api/afterz/consent/:event", auth, (req, res) => {
    const event = catalog?.event(Number(req.params.event));
    const { source, enabled } = req.body;
    if (
      !event ||
      !hasPublicEventFlags(event) ||
      event.status !== "LIVE" ||
      !["rsvp", "checkin"].includes(source) ||
      typeof enabled !== "boolean"
    )
      return res
        .status(400)
        .json({ error: "Choose Yes or No for this event." });
    db.transaction(() => {
      db.prepare(
        "DELETE FROM afterz_consent WHERE event_id=? AND user_id=?",
      ).run(event.id, req.session.userId!);
      db.prepare("INSERT INTO afterz_consent VALUES(?,?,?,?)").run(
        event.id,
        req.session.userId!,
        source,
        Number(enabled),
      );
    })();
    res.json({ enabled });
  });
  const remind = () => {
    if (!catalog) return;
    const current = db
      .prepare(
        `SELECT n.gathering_id AS id,n.event_id AS eventId,n.occurrence,g.host_id AS host,g.title FROM afterz_nights n
      JOIN afterz_gatherings g ON g.id=n.gathering_id WHERE g.closes_at>?`,
      )
      .all(now()) as {
      id: string;
      eventId: number;
      occurrence: string;
      host: number;
      title: string;
    }[];
    for (const n of current) {
      const event = catalog.event(n.eventId);
      const times = event && timing(event, n.occurrence);
      if (!times || now() < times.start) continue;
      const users = (
        db
          .prepare(
            `SELECT DISTINCT a.user_id AS id FROM attendances a JOIN afterz_consent c ON a.event_id=c.event_id AND a.user_id=c.user_id
        WHERE a.event_id=? AND a.is_active=1 AND (a.expires_at IS NULL OR a.expires_at>?) AND c.enabled=1 AND NOT EXISTS
        (SELECT 1 FROM afterz_reminders r WHERE r.gathering_id=? AND r.user_id=a.user_id)
        AND NOT EXISTS(SELECT 1 FROM afterz_guests g WHERE g.gathering_id=? AND g.user_id=a.user_id AND g.status IN ('declined','revoked'))
        AND NOT EXISTS(SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=a.user_id) OR (blocked_user_id=? AND blocker_user_id=a.user_id))`,
          )
          .all(
            n.eventId,
            new Date(now()).toISOString(),
            n.id,
            n.id,
            n.host,
            n.host,
          ) as { id: number }[]
      ).map((u) => u.id);
      if (!users.length) continue;
      catalog.notify(users, n.host, n.title, n.id);
      db.transaction(() => {
        for (const id of users)
          db.prepare("INSERT OR IGNORE INTO afterz_reminders VALUES(?,?)").run(
            n.id,
            id,
          );
      })();
    }
  };
  return {
    get,
    live,
    timing,
    remind,
    confirm,
    adult,
    erase(id: string) {
      for (const table of [
        "afterz_seconds",
        "afterz_reminders",
        "afterz_nights",
      ])
        db.prepare("DELETE FROM " + table + " WHERE gathering_id=?").run(id);
    },
    full(id: string) {
      return !!db
        .prepare(
          `SELECT 1 FROM afterz_nights WHERE gathering_id=? AND capacity <= (SELECT count(*) FROM afterz_guests WHERE gathering_id=? AND status='accepted')`,
        )
        .get(id, id);
    },
    save(
      id: string,
      eventId: number,
      occurrence: string,
      opts: Record<string, unknown>,
    ) {
      db.prepare("INSERT INTO afterz_nights VALUES(?,?,?,?,?,?,?,?,?)").run(
        id,
        eventId,
        occurrence,
        opts.capacity,
        opts.poster ?? null,
        opts.vibe,
        Number(opts.sexPositive === true),
        Number(opts.nudityOk === true),
        Number(opts.sexPositive === true || opts.glow === true),
      );
    },
  };
}
