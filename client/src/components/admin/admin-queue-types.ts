export type InboxKind =
  | "submission"
  | "promoter"
  | "talent"
  | "moderation"
  | "gifting_post"
  | "gifting_report"
  | "missed_connection";

export type BoardRejectTarget = "gigs" | "gifting" | "missed-connections";

export type InboxKindFilter = InboxKind | "all";

export type OwnerDeskItem = {
  id: number;
  source: "desk" | "feedback";
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  body: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pageUrl: string | null;
  severity: string | null;
  meta: Record<string, unknown>;
  status: string;
  createdAt: string;
};