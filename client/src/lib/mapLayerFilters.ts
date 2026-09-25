import {eventNight} from '../../public/zaydar-map/event-night.js';
import { parsePacificDateTime } from "../../../shared/missedConnections";

export type MapTimeFilter = "default" | "tonight" | "soon" | "weekend" | "custom";
type ScheduledEvent = { dateStart: string; dateEnd: string; eventTypes?: string | null };

export function portlandDay(value: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function matchesMapEvent(event: ScheduledEvent, filter: MapTimeFilter, tag: string | null, from = "", to = "", now = Date.now()): boolean {
  const start = parsePacificDateTime(event.dateStart);
  const end = parsePacificDateTime(event.dateEnd) ?? start;
  if (start === null || end === null) return false;
  if (tag) {
    try {
      const tags: unknown = JSON.parse(event.eventTypes || "[]");
      if (!Array.isArray(tags) || !tags.includes(tag)) return false;
    } catch { return false; }
  }
  if (filter === "custom") {
    if (!from || !to) return false;
    const [low, high] = from <= to ? [from, to] : [to, from];
    return portlandDay(start) <= high && portlandDay(end) >= low;
  }
  const sameNight=eventNight(start)===eventNight(now);
  if (filter === "tonight") return sameNight;
  if (end < now && !(filter === "default" && sameNight)) return false;
  if (filter === "soon") return start <= now + 90 * 60_000;
  if (filter === "weekend") {
    const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(start);
    return start <= now + 7 * 86_400_000 && ["Fri", "Sat", "Sun"].includes(day);
  }
  return start <= now + 21 * 86_400_000;
}

/** Board ids overlap across APIs. Keep scene selection keys namespaced. */
export function mapListingKey(board: unknown, id: unknown): string {
  return `board-${String(board || "listing")}-${String(id)}`;
}
