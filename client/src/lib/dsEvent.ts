import type { Event } from "@shared/schema";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { resolveEventPosterUrl } from "@shared/eventPoster";

export function formatListingWhen(event: Event): string {
  const time = event.dateStart
    ? new Date(event.dateStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = event.dateStart
    ? new Date(event.dateStart).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    : "";
  const parts = [dateLabel, time].filter(Boolean);
  if (event.neighborhood) parts.push(event.neighborhood);
  return parts.join(" · ");
}

export function listingTypeTags(event: Event, max = 2): string[] {
  return getEventTypeTagsForEvent(event).slice(0, max);
}

export function listingPosterUrl(event: Event): string | undefined {
  const url = resolveEventPosterUrl(event.id, event.posterImageUrl);
  return url || undefined;
}

export function listingDay(event: Event): string {
  return event.dayOfWeek || "FRI";
}