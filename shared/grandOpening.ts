/**
 * Grand Opening badge + date under place name.
 * Tags and details stay live for 60 days from createdAt (when isNew was set).
 */

export const GRAND_OPENING_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

function parseMs(createdAt?: string | null): number | null {
  if (!createdAt) return null;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) ? t : null;
}

/** True while isNew and still inside the 60-day window from createdAt. */
export function isGrandOpeningActive(
  isNew: boolean | null | undefined,
  createdAt?: string | null,
  now = Date.now(),
): boolean {
  if (!isNew) return false;
  const t = parseMs(createdAt);
  if (t == null) return false;
  const age = now - t;
  if (age < 0) return true; // future-dated seed clock skew
  return age < GRAND_OPENING_WINDOW_MS;
}

/** Pacific calendar date string for the grand opening (YYYY-MM-DD) or null. */
export function grandOpeningCalendarDate(createdAt?: string | null): string | null {
  const t = parseMs(createdAt);
  if (t == null) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}

/**
 * Short display line under the place name (same display font, 30% smaller).
 * Example: "JUL 13, 2026"
 */
export function formatGrandOpeningDate(createdAt?: string | null): string | null {
  const t = parseMs(createdAt);
  if (t == null) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date(t))
    .toUpperCase();
}
