import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { PRIDE_WEEK_DAY_OPTIONS, PRIDE_WEEK_START_DATE } from "@shared/prideWeek";
import { pacificCalendarDate, parsePacificDateTime } from "@shared/missedConnections";
import { formatListingWhen, listingDay, listingPosterUrl, listingTypeTags } from "@/lib/dsEvent";

const PACIFIC_TZ = "America/Los_Angeles";

/** Fallback if no Jul 13 listings are loaded yet (midnight PDT Pride Week open). */
export const HOME_COUNTDOWN_TARGET = `${PRIDE_WEEK_START_DATE}T00:00:00-07:00`;

/** Make a stored dateStart safe for `new Date()` / Countdown (force Pacific offset). */
export function toCountdownTarget(dateStart: string): string {
  const raw = dateStart.trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return `${raw}:00-07:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) return `${raw}-07:00`;
  return `${raw}-07:00`;
}

/**
 * Countdown target = start time of the earliest event on Pride Week day 1 (Jul 13).
 * Recomputes from live listings so the home clock stays synced as the schedule changes.
 */
export function earliestPrideWeekStartTarget(
  events: Array<Pick<EventListing, "dateStart">>,
): string {
  let earliestMs: number | null = null;
  let earliestRaw: string | null = null;

  for (const event of events) {
    if (pacificCalendarDate(event.dateStart) !== PRIDE_WEEK_START_DATE) continue;
    const ms = parsePacificDateTime(event.dateStart);
    if (ms == null) continue;
    if (earliestMs == null || ms < earliestMs) {
      earliestMs = ms;
      earliestRaw = event.dateStart;
    }
  }

  if (earliestRaw) return toCountdownTarget(earliestRaw);
  return HOME_COUNTDOWN_TARGET;
}

/**
 * Countdown target = start of the next event that hasn't begun yet (year-round).
 * Returns null when nothing upcoming is loaded.
 */
export function nextEventStartTarget(
  events: Array<Pick<EventListing, "dateStart">>,
  nowMs: number = Date.now(),
): string | null {
  let bestMs: number | null = null;
  let bestRaw: string | null = null;
  for (const event of events) {
    const ms = parsePacificDateTime(event.dateStart);
    if (ms == null || ms <= nowMs) continue;
    if (bestMs == null || ms < bestMs) {
      bestMs = ms;
      bestRaw = event.dateStart;
    }
  }
  return bestRaw ? toCountdownTarget(bestRaw) : null;
}

export const HOME_DAY_ORDER = ["THU", "FRI", "SAT", "SUN"] as const;
export type HomeDayKey = (typeof HOME_DAY_ORDER)[number];

export const HOME_DAY_META: Record<
  HomeDayKey,
  { label: string; long: string; date: string; accent: string; color: string }
> = {
  THU: { label: "Thu", long: "Thursday", date: "Jul 16", accent: "cyan", color: "var(--day-thu)" },
  FRI: { label: "Fri", long: "Friday", date: "Jul 17", accent: "pink", color: "var(--day-fri)" },
  SAT: { label: "Sat", long: "Saturday", date: "Jul 18", accent: "green", color: "var(--day-sat)" },
  SUN: { label: "Sun", long: "Sunday", date: "Jul 19", accent: "orange", color: "var(--day-sun)" },
};

export const HOME_MARQUEE_FALLBACK = [
  "Rainbow Rave 2026",
  "Every Day Is Pride",
  "Keep Portland Weird",
  "Gay All Day",
  "Made by the Scene",
  "Dance Floor Forever",
];

const DAY_DATE_LOOKUP = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map(d => [d.value, d.date]),
) as Record<string, string>;

export function shuffleArray<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isPrideListing(event: EventListing): boolean {
  const day = event.dayOfWeek;
  return Boolean(day && (HOME_DAY_ORDER as readonly string[]).includes(day));
}

export function findSanctuaryHeadliner(events: EventListing[]): EventListing | null {
  return (
    events.find(e => {
      const title = e.title.toLowerCase();
      const venue = (e.venueName || "").toLowerCase();
      return title.includes("stank") || title.includes("yes coach") || venue.includes("sanctuary");
    }) ?? null
  );
}

function uniqueByEventId(list: EventListing[]): EventListing[] {
  const seen = new Set<number>();
  const out: EventListing[] = [];
  for (const item of list) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Shuffled event titles for the home ticker (all Pride-week names for the rainbow band). */
export function pickMarqueeItems(events: EventListing[], limit = 21): string[] {
  const titles = events.map(e => e.title).filter(Boolean);
  if (titles.length > 0) return titles.slice(0, limit);
  return shuffleArray(HOME_MARQUEE_FALLBACK).slice(0, Math.min(limit, HOME_MARQUEE_FALLBACK.length));
}

/**
 * Next N events that haven't ended yet (live + upcoming), earliest start first.
 * Home Up Next row — advances as Pride Week moves, not frozen on Monday openers.
 */
export function eventsUpNext(
  events: EventListing[],
  limit = 4,
  nowMs: number = Date.now(),
): EventListing[] {
  const upcoming = events
    .filter(e => {
      const endMs = parsePacificDateTime(e.dateEnd) ?? parsePacificDateTime(e.dateStart);
      if (endMs == null) return false;
      // Still open or starts soon — drop nights that already closed.
      return endMs >= nowMs;
    })
    .sort((a, b) => {
      const aMs = parsePacificDateTime(a.dateStart) ?? 0;
      const bMs = parsePacificDateTime(b.dateStart) ?? 0;
      return aMs - bMs;
    });
  return uniqueByEventId(upcoming).slice(0, limit);
}

/** Earliest live/upcoming listing the member has RSVP'd to. */
export function nextRsvpEvent(
  events: EventListing[],
  rsvpEventIds: Iterable<number>,
  nowMs: number = Date.now(),
): EventListing | null {
  const ids = new Set(rsvpEventIds);
  if (ids.size === 0) return null;
  const upcoming = events
    .filter(e => ids.has(e.id))
    .filter(e => {
      const endMs = parsePacificDateTime(e.dateEnd) ?? parsePacificDateTime(e.dateStart);
      if (endMs == null) return false;
      return endMs >= nowMs;
    })
    .sort((a, b) => {
      const aMs = parsePacificDateTime(a.dateStart) ?? 0;
      const bMs = parsePacificDateTime(b.dateStart) ?? 0;
      return aMs - bMs;
    });
  return uniqueByEventId(upcoming)[0] ?? null;
}

/** @deprecated Use eventsUpNext — Monday-only openers no longer make sense mid-week. */
export function eventsForMonday(events: EventListing[], limit = 4): EventListing[] {
  return eventsUpNext(events, limit);
}

/** "Mon, Jul 13 · 6:30 PM" for Up Next cards. */
export function formatUpNextWhen(event: EventListing): string {
  const ms = parsePacificDateTime(event.dateStart);
  const dateLabel =
    ms != null
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: PACIFIC_TZ,
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(new Date(ms))
      : "Mon, Jul 13";
  const time =
    ms != null
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: PACIFIC_TZ,
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(ms))
      : "";
  return dateLabel && time ? `${dateLabel} · ${time}` : dateLabel;
}

/** Random directory picks for the home "Where to Go" column. */
export function pickRandomBusinesses<T>(businesses: T[], count = 3): T[] {
  return shuffleArray(businesses).slice(0, count);
}

/** Random directory entries of a given type (e.g. nonprofit). */
export function pickRandomByType<T extends { type: string }>(entries: T[], type: string, count = 3): T[] {
  return shuffleArray(entries.filter(entry => entry.type === type)).slice(0, count);
}

/** Four random Pride-week events; ~12.5% chance the Sanctuary headliner is included. */
export function pickFourToTry(events: EventListing[], sanctuary: EventListing | null): EventListing[] {
  const pool = shuffleArray(uniqueByEventId(events.filter(isPrideListing)));
  if (pool.length === 0) return [];

  if (sanctuary && Math.random() < 0.125) {
    const rest = shuffleArray(pool.filter(e => e.id !== sanctuary.id)).slice(0, 3);
    return shuffleArray([sanctuary, ...rest]);
  }

  return pool.slice(0, 4);
}

export function isWhatsOnVisible(search = ""): boolean {
  if (/[?&]whatson=1/.test(search)) return true;
  return Date.now() >= new Date("2026-07-13T00:00:00-07:00").getTime();
}

export function eventsForHomeDay(events: EventListing[], day: HomeDayKey): EventListing[] {
  return events
    .filter(e => e.dayOfWeek === day)
    .sort((a, b) => {
      const aMs = parsePacificDateTime(a.dateStart) ?? 0;
      const bMs = parsePacificDateTime(b.dateStart) ?? 0;
      return aMs - bMs;
    });
}

export function countEventsByHomeDay(events: EventListing[]): Record<HomeDayKey, number> {
  const counts = { THU: 0, FRI: 0, SAT: 0, SUN: 0 } as Record<HomeDayKey, number>;
  for (const event of events) {
    const day = event.dayOfWeek as HomeDayKey;
    if (day && day in counts) counts[day]++;
  }
  return counts;
}

export function formatHomeWhen(event: Event): string {
  const day = listingDay(event) as HomeDayKey;
  const meta = HOME_DAY_META[day];
  const datePart = meta?.date ?? "";
  const ms = parsePacificDateTime(event.dateStart);
  const time =
    ms != null
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: PACIFIC_TZ,
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(ms))
      : "";
  const hood = event.neighborhood || "Portland";
  const dayShort = meta?.label ?? day;
  return [dayShort && datePart ? `${dayShort}, ${datePart}` : "", time, hood].filter(Boolean).join(" · ");
}

export function dayColorVar(day?: string | null): string {
  if (!day) return HOME_DAY_META.SAT.color;
  return HOME_DAY_META[day as HomeDayKey]?.color ?? HOME_DAY_META.SAT.color;
}

export function homeListingProps(event: Event) {
  return {
    day: listingDay(event),
    when: formatHomeWhen(event),
    types: listingTypeTags(event),
    image: listingPosterUrl(event),
  };
}

type MapPin = { x: number; y: number; day?: string; multi?: boolean };

const PORTLAND_BOUNDS = {
  minLat: 45.48,
  maxLat: 45.58,
  minLng: -122.72,
  maxLng: -122.58,
};

const DEFAULT_HOME_PINS: MapPin[] = [
  { x: 44, y: 56, day: "SAT" },
  { x: 41, y: 61, day: "SAT" },
  { x: 52, y: 40, day: "THU" },
  { x: 36, y: 46, day: "THU" },
  { x: 60, y: 50, day: "FRI" },
  { x: 66, y: 64, day: "FRI" },
  { x: 47, y: 52, day: "SUN" },
  { x: 58, y: 70, day: "SUN" },
  { x: 50, y: 47, multi: true },
  { x: 63, y: 44, day: "SAT" },
  { x: 39, y: 68, day: "SUN" },
];

export function buildHomeMapPins(events: EventListing[]): MapPin[] {
  const withCoords = events.filter(
    e => typeof e.lat === "number" && typeof e.lng === "number" && Number.isFinite(e.lat) && Number.isFinite(e.lng),
  );
  if (withCoords.length < 4) return DEFAULT_HOME_PINS;

  const { minLat, maxLat, minLng, maxLng } = PORTLAND_BOUNDS;
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  const pins = shuffleArray(withCoords)
    .slice(0, 12)
    .map(e => ({
      x: Math.round(((e.lng! - minLng) / lngSpan) * 100),
      y: Math.round((1 - (e.lat! - minLat) / latSpan) * 100),
      day: e.dayOfWeek || "SAT",
    }));

  return pins.length > 0 ? pins : DEFAULT_HOME_PINS;
}

export function prideDayChipDate(day: HomeDayKey): string {
  const iso = DAY_DATE_LOOKUP[day];
  if (!iso) return HOME_DAY_META[day].date.split(" ")[1] ?? "";
  const d = new Date(`${iso}T12:00:00-07:00`);
  return String(d.getUTCDate());
}