import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import AdminBoardReject from "@/components/admin/AdminBoardReject";
import type { QueueFolder } from "../types";
import { C, MONO } from "./sheet";

type QueueRowKind =
  | "submission"
  | "river_brats"
  | "gifting_report"
  | "gifting_flagged"
  | "spotted"
  | "moderation"
  | "promoter_request"
  | "business_claim"
  | "business_submission"
  | "logo_request"
  | "gig_pending"
  | "owner_desk";

type QueueRow = {
  id: string;
  kind: QueueRowKind;
  entityId: number;
  tag: string;
  tagColor: string;
  title: string;
  meta: string;
  fields: Array<[string, string]>;
  note: string;
  body?: string;
  /** Owner-desk contact/sponsor messages: reply target + file links. */
  replyEmail?: string;
  attachments?: string[];
  outcome?: string;
  completedAt?: string;
  readOnly?: boolean;
};

/** Every admin queue surface — always shown in floating inbox, even at 0. */
/**
 * Shared Admin · Queue buckets only.
 * Logos are Owner desk only (not shared keyholder queue).
 * Missed conn / River Brats / Gig Work = reports & flags → resolve or reject-with-reason.
 */
const ADMIN_QUEUE_BUCKETS: Array<{
  id: string;
  label: string;
  kinds: QueueRowKind[];
  color: string;
}> = [
  { id: "events", label: "Events / claims", kinds: ["submission"], color: C.cyan },
  { id: "promoters", label: "Promoters", kinds: ["promoter_request"], color: C.purple },
  { id: "venue_claims", label: "Venue claims", kinds: ["business_claim"], color: C.orange },
  { id: "new_venues", label: "New venues", kinds: ["business_submission"], color: C.orange },
  { id: "moderation", label: "Moderation", kinds: ["moderation"], color: C.magenta },
  { id: "spotted", label: "Missed conn", kinds: ["spotted"], color: C.magenta },
  { id: "gifting", label: "Gifting", kinds: ["gifting_report", "gifting_flagged"], color: C.lime },
  { id: "river_brats", label: "River Brats", kinds: ["river_brats"], color: C.orange },
  { id: "gigs", label: "Gig Work", kinds: ["gig_pending"], color: C.purple },
];

const TYPE_TAG: Record<string, { label: string; color: string }> = {
  NEW_EVENT: { label: "EVENT", color: C.cyan },
  SUGGEST: { label: "EVENT", color: C.cyan },
  CLAIM: { label: "CLAIM", color: C.purple },
  PROMOTER_APPLICATION: { label: "PROMOTER", color: C.purple },
  PROMOTER: { label: "PROMOTER", color: C.purple },
  PLACE: { label: "PLACE", color: C.orange },
  BUSINESS: { label: "PLACE", color: C.orange },
};

const TERMINAL_GIFTING = new Set(["REJECTED", "REMOVED", "GIFTED", "FOUND", "EXPIRED"]);

function ts(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function formatRejectNote(reasonCode: string, note: string) {
  const base = String(reasonCode || "OFF_TOPIC").trim();
  const extra = String(note || "").trim();
  return extra ? `${base}: ${extra}` : base;
}

function mapSubmission(s: any, completed = false): QueueRow | null {
  const status = String(s.status).toUpperCase();
  if (completed ? status === "PENDING" : status !== "PENDING") return null;
  const t = TYPE_TAG[s.type] || { label: String(s.type || "ITEM"), color: C.cyan };
  const fields: Array<[string, string]> = [];
  if (s.venueName) fields.push(["Where", s.venueName + (s.address ? ` · ${s.address}` : "")]);
  if (s.dateStart) fields.push(["When", ts(s.dateStart)]);
  if (s.submitterEmail) fields.push(["From", String(s.submitterEmail)]);
  return {
    id: `sub-${s.id}`,
    kind: "submission",
    entityId: s.id,
    tag: t.label,
    tagColor: t.color,
    title: s.title || s.name || "Untitled submission",
    meta: `Submitted by ${s.submittedBy || s.submitterEmail || "someone"}${s.createdAt ? " · " + ts(s.createdAt) : ""}`,
    fields,
    note: s.description || "",
    body: s.claimReason || undefined,
    outcome: completed ? status : undefined,
    completedAt: completed ? String(s.createdAt || "") : undefined,
    readOnly: completed,
  };
}

function mapPendingGig(g: any, completed = false): QueueRow | null {
  const status = String(g.status || "").toUpperCase();
  if (completed) {
    if (!["REJECTED", "REMOVED"].includes(status)) return null;
  } else if (status !== "PENDING") {
    return null;
  }
  return {
    id: `gig-${g.id}`,
    kind: "gig_pending",
    entityId: g.id,
    tag: "GIG WORK",
    tagColor: C.purple,
    title: g.title || "Gig post",
    meta: `Needs review · ${g.postType || "GIG"}${g.username ? ` · @${g.username}` : g.name ? ` · ${g.name}` : ""}${g.createdAt ? " · " + ts(g.createdAt) : ""}`,
    fields: [
      ["Type", String(g.postType || "—")],
      ["Where", String(g.location || (g.isRemote ? "Remote" : "—"))],
      ["Comp", String(g.compensation || "—")],
    ],
    note: g.description || g.adminNotes || "",
    outcome: completed ? status : undefined,
    completedAt: completed ? String(g.createdAt || "") : undefined,
    readOnly: completed,
  };
}

function mapRiverBratsReport(r: any, completed = false): QueueRow | null {
  const status = String(r.status).toUpperCase();
  if (completed ? status !== "RESOLVED" : status !== "PENDING") return null;
  return {
    id: `rb-${r.id}`,
    kind: "river_brats",
    entityId: r.id,
    tag: "RIVER BRATS",
    tagColor: C.orange,
    title: `${r.target_type || "Content"} #${r.target_id}`,
    meta: `Report · ${r.reason || "Flagged"}${r.reporterUsername ? ` · by ${r.reporterUsername}` : ""}${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields: [
      ["Target", `${r.target_type || "—"} #${r.target_id ?? "—"}`],
      ["Reason", String(r.reason || "—")],
    ],
    note: r.details || r.message || "",
    outcome: completed ? status : undefined,
    completedAt: completed ? String(r.createdAt || r.resolved_at || "") : undefined,
    readOnly: completed,
  };
}

function mapGiftingReport(r: any, completed = false): QueueRow | null {
  const status = String(r.status).toUpperCase();
  if (completed ? status !== "RESOLVED" : status !== "PENDING") return null;
  return {
    id: `gr-${r.id}`,
    kind: "gifting_report",
    entityId: r.id,
    tag: "GIFT REPORT",
    tagColor: C.red,
    title: r.postTitle || `Report #${r.id}`,
    meta: String(r.reason || "Flagged gifting post"),
    fields: [["Post", String(r.postTitle || r.postId || "—")]],
    note: r.message || "",
    outcome: completed ? status : undefined,
    completedAt: completed ? String(r.createdAt || r.resolved_at || "") : undefined,
    readOnly: completed,
  };
}

function mapGiftingFlagged(p: any, completed = false): QueueRow | null {
  const status = String(p.status).toUpperCase();
  if (completed) {
    if (!TERMINAL_GIFTING.has(status)) return null;
  } else {
    if (TERMINAL_GIFTING.has(status)) return null;
    if (Number(p.reportCount || 0) <= 0) return null;
  }
  return {
    id: `gp-${p.id}`,
    kind: "gifting_flagged",
    entityId: p.id,
    tag: "FLAGGED GIFT",
    tagColor: C.purple,
    title: p.title || `Gifting post #${p.id}`,
    meta: `${p.postType || "POST"} · ${p.reportCount} report(s)`,
    fields: [["Status", String(p.status || "—")]],
    note: p.description || "",
    outcome: completed ? status : undefined,
    completedAt: completed ? String(p.createdAt || p.updated_at || "") : undefined,
    readOnly: completed,
  };
}

function mapSpotted(p: any, completed = false): QueueRow | null {
  const status = String(p.status).toUpperCase();
  const reviewed = Boolean(p.adminReviewed);
  if (completed) {
    if (!reviewed && status === "ACTIVE") return null;
  } else if (status !== "ACTIVE" || reviewed) {
    return null;
  }
  return {
    id: `sp-${p.id}`,
    kind: "spotted",
    entityId: p.id,
    tag: "MISSED CONN",
    tagColor: C.magenta,
    title: p.title || `Missed connection #${p.id}`,
    meta: `Report / review · ${
      p.eventTitle
        ? `${p.eventTitle}${p.venueHint ? ` · ${p.venueHint}` : ""}`
        : (p.venueHint || "Around town")
    }`,
    fields: p.username ? [["Poster", String(p.displayName || p.username)]] : [],
    note: p.body || "",
    outcome: completed ? (status === "ACTIVE" && reviewed ? "CLEARED" : status) : undefined,
    completedAt: completed ? String(p.createdAt || "") : undefined,
    readOnly: completed,
  };
}

const MODERATION_TAG: Record<string, { label: string; color: string }> = {
  MISSED_CONNECTION_REPORT: { label: "MC REPORT", color: C.red },
  NEW_DIRECTORY_LISTING: { label: "NEW PLACE", color: C.orange },
  TRANSFER: { label: "TRANSFER", color: C.purple },
  REMOVE: { label: "REMOVE REQ", color: C.red },
  FLAG: { label: "FLAGGED", color: C.red },
  FLAGGED_BY_OWNER: { label: "OWNER FLAG", color: C.red },
};

/** Shared admin moderation queue (moderation_requests) — reports and
 * notifications that should reach every admin, not just the owner. */
function mapModerationRequest(m: any, completed = false): QueueRow | null {
  const status = String(m.status || "").toUpperCase();
  if (completed ? status === "PENDING" : status !== "PENDING") return null;
  const type = String(m.type || "");
  const t = MODERATION_TAG[type] || { label: type.replace(/_/g, " ") || "REVIEW", color: C.cyan };
  const fields: Array<[string, string]> = [];
  if (m.requesterName) fields.push(["From", String(m.requesterName)]);
  if (m.eventTitle) fields.push(["Item", String(m.eventTitle)]);
  return {
    id: `mod-${m.id}`,
    kind: "moderation",
    entityId: m.id,
    tag: t.label,
    tagColor: t.color,
    title: String(m.eventTitle || t.label),
    meta: `${t.label}${m.createdAt ? " · " + ts(m.createdAt) : ""}`,
    fields,
    note: String(m.proof || ""),
    outcome: completed ? status : undefined,
    completedAt: completed ? String(m.createdAt || "") : undefined,
    readOnly: completed,
  };
}

/** Promoter applications / requests (users with promoterStatus "pending",
 * plus pending event-claim submitters). Approve/deny sets promoterStatus. */
function mapPromoterRequest(r: any): QueueRow {
  const who = r.displayName || r.username || "Applicant";
  const fields: Array<[string, string]> = [];
  if (r.username) fields.push(["Handle", `@${r.username}`]);
  if (r.email) fields.push(["Email", String(r.email)]);
  if (r.submitterOrg) fields.push(["Org", String(r.submitterOrg)]);
  if (r.eventTitle) fields.push(["Event", String(r.eventTitle)]);
  return {
    id: `promo-${r.id}`,
    kind: "promoter_request",
    entityId: r.id,
    tag: "PROMOTER",
    tagColor: C.purple,
    title: who,
    meta: `Promoter request${r.requestedAt ? " · " + ts(r.requestedAt) : ""}`,
    fields,
    note: String(r.claimReason || ""),
  };
}

/** Venue/business claims (business_claims table) — someone claiming a
 * directory listing as its owner. */
function mapBusinessClaim(r: any, completed = false): QueueRow | null {
  const status = String(r.status || "").toUpperCase();
  if (completed && status === "PENDING") return null;
  if (!completed && status !== "PENDING") return null;
  const who = r.displayName || r.username || "Someone";
  const fields: Array<[string, string]> = [["From", who]];
  if (r.email) fields.push(["Email", String(r.email)]);
  return {
    id: `bclaim-${r.id}`,
    kind: "business_claim",
    entityId: r.id,
    tag: "VENUE CLAIM",
    tagColor: C.orange,
    title: String(r.businessName || "Venue claim"),
    meta: `Claim by ${who}${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields,
    note: String(r.claimReason || ""),
    outcome: completed ? status : undefined,
    completedAt: completed ? String(r.createdAt || "") : undefined,
    readOnly: completed,
  };
}

/** New venue/business submissions (business_submissions table). */
function mapBusinessSubmission(r: any, completed = false): QueueRow | null {
  const status = String(r.status || "").toUpperCase();
  if (completed && status === "PENDING") return null;
  if (!completed && status !== "PENDING") return null;
  const fields: Array<[string, string]> = [];
  if (r.type) fields.push(["Type", String(r.type)]);
  if (r.address) fields.push(["Where", String(r.address) + (r.neighborhood ? ` · ${r.neighborhood}` : "")]);
  if (r.phone) fields.push(["Phone", String(r.phone)]);
  if (r.website) fields.push(["Web", String(r.website)]);
  if (r.instagram) fields.push(["IG", String(r.instagram)]);
  return {
    id: `bsub-${r.id}`,
    kind: "business_submission",
    entityId: r.id,
    tag: "NEW VENUE",
    tagColor: C.orange,
    title: String(r.name || "New venue"),
    meta: `New venue${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields,
    note: String(r.description || ""),
    outcome: completed ? status : undefined,
    completedAt: completed ? String(r.createdAt || "") : undefined,
    readOnly: completed,
  };
}

/** Business logo update requests (business_logo_requests table). */
function mapLogoRequest(r: any, completed = false): QueueRow | null {
  const status = String(r.status || "").toUpperCase();
  if (completed && status === "PENDING") return null;
  if (!completed && status !== "PENDING") return null;
  return {
    id: `logo-${r.id}`,
    kind: "logo_request",
    entityId: r.id,
    tag: "LOGO",
    tagColor: C.cyan,
    title: `${r.businessName || "Venue"} · new logo`,
    meta: `Logo request${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields: [["Venue", String(r.businessName || "—")]],
    note: "",
    attachments: r.imageUrl ? [String(r.imageUrl)] : [],
    outcome: completed ? status : undefined,
    completedAt: completed ? String(r.createdAt || "") : undefined,
    readOnly: completed,
  };
}

const DESK_TAG: Record<string, { label: string; color: string }> = {
  contact: { label: "MESSAGE", color: C.cyan },
  sponsor: { label: "SPONSOR", color: C.lime },
  bug: { label: "BUG", color: C.red },
  feedback: { label: "FEEDBACK", color: C.orange },
  crash: { label: "CRASH", color: C.red },
  keyholder: { label: "KEYHOLDER", color: C.purple },
  escalation: { label: "ESCALATION", color: C.magenta },
};

/** Owner Desk items come from /api/admin/feedback (owner_desk_items): contact +
 * sponsor messages with full sender details, not moderation reports. */
function mapOwnerDeskItem(r: any, completed = false): QueueRow | null {
  const status = String(r.status || "").toUpperCase();
  if (completed ? status !== "RESOLVED" : status !== "OPEN") return null;
  const kind = String(r.kind || "contact");
  const meta = r.meta || {};
  const t = DESK_TAG[kind] || { label: String(r.kindLabel || kind).toUpperCase(), color: C.purple };
  const fields: Array<[string, string]> = [];
  if (r.contactName) fields.push(["From", String(r.contactName)]);
  if (r.contactEmail) fields.push(["Email", String(r.contactEmail)]);
  if (r.contactPhone) fields.push(["Phone", String(r.contactPhone)]);
  if (meta.businessName) fields.push(["Business", String(meta.businessName)]);
  if (meta.sponsorshipType) fields.push(["Type", String(meta.sponsorshipType)]);
  if (meta.lengthNeeded) fields.push(["Length", String(meta.lengthNeeded)]);
  if (r.pageUrl) fields.push(["Sent from", String(r.pageUrl)]);
  const attachments = Array.isArray(meta.attachmentUrls) ? meta.attachmentUrls.filter(Boolean) : [];
  return {
    id: `desk-${r.id}`,
    kind: "owner_desk",
    entityId: r.id,
    tag: t.label,
    tagColor: t.color,
    title: String(r.title || r.summary || "Message"),
    meta: `${r.contactName || "Someone"}${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields,
    note: String(r.body || ""),
    replyEmail: r.contactEmail ? String(r.contactEmail) : undefined,
    attachments,
    outcome: completed ? "RESOLVED" : undefined,
    completedAt: completed ? String(r.resolvedAt || r.createdAt || "") : undefined,
    readOnly: completed,
  };
}

function sortCompletedRows(items: QueueRow[]): QueueRow[] {
  return [...items].sort((a, b) => {
    const aTs = Date.parse(a.completedAt || "") || 0;
    const bTs = Date.parse(b.completedAt || "") || 0;
    return bTs - aTs;
  });
}

function invalidateAdminQueue(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/pending-count"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/gigs"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/missed-connections"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/river-brats/reports"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/promoter-requests"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/business-claims"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/business-submissions"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/business-logo-requests"] });
  qc.invalidateQueries({ queryKey: ["/api/gifting"] });
  qc.invalidateQueries({ queryKey: ["/api/missed-connections"] });
}

export default function QueueView({
  mode,
  queueFolder,
  guideUnread = 0,
  ownerCount = 0,
  onOpenGuideInbox,
  onOpenOwnerDesk,
}: {
  mode: "admin" | "owner";
  queueFolder: QueueFolder;
  /** Shared guide-admin message unread — shown as a jump chip into Admin · Inbox. */
  guideUnread?: number;
  ownerCount?: number;
  onOpenGuideInbox?: () => void;
  onOpenOwnerDesk?: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  /** "all" or a bucket id from ADMIN_QUEUE_BUCKETS — keeps every queue discoverable. */
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const accent = mode === "admin" ? C.magenta : C.purple;
  const completed = queueFolder === "completed";

  const adminFetch = async (url: string) => {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  };

  const subsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/submissions", completed ? "all" : "pending"],
    queryFn: () => adminFetch(completed ? "/api/admin/submissions?all=true" : "/api/admin/submissions"),
    enabled: mode === "admin",
  });
  const giftingQuery = useQuery<{ posts: any[]; reports: any[] }>({
    queryKey: ["/api/admin/gifting"],
    queryFn: () => apiRequest("GET", "/api/admin/gifting").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const spottedQuery = useQuery<any[]>({
    queryKey: ["/api/admin/missed-connections", completed ? "recent" : "pending"],
    queryFn: () => apiRequest("GET", completed ? "/api/admin/missed-connections?recent=true" : "/api/admin/missed-connections").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const riverBratsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/river-brats/reports"],
    queryFn: () => apiRequest("GET", "/api/admin/river-brats/reports").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const moderationQuery = useQuery<any[]>({
    queryKey: ["/api/admin/moderation", completed ? "all" : "pending"],
    queryFn: () => apiRequest("GET", completed ? "/api/admin/moderation?all=true" : "/api/admin/moderation").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const promoterQuery = useQuery<any[]>({
    queryKey: ["/api/admin/promoter-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/promoter-requests").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin" && !completed,
  });
  const claimsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-claims", completed ? "recent" : "pending"],
    queryFn: () => apiRequest("GET", completed ? "/api/admin/business-claims?recent=true" : "/api/admin/business-claims").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const bizSubsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-submissions", completed ? "recent" : "pending"],
    queryFn: () => apiRequest("GET", completed ? "/api/admin/business-submissions?recent=true" : "/api/admin/business-submissions").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  // Logos = Owner desk only (not shared Admin · Queue).
  const logoQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-logo-requests", completed ? "recent" : "pending"],
    queryFn: () => apiRequest("GET", completed ? "/api/admin/business-logo-requests?recent=true" : "/api/admin/business-logo-requests").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "owner",
  });
  const gigsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/gigs"],
    queryFn: () => apiRequest("GET", "/api/admin/gigs").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const ownerQuery = useQuery<any[]>({
    queryKey: ["/api/admin/feedback", completed ? "resolved" : "open"],
    queryFn: () => adminFetch(completed ? "/api/admin/feedback?status=RESOLVED" : "/api/admin/feedback"),
    enabled: mode === "owner",
  });

  const subs = subsQuery.data ?? [];
  const giftingAdmin = giftingQuery.data;
  const spotted = spottedQuery.data ?? [];
  const riverBratsReports = riverBratsQuery.data ?? [];
  const moderationReqs = moderationQuery.data ?? [];
  const promoterReqs = promoterQuery.data ?? [];
  const businessClaims = claimsQuery.data ?? [];
  const businessSubs = bizSubsQuery.data ?? [];
  const logoReqs = logoQuery.data ?? [];
  const gigs = gigsQuery.data ?? [];
  const ownerReports = ownerQuery.data ?? [];

  const failedSources = mode === "admin"
    ? [
        subsQuery.isError && "submissions",
        giftingQuery.isError && "gifting",
        gigsQuery.isError && "pride werk",
        spottedQuery.isError && "missed connections",
        riverBratsQuery.isError && "river brats",
        moderationQuery.isError && "moderation",
        promoterQuery.isError && "promoters",
        claimsQuery.isError && "venue claims",
        bizSubsQuery.isError && "venue submissions",
      ].filter(Boolean) as string[]
    : [
        ownerQuery.isError && "owner desk",
        logoQuery.isError && "logo requests",
      ].filter(Boolean) as string[];

  const onQueueSuccess = () => invalidateAdminQueue(qc);
  const resolveOwnerDesk = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/feedback/${id}/resolve`, { method: "POST", credentials: "include" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/pending-count"] });
    },
  });

  const approveSub = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminName: user?.displayName || user?.username || "admin" }),
      }),
    onSuccess: onQueueSuccess,
  });
  const declineSub = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      }),
    onSuccess: onQueueSuccess,
  });
  const resolveRiverBrats = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/river-brats/reports/${id}/resolve`, {}),
    onSuccess: onQueueSuccess,
  });
  const resolveGiftingReport = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/gifting/reports/${id}/resolve`, {}),
    onSuccess: onQueueSuccess,
  });
  const rejectGifting = useMutation({
    mutationFn: ({ id, reasonCode, note }: { id: number; reasonCode: string; note: string }) =>
      apiRequest("POST", `/api/admin/gifting/${id}/reject`, { reasonCode, note }),
    onSuccess: onQueueSuccess,
  });
  const approveSpotted = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/missed-connections/${id}/approve`, {}),
    onSuccess: onQueueSuccess,
  });
  const removeSpotted = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/missed-connections/${id}`),
    onSuccess: onQueueSuccess,
  });
  const rejectSpotted = useMutation({
    mutationFn: ({ id, reasonCode, note }: { id: number; reasonCode: string; note: string }) =>
      apiRequest("POST", `/api/admin/missed-connections/${id}/reject`, { reasonCode, note }),
    onSuccess: onQueueSuccess,
  });
  const resolveModeration = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/moderation/${id}/resolve`, { status: "APPROVED" }),
    onSuccess: onQueueSuccess,
  });
  const adminName = user?.displayName || user?.username || "Admin";
  const approvePromoter = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/promoter-requests/${id}/approve`, {}),
    onSuccess: onQueueSuccess,
  });
  const denyPromoter = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/promoter-requests/${id}/deny`, {}),
    onSuccess: onQueueSuccess,
  });
  const approveClaim = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-claims/${id}/approve`, { adminName }),
    onSuccess: onQueueSuccess,
  });
  const denyClaim = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-claims/${id}/deny`, {}),
    onSuccess: onQueueSuccess,
  });
  const approveBizSub = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-submissions/${id}/approve`, { adminName }),
    onSuccess: onQueueSuccess,
  });
  const denyBizSub = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-submissions/${id}/deny`, {}),
    onSuccess: onQueueSuccess,
  });
  const approveLogo = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-logo-requests/${id}/approve`, {}),
    onSuccess: onQueueSuccess,
  });
  const denyLogo = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/business-logo-requests/${id}/deny`, {}),
    onSuccess: onQueueSuccess,
  });
  const approveGig = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/gigs/${id}/status`, { status: "LIVE" }),
    onSuccess: onQueueSuccess,
  });
  const rejectGig = useMutation({
    mutationFn: ({ id, reasonCode, note }: { id: number; reasonCode: string; note: string }) =>
      apiRequest("POST", `/api/admin/gigs/${id}/reject`, { reasonCode, note }),
    onSuccess: onQueueSuccess,
  });

  const rows: QueueRow[] = useMemo(() => {
    if (mode === "owner") {
      const items: QueueRow[] = [];
      for (const r of ownerReports) {
        const row = mapOwnerDeskItem(r, completed);
        if (row) items.push(row);
      }
      // Logo requests are Owner inbox only.
      for (const l of logoReqs) {
        const row = mapLogoRequest(l, completed);
        if (row) items.push(row);
      }
      return completed ? sortCompletedRows(items) : items;
    }
    const items: QueueRow[] = [];
    for (const s of subs) {
      // Standalone promoter applications render in the promoter queue (enriched there).
      if (!completed && s.type === "PROMOTER_APPLICATION") continue;
      const row = mapSubmission(s, completed);
      if (row) items.push(row);
    }
    for (const r of riverBratsReports) {
      const row = mapRiverBratsReport(r, completed);
      if (row) items.push(row);
    }
    for (const r of giftingAdmin?.reports || []) {
      const row = mapGiftingReport(r, completed);
      if (row) items.push(row);
    }
    for (const p of giftingAdmin?.posts || []) {
      const row = mapGiftingFlagged(p, completed);
      if (row) items.push(row);
    }
    for (const p of spotted) {
      const row = mapSpotted(p, completed);
      if (row) items.push(row);
    }
    for (const m of moderationReqs) {
      const row = mapModerationRequest(m, completed);
      if (row) items.push(row);
    }
    if (!completed) {
      for (const p of promoterReqs) items.push(mapPromoterRequest(p));
    }
    for (const c of businessClaims) {
      const row = mapBusinessClaim(c, completed);
      if (row) items.push(row);
    }
    for (const s of businessSubs) {
      const row = mapBusinessSubmission(s, completed);
      if (row) items.push(row);
    }
    // Logos intentionally omitted from shared admin queue (Owner only).
    for (const g of gigs) {
      const row = mapPendingGig(g, completed);
      if (row) items.push(row);
    }
    return completed ? sortCompletedRows(items) : items;
  }, [mode, completed, subs, riverBratsReports, giftingAdmin, spotted, moderationReqs, promoterReqs, businessClaims, businessSubs, logoReqs, gigs, ownerReports]);

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const b of ADMIN_QUEUE_BUCKETS) {
      counts[b.id] = rows.filter((r) => b.kinds.includes(r.kind)).length;
    }
    return counts;
  }, [rows]);

  const visibleBuckets = useMemo(() => {
    if (mode !== "admin") return [];
    if (bucketFilter === "all") return ADMIN_QUEUE_BUCKETS;
    return ADMIN_QUEUE_BUCKETS.filter((b) => b.id === bucketFilter);
  }, [mode, bucketFilter]);

  const claimMutation = useMutation({
    mutationFn: async ({ kind, entityId, takeover }: { kind: string; entityId: number; takeover?: boolean }) => {
      const r = await apiRequest("POST", "/api/admin/queue-claims", { kind, entityId, takeover: !!takeover });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Claim failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/queue"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/queue-claims"] });
    },
  });
  const releaseClaimMutation = useMutation({
    mutationFn: async ({ kind, entityId }: { kind: string; entityId: number }) => {
      const r = await apiRequest("DELETE", `/api/admin/queue-claims/${encodeURIComponent(kind)}/${entityId}`);
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Release failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/queue"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/queue-claims"] });
    },
  });

  const { data: queueClaims = [] } = useQuery<
    Array<{ queueKind: string; entityId: number; assigneeUsername: string | null; assigneeUserId: number }>
  >({
    queryKey: ["/api/admin/queue-claims"],
    queryFn: () =>
      fetch("/api/admin/queue-claims", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    enabled: mode === "admin" && !completed,
    refetchInterval: 60_000,
  });

  const claimFor = (kind: QueueRowKind, entityId: number) => {
    const mapKind =
      kind === "promoter_request" ? "promoter"
        : kind === "spotted" ? "missed_connection"
          : kind === "gig_pending" ? "gig_pending"
            : kind;
    return queueClaims.find((c) => c.queueKind === mapKind && c.entityId === entityId);
  };

  const claimKindFor = (kind: QueueRowKind) => {
    if (kind === "promoter_request") return "promoter";
    if (kind === "spotted") return "missed_connection";
    return kind;
  };

  const pending = approveSub.isPending || declineSub.isPending || resolveRiverBrats.isPending
    || resolveGiftingReport.isPending || rejectGifting.isPending || approveSpotted.isPending
    || removeSpotted.isPending || rejectSpotted.isPending || resolveOwnerDesk.isPending
    || resolveModeration.isPending || approvePromoter.isPending || denyPromoter.isPending
    || approveClaim.isPending || denyClaim.isPending || approveBizSub.isPending
    || denyBizSub.isPending || approveLogo.isPending || denyLogo.isPending
    || approveGig.isPending || rejectGig.isPending
    || claimMutation.isPending || releaseClaimMutation.isPending;

  const kicker = mode === "admin"
    ? completed
      ? `RECENTLY COMPLETED · ${rows.length} ITEM${rows.length === 1 ? "" : "S"}`
      : `SHARED QUEUE · ${rows.length} ITEM${rows.length === 1 ? "" : "S"}`
    : completed
      ? `RECENTLY DELETED · ${rows.length} ITEM${rows.length === 1 ? "" : "S"}`
      : `OWNER DESK · ${rows.length} ITEM${rows.length === 1 ? "" : "S"}`;

  const btn = (label: string, color: string, onClick: () => void, outline = false) => (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        flex: 1,
        padding: "8px 14px",
        borderRadius: 999,
        border: outline ? `1.5px solid ${color}` : "none",
        background: outline ? "none" : color,
        color: outline ? color : "#06060a",
        fontFamily: MONO,
        fontSize: 9.5,
        letterSpacing: ".07em",
        fontWeight: 700,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );

  const renderQueueRow = (q: QueueRow, i: number) => {
    const isOpen = !!open[q.id];
    const rejectKey = q.id;
    return (
      <div key={q.id} style={{ borderTop: i > 0 ? `1px solid ${C.border2}` : undefined, background: isOpen ? "#101014" : undefined }}>
        <div
          onClick={() => setOpen((p) => ({ ...p, [q.id]: !p[q.id] }))}
          style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: ".08em",
                  fontWeight: 700,
                  color: "#06060a",
                  background: q.tagColor,
                  padding: "2.5px 7px",
                  borderRadius: 6,
                  flex: "none",
                }}
              >
                {q.tag}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: C.heading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {q.title}
            </div>
            <div style={{ fontSize: 12, color: C.meta, marginTop: 3 }}>
              {q.meta}
              {q.outcome ? ` · ${q.outcome}` : ""}
              {(() => {
                const c = claimFor(q.kind, q.entityId);
                return c?.assigneeUsername
                  ? ` · claimed by @${c.assigneeUsername}`
                  : "";
              })()}
            </div>
          </div>
          <span style={{ color: accent, flex: "none", display: "flex", transition: "transform .15s", transform: `rotate(${isOpen ? 180 : 0}deg)` }}>
            <ChevronDown size={20} strokeWidth={2.4} />
          </span>
        </div>
        {isOpen && (
          <div style={{ padding: "0 16px 16px" }} onClick={(e) => e.stopPropagation()}>
            {mode === "admin" && !q.readOnly && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {(() => {
                  const ck = claimKindFor(q.kind);
                  const c = claimFor(q.kind, q.entityId);
                  const mine = c && user?.id === c.assigneeUserId;
                  if (!c) {
                    return btn("CLAIM", C.cyan, () =>
                      claimMutation.mutate({ kind: ck, entityId: q.entityId }),
                    );
                  }
                  if (mine) {
                    return btn("RELEASE", C.limeSoft, () =>
                      releaseClaimMutation.mutate({ kind: ck, entityId: q.entityId }),
                      true,
                    );
                  }
                  return btn("TAKE OVER", C.orange, () =>
                    claimMutation.mutate({ kind: ck, entityId: q.entityId, takeover: true }),
                    true,
                  );
                })()}
              </div>
            )}
            {q.fields.length > 0 && (
              <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border2}` }}>
                {q.fields.map(([label, value], fi) => (
                  <div key={fi} style={{ display: "flex", gap: 10, padding: "9px 12px", background: C.inset2, borderTop: fi > 0 ? `1px solid ${C.divider}` : undefined }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.faint, width: 66, flex: "none", textTransform: "uppercase", paddingTop: 1 }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 13, color: C.body, flex: 1, lineHeight: 1.4 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
            {(q.note || q.body) && (
              <div style={{ marginTop: 10, background: C.inset, borderRadius: 12, padding: "11px 13px", fontSize: 12.5, color: C.muted, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                {q.body || q.note}
              </div>
            )}
            {q.attachments && q.attachments.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {q.attachments.map((url, ai) => (
                  <a
                    key={ai}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".06em",
                      color: accent,
                      border: `1px solid ${C.border2}`,
                      borderRadius: 8,
                      padding: "6px 10px",
                      textDecoration: "none",
                    }}
                  >
                    Attachment {ai + 1} ↗
                  </a>
                ))}
              </div>
            )}
            {!q.readOnly && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {q.kind === "submission" && (
                  <>
                    {btn("APPROVE", C.green, () => approveSub.mutate(q.entityId))}
                    {btn("DECLINE", C.red, () => declineSub.mutate(q.entityId), true)}
                  </>
                )}
                {q.kind === "river_brats" && (
                  <>
                    {btn("RESOLVE REPORT", C.limeSoft, () => resolveRiverBrats.mutate(q.entityId))}
                    <div style={{ width: "100%", marginTop: 4 }}>
                      <AdminBoardReject
                        compact
                        reasonCode={rejectReasons[rejectKey] || "OFF_TOPIC"}
                        note={rejectNotes[rejectKey] || ""}
                        onReasonChange={(code) => setRejectReasons((p) => ({ ...p, [rejectKey]: code }))}
                        onNoteChange={(note) => setRejectNotes((p) => ({ ...p, [rejectKey]: note }))}
                        onReject={() => {
                          // Resolve report with board reason noted; no separate post-delete API on RB yet.
                          void apiRequest("POST", `/api/admin/river-brats/reports/${q.entityId}/resolve`, {
                            adminNotes: formatRejectNote(rejectReasons[rejectKey] || "OFF_TOPIC", rejectNotes[rejectKey] || ""),
                          }).then(() => onQueueSuccess());
                        }}
                        pending={pending}
                      />
                    </div>
                  </>
                )}
                {q.kind === "moderation" && btn("MARK REVIEWED", C.limeSoft, () => resolveModeration.mutate(q.entityId))}
                {q.kind === "promoter_request" && (
                  <>
                    {btn("APPROVE PROMOTER", C.green, () => approvePromoter.mutate(q.entityId))}
                    {btn("DENY", C.red, () => denyPromoter.mutate(q.entityId), true)}
                  </>
                )}
                {q.kind === "business_claim" && (
                  <>
                    {btn("APPROVE CLAIM", C.green, () => approveClaim.mutate(q.entityId))}
                    {btn("DENY", C.red, () => denyClaim.mutate(q.entityId), true)}
                  </>
                )}
                {q.kind === "business_submission" && (
                  <>
                    {btn("APPROVE VENUE", C.green, () => approveBizSub.mutate(q.entityId))}
                    {btn("DENY", C.red, () => denyBizSub.mutate(q.entityId), true)}
                  </>
                )}
                {q.kind === "logo_request" && (
                  <>
                    {btn("APPROVE LOGO", C.green, () => approveLogo.mutate(q.entityId))}
                    {btn("DENY", C.red, () => denyLogo.mutate(q.entityId), true)}
                  </>
                )}
                {q.kind === "gig_pending" && (
                  <>
                    {btn("SET LIVE", C.green, () => approveGig.mutate(q.entityId))}
                    <div style={{ width: "100%", marginTop: 4 }}>
                      <AdminBoardReject
                        compact
                        reasonCode={rejectReasons[rejectKey] || "OFF_TOPIC"}
                        note={rejectNotes[rejectKey] || ""}
                        onReasonChange={(code) => setRejectReasons((p) => ({ ...p, [rejectKey]: code }))}
                        onNoteChange={(note) => setRejectNotes((p) => ({ ...p, [rejectKey]: note }))}
                        onReject={() => rejectGig.mutate({
                          id: q.entityId,
                          reasonCode: rejectReasons[rejectKey] || "OFF_TOPIC",
                          note: rejectNotes[rejectKey] || "",
                        })}
                        pending={pending}
                      />
                    </div>
                  </>
                )}
                {q.kind === "gifting_report" && btn("RESOLVE REPORT", C.limeSoft, () => resolveGiftingReport.mutate(q.entityId))}
                {q.kind === "gifting_flagged" && (
                  <div style={{ width: "100%" }}>
                    <AdminBoardReject
                      compact
                      reasonCode={rejectReasons[rejectKey] || "OFF_TOPIC"}
                      note={rejectNotes[rejectKey] || ""}
                      onReasonChange={(code) => setRejectReasons((p) => ({ ...p, [rejectKey]: code }))}
                      onNoteChange={(note) => setRejectNotes((p) => ({ ...p, [rejectKey]: note }))}
                      onReject={() => rejectGifting.mutate({
                        id: q.entityId,
                        reasonCode: rejectReasons[rejectKey] || "OFF_TOPIC",
                        note: rejectNotes[rejectKey] || "",
                      })}
                      pending={pending}
                    />
                  </div>
                )}
                {q.kind === "spotted" && (
                  <>
                    {btn("RESOLVE / CLEAR", C.green, () => approveSpotted.mutate(q.entityId))}
                    <div style={{ width: "100%", marginTop: 4 }}>
                      <AdminBoardReject
                        compact
                        reasonCode={rejectReasons[rejectKey] || "OFF_TOPIC"}
                        note={rejectNotes[rejectKey] || ""}
                        onReasonChange={(code) => setRejectReasons((p) => ({ ...p, [rejectKey]: code }))}
                        onNoteChange={(note) => setRejectNotes((p) => ({ ...p, [rejectKey]: note }))}
                        onReject={() => rejectSpotted.mutate({
                          id: q.entityId,
                          reasonCode: rejectReasons[rejectKey] || "OFF_TOPIC",
                          note: rejectNotes[rejectKey] || "",
                        })}
                        pending={pending}
                      />
                    </div>
                  </>
                )}
                {q.kind === "owner_desk" && (
                  <>
                    {q.replyEmail
                      ? btn("REPLY", C.cyan, () => {
                          window.location.href = `mailto:${q.replyEmail}?subject=${encodeURIComponent(`Re: ${q.title}`)}`;
                        })
                      : null}
                    {btn("MARK DONE", C.green, () => resolveOwnerDesk.mutate(q.entityId), true)}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "0 2px 12px",
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: ".14em",
          fontWeight: 600,
          color: accent,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 8px ${accent}`, flex: "none" }} />
        {kicker}
      </div>

      {/* Always-visible map of every queue surface (counts stay visible at 0). */}
      {mode === "admin" && !completed && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 2px 14px" }}>
          <button
            type="button"
            onClick={() => setBucketFilter("all")}
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: ".06em",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${bucketFilter === "all" ? accent : C.border2}`,
              background: bucketFilter === "all" ? accent : "transparent",
              color: bucketFilter === "all" ? "#06060a" : C.meta,
              cursor: "pointer",
            }}
          >
            All · {bucketCounts.all || 0}
          </button>
          {ADMIN_QUEUE_BUCKETS.map((b) => {
            const n = bucketCounts[b.id] || 0;
            const act = bucketFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBucketFilter(b.id)}
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: ".06em",
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${act ? b.color : C.border2}`,
                  background: act ? b.color : n > 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  color: act ? "#06060a" : n > 0 ? C.heading : C.faint,
                  cursor: "pointer",
                }}
              >
                {b.label} · {n}
              </button>
            );
          })}
          {onOpenGuideInbox && (
            <button
              type="button"
              onClick={onOpenGuideInbox}
              style={{
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: ".06em",
                fontWeight: 700,
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${C.cyan}`,
                background: guideUnread > 0 ? "rgba(0,255,255,0.08)" : "transparent",
                color: C.cyan,
                cursor: "pointer",
              }}
            >
              Guide messages · {guideUnread}
            </button>
          )}
          {onOpenOwnerDesk && (
            <button
              type="button"
              onClick={onOpenOwnerDesk}
              style={{
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: ".06em",
                fontWeight: 700,
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${C.purple}`,
                background: ownerCount > 0 ? "rgba(138,77,255,0.1)" : "transparent",
                color: C.purple,
                cursor: "pointer",
              }}
            >
              Owner desk · {ownerCount}
            </button>
          )}
        </div>
      )}

      {failedSources.length > 0 && (
        <div
          style={{
            margin: "0 2px 12px",
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${C.red}`,
            background: "rgba(201,57,31,0.1)",
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: ".06em",
            color: C.red,
            lineHeight: 1.45,
          }}
        >
          Could not load: {failedSources.join(", ")}. You may need to sign in again as admin, or the server returned an error — not an empty queue.
        </div>
      )}

      {mode === "admin" ? (
        visibleBuckets.map((bucket) => {
          const bucketRows = rows.filter((r) => bucket.kinds.includes(r.kind));
          return (
            <div key={bucket.id} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  margin: "0 2px 8px",
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  color: bucket.color,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: bucket.color, flex: "none" }} />
                {bucket.label.toUpperCase()}
                <span style={{ color: C.faint, fontWeight: 600 }}>· {bucketRows.length}</span>
              </div>
              {bucketRows.length === 0 ? (
                <div
                  style={{
                    margin: "0 2px",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px dashed ${C.border2}`,
                    color: C.faint2,
                    fontFamily: MONO,
                    fontSize: 10.5,
                    letterSpacing: ".08em",
                  }}
                >
                  {completed ? "None in recently completed" : "None waiting — queue clear"}
                </div>
              ) : (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 22, overflow: "hidden", background: C.list }}>
                  {bucketRows.map((q, i) => renderQueueRow(q, i))}
                </div>
              )}
            </div>
          );
        })
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "44px 20px", color: C.faint2, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em" }}>
          {failedSources.length > 0
            ? "QUEUE COULD NOT LOAD"
            : completed
              ? "NO RECENTLY DELETED ITEMS"
              : "OWNER DESK IS CLEAR"}
        </div>
      ) : (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 22, overflow: "hidden", background: C.list }}>
          {rows.map((q, i) => renderQueueRow(q, i))}
        </div>
      )}

      {mode === "owner" && !completed && (
        <p style={{ margin: "14px 2px 4px", fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
          Contact and sponsorship messages from the site's forms land here. Reply goes to the sender's email; Mark done clears it from the desk.
        </p>
      )}
    </>
  );
}