import { parsePacificDateTime } from "./missedConnections";

/**
 * Afterz window for one occurrence (single source for server + client):
 * opens 72 hours before doors, closes 30 minutes after the event ends.
 * Moved verbatim from server/afterzNights.ts `timing` (Nov 20 2026).
 */
export const AFTERZ_OPENS_BEFORE_MS = 72 * 3_600_000;
export const AFTERZ_CLOSES_AFTER_MS = 30 * 60_000;

export type AfterzWindow = { start: number; opensAt: number; closesAt: number; state: "before" | "open" | "closed" };

export function getAfterzWindow(dateStart: string, dateEnd: string | null | undefined, now: number): AfterzWindow | null {
  const start = parsePacificDateTime(dateStart);
  const end = parsePacificDateTime(dateEnd || dateStart);
  if (start == null || end == null) return null;
  const opensAt = start - AFTERZ_OPENS_BEFORE_MS;
  const closesAt = end + AFTERZ_CLOSES_AFTER_MS;
  return { start, opensAt, closesAt, state: now < opensAt ? "before" : now >= closesAt ? "closed" : "open" };
}
