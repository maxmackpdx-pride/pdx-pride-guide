const PACIFIC_TZ = "America/Los_Angeles";
const POST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PACIFIC_OFFSET_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  timeZoneName: "longOffset",
});
const pacificWallTimeCache = new Map<string, number | null>();

function pacificOffsetMs(epochMs: number): number {
  const name = PACIFIC_OFFSET_FORMAT.formatToParts(new Date(epochMs))
    .find(part => part.type === "timeZoneName")?.value || "";
  const match = name.match(/^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const seconds = Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4] || 0);
  return (match[1] === "-" ? -1 : 1) * seconds * 1000;
}

/** Pacific wall time; fall-back repeats use the earlier instant, spring gaps are invalid. */
export function parsePacificDateTime(value?: string | null): number | null {
  if (typeof value !== "string" || !value) return null;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (pacificWallTimeCache.has(value)) return pacificWallTimeCache.get(value)!;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/);
  if (!match) return null;
  const normalized = `${match[1]}T${match[2] || "00"}:${match[3] || "00"}:${match[4] || "00"}.${(match[5] || "0").padEnd(3, "0").slice(0, 3)}Z`;
  const wallMs = Date.parse(normalized);
  if (!Number.isFinite(wallMs) || new Date(wallMs).toISOString() !== normalized) return null;

  // Offsets on either side cover both candidates at a daylight-saving change.
  // A candidate is valid only if its actual zone offset matches the assumed one.
  const offsets = new Set([pacificOffsetMs(wallMs - 86400000), pacificOffsetMs(wallMs + 86400000)]);
  const candidates = [...offsets]
    .map(offset => ({ offset, epochMs: wallMs - offset }))
    .filter(({ offset, epochMs }) => pacificOffsetMs(epochMs) === offset)
    .map(({ epochMs }) => epochMs);
  const result = candidates.length ? Math.min(...candidates) : null;
  // Event lists repeatedly parse the same timestamps; keep this cache bounded.
  if (pacificWallTimeCache.size >= 4096) pacificWallTimeCache.clear();
  pacificWallTimeCache.set(value, result);
  return result;
}

export function pacificCalendarDate(value?: string | null): string | null {
  const t = parsePacificDateTime(value);
  if (t == null) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}

export function pacificTodayDate(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

export function missedConnectionClosesAt(dateStart?: string | null, dateEnd?: string | null): string | null {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return null;
  const end = parsePacificDateTime(dateEnd) ?? start;
  return new Date(end + POST_WINDOW_MS).toISOString();
}

export type MissedConnectionWindow = {
  opensAt: number;
  closesAt: number;
  canPost: boolean;
  reason?: string;
};

export function getMissedConnectionWindow(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): MissedConnectionWindow | null {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return null;
  const end = parsePacificDateTime(dateEnd) ?? start;
  const opensAt = start;
  const closesAt = end + POST_WINDOW_MS;
  if (now < opensAt) {
    return {
      opensAt,
      closesAt,
      canPost: false,
      reason: "Opens when the event starts",
    };
  }
  if (now >= closesAt) {
    return {
      opensAt,
      closesAt,
      canPost: false,
      reason: "Posting closed - window ended 7 days after the event ended",
    };
  }
  return { opensAt, closesAt, canPost: true };
}

export function isEventHappeningToday(dateStart?: string | null, now = Date.now()): boolean {
  const eventDay = pacificCalendarDate(dateStart);
  if (!eventDay) return false;
  return eventDay === pacificTodayDate(now);
}

export function isMissedConnectionPostable(
  dateStart?: string | null,
  dateEnd?: string | null,
  opts?: { requireToday?: boolean; now?: number },
): { ok: boolean; reason?: string; closesAt?: string } {
  const now = opts?.now ?? Date.now();
  if (opts?.requireToday && !isEventHappeningToday(dateStart, now)) {
    return { ok: false, reason: "Only events happening today can be selected" };
  }
  const window = getMissedConnectionWindow(dateStart, dateEnd, now);
  if (!window) return { ok: false, reason: "Invalid event schedule" };
  if (!window.canPost) return { ok: false, reason: window.reason };
  return { ok: true, closesAt: new Date(window.closesAt).toISOString() };
}

export type MissedConnectionEventTiming = "upcoming" | "live" | "past";

/**
 * Schedule phase from doors/end only - not the 7-day missed-connection post window.
 * Use this for the Events board (main grid vs PAST tab), tickets, RSVP labels, etc.
 */
export function getEventScheduleTiming(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): MissedConnectionEventTiming {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return "past";
  if (now < start) return "upcoming";
  const end = parsePacificDateTime(dateEnd) ?? start;
  if (now < end) return "live";
  return "past";
}

/** True once the event's scheduled end has passed (falls back to start). */
export function isEventSchedulePast(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): boolean {
  return getEventScheduleTiming(dateStart, dateEnd, now) === "past";
}

/**
 * Missed-connection board timing: "live" while the post window is open
 * (through 7 days after the event ends). Prefer getEventScheduleTiming /
 * isEventSchedulePast for grid visibility and door times.
 */
export function getEventTiming(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): MissedConnectionEventTiming {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return "past";
  if (now < start) return "upcoming";
  if (isMissedConnectionPostable(dateStart, dateEnd, { now }).ok) return "live";
  return "past";
}

/** Board compose: any scheduled LIVE event can be linked (post window enforced separately). */
export function isMissedConnectionLinkable(dateStart?: string | null): boolean {
  return parsePacificDateTime(dateStart) != null;
}

export function formatCustomSpottedVenue(eventLabel: string, location?: string): string {
  const label = eventLabel.trim().slice(0, 80);
  const place = location?.trim().slice(0, 80) || "";
  if (label && place) return `${label} · ${place}`;
  return label || place || "Around town";
}

export const MISSED_CONNECTION_ANON_LABEL = "Anonymous";

/**
 * Standard: some directory categories never surface MIZZED CONNECTION. A
 * healthcare provider (clinic, therapist, PrEP, etc.) is not a venue where a
 * "spotted you here" post belongs. This Set is the single source of truth -
 * add a category here to hide the MIZZED CONNECTION tab on every surface.
 */
export const MISSED_CONNECTIONS_HIDDEN_CATEGORIES: ReadonlySet<string> = new Set([
  "healthcare",
]);

/** True when any of the given category/type values should hide MIZZED CONNECTION. */
export function categoryHidesMissedConnections(
  ...categories: Array<string | null | undefined>
): boolean {
  return categories.some(
    (c) => !!c && MISSED_CONNECTIONS_HIDDEN_CATEGORIES.has(c.toLowerCase()),
  );
}

/** Posts not tied to a calendar event expire 7 days after creation. */
export function generalSpottedClosesAt(now = Date.now()): string {
  return new Date(now + POST_WINDOW_MS).toISOString();
}

export function pacificDayOfWeek(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    weekday: "short",
  })
    .format(new Date(now))
    .replace(/\./g, "")
    .toUpperCase()
    .slice(0, 3);
}
