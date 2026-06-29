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

function eventDayIdentity(event: Pick<Event, "title" | "venueName" | "dayOfWeek">) {
  return `${event.title.trim().toLowerCase()}|${event.venueName.trim().toLowerCase()}|${event.dayOfWeek || ""}`;
}

function dayOfWeekForCalendarDay(dayKey: string): string {
  const ms = parsePacificDateTime(`${dayKey}T12:00:00`);
  if (ms == null) return "";
  return pacificDayOfWeek(ms);
}

/** Split span-across-midnight / multi-day listings into one row per Pacific calendar day. */
export function expandMultiDayEvents<T extends Event>(events: T[]): EventListing[] {
  const expanded: EventListing[] = [];

  for (const event of events) {
    const calendarDays = enumeratePacificCalendarDays(event.dateStart, event.dateEnd);
    if (calendarDays.length <= 1) {
      expanded.push(event);
      continue;
    }

    let emitted = 0;
    for (const dayKey of calendarDays) {
      const dayOfWeek = dayOfWeekForCalendarDay(dayKey);
      if (!PRIDE_LISTING_DAYS.has(dayOfWeek)) continue;
      const identity = eventDayIdentity({ ...event, dayOfWeek });
      const alreadyListed = events.some(
        other => other.id !== event.id && eventDayIdentity(other) === identity,
      );
      if (alreadyListed) continue;

      const { dateStart, dateEnd } = sliceEventForCalendarDay(event, dayKey);
      expanded.push({
        ...event,
        dateStart,
        dateEnd,
        dayOfWeek,
        listingInstanceKey: `${event.id}:${dayKey}`,
      });
      emitted += 1;
    }

    if (emitted === 0) expanded.push(event);
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