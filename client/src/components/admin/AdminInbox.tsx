import { useMemo, useState } from "react";
import { CheckCircle, ChevronDown, Clock, XCircle } from "lucide-react";
import AdminLoadError from "@/components/admin/AdminLoadError";
import AdminUserIdentity, { type AdminUserProfile } from "@/components/admin/AdminUserIdentity";

export type InboxKind =
  | "submission"
  | "promoter"
  | "talent"
  | "moderation"
  | "gifting_post"
  | "gifting_report"
  | "feedback";

export type InboxKindFilter = InboxKind | "all";

interface InboxItem {
  key: string;
  kind: InboxKind;
  id: number;
  createdAt: string;
  title: string;
  subtitle: string;
  status: string;
  pending: boolean;
  severity?: string;
  payload: any;
  profile?: AdminUserProfile | null;
}

function inboxUserProfile(kind: InboxKind, payload: any): AdminUserProfile | null {
  if (kind === "submission" && payload.submitterProfile) return payload.submitterProfile;
  if (kind === "promoter" || kind === "talent") {
    return {
      id: payload.id,
      username: payload.username,
      displayName: payload.displayName,
      email: payload.email,
      photoUrl: payload.photoUrl,
      avatarChoice: payload.avatarChoice,
      avatarRing: payload.avatarRing,
    };
  }
  if (kind === "moderation" && payload.requesterProfile) return payload.requesterProfile;
  if (kind === "gifting_post" && payload.username) {
    return {
      id: payload.userId,
      username: payload.username,
      displayName: payload.displayName,
      photoUrl: payload.posterPhotoUrl,
      avatarChoice: payload.avatarChoice,
      avatarRing: payload.posterAvatarRing,
    };
  }
  return null;
}

const KIND_META: Record<InboxKind, { label: string; color: string }> = {
  submission: { label: "Submission", color: "#00FFFF" },
  promoter: { label: "Promoter", color: "#C8FA3C" },
  talent: { label: "Talent", color: "#FF8C00" },
  moderation: { label: "Moderation", color: "#FF6600" },
  gifting_post: { label: "Gifting", color: "#B451FF" },
  gifting_report: { label: "Gifting report", color: "#FF2400" },
  feedback: { label: "Feedback", color: "#750787" },
};

const KIND_FILTERS: { key: InboxKindFilter; label: string }[] = [
  { key: "all", label: "All types" },
  { key: "submission", label: "Submissions" },
  { key: "promoter", label: "Promoters" },
  { key: "talent", label: "Talent" },
  { key: "moderation", label: "Moderation" },
  { key: "gifting_post", label: "Gifting" },
  { key: "gifting_report", label: "Reports" },
  { key: "feedback", label: "Feedback" },
];

function kindLabel(kind: InboxKind) {
  return KIND_META[kind].label;
}

function kindColor(kind: InboxKind) {
  return KIND_META[kind].color;
}

export interface AdminInboxProps {
  submissions: any[];
  promoterRequests: any[];
  talentRequests: any[];
  modRequests: any[];
  giftingPosts: any[];
  giftingReports: any[];
  feedback: any[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  expandedKey: string | null;
  onToggleExpand: (key: string | null) => void;
  rejectReasons: Record<number, string>;
  onRejectReasonChange: (id: number, value: string) => void;
  modNotes: Record<number, string>;
  onModNoteChange: (id: number, value: string) => void;
  onApproveSubmission: (id: number) => void;
  onRejectSubmission: (id: number, reason: string) => void;
  onApprovePromoter: (userId: number) => void;
  onDenyPromoter: (userId: number) => void;
  onApproveTalent: (talentId: number) => void;
  onDenyTalent: (talentId: number) => void;
  onResolveModeration: (id: number, action: "approve" | "reject", note?: string) => void;
  onDismissStaleTests: () => void;
  onGiftingStatus: (id: number, status: string) => void;
  onResolveGiftingReport: (id: number) => void;
  onResolveFeedback: (id: number) => void;
  actionPending?: boolean;
}

function buildInboxItems(props: AdminInboxProps): InboxItem[] {
  const items: InboxItem[] = [];

  for (const sub of props.submissions) {
    const pending = String(sub.status).toUpperCase() === "PENDING";
    items.push({
      key: `submission-${sub.id}`,
      kind: "submission",
      id: sub.id,
      createdAt: sub.createdAt,
      title: sub.title || `Submission #${sub.id}`,
      subtitle: `${sub.type} · ${sub.submitterName}${sub.submitterEmail ? ` · ${sub.submitterEmail}` : ""}`,
      status: sub.status,
      pending,
      payload: sub,
      profile: sub.submitterProfile || null,
    });
  }

  for (const req of props.promoterRequests) {
    items.push({
      key: `promoter-${req.id}`,
      kind: "promoter",
      id: req.id,
      createdAt: req.requestedAt,
      title: req.displayName || req.username,
      subtitle: `${req.email}${req.eventTitle ? ` · claiming ${req.eventTitle}` : ""}`,
      status: "PENDING",
      pending: true,
      payload: req,
      profile: inboxUserProfile("promoter", req),
    });
  }

  for (const req of props.talentRequests) {
    items.push({
      key: `talent-${req.id}`,
      kind: "talent",
      id: req.id,
      createdAt: req.createdAt,
      title: req.displayName || req.username,
      subtitle: `${req.role} · ${req.eventTitle}`,
      status: "PENDING",
      pending: true,
      payload: req,
      profile: inboxUserProfile("talent", req),
    });
  }

  for (const req of props.modRequests) {
    const pending = String(req.status).toUpperCase() === "PENDING";
    items.push({
      key: `moderation-${req.id}`,
      kind: "moderation",
      id: req.id,
      createdAt: req.createdAt,
      title: req.eventTitle || `Event #${req.eventId}`,
      subtitle: `${req.type} · ${req.requesterName} · ${req.requesterEmail}`,
      status: req.status,
      pending,
      payload: req,
      profile: req.requesterProfile || null,
    });
  }

  for (const post of props.giftingPosts) {
    const pending = post.status === "PENDING" || (post.reportCount > 0 && post.status !== "PENDING");
    items.push({
      key: `gifting_post-${post.id}`,
      kind: "gifting_post",
      id: post.id,
      createdAt: post.createdAt || post.created_at,
      title: post.title,
      subtitle: `${post.postType} · ${post.status}${post.reportCount ? ` · ${post.reportCount} report(s)` : ""}`,
      status: post.status,
      pending: post.status === "PENDING" || post.reportCount > 0,
      payload: post,
      profile: inboxUserProfile("gifting_post", post),
    });
  }

  for (const report of props.giftingReports) {
    const pending = String(report.status).toUpperCase() === "PENDING";
    items.push({
      key: `gifting_report-${report.id}`,
      kind: "gifting_report",
      id: report.id,
      createdAt: report.createdAt || report.created_at,
      title: report.postTitle || `Report #${report.id}`,
      subtitle: report.reason,
      status: report.status,
      pending,
      payload: report,
    });
  }

  for (const item of props.feedback) {
    const pending = item.status === "OPEN";
    items.push({
      key: `feedback-${item.id}`,
      kind: "feedback",
      id: item.id,
      createdAt: item.createdAt || item.created_at,
      title: item.category || "Feedback",
      subtitle: item.message?.slice(0, 120) || "",
      status: item.status,
      pending,
      severity: item.severity,
      payload: item,
    });
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function AdminInbox(props: AdminInboxProps) {
  const [kindFilter, setKindFilter] = useState<InboxKindFilter>("all");
  const [showResolved, setShowResolved] = useState(false);

  const allItems = useMemo(() => buildInboxItems(props), [
    props.submissions,
    props.promoterRequests,
    props.talentRequests,
    props.modRequests,
    props.giftingPosts,
    props.giftingReports,
    props.feedback,
  ]);

  const pendingCount = allItems.filter(item => item.pending).length;
  const filteredItems = allItems.filter(item => {
    if (!showResolved && !item.pending) return false;
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    return true;
  });

  if (props.error) {
    return <AdminLoadError label="inbox" onRetry={props.onRetry} />;
  }

  if (props.loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-white/5 animate-pulse border border-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-white/40 text-sm m-0">
          {pendingCount} pending across submissions, promoters, talent, moderation, gifting, and feedback.
        </p>
        <button
          type="button"
          onClick={props.onDismissStaleTests}
          disabled={props.actionPending}
          className="sticker text-xs"
          style={{ color: "#666", borderColor: "#444" }}
        >
          DISMISS STALE TESTS
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {KIND_FILTERS.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setKindFilter(filter.key)}
            className={`dash-admin-tab ${kindFilter === filter.key ? "active" : ""}`}
            style={{
              borderBottom: kindFilter === filter.key ? "2px solid #C8FA3C" : "2px solid transparent",
              marginBottom: 0,
              padding: "8px 12px",
              fontSize: 10,
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="display text-xs text-white/40 flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
        Show resolved items
      </label>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "#CCFF00" }} />
          <p className="display text-2xl text-white/30">INBOX CLEAR</p>
          <p className="text-white/30 text-sm mt-2">
            {showResolved ? "No items match these filters." : "No pending items match these filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-white/35 text-xs">{filteredItems.length} item(s)</p>
          {filteredItems.map(item => (
            <InboxCard
              key={item.key}
              item={item}
              expanded={props.expandedKey === item.key}
              onToggle={() => props.onToggleExpand(props.expandedKey === item.key ? null : item.key)}
              {...props}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InboxCard({
  item,
  expanded,
  onToggle,
  rejectReasons,
  onRejectReasonChange,
  modNotes,
  onModNoteChange,
  onApproveSubmission,
  onRejectSubmission,
  onApprovePromoter,
  onDenyPromoter,
  onApproveTalent,
  onDenyTalent,
  onResolveModeration,
  onGiftingStatus,
  onResolveGiftingReport,
  onResolveFeedback,
  actionPending,
}: {
  item: InboxItem;
  expanded: boolean;
  onToggle: () => void;
} & AdminInboxProps) {
  const accent = kindColor(item.kind);
  const payload = item.payload;

  return (
    <div className="border-2 transition-all" style={{ background: "#111", borderColor: expanded ? accent : "#222" }}>
      <button type="button" className="w-full text-left p-5 flex items-start justify-between gap-4" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          {item.profile && (
            <div className="mb-3" onClick={e => e.stopPropagation()}>
              <AdminUserIdentity profile={item.profile} showEmail={!!item.profile.email} size={36} />
            </div>
          )}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="sticker text-xs" style={{ color: accent, borderColor: accent }}>{kindLabel(item.kind)}</span>
            {!item.pending && (
              <span className="sticker text-xs" style={{ color: "#666", borderColor: "#444" }}>RESOLVED</span>
            )}
            {item.severity && (
              <span
                className="sticker text-xs"
                style={{
                  color: item.severity === "BLOCKER" || item.severity === "HIGH" ? "#FF2400" : "#CCFF00",
                  borderColor: item.severity === "BLOCKER" || item.severity === "HIGH" ? "#FF2400" : "#CCFF00",
                }}
              >
                {item.severity}
              </span>
            )}
          </div>
          <p className="display text-lg text-white truncate">{item.title}</p>
          <p className="text-white/45 text-sm mt-1 truncate">{item.subtitle}</p>
          <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
            <Clock size={10} />
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="text-white/30 flex-shrink-0 mt-1 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
          {item.kind === "submission" && (
            <>
              {payload.submitterProfile && (
                <AdminUserIdentity profile={payload.submitterProfile} showEmail size={40} />
              )}

              {/* Submitter info */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Type", payload.type],
                  ["Submitter", payload.submitterName],
                  ["Email", payload.submitterEmail],
                  ["Org", payload.submitterOrg],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="bg-black/30 p-2 border border-white/10">
                    <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{k}</p>
                    <p className="text-white text-sm break-all">{v}</p>
                  </div>
                ))}
              </div>

              {/* Application / claim reason (most important for PROMOTER_APPLICATION) */}
              {payload.claimReason && (
                <div className="bg-black/30 p-3 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-1">
                    {payload.type === "PROMOTER_APPLICATION" ? "Promoter Application" : payload.type === "SUGGEST" ? "Where Spotted" : "Claim Reason / Proof"}
                  </p>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{payload.claimReason}</p>
                </div>
              )}

              {/* Proof / portfolio link */}
              {payload.type === "PROMOTER_APPLICATION" && payload.ticketUrl && (
                <div className="bg-black/30 p-3 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-1">Proof / Portfolio Link</p>
                  <a href={payload.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm underline break-all">{payload.ticketUrl}</a>
                </div>
              )}

              {/* Event details (for NEW_EVENT and SUGGEST) */}
              {payload.type !== "PROMOTER_APPLICATION" && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Title", payload.title],
                    ["Venue", payload.venueName],
                    ["Address", payload.address],
                    ["Neighborhood", payload.neighborhood],
                    ["Day", payload.dayOfWeek],
                    ["Start", payload.dateStart ? new Date(payload.dateStart).toLocaleString() : null],
                    ["End", payload.dateEnd ? new Date(payload.dateEnd).toLocaleString() : null],
                    ["Age", payload.ageRequirement],
                    ["Admission", payload.admission],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string} className="bg-black/30 p-2 border border-white/10">
                      <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{k}</p>
                      <p className="text-white text-sm break-all">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {payload.type !== "PROMOTER_APPLICATION" && payload.description && (
                <div className="bg-black/30 p-3 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-1">Description</p>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{payload.description}</p>
                </div>
              )}

              {/* Ticket / info link */}
              {payload.type !== "PROMOTER_APPLICATION" && payload.ticketUrl && (
                <div className="bg-black/30 p-3 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-1">Ticket / Info Link</p>
                  <a href={payload.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm underline break-all">{payload.ticketUrl}</a>
                </div>
              )}

              {/* Uploaded poster/flyer */}
              {payload.posterImageUrl && (
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-2">Uploaded Flyer</p>
                  <img src={payload.posterImageUrl} alt="Event flyer" className="max-h-64 border border-white/10 object-contain" style={{ maxWidth: "100%" }} />
                  <p className="text-white/30 text-xs mt-1 break-all">{payload.posterImageUrl}</p>
                </div>
              )}

              {item.pending && (
                <>
                  <input
                    type="text"
                    value={rejectReasons[payload.id] || ""}
                    onChange={e => onRejectReasonChange(payload.id, e.target.value)}
                    placeholder="Reject reason (optional)"
                    className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-red-500"
                  />
                  <ActionRow
                    pending={actionPending}
                    onApprove={() => onApproveSubmission(payload.id)}
                    onReject={() => onRejectSubmission(payload.id, rejectReasons[payload.id] || "")}
                  />
                </>
              )}
            </>
          )}

          {item.kind === "promoter" && item.pending && (
            <>
              <AdminUserIdentity profile={item.profile} showEmail size={40} />
              {payload.claimReason && (
                <p className="text-white/70 text-sm whitespace-pre-wrap border-l-2 pl-3" style={{ borderColor: accent }}>
                  {payload.claimReason}
                </p>
              )}
              <ActionRow
                pending={actionPending}
                onApprove={() => onApprovePromoter(payload.id)}
                onReject={() => onDenyPromoter(payload.id)}
              />
            </>
          )}

          {item.kind === "talent" && item.pending && (
            <>
            <AdminUserIdentity profile={item.profile} size={40} />
            <ActionRow
              pending={actionPending}
              onApprove={() => onApproveTalent(payload.id)}
              onReject={() => onDenyTalent(payload.id)}
            />
            </>
          )}

          {item.kind === "moderation" && (
            <>
              {payload.requesterProfile && (
                <AdminUserIdentity profile={payload.requesterProfile} showEmail size={40} />
              )}
              {payload.proof && (
                <div className="bg-black/30 p-3 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-1">Details</p>
                  <p className="text-white/80 text-sm">{payload.proof}</p>
                </div>
              )}
              {item.pending && (
                <>
                  <input
                    type="text"
                    value={modNotes[payload.id] || ""}
                    onChange={e => onModNoteChange(payload.id, e.target.value)}
                    placeholder="Admin note (optional)"
                    className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-yellow-400"
                  />
                  <ActionRow
                    pending={actionPending}
                    onApprove={() => onResolveModeration(payload.id, "approve", modNotes[payload.id])}
                    onReject={() => onResolveModeration(payload.id, "reject", modNotes[payload.id])}
                  />
                </>
              )}
            </>
          )}

          {item.kind === "gifting_post" && item.pending && (
            <>
              {item.profile && <AdminUserIdentity profile={item.profile} size={40} />}
              <p className="text-white/65 text-sm">{payload.description}</p>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => onGiftingStatus(payload.id, payload.postType === "ISO" ? "LOOKING" : "OPEN")}>
                  APPROVE
                </button>
                <button type="button" className="sticker" style={{ color: "#FF6600", borderColor: "#FF6600" }} onClick={() => onGiftingStatus(payload.id, "HIDDEN")}>
                  HIDE
                </button>
                <button type="button" className="sticker" style={{ color: "#FF2400", borderColor: "#FF2400" }} onClick={() => onGiftingStatus(payload.id, "REMOVED")}>
                  REMOVE
                </button>
              </div>
            </>
          )}

          {item.kind === "gifting_report" && item.pending && (
            <button type="button" className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => onResolveGiftingReport(payload.id)}>
              RESOLVE REPORT
            </button>
          )}

          {item.kind === "feedback" && (
            <>
              <p className="text-white/90 text-sm whitespace-pre-wrap">{payload.message}</p>
              {payload.steps && <p className="text-white/55 text-xs whitespace-pre-wrap">Steps: {payload.steps}</p>}
              <div className="text-white/35 text-xs space-y-1">
                <div>Page: {payload.pageUrl || payload.page_url}</div>
                {payload.email && <div>Email: {payload.email}</div>}
              </div>
              {item.pending && (
                <button type="button" className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => onResolveFeedback(payload.id)}>
                  MARK RESOLVED
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionRow({
  pending,
  onApprove,
  onReject,
}: {
  pending?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap">
      <button
        type="button"
        onClick={onApprove}
        disabled={pending}
        className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
        style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
      >
        <CheckCircle size={14} />{pending ? "PROCESSING..." : "APPROVE"}
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={pending}
        className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
        style={{ borderColor: "#FF2400", color: "#FF2400" }}
      >
        <XCircle size={14} />{pending ? "PROCESSING..." : "DENY"}
      </button>
    </div>
  );
}