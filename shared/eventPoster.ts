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