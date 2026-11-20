import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import type { IStorage } from "./storage";
import type { Event } from "@shared/schema";
import { normalizeVenueKey } from "./venueCoordinates";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import { resortForPrideEvent, winterPrideWatches } from "@shared/outzWinterEvents";
import type { OutzDetails } from "@shared/outzDetails";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import {
  pacificCalendarDate,
  parsePacificDateTime,
} from "@shared/missedConnections";

type Place = { id: string; name: string; lat?: number; lng?: number };
type Deps = {
  catalog: () => Promise<Place[]>;
  place: (id: string) => Promise<Place | undefined>;
  details: (id: string) => Promise<OutzDetails | null>;
  visible: (e: Event) => boolean;
  remind: (ids: number[], event: Event, place: string) => void;
};
export function registerOutdoorHosting(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  auth: RequestHandler,
  deps: Deps,
) {
  db.exec(`
   CREATE TABLE IF NOT EXISTS outdoor_event_submissions(submission_id INTEGER PRIMARY KEY,place_id TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS outdoor_submission_destinations ON outdoor_event_submissions(place_id);
   CREATE TABLE IF NOT EXISTS outdoor_cohost_requests(event_id INTEGER NOT NULL,user_id INTEGER NOT NULL,state TEXT NOT NULL,PRIMARY KEY(event_id,user_id));
   CREATE TABLE IF NOT EXISTS outdoor_rating_reminders(event_id INTEGER NOT NULL,user_id INTEGER NOT NULL,PRIMARY KEY(event_id,user_id));`);
  const eventFor = (id: number) => {
    const row = db
      .prepare(
        "SELECT p.place_id AS place FROM outdoor_event_submissions p JOIN submissions s ON s.id=p.submission_id WHERE s.event_id=? AND s.status='APPROVED' LIMIT 1",
      )
      .get(id) as { place: string } | undefined;
    const event = row && storage.getEvent(id);
    return row &&
      event &&
      hasPublicEventFlags(event) &&
      event.status === "LIVE" &&
      deps.visible(event)
      ? { place: row.place, event }
      : undefined;
  };
  const eligible = (place?: string) =>
    (
      db
        .prepare(
          `SELECT DISTINCT s.event_id AS id FROM outdoor_event_submissions p JOIN submissions s ON s.id=p.submission_id WHERE s.status='APPROVED' AND s.event_id IS NOT NULL AND (? IS NULL OR p.place_id=?)`,
        )
        .all(place ?? null, place ?? null) as { id: number }[]
    ).flatMap((row) => eventFor(row.id) ?? []);
  const compact = (e: Event) => ({
    id: e.id,
    title: e.title,
    dateStart: e.dateStart,
    dateEnd: e.dateEnd,
    venueName: e.venueName,
    poster: e.posterImageUrl,
  });
  app.get("/api/outz/buddies", (_req, res) => {
    const place =
      typeof _req.query.place === "string" ? _req.query.place : undefined;
    res.json(
      eligible(place)
        .filter(
          (r) => (parsePacificDateTime(r.event.dateEnd) ?? 0) > Date.now(),
        )
        .sort(
          (a, b) =>
            (parsePacificDateTime(a.event.dateStart) ?? 0) -
            (parsePacificDateTime(b.event.dateStart) ?? 0),
        )
        .slice(0, 150)
        .map((r) => ({ ...compact(r.event), place: r.place })),
    );
  });
  app.get("/api/outz/upcoming", async (req, res) => {
    const viewer = req.session.userId;
    const place = typeof req.query.place === "string" ? req.query.place : undefined;
    const personal = req.query.mine === "1";
    res.set("Cache-Control", "private, no-store");
    if (personal && !viewer) return res.json([]);
    const interested = personal ? new Set((db.prepare(
      "SELECT kind || ':' || ref AS key FROM card_hearts WHERE user_id=? AND kind IN ('outz','event')",
    ).all(viewer) as {key:string}[]).map(row => row.key)) : null;
    const going = personal ? new Set((db.prepare(
      "SELECT DISTINCT event_id AS id FROM attendances WHERE user_id=? AND is_active=1 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))",
    ).all(viewer) as {id:number}[]).map(row => row.id)) : null;
    const catalog = await deps.catalog();
    const placesByName = new Map<string, Set<string>>();
    for (const p of catalog) {
      const name = normalizeVenueKey(p.name);
      if (!name) continue;
      const matches = placesByName.get(name) ?? new Set<string>();
      matches.add(p.id);
      placesByName.set(name, matches);
    }
    const submissions = db.prepare(
      "SELECT s.event_id AS id, p.place_id AS place, s.status FROM outdoor_event_submissions p JOIN submissions s ON s.id=p.submission_id WHERE s.event_id IS NOT NULL ORDER BY (s.status='APPROVED')",
    ).all() as {id:number;place:string;status:string}[];
    const links = new Map(submissions.map(row => [row.id, row]));
    const winter = new Set(winterPrideWatches.map(item => item.placeId));
    const now = Date.now();
    const rows = storage.getEvents({status:"LIVE"}).flatMap(event => {
      if (!hasPublicEventFlags(event) || event.isHouseParty || !deps.visible(event)) return [];
      const linked = links.get(event.id);
      if (linked && linked.status !== "APPROVED") return [];
      const known = linked?.place || resortForPrideEvent(event);
      const exact = placesByName.get(normalizeVenueKey(event.venueName));
      const unique = exact?.size === 1 ? [...exact][0] : undefined;
      const destination = known || (unique && !winter.has(unique) ? unique : undefined);
      if (!destination || (place && destination !== place)) return [];
      if (interested && !interested.has("outz:" + destination) && !interested.has("event:" + event.id) && !going?.has(event.id)) return [];
      return expandMultiDayEvents([event]).flatMap(occurrence => {
        const start = parsePacificDateTime(occurrence.dateStart);
        const end = parsePacificDateTime(occurrence.dateEnd) ?? start;
        return start != null && end != null && end >= now
          ? [{...compact(occurrence), place:destination, start}] : [];
      });
    });
    res.json(rows.sort((a,b) => a.start-b.start || a.id-b.id).slice(0,150));
  });
  app.get("/api/outz/buddies/operator/:place", async (req, res) => {
    try {
      const place = await deps.place(String(req.params.place));
      if (!place) return res.sendStatus(404);
      // Only show a verified owned directory record with the same official/public destination name.
      const linked = db
        .prepare(
          `SELECT DISTINCT b.id,b.name FROM businesses b JOIN users u ON u.id=b.owner_id AND u.status='active' WHERE lower(trim(b.name))=lower(trim(?)) AND b.active=1 LIMIT 2`,
        )
        .all(place.name) as { id: number; name: string }[];
      res.json(linked.length === 1 ? linked[0] : null);
    } catch {
      res.status(503).json({ error: "Operator lookup unavailable." });
    }
  });
  app.get("/api/outz/buddies/event/:id", async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    const info = eventFor(Number(req.params.id));
    if (!info) return res.json(null);
    const user = req.session?.userId,
      host = !!user && storage.isUserEventHost(info.event.id, user);
    const day = pacificCalendarDate(info.event.dateStart);
    const weather = await deps.details(info.place).catch(() => null),
      forecast = weather?.forecast.find((f) => f.date === day);
    const requests = host
      ? (
          db
            .prepare(
              "SELECT u.id,u.username FROM outdoor_cohost_requests r JOIN users u ON u.id=r.user_id WHERE r.event_id=? AND r.state='pending' AND u.status='active'",
            )
            .all(info.event.id) as { id: number; username: string }[]
        ).filter(
          (r) => !storage.getMemberBlockStatus(user!, r.id).interactionBlocked,
        )
      : [];
    const state = user
      ? (
          db
            .prepare(
              "SELECT state FROM outdoor_cohost_requests WHERE event_id=? AND user_id=?",
            )
            .get(info.event.id, user) as { state: string } | undefined
        )?.state
      : undefined;
    res.json({
      place: info.place,
      host,
      requests,
      state,
      forecast: forecast ?? null,
      updatedAt: weather?.forecastUpdatedAt,
      ended:
        (parsePacificDateTime(info.event.dateEnd) ?? Infinity) < Date.now(),
    });
  });
  app.post("/api/outz/buddies/event/:id/cohost", auth, (req, res) => {
    const info = eventFor(Number(req.params.id)),
      viewer = req.session.userId!;
    if (!info || (parsePacificDateTime(info.event.dateEnd) ?? 0) < Date.now())
      return res
        .status(404)
        .json({ error: "This event has ended or is unavailable." });
    const host = storage.isUserEventHost(info.event.id, viewer);
    if (req.body.action === "request") {
      const hosts = storage.getEventHosts(info.event.id);
      if (
        host ||
        hosts.some(
          (h) =>
            storage.getMemberBlockStatus(viewer, h.userId).interactionBlocked,
        )
      )
        return res.status(403).json({ error: "Request unavailable." });
      db.prepare(
        "INSERT OR IGNORE INTO outdoor_cohost_requests VALUES(?,?,'pending')",
      ).run(info.event.id, viewer);
      return res.json({ saved: true });
    }
    if (!host)
      return res.status(403).json({ error: "Only hosts can manage requests." });
    const id = Number(req.body.userId),
      state =
        req.body.action === "approve"
          ? "accepted"
          : req.body.action === "decline"
            ? "declined"
            : null;
    const person = id && storage.getUserById(id);
    if (
      !state ||
      !person ||
      person.status !== "active" ||
      storage.getMemberBlockStatus(id, viewer).interactionBlocked
    )
      return res.status(400).json({ error: "Request unavailable." });
    try {
      db.transaction(() => {
        const changed = db
          .prepare(
            "UPDATE outdoor_cohost_requests SET state=? WHERE event_id=? AND user_id=? AND state='pending'",
          )
          .run(state, info.event.id, id);
        if (!changed.changes) throw Error("This request was already handled.");
        if (state === "accepted") {
          const result = storage.addEventCoHost(
            info.event.id,
            viewer,
            person.username,
            "",
          );
          if (result.error) throw Error(result.error);
        }
      })();
      res.json({ saved: true });
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  });
  const ratings = () => {
    const now = Date.now();
    for (const { event, place } of eligible()) {
      const end = parsePacificDateTime(event.dateEnd);
      if (!end || end > now || end < now - 86400000) continue;
      const rows = db
        .prepare(
          `SELECT DISTINCT a.user_id AS id FROM attendances a JOIN users u ON u.id=a.user_id AND u.status='active' WHERE a.event_id=? AND a.is_active=1
      AND NOT EXISTS(SELECT 1 FROM outdoor_rating_reminders r WHERE r.event_id=a.event_id AND r.user_id=a.user_id)`,
        )
        .all(event.id) as { id: number }[];
      if (!rows.length) continue;
      deps.remind(
        rows.map((r) => r.id),
        event,
        place,
      );
      db.transaction(() => {
        for (const row of rows)
          db.prepare(
            "INSERT OR IGNORE INTO outdoor_rating_reminders VALUES(?,?)",
          ).run(event.id, row.id);
      })();
    }
  };
  const timer = setInterval(() => {
    try {
      ratings();
    } catch (e) {
      console.warn("[outdoor] rating reminder failed", e);
    }
  }, 5 * 60_000);
  timer.unref();
  return {
    dispose: () => clearInterval(timer),
    ratings,
    link: (submission: number, place: string) =>
      db
        .prepare("INSERT OR IGNORE INTO outdoor_event_submissions VALUES(?,?)")
        .run(submission, place),
    async placeForSubmission(placeId: unknown) {
      if (typeof placeId !== "string" || placeId.length > 180)
        throw Object.assign(Error("Choose a listed Outzide destination."), {
          status: 400,
        });
      const place = await deps.place(placeId);
      if (!place)
        throw Object.assign(Error("Destination unavailable."), { status: 400 });
      return place;
    },
    checkOverlap(place: Place, dateStart: unknown, overlapConfirmed: unknown) {
      const start =
        typeof dateStart === "string" ? parsePacificDateTime(dateStart) : null;
      if (!start || start <= Date.now())
        throw Object.assign(Error("Choose a future start time."), {
          status: 400,
        });
      const matches = storage
        .getEvents({ status: "LIVE" })
        .filter(
          (e) =>
            hasPublicEventFlags(e) &&
            deps.visible(e) &&
            e.venueName.trim().toLowerCase() ===
              place.name.trim().toLowerCase() &&
            parsePacificDateTime(e.dateStart) === start,
        );
      if (matches.length && overlapConfirmed !== true)
        throw Object.assign(
          Error(
            "Another event already starts here at the same time. Join it if this is the same outing.",
          ),
          { status: 409, matches: matches.map(compact) },
        );
      return place;
    },
  };
}
