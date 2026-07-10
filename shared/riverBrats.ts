import type { NudeBeachTab } from "./nudeBeaches";

export type RiverBratsShoreTab = "checkin" | "carpool" | "spotted";

export const RIVER_BRATS_SHORE_TABS: Array<{ key: RiverBratsShoreTab; label: string }> = [
  { key: "checkin", label: "Check-in" },
  { key: "carpool", label: "Carpool" },
  { key: "spotted", label: "Spotted" },
];

export const RIVER_BRATS_HOUR_START = 7;
export const RIVER_BRATS_HOUR_END = 21;

export const RIVER_BRATS_HOURS = Array.from(
  { length: RIVER_BRATS_HOUR_END - RIVER_BRATS_HOUR_START + 1 },
  (_, i) => RIVER_BRATS_HOUR_START + i,
);

const PACIFIC_TZ = "America/Los_Angeles";

export function formatRiverBratsHour(hour: number): string {
  if (hour < 1 || hour > 23) return "—";
  if (hour === 12) return "12pm";
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

export function pacificMidnightIso(dateStr: string): string {
  const t = new Date(`${dateStr}T23:59:59-07:00`).getTime();
  return new Date(t + 1).toISOString();
}

/** Beach group chat closes at 10pm Pacific on its calendar date. */
export const RIVER_BRATS_CHAT_CLOSE_HOUR = 22;

export function riverBratsChatClosesAtIso(dateStr: string): string {
  return new Date(`${dateStr}T22:00:00-07:00`).toISOString();
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

/** Beach check-in unlocks the day-room chat until 10pm Pacific. */
export const RIVER_BRATS_CHAT_CLOSES_AT = "10pm Pacific";