import type { NudeBeachTab } from "./nudeBeaches";

export const EVENT_PLACEHOLDERS = [
  "/placeholders/event-placeholder-1.svg",
  "/placeholders/event-placeholder-2.svg",
  "/placeholders/event-placeholder-3.svg",
  "/placeholders/event-placeholder-4.svg",
] as const;

export function resolveEventPosterUrl(
  eventId: number,
  posterImageUrl: string | null | undefined,
): string {
  if (posterImageUrl) return posterImageUrl;
  const idx = Math.abs(eventId) % EVENT_PLACEHOLDERS.length;
  return EVENT_PLACEHOLDERS[idx];
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