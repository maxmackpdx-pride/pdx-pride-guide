import type { Event } from "./schema";
import { pacificCalendarDate, pacificDayOfWeek, parsePacificDateTime } from "./missedConnections";

const PACIFIC_TZ = "America/Los_Angeles";
const PRIDE_LISTING_DAYS = new Set(["THU", "FRI", "SAT", "SUN"]);

export type EventListing = Event & { listingInstanceKey?: string };

function formatPacificDateTime(ms: number): string {
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
}

function pacificClock(value: string) {
  const ms = parsePacificDateTime(value);
  if (ms == null) return { hour: 0, minute: 0, second: 0, time: "00:00:00" };
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const ss = String(second).padStart(2, "0");
  return { hour, minute, second, time: `${hh}:${mm}:${ss}` };
}

function enumeratePacificCalendarDays(dateStart: string, dateEnd: string): string[] {
  const startKey = pacificCalendarDate(dateStart);
  const endKey = pacificCalendarDate(dateEnd);
  if (!startKey) return [];
  if (!endKey || startKey === endKey) return [startKey];

  const days: string[] = [];
  let cursor = parsePacificDateTime(`${startKey}T12:00:00`);
  const endMs = parsePacificDateTime(`${endKey}T12:00:00`);
  if (cursor == null || endMs == null) return [startKey];

  while (cursor <= endMs) {
    const key = pacificCalendarDate(new Date(cursor).toISOString());
    if (key) days.push(key);
    cursor += 24 * 60 * 60 * 1000;
  }

  return days.length > 0 ? days : [startKey];
}

/** One night out (e.g. 9pm Fri → 2am Sat) — not a multi-day festival. */
export function isOvernightSpill(dateStart: string, dateEnd: string): boolean {
  const startKey = pacificCalendarDate(dateStart);
  const endKey = pacificCalendarDate(dateEnd);
  if (!startKey || !endKey || startKey === endKey) return false;

  const calendarDays = enumeratePacificCalendarDays(dateStart, dateEnd);
  if (calendarDays.length !== 2) return false;

  const { hour: endHour } = pacificClock(dateEnd);
  return endHour < 12;
}

/** True multi-day = separate daily sessions (9–5 Fri and 9–5 Sat), not overnight spill. */
export function isMultiDayFestival(dateStart: string, dateEnd: string): boolean {
  const calendarDays = enumeratePacificCalendarDays(dateStart, dateEnd);
  if (calendarDays.length <= 1) return false;
  if (isOvernightSpill(dateStart, dateEnd)) return false;
  return true;
}

function usesRepeatingDailySchedule(dateStart: string, dateEnd: string): boolean {
  const start = pacificClock(dateStart);
  const end = pacificClock(dateEnd);
  const startMins = start.hour * 60 + start.minute;
  const endMins = end.hour * 60 + end.minute;
  return endMins > startMins;
}

function sliceEventForCalendarDay(event: Event, dayKey: string): { dateStart: string; dateEnd: string } {
  const dayStartMs = parsePacificDateTime(`${dayKey}T00:00:00`);
  const dayEndMs = parsePacificDateTime(`${dayKey}T23:59:59`);
  const eventStartMs = parsePacificDateTime(event.dateStart);
  const eventEndMs = parsePacificDateTime(event.dateEnd);
  if (dayStartMs == null || dayEndMs == null || eventStartMs == null || eventEndMs == null) {
    return { dateStart: event.dateStart, dateEnd: event.dateEnd };
  }

  const sliceStartMs = Math.max(eventStartMs, dayStartMs);
  const sliceEndMs = Math.min(eventEndMs, dayEndMs);
  if (sliceStartMs > sliceEndMs) {
    return { dateStart: event.dateStart, dateEnd: event.dateEnd };
  }

  return {
    dateStart: formatPacificDateTime(sliceStartMs),
    dateEnd: formatPacificDateTime(sliceEndMs),
  };
}

function sliceMultiDaySession(event: Event, dayKey: string): { dateStart: string; dateEnd: string } {
  if (usesRepeatingDailySchedule(event.dateStart, event.dateEnd)) {
    const startTime = pacificClock(event.dateStart).time;
    const endTime = pacificClock(event.dateEnd).time;
    return {
      dateStart: `${dayKey}T${startTime}`,
      dateEnd: `${dayKey}T${endTime}`,
    };
  }
  return sliceEventForCalendarDay(event, dayKey);
}

function eventDayIdentity(event: Pick<Event, "title" | "venueName" | "dayOfWeek">) {
  return `${event.title.trim().toLowerCase()}|${event.venueName.trim().toLowerCase()}|${event.dayOfWeek || ""}`;
}

function dayOfWeekForCalendarDay(dayKey: string): string {
  const ms = parsePacificDateTime(`${dayKey}T12:00:00`);
  if (ms == null) return "";
  return pacificDayOfWeek(ms);
}

function primaryDayOfWeek(dateStart: string): string {
  const key = pacificCalendarDate(dateStart);
  if (!key) return "";
  return dayOfWeekForCalendarDay(key);
}

/** Split true multi-day festivals into one listing per Pride day; keep overnights as one row. */
export function expandMultiDayEvents<T extends Event>(events: T[]): EventListing[] {
  const expanded: EventListing[] = [];

  for (const event of events) {
    if (!isMultiDayFestival(event.dateStart, event.dateEnd)) {
      expanded.push({
        ...event,
        dayOfWeek: event.dayOfWeek || primaryDayOfWeek(event.dateStart),
      });
      continue;
    }

    const calendarDays = enumeratePacificCalendarDays(event.dateStart, event.dateEnd);
    let emitted = 0;

    for (const dayKey of calendarDays) {
      const dayOfWeek = dayOfWeekForCalendarDay(dayKey);
      if (!PRIDE_LISTING_DAYS.has(dayOfWeek)) continue;

      const identity = eventDayIdentity({ ...event, dayOfWeek });
      const alreadyListed = events.some(
        other => other.id !== event.id && eventDayIdentity(other) === identity,
      );
      if (alreadyListed) continue;

      const { dateStart, dateEnd } = sliceMultiDaySession(event, dayKey);
      expanded.push({
        ...event,
        dateStart,
        dateEnd,
        dayOfWeek,
        listingInstanceKey: `${event.id}:${dayKey}`,
      });
      emitted += 1;
    }

    if (emitted === 0) {
      expanded.push({
        ...event,
        dayOfWeek: event.dayOfWeek || primaryDayOfWeek(event.dateStart),
      });
    }
  }

  return expanded.sort((a, b) => {
    const at = parsePacificDateTime(a.dateStart) || 0;
    const bt = parsePacificDateTime(b.dateStart) || 0;
    return at - bt || a.id - b.id;
  });
}

export function listingKey(event: Pick<EventListing, "id" | "listingInstanceKey">) {
  return event.listingInstanceKey || String(event.id);
}