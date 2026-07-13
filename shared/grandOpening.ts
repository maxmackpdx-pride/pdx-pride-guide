/**
 * Grand Opening badge + date under place name.
 *
 * ONLY use a verified grandOpeningDate (YYYY-MM-DD or ISO). Never treat
 * directory seed date / createdAt / isNew alone as a grand opening — many
 * places were flagged isNew when added to the guide years after opening.
 *
 * Tags and date line stay live for 60 days from the verified opening day.
 */

export const GRAND_OPENING_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

/** Parse YYYY-MM-DD or ISO into epoch ms (noon UTC-ish for date-only to avoid TZ edge). */
function parseOpeningMs(grandOpeningDate?: string | null): number | null {
  if (!grandOpeningDate) return null;
  const raw = String(grandOpeningDate).trim();
  if (!raw) return null;
  // Date-only: interpret as Pacific calendar day start via explicit ISO local midday
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dayOnly) {
    const iso = `${dayOnly[1]}-${dayOnly[2]}-${dayOnly[3]}T12:00:00-07:00`;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : null;
  }
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

/**
 * True only when a verified grandOpeningDate is set and still within 60 days.
 * `isNew` is ignored for activation (kept for admin/legacy; opening date is source of truth).
 */
export function isGrandOpeningActive(
  grandOpeningDate?: string | null,
  now = Date.now(),
): boolean {
  const t = parseOpeningMs(grandOpeningDate);
  if (t == null) return false;
  const age = now - t;
  // Not yet opened (future date): still show as upcoming grand opening within window
  if (age < 0) return -age < GRAND_OPENING_WINDOW_MS;
  return age < GRAND_OPENING_WINDOW_MS;
}

/**
 * Short display line under the place name (same display font, 30% smaller).
 * Example: "JUL 11, 2026"
 */
export function formatGrandOpeningDate(grandOpeningDate?: string | null): string | null {
  const t = parseOpeningMs(grandOpeningDate);
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
