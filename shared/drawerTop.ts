/**
 * Helpers for the shared DrawerTop used by every room drawer. The calendar
 * is a 14-day Placez rail (two weeks out). The countdown card shows the
 * next upcoming event. Visual style lives in the client DrawerTop components.
 */
import { addCalendarDays } from "./drawerFilters";
import { pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "./missedConnections";

export type DrawerTopEvent = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd?: string | null;
  posterImageUrl?: string | null;
  venueName?: string | null;
  dayOfWeek?: string | null;
  accentColor?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DrawerCalendarDay = {
  key: string;
  weekday: string;
  day: string;
  label: string;
  count: number;
};

export type DrawerCountdownRemaining = {
  days: number;
  hours: number;
  minutes: number;
  starts: number;
};

const WEEKDAY = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });
const WEEKDAY_LONG = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });

function utcNoonFromIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** Pacific dates starting today, with how many events fall on each day. Default is two weeks (14 days). */
export function buildDrawerCalendarDays(events: DrawerTopEvent[], now = Date.now(), length = 14): DrawerCalendarDay[] {
  const today = pacificTodayDate(now);
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = pacificCalendarDate(event.dateStart);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const days = Math.max(1, length);
  return Array.from({ length: days }, (_, index) => {
    const key = addCalendarDays(today, index);
    const date = utcNoonFromIsoDate(key);
    return {
      key,
      weekday: WEEKDAY.format(date),
      day: String(date.getUTCDate()),
      label: WEEKDAY_LONG.format(date),
      count: counts.get(key) || 0,
    };
  });
}

/** Placez / hologram countdown units: days, hours, minutes until start. */
export function remainingToStart(dateStart: string, now = Date.now()): DrawerCountdownRemaining | null {
  const starts = parsePacificDateTime(dateStart);
  if (starts == null || starts <= now) return null;
  const minutes = Math.max(1, Math.ceil((starts - now) / 60000));
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
    starts,
  };
}

export function formatDrawerCountdown(remaining: DrawerCountdownRemaining): string {
  const hours = String(remaining.hours).padStart(2, "0");
  const minutes = String(remaining.minutes).padStart(2, "0");
  return remaining.days > 0 ? `${remaining.days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

/**
 * The next upcoming events after `now`, optionally limited to one Pacific date.
 * Returns at most `limit` events, soonest first.
 */
export function nextDrawerEvents(
  events: DrawerTopEvent[],
  now = Date.now(),
  limit = 3,
  onDate?: string | null,
): DrawerTopEvent[] {
  return events
    .filter(event => {
      if (remainingToStart(event.dateStart, now) == null) return false;
      if (!onDate) return true;
      return pacificCalendarDate(event.dateStart) === onDate;
    })
    .sort((a, b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0))
    .slice(0, limit);
}
