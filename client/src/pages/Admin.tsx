import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle, XCircle, Eye, EyeOff, Lock, Clock,
  ToggleLeft, ToggleRight, ChevronDown, Inbox, Tag, AlertTriangle,
} from "lucide-react";

const ADMIN_PASSWORD = "pdxpride2026";

interface Submission {
  id: number;
  type: string;
  submittedData: string;
  status: string;
  approvedBy: string | null;
  rejectedBy: string | null;
  rejectReason: string | null;
  createdAt: string;
}

interface AdminEvent {
  id: number;
  title: string;
  venueName: string;
  dayOfWeek: string;
  dateStart: string;
  isClaimable: boolean;
  status: string;
}

interface ModerationRequest {
  id: number;
  type: "CLAIM" | "REMOVE";
  eventId: number;
  eventTitle?: string;
  proof: string;
  contactEmail: string;
  contactName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  adminNote?: string;
}

type AdminTab = "queue" | "moderation" | "events";

export default function Admin() {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState("Admin1");
  const [activeTab, setActiveTab] = useState<AdminTab>("queue");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [modNote, setModNote] = useState<Record<number, string>>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const { data: submissions = [], isLoading: subLoading } = useQuery<Submission[]>({
    queryKey: ["/api/admin/submissions"],
    enabled: authenticated,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<AdminEvent[]>({
    queryKey: ["/api/admin/events"],
    enabled: authenticated && activeTab === "events",
  });

  const { data: modRequests = [], isLoading: modLoading } = useQuery<ModerationRequest[]>({
    queryKey: ["/api/admin/moderation"],
    enabled: authenticated && activeTab === "moderation",
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiRequest("POST", `/api/admin/submissions/${id}/approve`, { adminName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Approved", description: "Submission approved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Could not approve submission.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/admin/submissions/${id}/reject`, { adminName, reason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      setRejectReasons(prev => ({ ...prev, [id]: "" }));
      toast({ title: "Rejected", description: "Submission rejected." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not reject submission.", variant: "destructive" });
    },
  });

  const claimableMutation = useMutation({
    mutationFn: ({ id, isClaimable }: { id: number; isClaimable: boolean }) =>
      apiRequest("PATCH", `/api/admin/events/${id}/claimable`, { isClaimable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Updated", description: "Claimable status updated." });
    },
  });

  const resolveModerationMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: "approve" | "reject"; note?: string }) =>
      apiRequest("POST", `/api/admin/moderation/${id}/resolve`, { action, adminNote: note, adminName }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: action === "approve" ? "Request Approved" : "Request Rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not resolve request.", variant: "destructive" });
    },
  });

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0a0a" }}>
        <div className="w-full max-w-sm border-2 p-8" style={{ background: "#111", borderColor: "#CCFF00" }}>
          <div className="text-center mb-8">
            <Lock size={28} className="mx-auto mb-4" style={{ color: "#CCFF00" }} />
            <h1 className="display text-4xl text-white">ADMIN</h1>
            <p className="text-white/40 text-sm mt-1">PDX Pride Guide</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="display text-xs block mb-2" style={{ color: "#CCFF00" }}>ADMIN NAME</label>
              <input
                data-testid="input-admin-name"
                type="text"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black/40 focus:outline-none focus:border-yellow-400"
                placeholder="Admin1"
              />
            </div>
            <div>
              <label className="display text-xs block mb-2" style={{ color: "#CCFF00" }}>PASSWORD</label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
                  className={`w-full px-3 py-2 pr-10 text-white text-sm border bg-black/40 focus:outline-none ${
                    passwordError ? "border-red-500" : "border-white/20 focus:border-yellow-400"
                  }`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1">Incorrect password</p>}
            </div>
            <button
              type="submit"
              data-testid="button-login"
              className="display text-lg w-full py-3 border-2 transition-all"
              style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
            >
              ENTER
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingSubs = submissions.filter(s => s.status === "pending");
  const resolvedSubs = submissions.filter(s => s.status !== "pending");
  const pendingMod = modRequests.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Admin header */}
      <div className="border-b-2 border-white/10 px-4 py-6 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: "#CCFF00" }} />
            <h1 className="display text-3xl text-white">ADMIN DASHBOARD</h1>
            <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>
              {adminName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingSubs.length > 0 && (
              <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>
                {pendingSubs.length} PENDING
              </span>
            )}
            {pendingMod.length > 0 && (
              <span className="sticker" style={{ color: "#FF6600", borderColor: "#FF6600" }}>
                {pendingMod.length} REQUESTS
              </span>
            )}
            <button
              data-testid="button-logout"
              onClick={() => setAuthenticated(false)}
              className="sticker transition-all hover:bg-white/10"
              style={{ color: "#fff", borderColor: "#333" }}
            >
              LOG OUT
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b-2 border-white/10">
          {([
            { key: "queue" as AdminTab, label: `REVIEW QUEUE (${pendingSubs.length})`, icon: <Inbox size={12} /> },
            { key: "moderation" as AdminTab, label: `CLAIM / REMOVE${pendingMod.length > 0 ? ` (${pendingMod.length})` : ""}`, icon: <Tag size={12} /> },
            { key: "events" as AdminTab, label: "MANAGE EVENTS", icon: <Shield size={12} /> },
          ]).map(tab => (
            <button
              key={tab.key}
              data-testid={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className="display text-sm px-5 py-3 border-b-2 -mb-px transition-all flex items-center gap-2"
              style={{
                borderColor: activeTab === tab.key ? "#CCFF00" : "transparent",
                color: activeTab === tab.key ? "#CCFF00" : "#666",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── REVIEW QUEUE ── */}
        {activeTab === "queue" && (
          <div>
            {subLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : pendingSubs.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "#CCFF00" }} />
                <p className="display text-2xl text-white/30">QUEUE CLEAR</p>
                <p className="text-white/30 text-sm mt-2">No pending submissions to review.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-12">
                <p className="text-white/40 text-sm">{pendingSubs.length} pending — two-admin approval required</p>
                {pendingSubs.map(sub => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    expanded={expandedId === sub.id}
                    onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                    rejectReason={rejectReasons[sub.id] || ""}
                    onRejectReasonChange={val =>
                      setRejectReasons(prev => ({ ...prev, [sub.id]: val }))
                    }
                    onApprove={() => approveMutation.mutate({ id: sub.id })}
                    onReject={() => rejectMutation.mutate({ id: sub.id, reason: rejectReasons[sub.id] || "" })}
                    approving={approveMutation.isPending}
                    rejecting={rejectMutation.isPending}
                  />
                ))}
              </div>
            )}

            {resolvedSubs.length > 0 && (
              <div>
                <h3 className="display text-xl text-white/30 mb-4">RESOLVED ({resolvedSubs.length})</h3>
                <div className="space-y-2">
                  {resolvedSubs.map(sub => (
                    <div
                      key={sub.id}
                      className="p-4 border border-white/10 flex items-center justify-between gap-4"
                      style={{ background: "#0d0d0d" }}
                    >
                      <div>
                        <span className="display text-sm text-white/50">{sub.type}</span>
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className="sticker text-xs"
                        style={{
                          color: sub.status === "approved" ? "#CCFF00" : "#FF2400",
                          borderColor: sub.status === "approved" ? "#CCFF00" : "#FF2400",
                        }}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODERATION INBOX (CLAIM / REMOVE) ── */}
        {activeTab === "moderation" && (
          <div>
            <p className="text-white/40 text-sm mb-6">
              Claim requests — promoters asking to take ownership of an event. Remove requests — requests to take down a listing.
            </p>
            {modLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : modRequests.length === 0 ? (
              <div className="text-center py-16">
                <Inbox size={36} className="mx-auto mb-4 text-white/20" />
                <p className="display text-xl text-white/30">INBOX EMPTY</p>
                <p className="text-white/20 text-sm mt-2">No claim or remove requests.</p>
              </div>
            ) : (
              <div>
                {/* Pending */}
                {pendingMod.length > 0 && (
                  <div className="mb-8">
                    <h3 className="display text-base text-white/40 mb-3">PENDING ({pendingMod.length})</h3>
                    <div className="space-y-3">
                      {pendingMod.map(req => (
                        <ModerationCard
                          key={req.id}
                          req={req}
                          expanded={expandedId === req.id + 10000}
                          onToggle={() => setExpandedId(expandedId === req.id + 10000 ? null : req.id + 10000)}
                          note={modNote[req.id] || ""}
                          onNoteChange={val => setModNote(prev => ({ ...prev, [req.id]: val }))}
                          onApprove={() => resolveModerationMutation.mutate({ id: req.id, action: "approve", note: modNote[req.id] })}
                          onReject={() => resolveModerationMutation.mutate({ id: req.id, action: "reject", note: modNote[req.id] })}
                          resolving={resolveModerationMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Resolved */}
                {modRequests.filter(r => r.status !== "pending").length > 0 && (
                  <div>
                    <h3 className="display text-base text-white/30 mb-3">RESOLVED</h3>
                    <div className="space-y-2">
                      {modRequests.filter(r => r.status !== "pending").map(req => (
                        <div
                          key={req.id}
                          className="p-4 border border-white/10 flex items-center justify-between gap-4"
                          style={{ background: "#0d0d0d" }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span
                              className="sticker text-xs flex-shrink-0"
                              style={{
                                color: req.type === "CLAIM" ? "#00FFFF" : "#FF6600",
                                borderColor: req.type === "CLAIM" ? "#00FFFF" : "#FF6600",
                              }}
                            >
                              {req.type}
                            </span>
                            <div className="min-w-0">
                              <p className="display text-sm text-white/50 truncate">
                                Event #{req.eventId}{req.eventTitle ? ` — ${req.eventTitle}` : ""}
                              </p>
                              <p className="text-white/30 text-xs">{req.contactName} · {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span
                            className="sticker text-xs flex-shrink-0"
                            style={{
                              color: req.status === "approved" ? "#CCFF00" : "#FF2400",
                              borderColor: req.status === "approved" ? "#CCFF00" : "#FF2400",
                            }}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MANAGE EVENTS ── */}
        {activeTab === "events" && (
          <div>
            <p className="text-white/40 text-sm mb-6">
              Toggle "claimable" to let organizers submit a claim for ownership of an event.
            </p>
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-white/30 text-center py-12">No events found.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    data-testid={`row-event-${ev.id}`}
                    className="p-4 border border-white/10 flex items-center justify-between gap-4 flex-wrap"
                    style={{ background: "#111" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="display text-base text-white truncate">{ev.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {ev.venueName} · {ev.dayOfWeek} {new Date(ev.dateStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="sticker text-xs"
                        style={{
                          color: ev.status === "live" ? "#CCFF00" : "#666",
                          borderColor: ev.status === "live" ? "#CCFF00" : "#333",
                        }}
                      >
                        {ev.status.toUpperCase()}
                      </span>
                      <button
                        data-testid={`toggle-claimable-${ev.id}`}
                        onClick={() => claimableMutation.mutate({ id: ev.id, isClaimable: !ev.isClaimable })}
                        className="flex items-center gap-2 text-sm transition-all"
                        style={{ color: ev.isClaimable ? "#CCFF00" : "#444" }}
                      >
                        {ev.isClaimable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        <span className="display text-xs">{ev.isClaimable ? "CLAIMABLE" : "CLAIM OFF"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Submission Card ──────────────────────────────────────────────────────────
function SubmissionCard({
  sub, expanded, onToggle, rejectReason, onRejectReasonChange, onApprove, onReject, approving, rejecting,
}: {
  sub: Submission;
  expanded: boolean;
  onToggle: () => void;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  let parsedData: Record<string, any> = {};
  try { parsedData = JSON.parse(sub.submittedData); } catch {}

  const approvalCount = sub.approvedBy ? sub.approvedBy.split(",").filter(Boolean).length : 0;

  return (
    <div
      data-testid={`card-submission-${sub.id}`}
      className="border-2 transition-all"
      style={{ background: "#111", borderColor: expanded ? "#FF00CC" : "#222" }}
    >
      <button className="w-full text-left p-5 flex items-start justify-between gap-4" onClick={onToggle}>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="sticker text-xs" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>{sub.type}</span>
            {approvalCount > 0 && (
              <span className="sticker text-xs" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>
                {approvalCount}/2 APPROVED
              </span>
            )}
          </div>
          <p className="display text-xl text-white">
            {parsedData.name || parsedData.title || `Submission #${sub.id}`}
          </p>
          <p className="text-white/30 text-xs mt-1 flex items-center gap-1">
            <Clock size={10} />
            {new Date(sub.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="text-white/30 flex-shrink-0 mt-1 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">
          <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.entries(parsedData)
              .filter(([k]) => !["id", "status", "createdAt"].includes(k))
              .map(([key, val]) => (
                <div key={key} className="bg-black/30 p-2 border border-white/10">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{key}</p>
                  <p className="text-white text-sm truncate">{String(val)}</p>
                </div>
              ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="display text-xs text-white/30 block mb-1">REJECT REASON (optional)</label>
              <input
                data-testid={`input-reject-reason-${sub.id}`}
                type="text"
                value={rejectReason}
                onChange={e => onRejectReasonChange(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                data-testid={`button-approve-${sub.id}`}
                onClick={onApprove}
                disabled={approving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
              >
                <CheckCircle size={14} />
                {approving ? "APPROVING..." : "APPROVE"}
              </button>
              <button
                data-testid={`button-reject-${sub.id}`}
                onClick={onReject}
                disabled={rejecting}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ borderColor: "#FF2400", color: "#FF2400" }}
              >
                <XCircle size={14} />
                {rejecting ? "REJECTING..." : "REJECT"}
              </button>
            </div>
            {approvalCount === 1 && (
              <p className="text-white/30 text-xs">1 of 2 admins approved — needs one more approval to go live.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Moderation Request Card ──────────────────────────────────────────────────
function ModerationCard({
  req, expanded, onToggle, note, onNoteChange, onApprove, onReject, resolving,
}: {
  req: ModerationRequest;
  expanded: boolean;
  onToggle: () => void;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  resolving: boolean;
}) {
  const isClaim = req.type === "CLAIM";
  const accentColor = isClaim ? "#00FFFF" : "#FF6600";

  return (
    <div
      data-testid={`card-moderation-${req.id}`}
      className="border-2 transition-all"
      style={{ background: "#111", borderColor: expanded ? accentColor : "#222" }}
    >
      <button className="w-full text-left p-5 flex items-start justify-between gap-4" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="sticker text-xs" style={{ color: accentColor, borderColor: accentColor }}>
              {req.type}
            </span>
            {!isClaim && (
              <span className="sticker text-xs flex items-center gap-1" style={{ color: "#FF6600", borderColor: "#FF6600" }}>
                <AlertTriangle size={9} /> REMOVE
              </span>
            )}
          </div>
          <p className="display text-lg text-white">
            {req.eventTitle || `Event #${req.eventId}`}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {req.contactName} · {req.contactEmail}
          </p>
          <p className="text-white/20 text-xs flex items-center gap-1 mt-0.5">
            <Clock size={9} />
            {new Date(req.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="text-white/30 flex-shrink-0 mt-1 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">
          {req.proof && (
            <div className="mb-4 bg-black/30 p-3 border border-white/10">
              <p className="text-white/30 text-xs uppercase tracking-wide mb-1">
                {isClaim ? "PROOF OF OWNERSHIP" : "REASON FOR REMOVAL"}
              </p>
              <p className="text-white/80 text-sm">{req.proof}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="display text-xs text-white/30 block mb-1">ADMIN NOTE (optional)</label>
              <input
                data-testid={`input-mod-note-${req.id}`}
                type="text"
                value={note}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="Internal note..."
                className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                data-testid={`button-mod-approve-${req.id}`}
                onClick={onApprove}
                disabled={resolving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
              >
                <CheckCircle size={14} />
                {resolving ? "PROCESSING..." : isClaim ? "GRANT CLAIM" : "APPROVE REMOVAL"}
              </button>
              <button
                data-testid={`button-mod-reject-${req.id}`}
                onClick={onReject}
                disabled={resolving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ borderColor: "#FF2400", color: "#FF2400" }}
              >
                <XCircle size={14} />
                {resolving ? "PROCESSING..." : "DENY"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
