import { resolveEventPosterUrl } from "@shared/eventPoster";
import { parsePacificDateTime } from "@shared/missedConnections";
import type { EventListing } from "@shared/multiDayEvents";
import { PRIDE_WEEK_DAYS, type AdmKey, type DayKey, type EventType, type PrideEvent } from "@shared/prideWeek";

const GRID_START = 10 * 60;
const GRID_END = 27 * 60;

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
};

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
  if (!day || !(PRIDE_WEEK_DAYS as readonly string[]).includes(day)) return null;

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
  };
}

export function buildScheduleEvents(
  listings: EventListing[],
  attendanceSummaries: Record<string, { count?: number }>,
): ScheduleEvent[] {
  const out: ScheduleEvent[] = [];
  for (const listing of listings) {
    const going =
      attendanceSummaries[listing.id]?.count ??
      attendanceSummaries[String(listing.id)]?.count ??
      0;
    const mapped = eventListingToScheduleEvent(listing, going);
    if (mapped) out.push(mapped);
  }
  return out;
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