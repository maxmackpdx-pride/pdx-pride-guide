export const EVENT_TALENT_ROLES = [
  "DRAG",
  "DJ",
  "BARTENDER",
  "MC",
  "GOGO",
  "PERFORMER",
  "OTHER",
] as const;

export type EventTalentRole = (typeof EVENT_TALENT_ROLES)[number];

export const EVENT_TALENT_ROLE_LABELS: Record<EventTalentRole, string> = {
  DRAG: "Drag",
  DJ: "DJ",
  BARTENDER: "Bartender",
  MC: "MC",
  GOGO: "Go-Go",
  PERFORMER: "Performer",
  OTHER: "Other",
};

export function isEventTalentRole(value: string): value is EventTalentRole {
  return (EVENT_TALENT_ROLES as readonly string[]).includes(value);
}

export type EventTalentRow = {
  id: number;
  eventId: number;
  userId: number;
  role: EventTalentRole;
  status: "LIVE" | "PENDING";
  addedByUserId: number | null;
  createdAt: string;
  username?: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};