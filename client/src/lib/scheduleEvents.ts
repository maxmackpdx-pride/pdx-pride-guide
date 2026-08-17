import { resolveBeachPosterUrl, resolveEventPosterUrl } from "@shared/eventPoster";
import { parsePacificDateTime, pacificCalendarDate } from "@shared/missedConnections";
import type { EventListing } from "@shared/multiDayEvents";
import { Z_OUT_BEACH_PATHS, type NudeBeachTab } from "@shared/nudeBeaches";
import {
  EVENT_WEEK_DAY_OPTIONS,
  EVENT_WEEK_DAYS,
  type AdmKey,
  type DayKey,
  type EventType,
  type PrideEvent,
} from "@shared/eventWeek";
import {
  beachVenueLabel,
  defaultDepartHour,
  formatRiverBratsWindow,
  riverBratsWallIso,
} from "@shared/riverBrats";

const GRID_START = 10 * 60;
const GRID_END = 27 * 60;

/** Synthetic negative id so layoutDay never collides with real event ids. */
export function beachScheduleEventId(checkinId: number): number {
  return -Math.abs(checkinId || 1);
}

export function beachScheduleKey(checkinId: number): string {
  return `beach-${checkinId}`;
}

export type BeachCheckinScheduleRow = {
  id: number;
  beachId: string;
  calendarDate: string;
  arrivalHour: number;
  departHour?: number | null;
  note?: string | null;
  presence?: string;
};

const JSON_TAG_TO_TYPE: Record<string, EventType> = {
  DRAG: "drag",
  DANCE: "dance",
  NIGHTLIFE: "dance",
  MARCH: "march",
  FAIR: "outdoor",
  PERFORMANCE: "music",
  SOCIAL: "community",
  EDUCATION: "community",
  BRUNCH: "community",
  KINK: "community",
  TRANS: "community",
  QTBIPOC: "community",
  OTHER: "community",
};

export type ScheduleEvent = PrideEvent & {
  /** Unique per grid block (handles multi-day listing slices). */
  scheduleKey: string;
  /** Resolved flyer URL for grid blocks and popover header. */
  posterUrl: string;
  /** Absolute start/end (ms) for live / up-next selectors. */
  startMs: number;
  endMs: number;
  /** Personal River Brats day (not a Pride event listing). */
  kind?: "event" | "beach";
  beachId?: NudeBeachTab;
  checkinId?: number;
  calendarDate?: string;
  /** Deep link for popover “open” (events use eventPath; beach plans use OUTZ). */
  href?: string;
};

function dayKeyFromCalendarDate(ymd: string): DayKey | null {
  const hit = EVENT_WEEK_DAY_OPTIONS.find(d => d.date === ymd);
  return hit ? (hit.value as DayKey) : null;
}

function isNudeBeachTab(id: string): id is NudeBeachTab {
  return id === "rooster-rock" || id === "sauvie-island";
}

/**
 * Map a personal beach check-in onto the Pride Week schedule grid with
 * beach-branded flyer art (same block treatment as event flyers).
 */
export function beachCheckinToScheduleEvent(row: BeachCheckinScheduleRow): ScheduleEvent | null {
  if (!isNudeBeachTab(row.beachId)) return null;
  const day = dayKeyFromCalendarDate(row.calendarDate);
  if (!day) return null;

  const arrival = Math.max(0, Math.min(23, Number(row.arrivalHour) || 0));
  const departRaw =
    row.departHour == null || !Number.isFinite(Number(row.departHour))
      ? defaultDepartHour(arrival)
      : Number(row.departHour);
  const depart = Number.isFinite(departRaw)
    ? Math.max(arrival + 1, Math.min(22, departRaw))
    : defaultDepartHour(arrival);

  let startMin = arrival * 60;
  let endMin = depart * 60;
  // Schedule grid is 10am–3am; early river plans still need a visible block.
  if (endMin <= GRID_START) {
    startMin = GRID_START;
    endMin = GRID_START + 60;
  } else {
    startMin = Math.max(startMin, GRID_START);
    endMin = Math.min(Math.max(endMin, startMin + 60), GRID_END);
  }
  if (endMin <= startMin) return null;

  const startIso = riverBratsWallIso(row.calendarDate, arrival);
  const endIso = riverBratsWallIso(row.calendarDate, depart);
  const startMs = parsePacificDateTime(startIso) ?? Date.parse(`${row.calendarDate}T${String(arrival).padStart(2, "0")}:00:00-07:00`);
  let endMs = parsePacificDateTime(endIso) ?? startMs + (depart - arrival) * 3_600_000;
  if (!Number.isFinite(startMs)) return null;
  if (!Number.isFinite(endMs) || endMs <= startMs) {
    endMs = startMs + Math.max(60, endMin - startMin) * 60_000;
  }

  const venue = beachVenueLabel(row.beachId);
  const window = formatRiverBratsWindow(arrival, depart);
  const hood = row.beachId === "sauvie-island" ? "Sauvie Island" : "Columbia Gorge";
  const presence = String(row.presence || "PLANNED").toUpperCase();
  const note = row.note?.trim();
  const blurbParts = [
    presence === "HERE" ? "You’re verified on the beach." : `River Brats plan · ${window}.`,
    note ? (note.endsWith(".") ? note : `${note}.`) : null,
    "Open Nude Beaches to tweak time, chat, or uncheck in.",
  ].filter(Boolean);

  const tab = row.beachId === "sauvie-island" ? "sauvie-island" : "rooster-rock";

  return {
    id: beachScheduleEventId(row.id),
    scheduleKey: beachScheduleKey(row.id),
    day,
    s: startMin,
    e: endMin,
    title: `Beach day · ${row.beachId === "sauvie-island" ? "Collins Beach" : "Rooster Rock"}`,
    venue,
    hood,
    adm: "FREE",
    types: ["outdoor", "community"],
    age: "all-ages",
    going: 0,
    blurb: blurbParts.join(" "),
    feat: false,
    posterUrl: resolveBeachPosterUrl(row.beachId),
    startMs,
    endMs,
    kind: "beach",
    beachId: row.beachId,
    checkinId: row.id,
    calendarDate: row.calendarDate,
    href: Z_OUT_BEACH_PATHS[tab],
  };
}

function pacificClockMinutes(value: string): number | null {
  const ms = parsePacificDateTime(value);
  if (ms == null) return null;
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  const minute = Number(parts.minute);
  let total = hour * 60 + minute;
  if (hour < 4) total += 1440;
  return total;
}

function mapAdmission(admission: string): AdmKey {
  if (admission === "FREE") return "FREE";
  if (admission === "SUGGESTED_DONATION") return "SUGGESTED_DONATION";
  return "TICKETED";
}

function mapAge(ageRequirement: string): string {
  if (ageRequirement === "21_PLUS") return "21+";
  if (ageRequirement === "18_PLUS") return "18+";
  return "all-ages";
}

function parseTypes(eventTypes: string): EventType[] {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(eventTypes || "[]");
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    /* ignore */
  }
  const types = new Set<EventType>();
  for (const tag of tags) {
    const norm = tag.trim().toUpperCase().replace(/[\s-]+/g, "_");
    const mapped = JSON_TAG_TO_TYPE[norm];
    if (mapped) types.add(mapped);
  }
  if (types.size === 0) types.add("community");
  return Array.from(types);
}

function isHeadliner(event: EventListing, going: number): boolean {
  const title = event.title.toLowerCase();
  if (going >= 50) return true;
  if (title.includes("parade") || title.includes("waterfront festival")) return true;
  if (title.includes("radiance") || title.includes("darcelle")) return true;
  let tags: string[] = [];
  try {
    tags = JSON.parse(event.eventTypes || "[]");
  } catch {
    /* ignore */
  }
  return tags.some(t => String(t).toUpperCase().includes("MARCH"));
}

export function eventListingToScheduleEvent(
  event: EventListing,
  going = 0,
): ScheduleEvent | null {
  const day = event.dayOfWeek as DayKey;
  if (!day || !(EVENT_WEEK_DAYS as readonly string[]).includes(day)) return null;

  const startMin = pacificClockMinutes(event.dateStart);
  let endMin = pacificClockMinutes(event.dateEnd);
  if (startMin == null) return null;
  if (endMin != null && endMin < startMin) endMin += 24 * 60;
  if (endMin == null || endMin <= startMin) endMin = startMin + 60;

  const clampedStart = Math.max(startMin, GRID_START);
  const clampedEnd = Math.min(endMin, GRID_END);
  if (clampedEnd <= clampedStart) return null;

  const startMs = parsePacificDateTime(event.dateStart);
  if (startMs == null) return null;
  let endMs = parsePacificDateTime(event.dateEnd);
  if (endMs == null || endMs <= startMs) {
    endMs = startMs + (endMin - startMin) * 60_000;
  }

  return {
    id: event.id,
    scheduleKey: event.listingInstanceKey ?? String(event.id),
    day,
    s: clampedStart,
    e: clampedEnd,
    title: event.title,
    venue: event.venueName,
    hood: event.neighborhood || "Portland",
    adm: mapAdmission(event.admission),
    types: parseTypes(event.eventTypes),
    age: mapAge(event.ageRequirement),
    going,
    blurb: event.description,
    feat: isHeadliner(event, going),
    posterUrl: resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek),
    startMs,
    endMs,
    calendarDate: pacificCalendarDate(event.dateStart) ?? undefined,
  };
}

export function buildScheduleEvents(
  listings: EventListing[],
  attendanceSummaries: Record<string, { count?: number }>,
  beachCheckins: BeachCheckinScheduleRow[] = [],
): ScheduleEvent[] {
  const out: ScheduleEvent[] = [];
  for (const listing of listings) {
    const going =
      attendanceSummaries[listing.id]?.count ??
      attendanceSummaries[String(listing.id)]?.count ??
      0;
    const mapped = eventListingToScheduleEvent(listing, going);
    if (mapped) out.push({ ...mapped, kind: "event" });
  }
  for (const row of beachCheckins) {
    const mapped = beachCheckinToScheduleEvent(row);
    if (mapped) out.push(mapped);
  }
  return out;
}

export function isBeachScheduleEvent(e: Pick<ScheduleEvent, "kind" | "scheduleKey" | "id">): boolean {
  return e.kind === "beach" || String(e.scheduleKey || "").startsWith("beach-") || e.id < 0;
}

/** True while the event is actually on (absolute start/end, day-aware). */
export function isLiveNow(e: ScheduleEvent, nowMs: number): boolean {
  return e.startMs <= nowMs && nowMs < e.endMs;
}

/** All events currently within their start–end window, ending soonest first. */
export function liveScheduleEvents(list: ScheduleEvent[], nowMs: number): ScheduleEvent[] {
  return list.filter(e => isLiveNow(e, nowMs)).sort((a, b) => a.endMs - b.endMs || a.startMs - b.startMs);
}

/** Next events that have not started yet, soonest first. */
export function upcomingScheduleEvents(
  list: ScheduleEvent[],
  nowMs: number,
  limit = 10,
): ScheduleEvent[] {
  return list
    .filter(e => e.startMs > nowMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs)
    .slice(0, limit);
}
