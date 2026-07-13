import { parsePacificDateTime } from "./missedConnections";

/** Event group chat opens 48 hours before doors and closes 4 hours after the
 *  event ends (falls back to start when dateEnd is missing/unparsable). */
export const EVENT_CHAT_OPENS_BEFORE_MS = 48 * 60 * 60 * 1000;
export const EVENT_CHAT_CLOSES_AFTER_MS = 4 * 60 * 60 * 1000;

/** Group chat messages are hard-deleted this many days after the chat closes. */
export const CHAT_RETENTION_DAYS = 7;

export type EventChatWindowState = "BEFORE" | "OPEN" | "CLOSED";

export type EventChatWindow = {
  opensAt: number;
  closesAt: number;
  state: EventChatWindowState;
};

export function getEventChatWindow(
  dateStart?: string | null,
  dateEnd?: string | null,
  now = Date.now(),
): EventChatWindow | null {
  const start = parsePacificDateTime(dateStart);
  if (start == null) return null;
  const end = parsePacificDateTime(dateEnd) ?? start;
  const opensAt = start - EVENT_CHAT_OPENS_BEFORE_MS;
  const closesAt = end + EVENT_CHAT_CLOSES_AFTER_MS;
  const state: EventChatWindowState =
    now < opensAt ? "BEFORE" : now >= closesAt ? "CLOSED" : "OPEN";
  return { opensAt, closesAt, state };
}
