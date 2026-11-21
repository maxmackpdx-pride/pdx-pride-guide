import { parsePacificDateTime } from "@shared/missedConnections";

/** Pure helpers for RidezFormCard (unit-tested without React). */
type Values = Record<string, string | boolean>;

export type RidezMode = "offer" | "need";
export type RidezDirection = "arriving" | "departing";
export type RidezFormRide = { id: number; area?: string; driver?: string; remaining?: number; mine?: boolean; myRequest?: number | null; plan?: { kind?: string; meeting?: string | null; leaveBy?: number | null } | null };

export function ridezPlanningBase(eventId: number, occurrenceDate: string) {
  return `/api/events/${eventId}/occurrences/${occurrenceDate.slice(0, 10)}/planning`;
}

export function rideDirectionOf(r: RidezFormRide): RidezDirection {
  return r.plan?.kind === "home" || r.plan?.kind === "afterz" ? "departing" : "arriving";
}

/** Leave-by from the occurrence day + a Pacific wall time. Departing rides past midnight roll to the next day. */
export function ridezLeaveBy(occurrenceDate: string, time: string, direction: RidezDirection, eventStart?: string | null): number | null {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const day = occurrenceDate.slice(0, 10);
  const at = parsePacificDateTime(`${day}T${time}`);
  if (at == null) return null;
  const start = eventStart ? parsePacificDateTime(eventStart.length > 10 ? `${day}T${eventStart.slice(11, 16)}` : null) : null;
  return direction === "departing" && start != null && at < start ? at + 24 * 3600_000 : at;
}

/** Offer body for POST {planning}/rides (validated again by the server). */
export function ridezOfferBody(v: Values, occurrenceDate: string, eventStart?: string | null) {
  const direction: RidezDirection = v.direction === "departing" ? "departing" : "arriving";
  const time = String(v.leaveTime || "");
  if (direction === "departing" && !time) throw new Error("Pick a leave-by time for a ride home.");
  return {
    area: String(v.area || "").trim(),
    seats: Number(v.seats) || 0,
    kind: direction === "departing" ? "home" : "carpool",
    meeting: String(v.meeting || "").trim(),
    leaveBy: time ? ridezLeaveBy(occurrenceDate, time, direction, eventStart) : null,
    oneWay: direction === "arriving" && !time,
  };
}

