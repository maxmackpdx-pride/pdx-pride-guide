const PACIFIC_TZ = "America/Los_Angeles";
const POST_OPEN_DELAY_MS = 20 * 60 * 1000;
const POST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function parsePacificDateTime(value?: string | null): number | null {
  if (!value) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }
  const t = new Date(`${value}-07:00`).getTime();
  return Number.isFinite(t) ? t : null;
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

export function missedConnectionClosesAt(dateStart?: string | null): string | null {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return null;
  return new Date(start + POST_WINDOW_MS).toISOString();
}

export type MissedConnectionWindow = {
  opensAt: number;
  closesAt: number;
  canPost: boolean;
  reason?: string;
};

export function getMissedConnectionWindow(
  dateStart?: string | null,
  now = Date.now(),
): MissedConnectionWindow | null {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return null;
  const opensAt = start + POST_OPEN_DELAY_MS;
  const closesAt = start + POST_WINDOW_MS;
  if (now < opensAt) {
    return {
      opensAt,
      closesAt,
      canPost: false,
      reason: "Opens 20 minutes after the event starts",
    };
  }
  if (now >= closesAt) {
    return {
      opensAt,
      closesAt,
      canPost: false,
      reason: "Posting closed — window ended 7 days after the event started",
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
  opts?: { requireToday?: boolean; now?: number },
): { ok: boolean; reason?: string; closesAt?: string } {
  const now = opts?.now ?? Date.now();
  if (opts?.requireToday && !isEventHappeningToday(dateStart, now)) {
    return { ok: false, reason: "Only events happening today can be selected" };
  }
  const window = getMissedConnectionWindow(dateStart, now);
  if (!window) return { ok: false, reason: "Invalid event schedule" };
  if (!window.canPost) return { ok: false, reason: window.reason };
  return { ok: true, closesAt: new Date(window.closesAt).toISOString() };
}

export const MISSED_CONNECTION_ANON_LABEL = "Anonymous";