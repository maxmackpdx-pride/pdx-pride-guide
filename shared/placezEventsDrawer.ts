import {
  getEventScheduleTiming,
  missedConnectionClosesAt,
  parsePacificDateTime,
} from "./missedConnections";

/** Ride plan kinds used by night-ride / event planning APIs. */
export type RidePlanKind = "carpool" | "home" | "afterz";

export type CarpoolDirection = "Arriving" | "Departing";

export type MapCamera = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

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
  const totalMin = Math.max(1, Math.ceil(remaining / 60000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return hours ? `${days}d ${hours}h left` : `${days}d left`;
  if (hours > 0) return hours < 6 && minutes ? `${hours}h ${minutes}m left` : `${hours}h left`;
  return `${minutes}m left`;
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

function lngToX(lng: number): number {
  return (lng + 180) / 360;
}

function latToY(lat: number): number {
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const s = Math.sin((clamped * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

function xToLng(x: number): number {
  return x * 360 - 180;
}

function yToLat(y: number): number {
  const n = Math.PI * (1 - 2 * y);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

/**
 * Approximate geographic bounds for a MapLibre camera and viewport size.
 * Pitch widens the visible ground footprint. Bearing is ignored for the
 * axis-aligned box used to test whether a point is on screen.
 */
export function cameraToBounds(
  camera: MapCamera,
  width: number,
  height: number,
): MapBounds | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const [lng, lat] = camera.center;
  if (![lng, lat, camera.zoom].every(Number.isFinite)) return null;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 85.051129) return null;
  const world = 256 * 2 ** camera.zoom;
  const pad = 1 + Math.max(0, camera.pitch ?? 0) / 90;
  const halfW = ((width / 2) / world) * pad;
  const halfH = ((height / 2) / world) * pad;
  const cx = lngToX(lng);
  const cy = latToY(lat);
  const west = xToLng(cx - halfW);
  const east = xToLng(cx + halfW);
  const north = yToLat(cy - halfH);
  const south = yToLat(cy + halfH);
  return { west, east, south, north };
}

export function pointInBounds(
  lat: number | null | undefined,
  lng: number | null | undefined,
  bounds: MapBounds,
): boolean {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const latOk = lat <= bounds.north && lat >= bounds.south;
  if (bounds.west <= bounds.east) return latOk && lng >= bounds.west && lng <= bounds.east;
  return latOk && (lng >= bounds.west || lng <= bounds.east);
}

export function debounceMs(defaultMs = 280): number {
  return defaultMs;
}

export type MapzTimeFilter = "Today" | "Tomorrow" | "This Week";

export const MAPZ_TIME_FILTERS: MapzTimeFilter[] = ["Today", "Tomorrow", "This Week"];
