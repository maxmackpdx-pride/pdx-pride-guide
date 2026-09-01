import type { Event } from "@shared/schema";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { formatPacificDateTime } from "@/lib/countdown";

export function formatListingWhen(event: Event): string {
  const time = event.dateStart
    ? formatPacificDateTime(event.dateStart, { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = event.dateStart
    ? formatPacificDateTime(event.dateStart, { weekday: "short", month: "short", day: "numeric" })
    : "";
  const parts = [dateLabel, time].filter(Boolean);
  if (event.neighborhood) parts.push(event.neighborhood);
  return parts.join(" · ");
}

/** Full date and start/end time used by the approved closed event-grid card.
 * Neighborhood belongs in the open card, not on the closed grid face.
 */
export function formatGridCardWhen(event: Event): string {
  if (!event.dateStart) return "";
  const clock = (value: string) => formatPacificDateTime(value, {
    hour: "numeric",
    minute: "2-digit",
  }).replace(/:00(?=\s*[AP]M)/i, "");
  const dateLabel = formatPacificDateTime(event.dateStart, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const start = clock(event.dateStart);
  const end = event.dateEnd ? clock(event.dateEnd) : "";
  return [dateLabel, [start, end].filter(Boolean).join("–")].filter(Boolean).join(" · ");
}

export function listingTypeTags(event: Event, max = 2): string[] {
  return getEventTypeTagsForEvent(event).slice(0, max);
}

export function listingPosterUrl(event: Event): string | undefined {
  const url = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);
  return url || undefined;
}

export function listingDay(event: Event): string {
  return event.dayOfWeek || "FRI";
}
