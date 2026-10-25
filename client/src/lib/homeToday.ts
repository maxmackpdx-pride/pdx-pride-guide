import { isEventSchedulePast, pacificCalendarDate, parsePacificDateTime } from "@shared/missedConnections";

/** Minimal listing shape the Today rail needs. */
export type TodayListing = { dateStart: string; dateEnd?: string | null };

/** A date-seeded score keeps picks steady during refetches and rotates them each Pacific day. */
export function dailyScore(value: string): number {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Three stable picks for a Pacific calendar date (YYYY-MM-DD). */
export function dailyPicks<T>(rows: T[], date: string, key: (row: T) => string, count = 3): T[] {
  return [...rows].sort((a, b) => dailyScore(`${date}:${key(a)}`) - dailyScore(`${date}:${key(b)}`)).slice(0, count);
}

/**
 * Events on today's Pacific calendar day that have not finished yet, soonest first.
 * `now` must be the live clock, so an event drops off when its scheduled end passes.
 */
export function todaysUpcomingEvents<T extends TodayListing>(listings: T[], now: number, today: string): T[] {
  return listings
    .filter(event => pacificCalendarDate(event.dateStart) === today && !isEventSchedulePast(event.dateStart, event.dateEnd, now))
    .sort((a, b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0));
}
