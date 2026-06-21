import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function Inbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendError, setSendError] = useState("");

  const { data: inbox = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: () => fetch("/api/messages/inbox").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: sent = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/sent"],
    queryFn: () => fetch("/api/messages/sent").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: thread = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/thread", activeThread?.threadId],
    queryFn: () => fetch(`/api/messages/thread/${activeThread.threadId}`).then(r => r.json()),
    enabled: !!activeThread,
  });

  const sendMsg = useMutation({
    mutationFn: (body: any) => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      setReplyBody(""); setShowCompose(false);
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
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
  const unreadCount = inbox.filter((m: any) => !m.isRead).length;

  const openThread = (msg: any) => {
    setActiveThread(msg);
    if (!msg.isRead && tab === "inbox") {
      fetch(`/api/messages/${msg.id}/read`, { method: "PUT" });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !activeThread) return;
    const toId = tab === "inbox" ? activeThread.fromUserId : activeThread.toUserId;
    await sendMsg.mutateAsync({
      toUserId: toId,
      subject: `Re: ${activeThread.subject}`,
      body: replyBody,
      threadId: activeThread.threadId,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", activeThread.threadId] });
  };

  const handleCompose = async () => {
    setSendError("");
    if (!composeTo || !composeBody) { setSendError("Recipient and message required."); return; }
    // Look up user by username
    const userRes = await fetch(`/api/users/by-username/${composeTo}`);
    if (!userRes.ok) { setSendError("User not found."); return; }
    const toUser = await userRes.json();
    await sendMsg.mutateAsync({ toUserId: toUser.id, subject: composeSubject, body: composeBody });
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 className="display" style={{ fontSize: "2.2rem", color: "#CCFF00" }}>INBOX</h1>
            {unreadCount > 0 && (
              <span style={{
                background: "#FF00CC", color: "#fff", borderRadius: "50%",
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.75rem",
              }}>{unreadCount}</span>
            )}
          </div>
          <button onClick={() => setShowCompose(true)} style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            background: "#CCFF00", color: "#000", border: "2px solid #000",
            padding: "10px 20px", cursor: "pointer", boxShadow: "3px 3px 0 #000",
          }}>+ NEW MESSAGE</button>
        </div>

        {/* Compose modal */}
        {showCompose && (
          <div style={{ marginBottom: 28, background: "#0a0a0a", border: "2px solid #CCFF00", padding: "24px 28px" }}>
            <h3 className="display" style={{ color: "#CCFF00", fontSize: "1rem", marginBottom: 16 }}>NEW MESSAGE</h3>
            <label style={labelStyle}>TO (USERNAME)</label>
            <input style={inputStyle} value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="their_username" />
            <label style={labelStyle}>SUBJECT</label>
            <input style={inputStyle} value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="What's up?" />
            <label style={labelStyle}>MESSAGE</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." />
            {sendError && <div style={{ color: "#FF2400", fontSize: "0.82rem", marginTop: 8 }}>{sendError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleCompose} style={btnStyle}>SEND →</button>
              <button onClick={() => setShowCompose(false)} style={{ ...btnStyle, background: "transparent", color: "#555", border: "2px solid #333" }}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Tabs */}
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

        <div style={{ display: "grid", gridTemplateColumns: activeThread ? "1fr 1fr" : "1fr", gap: 16 }}>
          {/* Message list */}
          <div>
            {msgs.length === 0 ? (
              <div style={{ color: "#444", padding: "24px 0" }}>No messages yet.</div>
            ) : (
              msgs.map((msg: any) => (
                <div key={msg.id} onClick={() => openThread(msg)} style={{
                  padding: "14px 18px", borderBottom: "1px solid #111",
                  cursor: "pointer", background: activeThread?.id === msg.id ? "#0d0d0d" : "transparent",
                  display: "flex", gap: 12, alignItems: "flex-start",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => { if (activeThread?.id !== msg.id) e.currentTarget.style.background = "#080808"; }}
                  onMouseLeave={e => { if (activeThread?.id !== msg.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {!msg.isRead && tab === "inbox" && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF00CC", marginTop: 6, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.88rem", color: "#fff", marginBottom: 2 }}>
                      {msg.subject || "(no subject)"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tab === "inbox" ? `from user #${msg.fromUserId}` : `to user #${msg.toUserId}`} · {msg.body.substring(0, 60)}{msg.body.length > 60 ? "..." : ""}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#333", marginTop: 4 }}>
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Thread view */}
          {activeThread && (
            <div style={{ background: "#060606", border: "1px solid #1a1a1a", padding: "20px" }}>
              <div className="display" style={{ fontSize: "1rem", color: "#fff", marginBottom: 16 }}>
                {activeThread.subject || "(no subject)"}
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
                {thread.map((m: any) => (
                  <div key={m.id} style={{
                    marginBottom: 12, padding: "10px 14px",
                    background: m.fromUserId === user.id ? "#0a0a0a" : "#111",
                    borderLeft: `3px solid ${m.fromUserId === user.id ? "#CCFF00" : "#555"}`,
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: 4 }}>
                      {m.fromUserId === user.id ? "You" : `User #${m.fromUserId}`} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div style={{ color: "#ccc", fontSize: "0.88rem", lineHeight: 1.5 }}>{m.body}</div>
                  </div>
                ))}
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="Write a reply..."
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
              />
              <button onClick={handleReply} style={{ ...btnStyle, marginTop: 10 }}>REPLY →</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-display)", fontWeight: 900,
  fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "#666", marginBottom: 6, marginTop: 14,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#0d0d0d", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: "#CCFF00", color: "#000", border: "2px solid #000",
  padding: "10px 20px", cursor: "pointer",
};
