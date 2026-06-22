import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

type Message = {
  id: number;
  fromUserId: number;
  toUserId: number;
  subject: string;
  body: string;
  isRead: boolean;
  threadId: string;
  contextType?: string;
  contextLabel?: string | null;
  createdAt: string;
  from_username?: string;
  from_display_name?: string;
  to_username?: string;
  to_display_name?: string;
};

export default function Inbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: inbox = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: () => fetch("/api/messages/inbox").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: sent = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/sent"],
    queryFn: () => fetch("/api/messages/sent").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: thread = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", activeThread?.threadId],
    queryFn: () => fetch(`/api/messages/thread/${activeThread!.threadId}`).then(r => r.ok ? r.json() : []),
    enabled: !!activeThread,
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => fetch(`/api/messages/thread/${activeThread!.threadId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", activeThread?.threadId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (threadId: string) => fetch(`/api/messages/thread/${threadId}`, { method: "DELETE" }),
    onSuccess: () => {
      setActiveThread(null);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  if (!user) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div className="display" style={{ fontSize: "2rem", color: "#fff" }}>INBOX</div>
        <p style={{ color: "#666" }}>Log in to view your messages.</p>
        <AuthModal onClose={() => {}} />
      </div>
    );
  }

  const msgs = tab === "inbox" ? inbox : sent;
  const unreadCount = inbox.filter(m => !m.isRead).length;

  const openThread = (msg: Message) => {
    setActiveThread(msg);
    if (!msg.isRead && tab === "inbox") {
      fetch(`/api/messages/${msg.id}/read`, { method: "PUT" }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
        queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      });
    }
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <div className="inbox-hero">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "42px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1 }}>
            <div>
              <h1 className="display page-hero-title" style={{ color: "#CCFF00" }}>INBOX</h1>
              <p style={{ color: "#bbb", fontSize: "0.9rem", marginTop: 6, maxWidth: 560 }}>
                Private threads from missed connections, Pride Work posts, event hosts, and check-ins.
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", background: "rgba(0,0,0,0.65)" }}>{unreadCount} UNREAD</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #1a1a1a", marginBottom: 24 }}>
          {(["inbox", "sent"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setActiveThread(null); }} style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "10px 20px", border: "none", background: "none",
              color: tab === t ? "#CCFF00" : "#555", cursor: "pointer",
              borderBottom: tab === t ? "2px solid #CCFF00" : "2px solid transparent",
              marginBottom: -2,
            }}>{t === "inbox" ? `RECEIVED${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "SENT"}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: activeThread ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr", gap: 16 }}>
          <div>
            {msgs.length === 0 ? (
              <div style={{ color: "#444", padding: "24px 0" }}>No scoped messages yet.</div>
            ) : msgs.map(msg => (
              <button key={msg.id} onClick={() => openThread(msg)} style={{
                width: "100%", textAlign: "left", padding: "14px 18px", border: "none", borderBottom: "1px solid #111",
                cursor: "pointer", background: activeThread?.id === msg.id ? "#0d0d0d" : "transparent",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                {!msg.isRead && tab === "inbox" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF00CC", marginTop: 6, flexShrink: 0 }} />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ display: "block", fontSize: "0.88rem", color: "#fff", marginBottom: 3 }}>
                    {msg.subject || "(no subject)"}
                  </span>
                  {msg.contextLabel && <span style={{ display: "block", fontSize: "0.72rem", color: "#00FFFF", marginBottom: 3 }}>{msg.contextLabel}</span>}
                  <span style={{ display: "block", fontSize: "0.78rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tab === "inbox" ? `from ${msg.from_display_name || msg.from_username || "someone"}` : `to ${msg.to_display_name || msg.to_username || "someone"}`} · {msg.body.substring(0, 70)}{msg.body.length > 70 ? "..." : ""}
                  </span>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "#333", marginTop: 4 }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {activeThread && (
            <div style={{ background: "#060606", border: "1px solid #1a1a1a", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="display" style={{ fontSize: "1rem", color: "#fff" }}>{activeThread.subject || "(no subject)"}</div>
                  {activeThread.contextType && (
                    <div style={{ color: "#555", fontSize: "0.75rem", marginTop: 4 }}>{activeThread.contextType.replaceAll("_", " ")}</div>
                  )}
                </div>
                <button onClick={() => deleteMutation.mutate(activeThread.threadId)} style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: "5px 10px", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
              <div style={{ maxHeight: 330, overflowY: "auto", marginBottom: 16 }}>
                {thread.map(m => (
                  <div key={m.id} style={{
                    marginBottom: 12, padding: "10px 14px",
                    background: m.fromUserId === user.id ? "#0a0a0a" : "#111",
                    borderLeft: `3px solid ${m.fromUserId === user.id ? "#CCFF00" : "#555"}`,
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: 4 }}>
                      {m.fromUserId === user.id ? "You" : (m.from_display_name || m.from_username || "someone")} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div style={{ color: "#ccc", fontSize: "0.88rem", lineHeight: 1.5 }}>{m.body}</div>
                  </div>
                ))}
              </div>
              <textarea
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
