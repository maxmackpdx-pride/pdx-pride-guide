import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import AdminBoardReject from "@/components/admin/AdminBoardReject";
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
};

const TYPE_TAG: Record<string, { label: string; color: string }> = {
  NEW_EVENT: { label: "EVENT", color: C.cyan },
  SUGGEST: { label: "EVENT", color: C.cyan },
  CLAIM: { label: "PROMOTER", color: C.purple },
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

function mapSubmission(s: any): QueueRow | null {
  if (String(s.status).toUpperCase() !== "PENDING") return null;
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
  };
}

function mapRiverBratsReport(r: any): QueueRow | null {
  if (String(r.status).toUpperCase() !== "PENDING") return null;
  return {
    id: `rb-${r.id}`,
    kind: "river_brats",
    entityId: r.id,
    tag: "RIVER BRATS",
    tagColor: C.orange,
    title: `${r.target_type || "Content"} #${r.target_id}`,
    meta: `${r.reason || "Reported"}${r.reporterUsername ? ` · by ${r.reporterUsername}` : ""}${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    fields: [
      ["Target", `${r.target_type || "—"} #${r.target_id ?? "—"}`],
      ["Reason", String(r.reason || "—")],
    ],
    note: r.details || r.message || "",
  };
}

function mapGiftingReport(r: any): QueueRow | null {
  if (String(r.status).toUpperCase() !== "PENDING") return null;
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
  };
}

function mapGiftingFlagged(p: any): QueueRow | null {
  if (TERMINAL_GIFTING.has(String(p.status).toUpperCase())) return null;
  if (Number(p.reportCount || 0) <= 0) return null;
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
  };
}

function mapSpotted(p: any): QueueRow | null {
  if (String(p.status).toUpperCase() !== "ACTIVE") return null;
  return {
    id: `sp-${p.id}`,
    kind: "spotted",
    entityId: p.id,
    tag: "MISSED CONN",
    tagColor: C.magenta,
    title: p.title || `Missed connection #${p.id}`,
    meta: p.eventTitle
      ? `${p.eventTitle}${p.venueHint ? ` · ${p.venueHint}` : ""}`
      : (p.venueHint || "Around town"),
    fields: p.username ? [["Poster", String(p.displayName || p.username)]] : [],
    note: p.body || "",
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
function mapModerationRequest(m: any): QueueRow | null {
  if (String(m.status || "").toUpperCase() !== "PENDING") return null;
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
function mapBusinessClaim(r: any): QueueRow {
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
  };
}

/** New venue/business submissions (business_submissions table). */
function mapBusinessSubmission(r: any): QueueRow {
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
  };
}

/** Business logo update requests (business_logo_requests table). */
function mapLogoRequest(r: any): QueueRow {
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
function mapOwnerDeskItem(r: any): QueueRow {
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
  };
}

function invalidateAdminQueue(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/pending-count"] });
  qc.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
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

export default function QueueView({ mode }: { mode: "admin" | "owner" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const accent = mode === "admin" ? C.magenta : C.purple;

  const adminFetch = async (url: string) => {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  };

  const subsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/submissions"],
    queryFn: () => adminFetch("/api/admin/submissions"),
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
    queryKey: ["/api/admin/missed-connections"],
    queryFn: () => apiRequest("GET", "/api/admin/missed-connections").then((r) => {
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
    queryKey: ["/api/admin/moderation"],
    queryFn: () => apiRequest("GET", "/api/admin/moderation").then((r) => {
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
    enabled: mode === "admin",
  });
  const claimsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-claims"],
    queryFn: () => apiRequest("GET", "/api/admin/business-claims").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const bizSubsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-submissions"],
    queryFn: () => apiRequest("GET", "/api/admin/business-submissions").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const logoQuery = useQuery<any[]>({
    queryKey: ["/api/admin/business-logo-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/business-logo-requests").then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }),
    enabled: mode === "admin",
  });
  const ownerQuery = useQuery<any[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: () => adminFetch("/api/admin/feedback"),
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
  const ownerReports = ownerQuery.data ?? [];

  const failedSources = mode === "admin"
    ? [
        subsQuery.isError && "submissions",
        giftingQuery.isError && "gifting",
        spottedQuery.isError && "missed connections",
        riverBratsQuery.isError && "river brats",
        moderationQuery.isError && "moderation",
        promoterQuery.isError && "promoters",
        claimsQuery.isError && "venue claims",
        bizSubsQuery.isError && "venue submissions",
        logoQuery.isError && "logo requests",
      ].filter(Boolean) as string[]
    : ownerQuery.isError
      ? ["owner desk"]
      : [];

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

  const rows: QueueRow[] = useMemo(() => {
    if (mode === "owner") return ownerReports.map(mapOwnerDeskItem);
    const items: QueueRow[] = [];
    for (const s of subs) {
      const row = mapSubmission(s);
      if (row) items.push(row);
    }
    for (const r of riverBratsReports) {
      const row = mapRiverBratsReport(r);
      if (row) items.push(row);
    }
    for (const r of giftingAdmin?.reports || []) {
      const row = mapGiftingReport(r);
      if (row) items.push(row);
    }
    for (const p of giftingAdmin?.posts || []) {
      const row = mapGiftingFlagged(p);
      if (row) items.push(row);
    }
    for (const p of spotted) {
      const row = mapSpotted(p);
      if (row) items.push(row);
    }
    for (const m of moderationReqs) {
      const row = mapModerationRequest(m);
      if (row) items.push(row);
    }
    for (const p of promoterReqs) items.push(mapPromoterRequest(p));
    for (const c of businessClaims) items.push(mapBusinessClaim(c));
    for (const s of businessSubs) items.push(mapBusinessSubmission(s));
    for (const l of logoReqs) items.push(mapLogoRequest(l));
    return items;
  }, [mode, subs, riverBratsReports, giftingAdmin, spotted, moderationReqs, promoterReqs, businessClaims, businessSubs, logoReqs, ownerReports]);

  const pending = approveSub.isPending || declineSub.isPending || resolveRiverBrats.isPending
    || resolveGiftingReport.isPending || rejectGifting.isPending || approveSpotted.isPending
    || removeSpotted.isPending || rejectSpotted.isPending || resolveOwnerDesk.isPending
    || resolveModeration.isPending || approvePromoter.isPending || denyPromoter.isPending
    || approveClaim.isPending || denyClaim.isPending || approveBizSub.isPending
    || denyBizSub.isPending || approveLogo.isPending || denyLogo.isPending;

  const kicker = mode === "admin"
    ? `SHARED QUEUE · ${rows.length} ITEM${rows.length === 1 ? "" : "S"}`
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

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "44px 20px", color: C.faint2, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em" }}>
          {failedSources.length > 0
            ? "QUEUE COULD NOT LOAD"
            : mode === "admin"
              ? "QUEUE IS CLEAR"
              : "OWNER DESK IS CLEAR"}
        </div>
      ) : (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 22, overflow: "hidden", background: C.list }}>
          {rows.map((q, i) => {
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
                    <div style={{ fontSize: 12, color: C.meta, marginTop: 3 }}>{q.meta}</div>
                  </div>
                  <span style={{ color: accent, flex: "none", display: "flex", transition: "transform .15s", transform: `rotate(${isOpen ? 180 : 0}deg)` }}>
                    <ChevronDown size={20} strokeWidth={2.4} />
                  </span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px" }} onClick={(e) => e.stopPropagation()}>
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
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {q.kind === "submission" && (
                        <>
                          {btn("APPROVE", C.green, () => approveSub.mutate(q.entityId))}
                          {btn("DECLINE", C.red, () => declineSub.mutate(q.entityId), true)}
                        </>
                      )}
                      {q.kind === "river_brats" && btn("RESOLVE", C.limeSoft, () => resolveRiverBrats.mutate(q.entityId))}
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
                          {btn("CLEAR FROM QUEUE", C.green, () => approveSpotted.mutate(q.entityId))}
                          {btn("REMOVE", C.red, () => removeSpotted.mutate(q.entityId), true)}
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === "owner" && (
        <p style={{ margin: "14px 2px 4px", fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
          Contact and sponsorship messages from the site's forms land here. Reply goes to the sender's email; Mark done clears it from the desk.
        </p>
      )}
    </>
  );
}