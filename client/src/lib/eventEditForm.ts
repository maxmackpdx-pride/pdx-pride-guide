import type { Event } from "@shared/schema";
import { jsonTagsToSubmitLabels, submitLabelsToJsonTags } from "@shared/eventTypeTags";

export type EventEditFormState = {
  title: string;
  description: string;
  venueName: string;
  address: string;
  neighborhood: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string;
  ageRequirement: string;
  admission: string;
  ticketUrl: string;
  posterImageUrl: string;
  isHouseParty: boolean;
  isSexPositive: boolean;
  nudityOk: boolean;
  selectedTypes: string[];
};

export function eventToEditForm(evt: Event): EventEditFormState {
  let storedTypes: string[] = [];
  try {
    storedTypes = JSON.parse(evt.eventTypes || "[]") as string[];
  } catch {
    storedTypes = [];
  }

  return {
    title: evt.title || "",
    description: evt.description || "",
    venueName: evt.venueName || "",
    address: evt.address || "",
    neighborhood: evt.neighborhood || "SE Portland",
    dateStart: evt.dateStart || "",
    dateEnd: evt.dateEnd || "",
    dayOfWeek: evt.dayOfWeek || "FRI",
    ageRequirement: evt.ageRequirement || "ALL_AGES",
    admission: evt.admission || "FREE",
    ticketUrl: evt.ticketUrl || "",
    posterImageUrl: evt.posterImageUrl || "",
    isHouseParty: !!evt.isHouseParty,
    isSexPositive: !!evt.isSexPositive,
    nudityOk: !!evt.nudityOk,
    selectedTypes: jsonTagsToSubmitLabels(storedTypes),
  };
}

export function editFormToApiPayload(form: EventEditFormState) {
  const { selectedTypes, ...rest } = form;
  return {
    ...rest,
    eventTypes: submitLabelsToJsonTags(selectedTypes),
  };
}

export function userCanEditEvent(
  event: Event,
  user: { id: number; username: string; email?: string | null; isAdmin?: boolean } | null | undefined,
  hostUserIds: number[],
): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (hostUserIds.includes(user.id)) return true;
  if (event.claimedBy && event.claimedBy === user.username) return true;
  if (event.submittedBy) {
    if (event.submittedBy === user.email || event.submittedBy === user.username) return true;
  }
  return false;
}