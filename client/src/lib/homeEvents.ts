import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { PRIDE_WEEK_DAY_OPTIONS } from "@shared/prideWeek";
import { parsePacificDateTime } from "@shared/missedConnections";
import { formatListingWhen, listingDay, listingPosterUrl, listingTypeTags } from "@/lib/dsEvent";

export const HOME_COUNTDOWN_TARGET = "2026-07-16T19:00:00-07:00";

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
  "July 16 to 19",
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

/** Shuffled event titles for the home ticker (capped so the band scrolls smoothly). */
export function pickMarqueeItems(events: EventListing[], limit = 12): string[] {
  const titles = shuffleArray(events.map(e => e.title).filter(Boolean));
  if (titles.length > 0) return titles.slice(0, limit);
  return shuffleArray(HOME_MARQUEE_FALLBACK).slice(0, limit);
}

/** Random directory picks for the home "Where to Go" column. */
export function pickRandomBusinesses<T>(businesses: T[], count = 3): T[] {
  return shuffleArray(businesses).slice(0, count);
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

const PACIFIC_TZ = "America/Los_Angeles";

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