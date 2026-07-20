import { pacificDayOfWeek } from "@shared/missedConnections";

const PACIFIC_TZ = "America/Los_Angeles";

/** Full year from a wall-clock or ISO string (never invent). */
export function yearFromDateString(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = String(value).match(/\b(20\d{2})\b/);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 2000 && y <= 2100 ? y : null;
}

/** Current calendar year in America/Los_Angeles (for vision when flyer omits year). */
export function pacificCalendarYear(nowMs = Date.now()): number {
  const y = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
  }).format(new Date(nowMs));
  return Number(y) || new Date(nowMs).getUTCFullYear();
}

/**
 * Convert any absolute timestamp (or ICS-like local) into the wall-clock
 * Pacific format used by the events table: `YYYY-MM-DDTHH:mm:ss` (no Z).
 * Always preserves the real year from the source — never defaults to a hard-coded year.
 */
export function toPacificWallClock(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  let ms: number | null = null;

  if (value instanceof Date) {
    ms = value.getTime();
  } else {
    const raw = String(value).trim();
    if (!raw) return null;

    // ICS floating / UTC compact: 20260718T210000Z or 20260718T210000
    const compact = raw.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i,
    );
    if (compact) {
      const [, y, mo, d, h, mi, s, z] = compact;
      if (z) {
        ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
      } else {
        // Treat as Pacific wall-clock already (common for local event feeds).
        return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
      }
    } else if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
      const t = new Date(raw).getTime();
      ms = Number.isFinite(t) ? t : null;
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
      // Already wall-clock-ish — normalize seconds.
      const m = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?/);
      if (!m) return null;
      return `${m[1]}:${m[2] ?? "00"}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return `${raw}T00:00:00`;
    } else {
      const t = new Date(raw).getTime();
      ms = Number.isFinite(t) ? t : null;
    }
  }

  if (ms == null || !Number.isFinite(ms)) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  // en-US hour12:false can emit "24" for midnight in some engines — normalize.
  let hour = get("hour");
  if (hour === "24") hour = "00";

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}`;
}

export function dayOfWeekFromStart(dateStart: string | null): string | null {
  if (!dateStart) return null;
  // pacificDayOfWeek expects epoch; wall-clock is Pacific-local so pin with -07:00
  // (DST handled by parse when absolute; for wall strings use date part).
  const day = dateStart.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ms = new Date(`${day}T12:00:00-07:00`).getTime();
  if (!Number.isFinite(ms)) return null;
  return pacificDayOfWeek(ms);
}

/** True when the listing has already ended (Pacific wall-clock). */
export function isPastEventListing(
  draft: { dateStart?: string | null; dateEnd?: string | null },
  nowMs = Date.now(),
): boolean {
  const end = draft.dateEnd || draft.dateStart;
  if (!end) return false;
  let ms: number;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(end)) {
    ms = new Date(end).getTime();
  } else {
    // Wall-clock Pacific: pin to America/Los_Angeles via noon probe for the day,
    // then use the wall time with a fixed offset approximation (−08/−07 by month).
    const m = end.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const month = Number(m[2]);
      // Rough PDT Mar–Nov, else PST (good enough for past/future filter)
      const off = month >= 3 && month <= 11 ? "-07:00" : "-08:00";
      ms = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || "00"}${off}`).getTime();
    } else {
      ms = new Date(`${end}-07:00`).getTime();
    }
  }
  if (!Number.isFinite(ms)) return false;
  // Also treat start-of-day after end-of-event day as past when end is midnight-ish
  return ms < nowMs;
}

/** Default end = start + 3h when only a start is known. */
export function defaultEndFromStart(dateStart: string): string {
  const m = dateStart.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return dateStart;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  d.setUTCHours(d.getUTCHours() + 3);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
