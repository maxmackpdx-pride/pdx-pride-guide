import { formatCardCountdown } from "./drawerTop";
import {
  getEventScheduleTiming,
  missedConnectionClosesAt,
  parsePacificDateTime,
} from "./missedConnections";

/** Ride plan kinds used by night-ride / event planning APIs. */
export type RidePlanKind = "carpool" | "home" | "afterz";

export type CarpoolDirection = "Arriving" | "Departing";

export { cameraToBounds, pointInBounds, type MapBounds, type MapCamera } from "./drawerMapBounds";

export type DrawerGigPlan = { id: number; title: string };
export type DrawerCarpoolPlan = {
  id: number;
  direction: CarpoolDirection;
  area: string;
  role: "driver" | "rider";
};
export type DrawerAfterzPlan = {
  id: string;
  title: string;
  role: "host" | "guest";
};
export type DrawerEventPlans = {
  gigz: DrawerGigPlan[];
  carpools: DrawerCarpoolPlan[];
  afterz: DrawerAfterzPlan[];
};

/** Arriving is a ride to the venue. Departing is a ride home. Afterz rides are not carpool labels. */
export function carpoolDirection(kind: string | null | undefined): CarpoolDirection | null {
  if (kind === "home") return "Departing";
  if (kind === "carpool") return "Arriving";
  return null;
}

export function hasAttachedPlans(plans?: DrawerEventPlans | null): boolean {
  if (!plans) return false;
  return plans.gigz.length > 0 || plans.carpools.length > 0 || plans.afterz.length > 0;
}

/** Stylized text lines for the plan extension. No attendee counts. */
export function planExtensionLines(plans: DrawerEventPlans): string[] {
  const lines: string[] = [];
  for (const gig of plans.gigz) {
    const title = gig.title.trim();
    lines.push(title ? `Gigz · ${title}` : "Gigz");
  }
  for (const ride of plans.carpools) {
    const area = ride.area.trim();
    lines.push(area ? `${ride.direction} · ${area}` : ride.direction);
  }
  for (const night of plans.afterz) {
    const title = night.title.trim();
    lines.push(title ? `Afterz · ${title}` : "Afterz");
  }
  return lines;
}

export function mizzedClosesAtMs(
  dateStart?: string | null,
  dateEnd?: string | null,
): number | null {
  const iso = missedConnectionClosesAt(dateStart, dateEnd);
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Human countdown until Mizzed closes. Closed windows are labeled, never left blank. */
export function formatMizzedCountdown(closesAtMs: number, now = Date.now()): string {
  const remaining = closesAtMs - now;
  if (remaining <= 0) return "Mizzed closed";
  return `${formatCardCountdown(remaining)} left`;
}

export function mizzedWindowOpen(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): boolean {
  const start = parsePacificDateTime(dateStart);
  const closes = mizzedClosesAtMs(dateStart, dateEnd);
  if (start == null || closes == null) return false;
  return now >= start && now < closes;
}

export function isUpcomingEvent(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): boolean {
  const timing = getEventScheduleTiming(dateStart, dateEnd, now);
  return timing === "upcoming" || timing === "live";
}

export function isPastAttendedEvent(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): boolean {
  return getEventScheduleTiming(dateStart, dateEnd, now) === "past";
}

/** Opens the Mizzed Connections board filtered to one event. */
export function mizzedEventHref(eventId: number): string {
  return `/mizzed?event=${eventId}`;
}

export function isValidEventId(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function parseEventQueryId(value: string | null | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function debounceMs(defaultMs = 280): number {
  return defaultMs;
}

export type MapzTimeFilter = "Today" | "Tomorrow" | "This Week";

export const MAPZ_TIME_FILTERS: MapzTimeFilter[] = ["Today", "Tomorrow", "This Week"];
