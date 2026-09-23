import { pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";

/** Retain the cutoff day in full, using three calendar months in Portland time. */
export function eventRetentionCutoff(now = Date.now()): number {
  const [year, month, day] = pacificTodayDate(now).split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return parsePacificDateTime(target.toISOString().slice(0, 10))!;
}

export function isExpiredEvent(start: string, end: string, cutoff: number): boolean {
  const startMs = parsePacificDateTime(start);
  const endMs = end?.trim() ? parsePacificDateTime(end) : startMs;
  // Match the event board’s start-date fallback when no end was supplied.
  // Preserve malformed or contradictory dates rather than guessing.
  return startMs != null && endMs != null && endMs >= startMs && endMs < cutoff;
}
