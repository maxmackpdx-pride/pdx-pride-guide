import type Database from "better-sqlite3";
import type { Express, RequestHandler, Response } from "express";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import type { Event } from "@shared/schema";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import {
  pacificCalendarDate,
  parsePacificDateTime,
} from "@shared/missedConnections";
import { registerNightRides, type RideNotice } from "./nightRides";
import type { IStorage } from "./storage";

export function createPlanningStore(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_gig_links (
      gig_id INTEGER PRIMARY KEY REFERENCES gig_posts(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, occurrence TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS event_gig_occurrence ON event_gig_links(event_id,occurrence);
    CREATE TABLE IF NOT EXISTS event_ride_offers (
      id INTEGER PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      occurrence TEXT NOT NULL, driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      area TEXT NOT NULL, seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 8),
      UNIQUE(event_id,occurrence,driver_id)
    );
    CREATE TABLE IF NOT EXISTS event_ride_requests (
      offer_id INTEGER NOT NULL REFERENCES event_ride_offers(id) ON DELETE CASCADE,
      rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      accepted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(offer_id,rider_id)
    )
  `);
  const visibleTo = `NOT EXISTS (SELECT 1 FROM member_blocks b WHERE
    (b.blocker_user_id=@viewer AND b.blocked_user_id=o.driver_id) OR
    (b.blocked_user_id=@viewer AND b.blocker_user_id=o.driver_id))`;
  return {
    linkGig(gigId: number, eventId: number, date: string) {
      db.prepare(
        "INSERT INTO event_gig_links(gig_id,event_id,occurrence) VALUES(?,?,?)",
      ).run(gigId, eventId, date);
    },
    gigs(eventId: number, date: string) {
      return db
        .prepare(
          `SELECT g.id,g.title,g.post_type AS postType,g.created_at AS createdAt,g.location,
        g.description,g.compensation,g.gig_date AS gigDate,g.gig_time AS gigTime FROM event_gig_links l
        JOIN gig_posts g ON g.id=l.gig_id WHERE l.event_id=? AND l.occurrence=? AND g.status='LIVE'
        AND g.post_type='POSTING_GIG' ORDER BY g.id DESC`,
        )
        .all(eventId, date);
    },
    rides(eventId: number, date: string, viewer: number) {
      const offers = db
        .prepare(
          `SELECT o.id,o.area,u.username AS driver,o.driver_id=@viewer AS mine,
        o.seats-(SELECT COUNT(*) FROM event_ride_requests WHERE offer_id=o.id AND accepted=1) AS remaining,
        (SELECT accepted FROM event_ride_requests WHERE offer_id=o.id AND rider_id=@viewer) AS myRequest
        FROM event_ride_offers o JOIN users u ON u.id=o.driver_id WHERE o.event_id=@eventId AND o.occurrence=@date
        AND u.status='active' AND ${visibleTo} ORDER BY o.id DESC`,
        )
        .all({ eventId, date, viewer }) as Array<{
        id: number;
        area: string;
        driver: string;
        mine: number;
        remaining: number;
        myRequest: number | null;
      }>;
      const requests =
        db.prepare(`SELECT r.rider_id AS id,u.username,r.accepted FROM event_ride_requests r
        JOIN users u ON u.id=r.rider_id WHERE offer_id=? AND u.status='active' AND NOT EXISTS (
          SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=r.rider_id)
          OR (b.blocked_user_id=? AND b.blocker_user_id=r.rider_id)) ORDER BY r.rider_id`);
      return offers.map((o) => ({
        ...o,
        mine: !!o.mine,
        requests: o.mine ? requests.all(o.id, viewer, viewer) : [],
      }));
    },
    offer(
      eventId: number,
      date: string,
      viewer: number,
      area: string,
      seats: number,
    ) {
      return (
        db
          .prepare(
            "INSERT INTO event_ride_offers(event_id,occurrence,driver_id,area,seats) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING",
          )
          .run(eventId, date, viewer, area, seats).changes > 0
      );
    },
    cancel(id: number, viewer: number) {
      return db.transaction(() => {
        if (
          !db
            .prepare(
              "SELECT 1 FROM event_ride_offers WHERE id=? AND driver_id=?",
            )
            .get(id, viewer)
        )
          return false;
        db.prepare("DELETE FROM event_ride_requests WHERE offer_id=?").run(id);
        db.prepare("DELETE FROM event_ride_offers WHERE id=?").run(id);
        return true;
      })();
    },
    request(id: number, viewer: number) {
      return (
        db
          .prepare(
            `INSERT INTO event_ride_requests(offer_id,rider_id)
        SELECT o.id,@viewer FROM event_ride_offers o WHERE o.id=@id AND o.driver_id<>@viewer AND ${visibleTo}
        AND o.seats>(SELECT COUNT(*) FROM event_ride_requests WHERE offer_id=o.id AND accepted=1)
        ON CONFLICT DO NOTHING`,
          )
          .run({ id, viewer }).changes > 0
      );
    },
    withdraw(id: number, viewer: number) {
      db.prepare(
        "DELETE FROM event_ride_requests WHERE offer_id=? AND rider_id=?",
      ).run(id, viewer);
    },
    accept(id: number, rider: number, driver: number) {
      return (
        db
          .prepare(
            `UPDATE event_ride_requests SET accepted=1 WHERE offer_id=@id AND rider_id=@rider AND accepted=0 AND EXISTS
        (SELECT 1 FROM event_ride_offers o WHERE o.id=@id AND o.driver_id=@driver AND o.seats>
        (SELECT COUNT(*) FROM event_ride_requests WHERE offer_id=@id AND accepted=1)) AND NOT EXISTS
        (SELECT 1 FROM member_blocks WHERE (blocker_user_id=@driver AND blocked_user_id=@rider)
          OR (blocker_user_id=@rider AND blocked_user_id=@driver))`,
          )
          .run({ id, rider, driver }).changes > 0
      );
    },
    hostedCandidates(viewer: number) {
      return db
        .prepare(
          `SELECT e.id,e.title,e.date_start AS dateStart FROM events e JOIN users u ON u.id=?
        WHERE e.status='LIVE' AND (EXISTS(SELECT 1 FROM event_hosts h WHERE h.event_id=e.id AND h.user_id=u.id)
          OR lower(ltrim(trim(e.claimed_by),'@')) IN (lower(u.email),lower(u.username))
          OR (coalesce(e.source,'') <> 'community_tip' AND e.is_claimable=0
            AND coalesce(trim(e.claimed_by),'')='' AND NOT EXISTS(SELECT 1 FROM event_hosts h WHERE h.event_id=e.id)
            AND lower(ltrim(trim(e.submitted_by),'@')) IN (lower(u.email),lower(u.username))))
        ORDER BY e.date_start DESC,e.id`,
        )
        .all(viewer) as { id: number; title: string; dateStart: string }[];
    },
    going(eventId: number, now: string) {
      return (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM attendances WHERE event_id=? AND is_active=1
        AND (expires_at IS NULL OR expires_at>?)`,
          )
          .get(eventId, now) as { n: number }
      ).n;
    },
  };
}

export function registerEventPlanning(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  requireAuth: RequestHandler,
  visible: (event: Pick<Event, "dateStart">) => boolean,
  moderate: (
    res: Response,
    board: string,
    fields: Record<string, string>,
  ) => boolean,
  notifyRiders?: RideNotice,
) {
  const store = createPlanningStore(db);
  function occurrence(id: number, date: unknown) {
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    )
      return undefined;
    const event = storage.getEvent(id);
    if (
      !event ||
      event.status !== "LIVE" ||
      !hasPublicEventFlags(event) ||
      !visible(event)
    )
      return undefined;
    return expandMultiDayEvents([event]).find(
      (e) => pacificCalendarDate(e.dateStart) === date,
    );
  }
  const path = "/api/events/:id/occurrences/:date/planning";
  const scope: RequestHandler = (req, res, next) => {
    const event = occurrence(Number(req.params.id), req.params.date);
    if (!event) {
      res.status(404).json({ error: "Event occurrence unavailable" });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.locals.event = event;
    res.locals.date = req.params.date;
    res.locals.open =
      (parsePacificDateTime(event.dateEnd || event.dateStart) ?? 0) >=
      Date.now();
    next();
  };
  const night = registerNightRides(
    app,
    db,
    storage,
    requireAuth,
    scope,
    path,
    notifyRiders,
  );
  app.get(path, scope, (req, res) => {
    const { event, date, open } = res.locals;
    const sessionId = req.session?.userId;
    const viewer =
      sessionId && storage.getUserById(sessionId)?.status === "active"
        ? sessionId
        : undefined;
    const rides = viewer
      ? store.rides(event.id, date, viewer).flatMap((ride) => {
          const meta = night.plan(ride.id),
            offer = night.offer(ride.id);
          if (!offer || !night.visible(offer, meta, viewer)) return [];
          const joined = ride.mine || ride.myRequest === 1;
          return [
            {
              ...ride,
              plan: meta
                ? {
                    kind: meta.kind,
                    meeting: meta.meeting,
                    leaveBy: meta.leave_by,
                    oneWay: !!meta.one_way,
                    departed: !!meta.departed,
                  }
                : null,
              faces: joined && meta ? night.peers(ride.id, viewer) : [],
            },
          ];
        })
      : null;
    res.json({
      title: event.title,
      poster: event.posterImageUrl,
      venue: event.venueName,
      checked: viewer ? !!night.present(event.id, date, viewer) : false,
      onSiteWindow:
        (parsePacificDateTime(event.dateStart) ?? Infinity) - 30 * 60000 <=
          Date.now() &&
        (parsePacificDateTime(event.dateEnd) ?? 0) + 30 * 60000 > Date.now(),
      canPostGig: !!viewer && open && storage.isUserEventHost(event.id, viewer),
      open,
      gigs: store.gigs(event.id, date),
      rides,
    });
  });
  app.post(path + "/rides", requireAuth, scope, (req, res) => {
    const { event, date, open } = res.locals;
    if (
      !open &&
      !(
        req.body.kind === "afterz" &&
        (parsePacificDateTime(event.dateEnd) ?? 0) + 30 * 60_000 >= Date.now()
      )
    ) {
      res.status(409).json({ error: "This occurrence has passed" });
      return;
    }
    const area = typeof req.body.area === "string" ? req.body.area.trim() : "";
    const seats = req.body.seats;
    if (
      area.length < 2 ||
      area.length > 80 ||
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 8
    ) {
      res
        .status(400)
        .json({ error: "Enter a departure neighborhood and 1–8 seats" });
      return;
    }
    const user = req.session.userId!,
      meta = night.parse(req.body, event, date, user);
    if (typeof meta === "string") return res.status(400).json({ error: meta });
    if (moderate(res, "Event carpool", { area, meeting: meta?.meeting ?? "" }))
      return;
    const added = db.transaction(() => {
      if (!store.offer(event.id, date, user, area, seats)) return false;
      if (meta) {
        const row = db
          .prepare(
            "SELECT id FROM event_ride_offers WHERE event_id=? AND occurrence=? AND driver_id=?",
          )
          .get(event.id, date, user) as { id: number };
        night.save(row.id, meta);
      }
      return true;
    })();
    if (!added) {
      res.status(409).json({ error: "You already have a ride offer here" });
      return;
    }
    res.status(201).json({ ok: true });
  });
  const ridePath = path + "/rides/:ride";
  const rideScope: RequestHandler = (req, res, next) => {
    const ride = Number(req.params.ride);
    const row = db
      .prepare(
        `SELECT o.driver_id FROM event_ride_offers o JOIN users u ON o.driver_id=u.id
      WHERE o.id=? AND o.event_id=? AND o.occurrence=? AND u.status='active'`,
      )
      .get(ride, res.locals.event.id, res.locals.date) as
      | { driver_id: number }
      | undefined;
    if (
      !row ||
      storage.getMemberBlockStatus(req.session.userId!, row.driver_id)
        .interactionBlocked
    ) {
      res.status(404).json({ error: "Ride unavailable" });
      return;
    }
    const offer = night.offer(ride),
      meta = night.plan(ride);
    if (!offer || !night.visible(offer, meta, req.session.userId!))
      return res.status(404).json({ error: "Ride unavailable" });
    if (
      meta &&
      (meta.departed || (meta.leave_by && meta.leave_by < Date.now())) &&
      (req.method === "POST" || req.method === "PUT")
    )
      return res
        .status(409)
        .json({ error: "The ride has left or the leave-by time passed." });
    if (
      meta?.kind === "afterz" &&
      (parsePacificDateTime(res.locals.event.dateEnd) ?? 0) + 30 * 60_000 >=
        Date.now()
    )
      res.locals.open = true;
    res.locals.driver = row.driver_id;
    res.locals.ride = ride;
    next();
  };
  app.delete(ridePath, requireAuth, scope, rideScope, (req, res) => {
    if (
      !db.transaction(() => {
        if (!store.cancel(res.locals.ride, req.session.userId!)) return false;
        night.erase(res.locals.ride);
        return true;
      })()
    ) {
      res.status(403).json({ error: "Only the driver can remove this offer" });
      return;
    }
    res.json({ ok: true });
  });
  app.post(
    ridePath + "/requests",
    requireAuth,
    scope,
    rideScope,
    (req, res) => {
      if (
        !res.locals.open ||
        !store.request(res.locals.ride, req.session.userId!)
      ) {
        res.status(409).json({ error: "A seat request could not be added" });
        return;
      }
      res.status(201).json({ ok: true });
    },
  );
  app.delete(
    ridePath + "/requests/me",
    requireAuth,
    scope,
    rideScope,
    (req, res) => {
      store.withdraw(res.locals.ride, req.session.userId!);
      res.json({ ok: true });
    },
  );
  const driverOnly: RequestHandler = (req, res, next) => {
    if (res.locals.driver !== req.session.userId) {
      res
        .status(403)
        .json({ error: "Only the driver can manage seat requests" });
      return;
    }
    next();
  };
  app.delete(
    ridePath + "/requests/:rider",
    requireAuth,
    scope,
    rideScope,
    driverOnly,
    (req, res) => {
      const result = db
        .prepare(
          "DELETE FROM event_ride_requests WHERE offer_id=? AND rider_id=? AND accepted=0",
        )
        .run(res.locals.ride, Number(req.params.rider));
      if (!result.changes) {
        res.status(409).json({ error: "Pending request unavailable" });
        return;
      }
      res.json({ ok: true });
    },
  );
  app.put(
    ridePath + "/requests/:rider",
    requireAuth,
    scope,
    rideScope,
    driverOnly,
    (req, res) => {
      if (
        !res.locals.open ||
        !night.visible(
          night.offer(res.locals.ride)!,
          night.plan(res.locals.ride),
          Number(req.params.rider),
        ) ||
        !store.accept(
          res.locals.ride,
          Number(req.params.rider),
          req.session.userId!,
        )
      ) {
        res.status(409).json({ error: "This request could not be accepted" });
        return;
      }
      res.json({ ok: true });
    },
  );
  app.get("/api/organizer/events/metrics", requireAuth, (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const now = new Date().toISOString();
    const viewer = req.session.userId!;
    const events = store
      .hostedCandidates(viewer)
      .filter((e) => visible(e) && storage.isUserEventHost(e.id, viewer));
    res.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        activeGoing: store.going(e.id, now),
      })),
    });
  });
  return {
    store,
    night,
    occurrence,
    acceptsPlanning: (event: Event) =>
      (parsePacificDateTime(event.dateEnd || event.dateStart) ?? 0) >=
      Date.now(),
  };
}
