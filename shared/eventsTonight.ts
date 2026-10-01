import { pacificTodayDate, parsePacificDateTime } from "./missedConnections";

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Portland's current evening: 6 p.m.–2 a.m.; before 2 a.m. belongs to yesterday. */
export function eventsTonightWindow(now = Date.now()) {
  const today = pacificTodayDate(now);
  // Spring's missing 2 a.m. rolls forward to 3 a.m.; fall's 2 a.m. is unambiguous.
  const resetFor = (date: string) => parsePacificDateTime(`${date}T02:00:00`)
    ?? parsePacificDateTime(`${date}T03:00:00`)!;
  const date = now < resetFor(today) ? shiftDate(today, -1) : today;
  return {
    start: parsePacificDateTime(`${date}T18:00:00`)!,
    end: resetFor(shiftDate(date, 1)),
    nextReset: now < resetFor(today) ? resetFor(today) : resetFor(shiftDate(today, 1)),
  };
}

export function isEventTonight(event: { dateStart: string; dateEnd?: string | null }, now = Date.now()): boolean {
  const { start, end } = eventsTonightWindow(now);
  const eventStart = parsePacificDateTime(event.dateStart);
  const eventEnd = parsePacificDateTime(event.dateEnd);
  if (eventStart == null) return false;
  // Unknown ends count by start time, rather than inventing an all-night duration.
  return eventStart < end && (eventEnd != null && eventEnd > eventStart ? eventEnd > start : eventStart >= start);
}
