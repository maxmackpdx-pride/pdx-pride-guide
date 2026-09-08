import { parsePacificDateTime } from "./missedConnections";

type EventDates = { dateStart: string; dateEnd: string };

/** Move an existing end date with the start's calendar date, preserving its wall time. */
export function moveEventStart(dates: EventDates, dateStart: string): EventDates {
  const previousDay = dates.dateStart.slice(0, 10);
  const nextDay = dateStart.slice(0, 10);
  const endDay = dates.dateEnd.slice(0, 10);
  const delta = Date.parse(`${nextDay}T12:00:00Z`) - Date.parse(`${previousDay}T12:00:00Z`);
  const end = Date.parse(`${endDay}T12:00:00Z`);
  if (!Number.isFinite(delta) || !Number.isFinite(end) || delta === 0) {
    return { ...dates, dateStart };
  }
  const movedEndDay = new Date(end + delta).toISOString().slice(0, 10);
  return { dateStart, dateEnd: movedEndDay + dates.dateEnd.slice(10) };
}

export function eventDatesError(dates: EventDates): string | null {
  const start = parsePacificDateTime(dates.dateStart);
  const end = parsePacificDateTime(dates.dateEnd);
  if (start == null || end == null) return "Choose the event start and end date and time.";
  if (end <= start) return "The event end must be after its start.";
  return null;
}
