import type { NudeBeachTab } from "./nudeBeaches";

/**
 * Event artwork rules
 * - Use the artwork the venue or host provides for the occurrence, including a
 *   photo without flyer text when that is the image they chose for the event.
 * - No event artwork means no image: cards draw the event's day motif in the flyer slot
 *   (client/src/components/events/DayMotif.tsx). The old generated day posters
 *   (/placeholders/event-day-*.svg, event-placeholder-*.svg) are retired.
 * - Rows saved with one of those retired paths still count as "no flyer".
 */

/** True for retired generated flyer stand-ins (not real promoter art), or no URL. */
export function isEventPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  return /\/placeholders\/event-(placeholder|day)-/i.test(url);
}

/** The event's source-provided artwork, or null when it has none. */
export function resolveEventPosterUrl(
  _eventId: number,
  posterImageUrl: string | null | undefined,
  _dayOfWeek?: string | null,
): string | null {
  return posterImageUrl && !isEventPlaceholderUrl(posterImageUrl) ? posterImageUrl : null;
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
