import { useState, useEffect, useCallback, useId } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import AuthModal from "@/components/AuthModal";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import UserAvatar from "@/components/UserAvatar";
import { counterpartyAvatar, senderAvatar } from "@/lib/inboxAvatar";
import { EVENT_TALENT_ROLE_LABELS, type EventTalentRole } from "@shared/eventTalent";

function inboxContextBadge(contextType?: string | null) {
  if (contextType === "EVENT_TALENT_REQUEST") return "LINEUP REQUEST";
  if (contextType === "MISSED_CONNECTION") return "MISSED CONNECTION";
  if (contextType === "HOST_MESSAGE") return "HOST UPDATE";
  return null;
}

function threadFromQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("thread")?.trim() || "";
}

function threadIdOf(msg: { threadId?: string; thread_id?: string } | null | undefined): string {
  return (msg?.threadId || msg?.thread_id || "").trim();
}

function isMessageRead(msg: { isRead?: boolean; is_read?: boolean }): boolean {
  return Boolean(msg.isRead ?? msg.is_read);
}

type Message = {
  id: number;
  fromUserId: number;
  toUserId: number;
  subject: string;
  body: string;
  isRead: boolean;
  threadId: string;
  contextType?: string;
  contextId?: number | null;
  contextLabel?: string | null;
  createdAt: string;
  from_username?: string;
  from_display_name?: string;
  from_photo_url?: string | null;
  from_avatar_choice?: number | null;
  from_avatar_ring?: string | null;
  to_username?: string;
  to_display_name?: string;
  to_photo_url?: string | null;
  to_avatar_choice?: number | null;
  to_avatar_ring?: string | null;
  masked?: boolean;
};

type ThreadReveal = {
  posterRevealed: boolean;
  replierRevealed: boolean;
  bothRevealed: boolean;
  iAmPoster?: boolean;
  iRevealed: boolean;
};

type ThreadPayload = {
  messages: Message[];
  reveal: ThreadReveal | null;
};

export default function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const replyFieldId = useId();
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [pendingThreadId, setPendingThreadId] = useState(threadFromQuery);

  usePageSeo(
    "Inbox — PDX Pride Guide",
    "Private messages from missed connections, Pride Werk, event hosts, and check-ins.",
  );

  const { data: inbox = [], isLoading: inboxLoading, isError: inboxError, refetch: refetchInbox } = useQuery<Message[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: async () => {
      const r = await fetch("/api/messages/inbox", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load inbox");
      return r.json();
    },
    enabled: !!user,
  });

  const { data: sent = [], isLoading: sentLoading, isError: sentError, refetch: refetchSent } = useQuery<Message[]>({
    queryKey: ["/api/messages/sent"],
    queryFn: async () => {
      const r = await fetch("/api/messages/sent", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load sent messages");
      return r.json();
    },
    enabled: !!user,
  });

  const { data: threadPayload, isError: threadError } = useQuery<ThreadPayload>({
    queryKey: ["/api/messages/thread", threadIdOf(activeThread)],
    queryFn: async () => {
      const r = await fetch(`/api/messages/thread/${threadIdOf(activeThread)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load thread");
      return r.json();
    },
    enabled: !!activeThread,
  });
  const thread = threadPayload?.messages ?? [];
  const threadReveal = threadPayload?.reveal ?? null;

  const talentRequestId = activeThread?.contextType === "EVENT_TALENT_REQUEST" ? activeThread.contextId : null;

  const { data: talentRequest } = useQuery({
    queryKey: ["/api/talent-request", talentRequestId],
    queryFn: () => fetch(`/api/talent-request/${talentRequestId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
    enabled: !!talentRequestId && !!user,
  });

  const approveTalentMutation = useMutation({
    mutationFn: async () => {
      if (!talentRequestId) throw new Error("Missing request");
      const res = await fetch(`/api/talent-request/${talentRequestId}/approve`, { method: "POST", credentials: "include" });
      const p = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(p.error || "Approve failed");
      return p;
    },
    onSuccess: () => {
      toast({ title: "Lineup approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      setActiveThread(null);
      setLocation("/inbox");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const denyTalentMutation = useMutation({
    mutationFn: async () => {
      if (!talentRequestId) throw new Error("Missing request");
      const res = await fetch(`/api/talent-request/${talentRequestId}/reject`, { method: "POST", credentials: "include" });
      const p = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(p.error || "Deny failed");
      return p;
    },
    onSuccess: () => {
      toast({ title: "Lineup declined" });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      setActiveThread(null);
      setLocation("/inbox");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => fetch(`/api/messages/thread/${threadIdOf(activeThread)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    }).then(r => {
      if (!r.ok) throw new Error("Reply failed");
      return r.json();
    }),
    onSuccess: () => {
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadIdOf(activeThread)] });
    },
    onError: () => toast({ title: "Reply failed", description: "Could not send your message.", variant: "destructive" }),
  });

  const revealMutation = useMutation({
    mutationFn: () => fetch(`/api/messages/thread/${threadIdOf(activeThread)}/reveal`, {
      method: "POST",
      credentials: "include",
    }).then(async r => {
      if (!r.ok) throw new Error("Reveal failed");
      return r.json();
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadIdOf(activeThread)] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      toast({ title: "Identity shared", description: "They'll see who you are once they reveal too." });
    },
    onError: () => toast({ title: "Could not reveal", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const r = await fetch(`/api/messages/thread/${threadId}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setActiveThread(null);
      setLocation("/inbox");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
    onError: () => toast({ title: "Delete failed", description: "Could not remove this thread.", variant: "destructive" }),
  });

  const syncThreadUrl = useCallback((threadId: string | null) => {
    setLocation(threadId ? `/inbox?thread=${encodeURIComponent(threadId)}` : "/inbox");
  }, [setLocation]);

  const openThread = useCallback((msg: Message, sourceTab: "inbox" | "sent") => {
    setActiveThread(msg);
    syncThreadUrl(threadIdOf(msg));
    if (!isMessageRead(msg) && sourceTab === "inbox") {
      fetch(`/api/messages/${msg.id}/read`, { method: "PUT", credentials: "include" }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
        queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      });
    }
  }, [syncThreadUrl]);

  useEffect(() => {
    if (!user || !pendingThreadId) return;
    const fromInbox = inbox.find(m => threadIdOf(m) === pendingThreadId);
    if (fromInbox) {
      setTab("inbox");
      openThread(fromInbox, "inbox");
      setPendingThreadId("");
      return;
    }
    const fromSent = sent.find(m => threadIdOf(m) === pendingThreadId);
    if (fromSent) {
      setTab("sent");
      openThread(fromSent, "sent");
      setPendingThreadId("");
    }
  }, [user, pendingThreadId, inbox, sent, openThread]);

  useEffect(() => {
    const onPopState = () => {
      const threadId = threadFromQuery();
      if (!threadId) {
        setActiveThread(null);
        return;
      }
      setPendingThreadId(threadId);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!user) {
    return (
      <div className="zine-page inbox-page board-page" style={{ minHeight: "100vh" }}>
        <PageHero
          titleLine1="INBOX"
          titleLine1Accent="lime"
          bgImage="/motifs/hero-inbox.jpg"
          bgPosition="center 35%"
        />
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 24px 80px", textAlign: "center" }}>
          <p style={{ color: "#9d9a92", marginBottom: 24, lineHeight: 1.6 }}>
            Log in to read private threads from missed connections, Pride Werk, event hosts, and check-ins.
          </p>
          <button type="button" className="btn-neon" onClick={() => setShowAuth(true)}>
            LOG IN / JOIN
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  const msgs = tab === "inbox" ? inbox : sent;
  const msgsLoading = tab === "inbox" ? inboxLoading : sentLoading;
  const msgsError = tab === "inbox" ? inboxError : sentError;
  const refetchMsgs = tab === "inbox" ? refetchInbox : refetchSent;
  const unreadCount = inbox.filter(m => !isMessageRead(m)).length;

  const closeThread = () => {
    setActiveThread(null);
    syncThreadUrl(null);
  };

  const handleDeleteThread = (threadId: string) => {
    if (!window.confirm("Delete this thread from your inbox? This cannot be undone.")) return;
    deleteMutation.mutate(threadId);
  };

  return (
    <div className="zine-page inbox-page board-page" style={{ minHeight: "100vh" }}>
      <PageHero
        titleLine1="INBOX"
        titleLine1Accent="lime"
        bgImage="/motifs/hero-inbox.jpg"
        bgPosition="center 35%"
      />
      <ScrollReveal>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 24px 48px", position: "relative", zIndex: 1 }}>
        <p className="inbox-page-lede">
          Private threads from missed connections, Pride Werk, event hosts, and check-ins.
          {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
        </p>
        <div role="tablist" aria-label="Message folders" style={{ display: "flex", borderBottom: "2px solid #1a1a1a", marginBottom: 24 }}>
          {(["inbox", "sent"] as const).map(t => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              aria-controls={`inbox-panel-${t}`}
              id={`inbox-tab-${t}`}
              onClick={() => { setTab(t); closeThread(); }}
              style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "10px 20px", border: "none", background: "none",
              color: tab === t ? "#CCFF00" : "#555", cursor: "pointer",
              borderBottom: tab === t ? "2px solid #CCFF00" : "2px solid transparent",
              marginBottom: -2,
            }}>{t === "inbox" ? `RECEIVED${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "SENT"}</button>
          ))}
        </div>

        <div className={`inbox-layout${activeThread ? " inbox-layout--split" : ""}`}>
          <div
            className="inbox-list-pane"
            role="tabpanel"
            id={`inbox-panel-${tab}`}
            aria-labelledby={`inbox-tab-${tab}`}
          >
            {msgsLoading ? (
              <BoardLoadingState label="Loading messages" />
            ) : msgsError ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <p style={{ color: "#fff", marginBottom: 8 }}>Could not load messages.</p>
                <button className="btn-neon" style={{ fontSize: "0.75rem", padding: "8px 14px" }} onClick={() => refetchMsgs()}>
                  TRY AGAIN
                </button>
              </div>
            ) : msgs.length === 0 ? (
              <div style={{ color: "#9d9a92", padding: "24px 0" }}>No messages yet.</div>
            ) : msgs.map(msg => {
              const party = counterpartyAvatar(msg, tab);
              return (
              <button
                key={msg.id}
                type="button"
                aria-current={threadIdOf(activeThread) === threadIdOf(msg) ? "true" : undefined}
                onClick={() => openThread(msg, tab)}
                style={{
                width: "100%", textAlign: "left", padding: "14px 18px", border: "none", borderBottom: "1px solid #111",
                cursor: "pointer", background: threadIdOf(activeThread) === threadIdOf(msg) ? "#0d0d0d" : "transparent",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span className="inbox-list-avatar" style={{ position: "relative", flexShrink: 0 }}>
                  <UserAvatar
                    photoUrl={party.photoUrl}
                    avatarChoice={party.avatarChoice ?? undefined}
                    avatarRing={party.avatarRing}
                    displayName={party.displayName ?? undefined}
                    username={party.username ?? undefined}
                    size={40}
                  />
                  {!isMessageRead(msg) && tab === "inbox" && (
                    <span style={{
                      position: "absolute", top: -1, right: -1, width: 10, height: 10,
                      borderRadius: "50%", background: "#FF00CC", border: "2px solid #000",
                    }} />
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ display: "block", fontSize: "0.88rem", color: "#fff", marginBottom: 3 }}>
                    {msg.subject || "(no subject)"}
                  </span>
                  {inboxContextBadge(msg.contextType) && (
                    <span style={{ display: "inline-block", fontSize: "0.62rem", color: "var(--neon-magenta)", border: "1px solid var(--neon-magenta)", padding: "2px 6px", marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
                      {inboxContextBadge(msg.contextType)}
                    </span>
                  )}
                  {msg.contextLabel && <span style={{ display: "block", fontSize: "0.72rem", color: "#00FFFF", marginBottom: 3 }}>{msg.contextLabel}</span>}
                  <span style={{ display: "block", fontSize: "0.78rem", color: "#8c8980", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tab === "inbox" ? `from ${msg.from_display_name || msg.from_username || "someone"}` : `to ${msg.to_display_name || msg.to_username || "someone"}`} · {msg.body.substring(0, 70)}{msg.body.length > 70 ? "..." : ""}
                  </span>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "#6f736c", marginTop: 4 }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </span>
              </button>
            );
            })}
          </div>

          {activeThread && (
            <div className="inbox-thread-pane" role="region" aria-label="Message thread" style={{ background: "#060606", border: "1px solid #1a1a1a", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="display" style={{ fontSize: "1rem", color: "#fff" }}>{activeThread.subject || "(no subject)"}</div>
                  {inboxContextBadge(activeThread.contextType) && (
                    <span style={{ display: "inline-block", fontSize: "0.62rem", color: "var(--neon-magenta)", border: "1px solid var(--neon-magenta)", padding: "2px 6px", marginTop: 6, fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
                      {inboxContextBadge(activeThread.contextType)}
                    </span>
                  )}
                  {activeThread.contextLabel && (
                    <div style={{ color: "#00FFFF", fontSize: "0.75rem", marginTop: 6 }}>{activeThread.contextLabel}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="inbox-back-btn"
                    onClick={closeThread}
                    style={{ background: "transparent", border: "1px solid #333", color: "#bdbab2", padding: "5px 10px", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button type="button" onClick={() => handleDeleteThread(threadIdOf(activeThread))} disabled={deleteMutation.isPending || !threadIdOf(activeThread)} style={{ background: "transparent", border: "1px solid #333", color: "#8c8980", padding: "5px 10px", cursor: "pointer", opacity: deleteMutation.isPending ? 0.5 : 1 }}>
                    Delete
                  </button>
                </div>
              </div>
              {activeThread.contextType === "EVENT_TALENT_REQUEST" && talentRequest?.status === "PENDING" && (
                <div style={{ marginBottom: 14, padding: "12px 14px", background: "#0d0d0d", border: "2px solid var(--neon-cyan)" }}>
                  <div className="display" style={{ fontSize: "0.78rem", color: "var(--neon-cyan)", marginBottom: 8 }}>LINEUP REQUEST</div>
                  <p style={{ fontSize: "0.82rem", color: "#ccc", lineHeight: 1.5, marginBottom: 12 }}>
                    {talentRequest.displayName || talentRequest.username} wants{" "}
                    <strong>{EVENT_TALENT_ROLE_LABELS[talentRequest.role as EventTalentRole] || talentRequest.role}</strong> on{" "}
                    <span style={{ color: "#00FFFF" }}>{talentRequest.eventTitle}</span>.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => approveTalentMutation.mutate()} disabled={approveTalentMutation.isPending}
                      style={{ ...btnStyle, marginTop: 0, opacity: approveTalentMutation.isPending ? 0.5 : 1 }}>
                      {approveTalentMutation.isPending ? "APPROVING..." : "APPROVE LINEUP →"}
                    </button>
                    <button type="button" onClick={() => denyTalentMutation.mutate()} disabled={denyTalentMutation.isPending}
                      style={{ ...btnStyle, marginTop: 0, background: "transparent", color: "#FF2400", borderColor: "#FF2400", opacity: denyTalentMutation.isPending ? 0.5 : 1 }}>
                      {denyTalentMutation.isPending ? "DECLINING..." : "DECLINE"}
                    </button>
                  </div>
                </div>
              )}
              {activeThread.contextType === "MISSED_CONNECTION" && threadReveal && (
                <div style={{ marginBottom: 14, padding: "10px 12px", background: "#0d0d0d", border: "1px solid #2a2a2a", fontSize: "0.78rem", color: "#9d9a92", lineHeight: 1.5 }}>
                  {threadReveal.bothRevealed ? (
                    <span style={{ color: "#CCFF00" }}>Both of you revealed — real names show in this thread.</span>
                  ) : threadReveal.iRevealed ? (
                    <span>You're revealed. Waiting for them to reveal before names appear.</span>
                  ) : (
                    <span>Missed connection threads stay anonymous until you both choose to reveal.</span>
                  )}
                  {!threadReveal.bothRevealed && !threadReveal.iRevealed && (
                    <button
                      type="button"
                      onClick={() => revealMutation.mutate()}
                      disabled={revealMutation.isPending}
                      className="display"
                      style={{ display: "block", marginTop: 10, background: "#FF00CC", color: "#000", border: "none", padding: "7px 14px", cursor: "pointer", fontSize: "0.75rem", opacity: revealMutation.isPending ? 0.55 : 1 }}
                    >
                      {revealMutation.isPending ? "REVEALING..." : "REVEAL MYSELF"}
                    </button>
                  )}
                </div>
              )}
              <div style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto", marginBottom: 16 }}>
                {threadError ? (
                  <p style={{ color: "#FF6600", fontSize: "0.85rem" }}>Could not load this thread.</p>
                ) : thread.map(m => {
                  const isSelf = m.fromUserId === user.id;
                  const avatar = isSelf
                    ? {
                        photoUrl: user.photoUrl,
                        avatarChoice: user.avatarChoice,
                        avatarRing: user.avatarRing,
                        displayName: user.displayName,
                        username: user.username,
                      }
                    : senderAvatar(m);
                  return (
                  <div key={m.id} style={{
                    marginBottom: 12, padding: "10px 14px",
                    background: isSelf ? "#0a0a0a" : "#111",
                    borderLeft: `3px solid ${isSelf ? "#CCFF00" : "#555"}`,
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <UserAvatar
                      photoUrl={avatar.photoUrl}
                      avatarChoice={avatar.avatarChoice ?? undefined}
                      avatarRing={avatar.avatarRing}
                      displayName={avatar.displayName ?? undefined}
                      username={avatar.username ?? undefined}
                      size={32}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: 4 }}>
                        {isSelf ? "You" : (m.from_display_name || m.from_username || "someone")} · {new Date(m.createdAt).toLocaleString()}
                      </div>
                      <div style={{ color: "#ccc", fontSize: "0.88rem", lineHeight: 1.5 }}>{m.body}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
              <label htmlFor={replyFieldId} className="sr-only">Reply to thread</label>
              <textarea
                id={replyFieldId}
                style={inputStyle}
                placeholder="Write a private reply..."
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
              />
              <button onClick={() => replyMutation.mutate(replyBody)} disabled={!replyBody.trim() || replyMutation.isPending} style={{ ...btnStyle, marginTop: 10, opacity: !replyBody.trim() || replyMutation.isPending ? 0.5 : 1 }}>
                {replyMutation.isPending ? "SENDING..." : "REPLY →"}
              </button>
            </div>
          )}
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#0d0d0d", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box", resize: "vertical",
};

const btnStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: "#CCFF00", color: "#000", border: "2px solid #000",
  padding: "10px 20px", cursor: "pointer",
};
