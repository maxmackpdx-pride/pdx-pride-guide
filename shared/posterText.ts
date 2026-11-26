/**
 * Flyer text verdict for an event's poster, from the QSearch OCR pass
 * (protocol step 6d): does the art carry any text at all, and does its
 * text carry the event's title. Stored on the event record as JSON in
 * the poster_text column; null means the poster has not been checked.
 *
 * Card fronts read carriesTitle: when the art already carries the
 * title, the card does not print it again (the nothing-redundant rule);
 * when it does not, the card adds the title itself. Many official
 * posters are text-free stock images (Sanctuary detail-page photos,
 * The Locker Room's series art), which is why the flag exists.
 */
export type PosterText = { hasText: boolean; carriesTitle: boolean };

/** Accepts the stored JSON string, a raw API object, or null. */
export function parsePosterText(value: unknown): PosterText | null {
  let raw: unknown = value;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    try {
      raw = JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { hasText, carriesTitle } = raw as Record<string, unknown>;
  if (typeof hasText !== "boolean" || typeof carriesTitle !== "boolean") return null;
  // A title carried by the art is text in the art.
  return { hasText: hasText || carriesTitle, carriesTitle };
}

/** The stored form: one JSON string, fixed key order so value equality holds. */
export function serializePosterText(value: PosterText): string {
  return JSON.stringify({ hasText: value.hasText || value.carriesTitle, carriesTitle: value.carriesTitle });
}
