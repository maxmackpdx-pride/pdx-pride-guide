import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import type { Event } from "@shared/schema";
import { pacificCalendarDate } from "@shared/missedConnections";
import {
  carpoolDirection,
  isPastAttendedEvent,
  isUpcomingEvent,
  mizzedClosesAtMs,
  mizzedWindowOpen,
  type DrawerAfterzPlan,
  type DrawerCarpoolPlan,
  type DrawerEventPlans,
  type DrawerGigPlan,
} from "@shared/placezEventsDrawer";
import type { IStorage } from "./storage";
import { RIDE_DRIVER_VISIBLE_TO_VIEWER } from "./eventPlanning";

type VisibleNight = { id: string; title: string; role: string; eventId: number; occurrence: string };

type PlannedRow = {
  eventId: number;
  occurrence: string;
  source: "rsvp" | "gig" | "carpool" | "afterz";
};

export type DrawerEventPayload = {
  event: Event;
  occurrenceDate: string;
  plans: DrawerEventPlans;
  mizzedClosesAt: string | null;
};

function publicEvent(
  storage: IStorage,
  eventId: number,
  visible: (event: Pick<Event, "dateStart">) => boolean,
): Event | undefined {
  const event = storage.getEvent(eventId);
  if (!event || event.status !== "LIVE" || !hasPublicEventFlags(event) || !visible(event)) {
    return undefined;
  }
  return event;
}

export function collectDrawerPlans(
  db: Database.Database,
  storage: IStorage,
  viewer: number,
  visible: (event: Pick<Event, "dateStart">) => boolean,
  now = Date.now(),
  nights: VisibleNight[] = [],
): { upcoming: DrawerEventPayload[]; past: DrawerEventPayload[] } {
  const rows: PlannedRow[] = [];

  const cached = new Map<number, Event | undefined>();
  const getVisible = (id: number) => {
    if (!cached.has(id)) cached.set(id, publicEvent(storage, id, visible));
    return cached.get(id);
  };

  const rsvps = db
    .prepare(
      `SELECT event_id AS eventId FROM attendances
       WHERE user_id=? AND is_active=1 AND (expires_at IS NULL OR expires_at>?)`,
    )
    .all(viewer, new Date(now).toISOString()) as { eventId: number }[];
  for (const row of rsvps) {
    const event = getVisible(row.eventId);
    const occurrence = event ? pacificCalendarDate(event.dateStart) : null;
    if (event && occurrence) rows.push({ eventId: event.id, occurrence, source: "rsvp" });
  }

  const gigs = db
    .prepare(
      `SELECT l.event_id AS eventId, l.occurrence FROM event_gig_links l
       JOIN gig_posts g ON g.id=l.gig_id
       WHERE g.user_id=? AND g.status='LIVE' AND g.post_type='POSTING_GIG'`,
    )
    .all(viewer) as { eventId: number; occurrence: string }[];
  for (const row of gigs) rows.push({ ...row, source: "gig" });

  const driven = db
    .prepare(
      `SELECT event_id AS eventId, occurrence FROM event_ride_offers WHERE driver_id=?`,
    )
    .all(viewer) as { eventId: number; occurrence: string }[];
  for (const row of driven) rows.push({ ...row, source: "carpool" });

  const riding = db
    .prepare(
      `SELECT o.event_id AS eventId, o.occurrence FROM event_ride_requests r
       JOIN event_ride_offers o ON o.id=r.offer_id
       JOIN users u ON u.id=o.driver_id
       WHERE r.rider_id=@viewer AND r.accepted=1 AND ${RIDE_DRIVER_VISIBLE_TO_VIEWER}`,
    )
    .all({viewer}) as { eventId: number; occurrence: string }[];
  for (const row of riding) rows.push({ ...row, source: "carpool" });

  const afterz = new Map<string, DrawerAfterzPlan[]>();
  for (const night of nights) {
    if (night.role !== "host" && night.role !== "accepted") continue;
    rows.push({eventId: night.eventId, occurrence: night.occurrence, source: "afterz"});
    const key = `${night.eventId}:${night.occurrence}`;
    const list = afterz.get(key) ?? [];
    list.push({id:night.id, title:night.title, role:night.role === "host" ? "host" : "guest"});
    afterz.set(key,list);
  }

  const keys = new Map<string, { eventId: number; occurrence: string; sources: Set<PlannedRow["source"]> }>();
  for (const row of rows) {
    const event = getVisible(row.eventId);
    if (!event || !row.occurrence) continue;
    const key = `${event.id}:${row.occurrence}`;
    const current = keys.get(key) ?? { eventId: event.id, occurrence: row.occurrence, sources: new Set() };
    current.sources.add(row.source);
    keys.set(key, current);
  }

  const upcoming: DrawerEventPayload[] = [];
  const past: DrawerEventPayload[] = [];

  for (const item of keys.values()) {
    const event = getVisible(item.eventId);
    if (!event) continue;
    const plans = plansFor(db, viewer, event.id, item.occurrence, afterz.get(`${event.id}:${item.occurrence}`) ?? []);
    const payload: DrawerEventPayload = {
      event,
      occurrenceDate: item.occurrence,
      plans,
      mizzedClosesAt: missedIso(event),
    };
    if (isUpcomingEvent(event.dateStart, event.dateEnd, now)) {
      upcoming.push(payload);
    } else if (
      isPastAttendedEvent(event.dateStart, event.dateEnd, now) &&
      item.sources.has("rsvp") &&
      mizzedWindowOpen(event.dateStart, event.dateEnd, now)
    ) {
      past.push(payload);
    }
  }

  const byStart = (a: DrawerEventPayload, b: DrawerEventPayload) =>
    (parseTime(a.event.dateStart) ?? 0) - (parseTime(b.event.dateStart) ?? 0);
  upcoming.sort(byStart);
  past.sort((a, b) => byStart(b, a));
  return { upcoming, past };
}

function missedIso(event: Event): string | null {
  const ms = mizzedClosesAtMs(event.dateStart, event.dateEnd);
  return ms == null ? null : new Date(ms).toISOString();
}

function parseTime(value?: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function plansFor(
  db: Database.Database,
  viewer: number,
  eventId: number,
  occurrence: string,
  afterz: DrawerAfterzPlan[],
): DrawerEventPlans {
  const gigz = db
    .prepare(
      `SELECT g.id, g.title FROM event_gig_links l
       JOIN gig_posts g ON g.id=l.gig_id
       WHERE l.event_id=? AND l.occurrence=? AND g.user_id=? AND g.status='LIVE' AND g.post_type='POSTING_GIG'
       ORDER BY g.id DESC`,
    )
    .all(eventId, occurrence, viewer) as DrawerGigPlan[];

  const carpools: DrawerCarpoolPlan[] = [];
  const offers = db
    .prepare(
      `SELECT o.id, o.area, o.driver_id AS driverId, p.kind
       FROM event_ride_offers o
       JOIN users u ON u.id=o.driver_id
       LEFT JOIN night_ride_plans p ON p.offer_id=o.id
       WHERE o.event_id=@eventId AND o.occurrence=@occurrence AND ${RIDE_DRIVER_VISIBLE_TO_VIEWER}`,
    )
    .all({eventId, occurrence, viewer}) as { id: number; area: string; driverId: number; kind: string | null }[];
  for (const offer of offers) {
    const direction = carpoolDirection(offer.kind ?? "carpool");
    if (!direction) continue;
    if (offer.driverId === viewer) {
      carpools.push({ id: offer.id, direction, area: offer.area, role: "driver" });
      continue;
    }
    const accepted = db
      .prepare(
        "SELECT 1 FROM event_ride_requests WHERE offer_id=? AND rider_id=? AND accepted=1",
      )
      .get(offer.id, viewer);
    if (accepted) carpools.push({ id: offer.id, direction, area: offer.area, role: "rider" });
  }

  return { gigz, carpools, afterz };
}

export function registerPlacezEventsDrawer(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  requireAuth: RequestHandler,
  visible: (event: Pick<Event, "dateStart">) => boolean,
  projectEvent: (event: Event) => unknown,
  listVisibleNights: (viewer: number) => VisibleNight[],
  now: () => number = Date.now,
) {
  app.get("/api/events/mine/drawer-plans", requireAuth, (req, res) => {
    res.set("Cache-Control", "private, no-store");
    res.vary("Cookie");
    const viewer = req.session.userId!;
    if (storage.getUserById(viewer)?.status !== "active") {
      res.status(403).json({ error: "Account unavailable" });
      return;
    }
    const plans = collectDrawerPlans(db, storage, viewer, visible, now(), listVisibleNights(viewer));
    const project = (item: DrawerEventPayload) => ({ ...item, event: projectEvent(item.event) });
    res.json({ upcoming: plans.upcoming.map(project), past: plans.past.map(project) });
  });
}
