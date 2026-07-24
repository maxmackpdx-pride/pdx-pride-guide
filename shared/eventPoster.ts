import type { NudeBeachTab } from "./nudeBeaches";
import { EVENT_WEEK_DAYS, type EventWeekDay } from "./eventWeek";

/** Neutral fallback when day is unknown — no weekday word. */
export const EVENT_PLACEHOLDER_PENDING = "/placeholders/event-placeholder-pending.svg";

/** Legacy rotation set (neutral / non-day-specific). Kept for any old references. */
export const EVENT_PLACEHOLDERS = [
  "/placeholders/event-placeholder-1.svg",
  "/placeholders/event-placeholder-2.svg",
  "/placeholders/event-placeholder-3.svg",
  EVENT_PLACEHOLDER_PENDING,
] as const;

const DAY_PLACEHOLDER: Record<EventWeekDay, string> = {
  MON: "/placeholders/event-day-mon.svg",
  TUE: "/placeholders/event-day-tue.svg",
  WED: "/placeholders/event-day-wed.svg",
  THU: "/placeholders/event-day-thu.svg",
  FRI: "/placeholders/event-day-fri.svg",
  SAT: "/placeholders/event-day-sat.svg",
  SUN: "/placeholders/event-day-sun.svg",
};

function isEventWeekDay(day: string): day is EventWeekDay {
  return (EVENT_WEEK_DAYS as readonly string[]).includes(day);
}

/** True for generated flyer stand-ins (not real promoter art). */
export function isEventPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return /\/placeholders\/event-(placeholder|day)-/i.test(url);
}

/**
 * Resolve flyer URL for an event.
 * Prefer real poster; otherwise day-aware placeholder so SAT never shows "SUNDAY VIBES".
 * If a stale generic placeholder path is stored, re-pick from dayOfWeek.
 */
export function resolveEventPosterUrl(
  eventId: number,
  posterImageUrl: string | null | undefined,
  dayOfWeek?: string | null,
): string {
  if (posterImageUrl && !isEventPlaceholderUrl(posterImageUrl)) return posterImageUrl;
  const day = (dayOfWeek || "").toUpperCase();
  if (isEventWeekDay(day)) return DAY_PLACEHOLDER[day];
  void eventId;
  return EVENT_PLACEHOLDER_PENDING;
}

/** Beach-day flyer placeholders (orange/white/black Rooster, green/white/black Sauvie). */
export const BEACH_PLACEHOLDERS: Record<NudeBeachTab, string> = {
  "rooster-rock": "/placeholders/beach-rooster-rock.svg",
  "sauvie-island": "/placeholders/beach-sauvie-island.svg",
};

export function resolveBeachPosterUrl(beachId: NudeBeachTab | string): string {
  if (beachId === "sauvie-island") return BEACH_PLACEHOLDERS["sauvie-island"];
  return BEACH_PLACEHOLDERS["rooster-rock"];
}
