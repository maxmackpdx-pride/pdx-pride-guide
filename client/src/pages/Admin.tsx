import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle, XCircle, Eye, EyeOff, Lock, Clock,
  ToggleLeft, ToggleRight, ChevronDown, Inbox, Tag, AlertTriangle, Pencil, X, Gift, MessageSquare,
} from "lucide-react";

interface Submission {
  id: number;
  type: string;
  eventId: number | null;
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  neighborhood: string | null;
  dayOfWeek: string | null;
  dateStart: string;
  dateEnd: string;
  submitterName: string;
  submitterEmail: string;
  submitterOrg: string | null;
  claimReason: string | null;
  status: string;
  approvals: string;
  adminNotes: string | null;
  createdAt: string;
}

interface AdminEvent {
  id: number;
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  dayOfWeek: string;
  dateStart: string;
  dateEnd: string;
  ageRequirement: string;
  admission: string;
  ticketUrl: string | null;
  posterImageUrl: string | null;
  isClaimable: boolean;
  isHouseParty: boolean;
  isPrivate: boolean;
  isSexPositive: boolean;
  nudityOk: boolean;
  status: string;
}

interface ModerationRequest {
  id: number;
  type: "CLAIM" | "REMOVE";
  eventId: number;
  eventTitle?: string;
  proof: string;
  requesterEmail: string;
  requesterName: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

type AdminTab = "queue" | "moderation" | "events" | "gifting" | "feedback";

export default function Admin() {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState("Admin1");
  const [activeTab, setActiveTab] = useState<AdminTab>("queue");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [modNote, setModNote] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminEvent>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.isAdmin) return;
        setAuthenticated(true);
        if (data.username) setAdminName(data.username);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      const data = await res.json();
      setAuthenticated(true);
      if (data?.username) setAdminName(data.username);
      setPasswordError(false);
    } catch {
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

  const { data: giftingAdmin = { posts: [], reports: [] }, isLoading: giftingLoading } = useQuery<any>({
    queryKey: ["/api/admin/gifting"],
    enabled: authenticated && activeTab === "gifting",
  });

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/feedback"],
    enabled: authenticated && activeTab === "feedback",
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiRequest("POST", `/api/admin/submissions/${id}/approve`, { adminName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/unclaimed"] });
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

  const editEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminEvent> }) =>
      apiRequest("PUT", `/api/admin/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditingId(null);
      setEditForm({});
      toast({ title: "Event updated", description: "Changes are live." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    },
  });

  const resolveModerationMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: "approve" | "reject"; note?: string }) =>
      apiRequest("POST", `/api/admin/moderation/${id}/resolve`, {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        adminNotes: note,
        adminName,
      }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: action === "approve" ? "Request Approved" : "Request Rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not resolve request.", variant: "destructive" });
    },
  });

  const updateGiftingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("POST", `/api/admin/gifting/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      toast({ title: "Gifting post updated" });
    },
  });

  const resolveGiftingReportMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: number; adminNotes?: string }) =>
      apiRequest("POST", `/api/admin/gifting/reports/${id}/resolve`, { adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
      toast({ title: "Report resolved" });
    },
  });

  const resolveFeedbackMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/feedback/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({ title: "Feedback resolved" });
    },
  });

  const startEdit = (ev: AdminEvent) => {
    setEditingId(ev.id);
    setEditForm({ ...ev });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    editEventMutation.mutate({ id: editingId, data: editForm });
  };

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
                <label className="display text-xs text-white/40 block mb-2">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-white/20 text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
            <div>
              <label className="display text-xs block mb-2" style={{ color: "#CCFF00" }}>ADMIN NAME</label>
              <input
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

  const pendingSubs = submissions.filter(s => s.status.toUpperCase() === "PENDING");
  const resolvedSubs = submissions.filter(s => s.status.toUpperCase() !== "PENDING");
  const pendingMod = modRequests.filter(r => r.status.toUpperCase() === "PENDING");
  const pendingGifting = (giftingAdmin.posts || []).filter((p: any) => p.status === "PENDING");
  const pendingGiftingReports = (giftingAdmin.reports || []).filter((r: any) => r.status === "PENDING");
  const openFeedback = feedback.filter((item: any) => item.status === "OPEN");

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
              onClick={() => { apiRequest("POST", "/api/admin/logout", {}); setAuthenticated(false); }}
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
            { key: "gifting" as AdminTab, label: `GIFTING${pendingGifting.length + pendingGiftingReports.length > 0 ? ` (${pendingGifting.length + pendingGiftingReports.length})` : ""}`, icon: <Gift size={12} /> },
            { key: "feedback" as AdminTab, label: `FEEDBACK${openFeedback.length > 0 ? ` (${openFeedback.length})` : ""}`, icon: <MessageSquare size={12} /> },
          ]).map(tab => (
            <button
              key={tab.key}
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
                <p className="text-white/40 text-sm">{pendingSubs.length} pending — admin review required</p>
                {pendingSubs.map(sub => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    expanded={expandedId === sub.id}
                    onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                    rejectReason={rejectReasons[sub.id] || ""}
                    onRejectReasonChange={val => setRejectReasons(prev => ({ ...prev, [sub.id]: val }))}
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
                    <div key={sub.id} className="p-4 border border-white/10 flex items-center justify-between gap-4" style={{ background: "#0d0d0d" }}>
                      <div>
                        <span className="display text-sm text-white/50">{sub.type}</span>
                        <p className="text-white/30 text-xs mt-0.5">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="sticker text-xs" style={{ color: sub.status.toUpperCase() === "APPROVED" ? "#CCFF00" : "#FF2400", borderColor: sub.status.toUpperCase() === "APPROVED" ? "#CCFF00" : "#FF2400" }}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODERATION ── */}
        {activeTab === "moderation" && (
          <div>
            <p className="text-white/40 text-sm mb-6">Claim and remove requests from the public.</p>
            {modLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : modRequests.length === 0 ? (
              <div className="text-center py-16">
                <Inbox size={36} className="mx-auto mb-4 text-white/20" />
                <p className="display text-xl text-white/30">INBOX EMPTY</p>
              </div>
            ) : (
              <div>
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
                {modRequests.filter(r => r.status.toUpperCase() !== "PENDING").length > 0 && (
                  <div>
                    <h3 className="display text-base text-white/30 mb-3">RESOLVED</h3>
                    <div className="space-y-2">
                      {modRequests.filter(r => r.status.toUpperCase() !== "PENDING").map(req => (
                        <div key={req.id} className="p-4 border border-white/10 flex items-center justify-between gap-4" style={{ background: "#0d0d0d" }}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="sticker text-xs flex-shrink-0" style={{ color: req.type === "CLAIM" ? "#00FFFF" : "#FF6600", borderColor: req.type === "CLAIM" ? "#00FFFF" : "#FF6600" }}>{req.type}</span>
                            <p className="display text-sm text-white/50 truncate">Event #{req.eventId}{req.eventTitle ? ` — ${req.eventTitle}` : ""}</p>
                          </div>
                          <span className="sticker text-xs flex-shrink-0" style={{ color: req.status.toUpperCase() === "APPROVED" ? "#CCFF00" : "#FF2400", borderColor: req.status.toUpperCase() === "APPROVED" ? "#CCFF00" : "#FF2400" }}>
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
              Edit any field on any event. Changes go live immediately.
            </p>
            {eventsLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : events.length === 0 ? (
              <p className="text-white/30 text-center py-12">No events found.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="border border-white/10" style={{ background: "#111" }}>
                    {/* Row */}
                    <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="display text-base text-white truncate">{ev.title}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {ev.venueName} · {ev.dayOfWeek} · {new Date(ev.dateStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="sticker text-xs" style={{ color: ev.status === "LIVE" ? "#CCFF00" : "#666", borderColor: ev.status === "LIVE" ? "#CCFF00" : "#333" }}>
                          {ev.status}
                        </span>
                        <button
                          onClick={() => claimableMutation.mutate({ id: ev.id, isClaimable: !ev.isClaimable })}
                          className="flex items-center gap-1 text-sm transition-all"
                          style={{ color: ev.isClaimable ? "#CCFF00" : "#444" }}
                        >
                          {ev.isClaimable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          <span className="display text-xs">{ev.isClaimable ? "CLAIMABLE" : "CLAIM OFF"}</span>
                        </button>
                        <button
                          onClick={() => editingId === ev.id ? setEditingId(null) : startEdit(ev)}
                          className="flex items-center gap-1 display text-xs px-3 py-1 border transition-all"
                          style={{
                            borderColor: editingId === ev.id ? "#FF00CC" : "#333",
                            color: editingId === ev.id ? "#FF00CC" : "#666",
                            background: "transparent",
                          }}
                        >
                          {editingId === ev.id ? <><X size={11} /> CANCEL</> : <><Pencil size={11} /> EDIT</>}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingId === ev.id && (
                      <form onSubmit={handleEditSave} className="border-t border-white/10 p-5 space-y-4" style={{ background: "#0d0d0d" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">TITLE</label>
                            <input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">VENUE NAME</label>
                            <input value={editForm.venueName || ""} onChange={e => setEditForm(f => ({ ...f, venueName: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">ADDRESS</label>
                            <input value={editForm.address || ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">NEIGHBORHOOD</label>
                            <input value={editForm.neighborhood || ""} onChange={e => setEditForm(f => ({ ...f, neighborhood: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">DAY</label>
                            <select value={editForm.dayOfWeek || ""} onChange={e => setEditForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["THU","FRI","SAT","SUN"].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">START TIME</label>
                            <input type="datetime-local" value={editForm.dateStart?.slice(0,16) || ""}
                              onChange={e => setEditForm(f => ({ ...f, dateStart: e.target.value + ":00" }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">END TIME</label>
                            <input type="datetime-local" value={editForm.dateEnd?.slice(0,16) || ""}
                              onChange={e => setEditForm(f => ({ ...f, dateEnd: e.target.value + ":00" }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">ADMISSION</label>
                            <select value={editForm.admission || "FREE"} onChange={e => setEditForm(f => ({ ...f, admission: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["FREE","TICKETED","DONATION","TBD"].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">AGE REQUIREMENT</label>
                            <select value={editForm.ageRequirement || "ALL_AGES"} onChange={e => setEditForm(f => ({ ...f, ageRequirement: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["ALL_AGES","18_PLUS","21_PLUS"].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">TICKET URL</label>
                            <input value={editForm.ticketUrl || ""} onChange={e => setEditForm(f => ({ ...f, ticketUrl: e.target.value || null }))}
                              placeholder="https://..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">POSTER IMAGE PATH</label>
                            <input value={editForm.posterImageUrl || ""} onChange={e => setEditForm(f => ({ ...f, posterImageUrl: e.target.value || null }))}
                              placeholder="/posters/filename.jpg" className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">STATUS</label>
                            <select value={editForm.status || "LIVE"} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["LIVE","HIDDEN","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">LAT / LNG</label>
                            <div className="flex gap-2">
                              <input type="number" step="any" value={editForm.lat ?? ""} onChange={e => setEditForm(f => ({ ...f, lat: Number(e.target.value) }))}
                                placeholder="45.52..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                              <input type="number" step="any" value={editForm.lng ?? ""} onChange={e => setEditForm(f => ({ ...f, lng: Number(e.target.value) }))}
                                placeholder="-122.67..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                            </div>
                          </div>
                          <div className="flex gap-6 items-center">
                            <label className="display text-xs text-white/40 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!editForm.isSexPositive} onChange={e => setEditForm(f => ({ ...f, isSexPositive: e.target.checked }))} />
                              SEX POSITIVE
                            </label>
                            <label className="display text-xs text-white/40 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!editForm.nudityOk} onChange={e => setEditForm(f => ({ ...f, nudityOk: e.target.checked }))} />
                              NUDITY OK
                            </label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">DESCRIPTION</label>
                            <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400 resize-y" />
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap pt-2">
                          <button type="submit" disabled={editEventMutation.isPending}
                            className="display text-sm px-6 py-2 border-2 disabled:opacity-50"
                            style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}>
                            {editEventMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="display text-sm px-6 py-2 border"
                            style={{ borderColor: "#333", color: "#666", background: "transparent" }}>
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── GIFTING ── */}
        {activeTab === "gifting" && (
          <div>
            <p className="text-white/40 text-sm mb-6">
              Review first-time gifting posts, handle reports, and change listing statuses.
            </p>
            {giftingLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : (
              <div className="space-y-8">
                <section>
                  <h3 className="display text-xl text-white mb-3">PENDING / REPORTED</h3>
                  {[...pendingGifting, ...(giftingAdmin.posts || []).filter((p: any) => p.reportCount > 0 && p.status !== "PENDING")].length === 0 ? (
                    <p className="text-white/30">No gifting items need review.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...pendingGifting, ...(giftingAdmin.posts || []).filter((p: any) => p.reportCount > 0 && p.status !== "PENDING")].map((post: any) => (
                        <div key={post.id} className="p-4 border border-white/10" style={{ background: "#111" }}>
                          <div className="flex justify-between gap-3 flex-wrap">
                            <div>
                              <span className="sticker text-xs" style={{ color: post.postType === "GIFT" ? "#CCFF00" : "#B451FF", borderColor: post.postType === "GIFT" ? "#CCFF00" : "#B451FF" }}>{post.postType === "ISO" ? "IN SEARCH OF" : post.postType}</span>
                              <p className="display text-lg text-white mt-2">{post.title}</p>
                              <p className="text-white/45 text-sm">{post.category} · {post.neighborhood} · {post.status} · {post.reportCount || 0} report(s)</p>
                              <p className="text-white/65 text-sm mt-2">{post.description}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap content-start">
                              <button className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => updateGiftingStatusMutation.mutate({ id: post.id, status: post.postType === "ISO" ? "LOOKING" : "OPEN" })}>APPROVE</button>
                              <button className="sticker" style={{ color: "#FF6600", borderColor: "#FF6600" }} onClick={() => updateGiftingStatusMutation.mutate({ id: post.id, status: "HIDDEN" })}>HIDE</button>
                              <button className="sticker" style={{ color: "#FF2400", borderColor: "#FF2400" }} onClick={() => updateGiftingStatusMutation.mutate({ id: post.id, status: "REMOVED" })}>REMOVE</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="display text-xl text-white mb-3">REPORTS</h3>
                  {pendingGiftingReports.length === 0 ? <p className="text-white/30">No open gifting reports.</p> : (
                    <div className="space-y-2">
                      {pendingGiftingReports.map((report: any) => (
                        <div key={report.id} className="p-4 border border-white/10 flex justify-between gap-3 flex-wrap" style={{ background: "#0d0d0d" }}>
                          <div>
                            <p className="display text-white">{report.postTitle}</p>
                            <p className="text-white/60 text-sm">{report.reason}</p>
                          </div>
                          <button className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => resolveGiftingReportMutation.mutate({ id: report.id })}>RESOLVE</button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="display text-xl text-white mb-3">ALL GIFTING POSTS</h3>
                  <div className="space-y-2">
                    {(giftingAdmin.posts || []).map((post: any) => (
                      <div key={post.id} className="p-3 border border-white/10 flex justify-between gap-3 flex-wrap" style={{ background: "#0b0b0b" }}>
                        <div>
                          <p className="display text-white/80">{post.title}</p>
                          <p className="text-white/35 text-xs">{post.postType === "ISO" ? "IN SEARCH OF" : post.postType} · {post.status} · {post.displayName || post.username}</p>
                        </div>
                        <select value={post.status} onChange={e => updateGiftingStatusMutation.mutate({ id: post.id, status: e.target.value })}
                          className="px-3 py-2 bg-black text-white border border-white/20">
                          {["OPEN","LOOKING","PENDING","POSTER_CHOOSING","PICKUP_PENDING","OFFER_PENDING","GIFTED","FOUND","EXPIRED","HIDDEN","REMOVED"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <p className="text-white/40 text-sm">
              Soft launch tech feedback from the footer form. Use this for bugs, mobile layout issues, wrong event data, login issues, and confusing flows.
            </p>
            {feedbackLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : feedback.length === 0 ? (
              <div className="border border-white/10 p-6 text-white/35">No open feedback right now.</div>
            ) : (
              feedback.map((item: any) => (
                <div key={item.id} className="border border-white/10 bg-black/40 p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="sticker text-xs" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>{item.category}</span>
                    <span
                      className="sticker text-xs"
                      style={{
                        color: item.severity === "BLOCKER" || item.severity === "HIGH" ? "#FF2400" : "#CCFF00",
                        borderColor: item.severity === "BLOCKER" || item.severity === "HIGH" ? "#FF2400" : "#CCFF00",
                      }}
                    >
                      {item.severity}
                    </span>
                    <span className="text-white/30 text-xs">{new Date(item.createdAt || item.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-white/90 text-sm whitespace-pre-wrap mb-3">{item.message}</p>
                  {item.steps && <p className="text-white/55 text-xs whitespace-pre-wrap mb-3">Steps / notes: {item.steps}</p>}
                  <div className="text-white/35 text-xs space-y-1 mb-4">
                    <div>Page: {item.pageUrl || item.page_url}</div>
                    {item.email && <div>Email: {item.email}</div>}
                    {(item.userAgent || item.user_agent) && <div>User agent: {item.userAgent || item.user_agent}</div>}
                  </div>
                  <button className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }} onClick={() => resolveFeedbackMutation.mutate(item.id)}>
                    MARK RESOLVED
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Submission Card ──────────────────────────────────────────────────────────
function SubmissionCard({ sub, expanded, onToggle, rejectReason, onRejectReasonChange, onApprove, onReject, approving, rejecting }: {
  sub: Submission; expanded: boolean; onToggle: () => void;
  rejectReason: string; onRejectReasonChange: (v: string) => void;
  onApprove: () => void; onReject: () => void; approving: boolean; rejecting: boolean;
}) {
  let approvals: string[] = [];
  try { approvals = JSON.parse(sub.approvals || "[]"); } catch {}
  const approvalCount = approvals.length;
  const details: Record<string, any> = {
    eventId: sub.eventId,
    title: sub.title,
    venue: sub.venueName,
    day: sub.dayOfWeek,
    start: sub.dateStart,
    end: sub.dateEnd,
    submitter: sub.submitterName,
    email: sub.submitterEmail,
    organization: sub.submitterOrg,
    claimReason: sub.claimReason,
    description: sub.description,
  };

  return (
    <div className="border-2 transition-all" style={{ background: "#111", borderColor: expanded ? "#FF00CC" : "#222" }}>
      <button className="w-full text-left p-5 flex items-start justify-between gap-4" onClick={onToggle}>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="sticker text-xs" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>{sub.type}</span>
            {approvalCount > 0 && <span className="sticker text-xs" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>{approvalCount}/2 APPROVED</span>}
          </div>
          <p className="display text-xl text-white">{sub.title || `Submission #${sub.id}`}</p>
          <p className="text-white/40 text-xs mt-1">{sub.submitterName} · {sub.submitterEmail}</p>
          <p className="text-white/30 text-xs mt-1 flex items-center gap-1">
            <Clock size={10} />
            {new Date(sub.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <ChevronDown size={18} className="text-white/30 flex-shrink-0 mt-1 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">
          <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.entries(details).filter(([, val]) => val !== null && val !== undefined && val !== "").map(([key, val]) => (
              <div key={key} className="bg-black/30 p-2 border border-white/10">
                <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{key}</p>
                <p className="text-white text-sm truncate">{String(val)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="display text-xs text-white/30 block mb-1">REJECT REASON (optional)</label>
              <input type="text" value={rejectReason} onChange={e => onRejectReasonChange(e.target.value)}
                placeholder="Reason for rejection..." className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-red-500" />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={onApprove} disabled={approving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}>
                <CheckCircle size={14} />{approving ? "APPROVING..." : "APPROVE"}
              </button>
              <button onClick={onReject} disabled={rejecting}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ borderColor: "#FF2400", color: "#FF2400" }}>
                <XCircle size={14} />{rejecting ? "REJECTING..." : "REJECT"}
              </button>
            </div>
            {approvalCount === 1 && <p className="text-white/30 text-xs">1 of 2 admins approved — needs one more approval to go live.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Moderation Card ──────────────────────────────────────────────────────────
function ModerationCard({ req, expanded, onToggle, note, onNoteChange, onApprove, onReject, resolving }: {
  req: ModerationRequest; expanded: boolean; onToggle: () => void;
  note: string; onNoteChange: (v: string) => void;
  onApprove: () => void; onReject: () => void; resolving: boolean;
}) {
  const isClaim = req.type === "CLAIM";
  const accentColor = isClaim ? "#00FFFF" : "#FF6600";

  return (
    <div className="border-2 transition-all" style={{ background: "#111", borderColor: expanded ? accentColor : "#222" }}>
      <button className="w-full text-left p-5 flex items-start justify-between gap-4" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="sticker text-xs" style={{ color: accentColor, borderColor: accentColor }}>{req.type}</span>
            {!isClaim && <span className="sticker text-xs flex items-center gap-1" style={{ color: "#FF6600", borderColor: "#FF6600" }}><AlertTriangle size={9} /> REMOVE</span>}
          </div>
          <p className="display text-lg text-white">{req.eventTitle || `Event #${req.eventId}`}</p>
          <p className="text-white/40 text-xs mt-1">{req.requesterName} · {req.requesterEmail}</p>
        </div>
        <ChevronDown size={18} className="text-white/30 flex-shrink-0 mt-1 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">
          {req.proof && (
            <div className="mb-4 bg-black/30 p-3 border border-white/10">
              <p className="text-white/30 text-xs uppercase tracking-wide mb-1">{isClaim ? "PROOF OF OWNERSHIP" : "REASON FOR REMOVAL"}</p>
              <p className="text-white/80 text-sm">{req.proof}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="display text-xs text-white/30 block mb-1">ADMIN NOTE (optional)</label>
              <input type="text" value={note} onChange={e => onNoteChange(e.target.value)}
                placeholder="Internal note..." className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={onApprove} disabled={resolving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}>
                <CheckCircle size={14} />{resolving ? "PROCESSING..." : isClaim ? "GRANT CLAIM" : "APPROVE REMOVAL"}
              </button>
              <button onClick={onReject} disabled={resolving}
                className="display text-base px-6 py-2 border-2 transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ borderColor: "#FF2400", color: "#FF2400" }}>
                <XCircle size={14} />{resolving ? "PROCESSING..." : "DENY"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
