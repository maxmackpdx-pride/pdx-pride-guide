import type { Event } from "./schema";

/** Canonical filter/display labels — single source of truth */
export const EVENT_TYPE_FILTERS = [
  "SEX POSITIVE",
  "NUDITY OK",
  "FREE",
  "TICKETED",
  "21+",
  "ALL AGES",
  "PUBLIC",
  "HOUSE PARTY",
] as const;

export type EventTypeFilterLabel = (typeof EVENT_TYPE_FILTERS)[number];

export interface EventTypeTagColors {
  color: string;
  borderColor: string;
}

export const EVENT_TYPE_TAG_COLORS: Record<EventTypeFilterLabel, EventTypeTagColors> = {
  "SEX POSITIVE": { color: "#FF00CC", borderColor: "#FF00CC" },
  "NUDITY OK": { color: "#FF00CC", borderColor: "#FF00CC" },
  FREE: { color: "#39FF14", borderColor: "#39FF14" },
  TICKETED: { color: "#00FFFF", borderColor: "#00FFFF" },
  "21+": { color: "#CCFF00", borderColor: "#CCFF00" },
  "ALL AGES": { color: "#CCFF00", borderColor: "#CCFF00" },
  PUBLIC: { color: "#888888", borderColor: "#555555" },
  "HOUSE PARTY": { color: "#FF6600", borderColor: "#FF6600" },
};

type EventTagSource = Pick<
  Event,
  "admission" | "ageRequirement" | "isPublic" | "isHouseParty" | "isSexPositive" | "nudityOk"
>;

/** Derive which canonical type tags apply to an event */
export function getEventTypeTagsForEvent(event: EventTagSource): EventTypeFilterLabel[] {
  const tags: EventTypeFilterLabel[] = [];

  if (event.admission === "FREE") tags.push("FREE");
  if (event.admission === "TICKETED") tags.push("TICKETED");
  if (event.ageRequirement === "21_PLUS") tags.push("21+");
  if (event.ageRequirement === "ALL_AGES") tags.push("ALL AGES");
  if (event.isPublic) tags.push("PUBLIC");
  if (event.isHouseParty) tags.push("HOUSE PARTY");
  if (event.isSexPositive) tags.push("SEX POSITIVE");
  if (event.nudityOk) tags.push("NUDITY OK");

  return tags;
}

export function isEventTypeFilterLabel(label: string): label is EventTypeFilterLabel {
  return (EVENT_TYPE_FILTERS as readonly string[]).includes(label);
}