/** Canonical admission / payment types for events. */
export const ADMISSION_TYPES = [
  "FREE",
  "TICKETED",
  "DOOR_FEE",
  "SUGGESTED_DONATION",
  /** Cover unknown - never treat as free when scrape has no signal. */
  "UNKNOWN",
] as const;

export type AdmissionType = (typeof ADMISSION_TYPES)[number];

export const ADMISSION_OPTIONS: ReadonlyArray<{ value: AdmissionType; label: string; hint: string }> = [
  {
    value: "FREE",
    label: "Free",
    hint: "No cover charge.",
  },
  {
    value: "TICKETED",
    label: "Ticketed",
    hint: "Advance purchase or reserved entry. Ticket link required.",
  },
  {
    value: "DOOR_FEE",
    label: "Door fee",
    hint: "Required cover paid at the door. Not pre-ticketed (typical for clubs like Sanctuary).",
  },
  {
    value: "SUGGESTED_DONATION",
    label: "Suggested donation",
    hint: "Pay what you can. Donation encouraged but not strictly required.",
  },
  {
    value: "UNKNOWN",
    label: "See listing",
    hint: "Cover not confirmed - check the event page. Never assume free.",
  },
];

export const ADMISSION_DISPLAY_LABELS: Record<AdmissionType, string> = {
  FREE: "Free",
  TICKETED: "Ticketed",
  DOOR_FEE: "Door fee",
  SUGGESTED_DONATION: "Donation",
  UNKNOWN: "See listing",
};

/** Default when ingest cannot prove free/ticketed/door - never invent FREE. */
export const ADMISSION_UNKNOWN: AdmissionType = "UNKNOWN";

/** Filter chip label on Events board (matches EVENT_TYPE_FILTERS). */
export const ADMISSION_FILTER_TAGS = ["FREE", "TICKETED", "DOOR FEE"] as const;

export function isAdmissionType(value: string): value is AdmissionType {
  return (ADMISSION_TYPES as readonly string[]).includes(value);
}

export function admissionRequiresTicketUrl(admission: string): boolean {
  return admission === "TICKETED";
}

export function admissionFilterTagForValue(admission: string): string | null {
  if (admission === "FREE" || admission === "TICKETED") return admission;
  if (admission === "DOOR_FEE") return "DOOR FEE";
  return null;
}

export function admissionFromFilterTag(tag: string): AdmissionType | null {
  if (tag === "FREE" || tag === "TICKETED") return tag;
  if (tag === "DOOR FEE") return "DOOR_FEE";
  return null;
}

/** CTA label for an optional external event link in detail views. */
export function admissionEventLinkLabel(admission: string): string {
  return admission === "TICKETED" ? "Get Tickets" : "Event info";
}

export function admissionDisplayLabel(admission: string | null | undefined): string | undefined {
  if (!admission) return undefined;
  if (isAdmissionType(admission)) return ADMISSION_DISPLAY_LABELS[admission];
  return admission.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
}