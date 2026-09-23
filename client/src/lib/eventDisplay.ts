import { parsePacificDateTime } from "@shared/missedConnections";
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });
export function eventTimeLabel(value: string | null | undefined): string {
  const time = value ? parsePacificDateTime(value) : null;
  return time == null || !Number.isFinite(time) ? "Time to be announced" : timeFormat.format(time);
}
export function eventDateLabel(value: string | null | undefined): string {
  const time = value ? parsePacificDateTime(value) : null;
  return time == null || !Number.isFinite(time) ? "Date to be announced" : dateFormat.format(time);
}
