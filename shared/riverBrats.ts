import type { NudeBeachTab } from "./nudeBeaches";

export type RiverBratsShoreTab = "checkin" | "carpool" | "spotted";

export const RIVER_BRATS_SHORE_TABS: Array<{ key: RiverBratsShoreTab; label: string }> = [
  { key: "checkin", label: "Check-in" },
  { key: "carpool", label: "Carpool" },
  { key: "spotted", label: "MIZZED CONNECTION" },
];

export const RIVER_BRATS_HOUR_START = 7;
export const RIVER_BRATS_HOUR_END = 21;

/**
 * Latest planned leave hour on the form (10pm Pacific).
 * Chat access is separate: open on check-in, close 12h after end of beach day.
 */
export const RIVER_BRATS_CHAT_CLOSE_HOUR = 22;

/** Hours after end of calendar beach day that chat access continues. */
export const RIVER_BRATS_CHAT_LINGER_HOURS = 12;

export const RIVER_BRATS_HOURS = Array.from(
  { length: RIVER_BRATS_HOUR_END - RIVER_BRATS_HOUR_START + 1 },
  (_, i) => RIVER_BRATS_HOUR_START + i,
);

const PACIFIC_TZ = "America/Los_Angeles";

export function formatRiverBratsHour(hour: number): string {
  if (hour < 1 || hour > 23) return "-";
  if (hour === 12) return "12pm";
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export function pacificTodayDate(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/** Max days ahead of Pacific "today" a beach check-in may be planned (Rooster + Sauvie). */
export const BEACH_CHECKIN_MAX_ADVANCE_DAYS = 7;

/** Latest planned leave hour (10pm Pacific, same as chat close). */
export const RIVER_BRATS_DEPART_HOUR_END = RIVER_BRATS_CHAT_CLOSE_HOUR;

/** Pure calendar arithmetic on YYYY-MM-DD (no timezone shift). */
export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Pacific today + N calendar days (N may be 0). */
export function pacificDateOffset(daysFromToday: number, now = Date.now()): string {
  return addCalendarDays(pacificTodayDate(now), daysFromToday);
}

/** Today through today+7 for check-in date chips. */
export function beachCheckinDateOptions(now = Date.now()): string[] {
  return Array.from({ length: BEACH_CHECKIN_MAX_ADVANCE_DAYS + 1 }, (_, i) => pacificDateOffset(i, now));
}

export function isAllowedBeachCheckinDate(dateStr: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const today = pacificTodayDate(now);
  const max = pacificDateOffset(BEACH_CHECKIN_MAX_ADVANCE_DAYS, now);
  return dateStr >= today && dateStr <= max;
}

export function formatBeachCheckinDateLabel(dateStr: string, now = Date.now()): string {
  const today = pacificTodayDate(now);
  if (dateStr === today) return "Today";
  if (dateStr === addCalendarDays(today, 1)) return "Tomorrow";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const weekday = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return weekday;
}

export function isValidRiverBratsDepartHour(hour: unknown, arrivalHour?: number): hour is number {
  if (typeof hour !== "number" || !Number.isInteger(hour)) return false;
  if (hour < RIVER_BRATS_HOUR_START + 1 || hour > RIVER_BRATS_DEPART_HOUR_END) return false;
  if (typeof arrivalHour === "number" && hour <= arrivalHour) return false;
  return true;
}

/** Default stay-until hour: +3h, capped at chat close. */
export function defaultDepartHour(arrivalHour: number): number {
  return Math.min(RIVER_BRATS_DEPART_HOUR_END, Math.max(arrivalHour + 1, arrivalHour + 3));
}

export function formatRiverBratsWindow(arrivalHour: number, departHour?: number | null): string {
  const start = formatRiverBratsHour(arrivalHour);
  if (departHour == null || !isValidRiverBratsDepartHour(departHour, arrivalHour)) return start;
  return `${start}–${formatRiverBratsHour(departHour)}`;
}

/** Wall-clock ISO used by calendar export (matches existing -07:00 convention). */
export function riverBratsWallIso(dateStr: string, hour: number, minute = 0): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${dateStr}T${hh}:${mm}:00`;
}

export function pacificMidnightIso(dateStr: string): string {
  const t = new Date(`${dateStr}T23:59:59-07:00`).getTime();
  return new Date(t + 1).toISOString();
}

/**
 * Chat access for a beach day ends 12 hours after that calendar day ends
 * (Pacific midnight → +12h = noon next day). Multi-day check-ins take the max.
 */
export function riverBratsChatClosesAtIso(dateStr: string): string {
  // End of beach day = next calendar day 00:00 Pacific, then + linger hours.
  const nextDay = addCalendarDays(dateStr, 1);
  const dayEndMs = new Date(`${nextDay}T00:00:00-07:00`).getTime();
  return new Date(dayEndMs + RIVER_BRATS_CHAT_LINGER_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Chat opens the moment someone checks in (no 48h wait).
 * Kept for API shape / inbox countdown; openAt ≈ check-in creation (now).
 */
export const RIVER_BRATS_CHAT_OPENS_BEFORE_MS = 0;

/** @deprecated Prefer immediate open on check-in; retained for callers. */
export function riverBratsChatOpensAtIso(dateStr: string): string {
  // Start of beach calendar day Pacific — access is still gated by active check-in.
  return new Date(`${dateStr}T00:00:00-07:00`).toISOString();
}

/**
 * True while a beach day still contributes chat access (before end-of-day + 12h).
 * Check-in may be earlier than the day itself — no open delay.
 */
export function isRiverBratsChatOpen(dateStr: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const closes = new Date(riverBratsChatClosesAtIso(dateStr)).getTime();
  return now < closes;
}

/** User can access beach chat if any of their check-in days is still open. */
export function riverBratsChatAccessFromDates(
  calendarDates: string[],
  now = Date.now(),
): { open: boolean; closesAt: string | null; opensAt: string | null } {
  const valid = calendarDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (!valid.length) return { open: false, closesAt: null, opensAt: null };
  let maxClose = 0;
  let minOpen = Infinity;
  for (const d of valid) {
    const c = new Date(riverBratsChatClosesAtIso(d)).getTime();
    const o = new Date(riverBratsChatOpensAtIso(d)).getTime();
    if (c > maxClose) maxClose = c;
    if (o < minOpen) minOpen = o;
  }
  const closesAt = new Date(maxClose).toISOString();
  const opensAt = Number.isFinite(minOpen) ? new Date(minOpen).toISOString() : null;
  // Open immediately once they have any check-in day still before its close.
  const open = now < maxClose;
  return { open, closesAt, opensAt };
}

/** Pacific weekday code MON…SUN for a YYYY-MM-DD (for day color tokens). */
export function pacificWeekdayCode(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "MON";
  const [y, m, d] = ymd.split("-").map(Number);
  const short = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  const map: Record<string, string> = {
    Mon: "MON",
    Tue: "TUE",
    Wed: "WED",
    Thu: "THU",
    Fri: "FRI",
    Sat: "SAT",
    Sun: "SUN",
  };
  return map[short] || "MON";
}

/** Compact day chip: Today / Tom / Mon 28 */
export function formatBeachGoingChip(dateStr: string, now = Date.now()): string {
  const today = pacificTodayDate(now);
  if (dateStr === today) return "Today";
  if (dateStr === addCalendarDays(today, 1)) return "Tom";
  const code = pacificWeekdayCode(dateStr);
  const dayNum = dateStr.slice(8, 10).replace(/^0/, "");
  const short = code.charAt(0) + code.slice(1).toLowerCase();
  return `${short} ${dayNum}`;
}

/** ISO fire time for an arrival-hour prompt on a given calendar date. */
export function riverBratsArrivalPromptIso(dateStr: string, hour: number): string {
  return new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00-07:00`).toISOString();
}

/** Current hour of day (0–23) in Pacific time. */
export function pacificCurrentHour(now = Date.now()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PACIFIC_TZ,
      hour: "numeric",
      hour12: false,
    }).format(new Date(now)),
  ) % 24;
}

export function beachVenueLabel(beachId: NudeBeachTab): string {
  return beachId === "rooster-rock" ? "Rooster Rock" : "Collins Beach · Sauvie Island";
}

export const CARPOOL_DEPARTURE_AREAS = [
  "Inner NE",
  "Outer NE",
  "North Portland",
  "NW Portland",
  "SW Portland",
  "SE Portland",
  "Inner SE",
  "Downtown",
  "Vancouver",
  "Beaverton",
  "Other",
] as const;

export type CarpoolPostType = "OFFERING_RIDE" | "NEED_RIDE";

/**
 * Trip direction for carpool posts.
 * TO_BEACH: leaving town for the beach.
 * FROM_BEACH: heading back (day-of return rides, or planned pickup home).
 */
export type CarpoolDirection = "TO_BEACH" | "FROM_BEACH";

export const CARPOOL_DIRECTIONS: Array<{ key: CarpoolDirection; label: string; short: string }> = [
  { key: "TO_BEACH", label: "Going out", short: "Out" },
  { key: "FROM_BEACH", label: "Heading back", short: "Back" },
];

export function carpoolDirectionLabel(direction: string | null | undefined): string {
  const key = String(direction || "TO_BEACH").toUpperCase();
  return CARPOOL_DIRECTIONS.find(d => d.key === key)?.label || "Going out";
}

export function isValidCarpoolDirection(raw: unknown): raw is CarpoolDirection {
  return raw === "TO_BEACH" || raw === "FROM_BEACH";
}

/** Same planning window as beach check-ins (today through +N). */
export function isAllowedCarpoolTripDate(dateStr: string, now = Date.now()): boolean {
  return isAllowedBeachCheckinDate(dateStr, now);
}

export const RIVER_BRATS_REPORT_REASONS = [
  "Spam or scam",
  "Unsafe or harassing",
  "Off topic",
  "Wrong beach / date",
  "Other",
] as const;

export type RiverBratsReportTarget = "CHECKIN" | "CARPOOL" | "MISSED_CONNECTION";

export function readRiverBratsShore(raw: string | null | undefined): RiverBratsShoreTab {
  if (raw === "carpool" || raw === "spotted") return raw;
  return "checkin";
}

export function isValidRiverBratsHour(hour: unknown): hour is number {
  return typeof hour === "number" && Number.isInteger(hour) && hour >= RIVER_BRATS_HOUR_START && hour <= RIVER_BRATS_HOUR_END;
}

export function isValidBeachId(id: unknown): id is NudeBeachTab {
  return id === "rooster-rock" || id === "sauvie-island";
}

/** Copy: chat stays open after the beach day ends. */
export const RIVER_BRATS_CHAT_CLOSES_AT = "12 hours after your beach day ends";
export const RIVER_BRATS_CHAT_OPENS_COPY = "as soon as you check in";