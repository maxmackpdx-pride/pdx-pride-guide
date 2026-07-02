/**
 * Portland Pride Week 2026 (Mon Jul 13 – Sun Jul 19) — single source of truth
 * for day codes, dates, labels, and day colors. Everything that renders or
 * stores a Pride day derives from this file. See docs/PRIDE_WEEK_13_19_PLAN.md.
 */
import { pacificDayOfWeek, parsePacificDateTime } from "./missedConnections";

export const PRIDE_WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type PrideWeekDay = (typeof PRIDE_WEEK_DAYS)[number];

/** Reserved for RSVP pulse on the events map — no day may use this hex. */
export const RSVP_COLOR = "#CCFF00";

export const PRIDE_WEEK_DAY_OPTIONS: ReadonlyArray<{
  value: PrideWeekDay;
  label: string;
  date: string;
  nextDate: string;
  /** Neon accent — map pins, glows, fills (≥3:1 on near-black). */
  color: string;
  /** Text-safe variant — day pills, tags, labels (≥4.5:1 on near-black). */
  textColor: string;
}> = [
  { value: "MON", label: "Monday July 13", date: "2026-07-13", nextDate: "2026-07-14", color: "#8800FF", textColor: "#AA66FF" },
  { value: "TUE", label: "Tuesday July 14", date: "2026-07-14", nextDate: "2026-07-15", color: "#0044FF", textColor: "#4488FF" },
  { value: "WED", label: "Wednesday July 15", date: "2026-07-15", nextDate: "2026-07-16", color: "#FFEE00", textColor: "#FFEE00" },
  { value: "THU", label: "Thursday July 16", date: "2026-07-16", nextDate: "2026-07-17", color: "#00FFFF", textColor: "#00FFFF" },
  { value: "FRI", label: "Friday July 17", date: "2026-07-17", nextDate: "2026-07-18", color: "#FF00CC", textColor: "#FF00CC" },
  { value: "SAT", label: "Saturday July 18", date: "2026-07-18", nextDate: "2026-07-19", color: "#39FF14", textColor: "#39FF14" },
  { value: "SUN", label: "Sunday July 19", date: "2026-07-19", nextDate: "2026-07-20", color: "#FF6600", textColor: "#FF6600" },
];

export const PRIDE_WEEK_START_DATE = PRIDE_WEEK_DAY_OPTIONS[0].date;
export const PRIDE_WEEK_END_DATE = PRIDE_WEEK_DAY_OPTIONS[PRIDE_WEEK_DAY_OPTIONS.length - 1].date;

export const DAY_COLORS: Record<string, string> = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.color]),
);

export const DAY_TEXT_COLORS: Record<string, string> = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.textColor]),
);

/** Calendar order MON(13)→SUN(19) for filters, pie slices, and sorts. */
export const DAY_SORT_ORDER: Record<string, number> = Object.fromEntries(
  PRIDE_WEEK_DAYS.map((d, i) => [d, i]),
);

const DAY_DATE_MAP = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.date]),
) as Record<PrideWeekDay, string>;

const DAY_NEXT_MAP = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.nextDate]),
) as Record<PrideWeekDay, string>;

export function prideWeekDate(day: string): string {
  return DAY_DATE_MAP[day as PrideWeekDay] || DAY_DATE_MAP.FRI;
}

export function prideWeekNextDate(day: string): string {
  return DAY_NEXT_MAP[day as PrideWeekDay] || DAY_NEXT_MAP.FRI;
}

export function defaultPrideDateTimes(day: string) {
  const d = prideWeekDate(day);
  const next = prideWeekNextDate(day);
  return {
    dateStart: `${d}T21:00`,
    dateEnd: `${next}T02:00`,
  };
}

/** Pacific weekday code ("MON"…"SUN") for a stored event dateStart; "" if unparseable. */
export function prideDayFromDate(dateStart?: string | null): string {
  const ms = parsePacificDateTime(dateStart);
  if (ms == null) return "";
  return pacificDayOfWeek(ms);
}
