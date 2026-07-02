/** Portland Pride 2026 listing week — submit forms + multi-day expansion. */
export const PRIDE_WEEK_DAYS = ["WED", "THU", "FRI", "SAT", "SUN", "MON"] as const;
export type PrideWeekDay = (typeof PRIDE_WEEK_DAYS)[number];

export const PRIDE_WEEK_DAY_OPTIONS: ReadonlyArray<{
  value: PrideWeekDay;
  label: string;
  date: string;
  nextDate: string;
}> = [
  { value: "WED", label: "Wednesday July 15", date: "2026-07-15", nextDate: "2026-07-16" },
  { value: "THU", label: "Thursday July 16", date: "2026-07-16", nextDate: "2026-07-17" },
  { value: "FRI", label: "Friday July 17", date: "2026-07-17", nextDate: "2026-07-18" },
  { value: "SAT", label: "Saturday July 18", date: "2026-07-18", nextDate: "2026-07-19" },
  { value: "SUN", label: "Sunday July 19", date: "2026-07-19", nextDate: "2026-07-20" },
  { value: "MON", label: "Monday July 20", date: "2026-07-20", nextDate: "2026-07-21" },
];

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