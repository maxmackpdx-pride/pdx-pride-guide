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

export const EVENT_TALENT_ROLE_COLORS: Record<EventTalentRole, { color: string; borderColor: string }> = {
  DRAG: { color: "#FF00CC", borderColor: "#FF00CC" },
  DJ: { color: "#00FFFF", borderColor: "#00FFFF" },
  BARTENDER: { color: "#FF6600", borderColor: "#FF6600" },
  MC: { color: "#CCFF00", borderColor: "#CCFF00" },
  GOGO: { color: "#FF00CC", borderColor: "#FF00CC" },
  PERFORMER: { color: "#CCFF00", borderColor: "#CCFF00" },
  OTHER: { color: "#aaaaaa", borderColor: "#555555" },
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