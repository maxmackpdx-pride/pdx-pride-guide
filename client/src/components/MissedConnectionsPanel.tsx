import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "./AuthModal";
import type { Event } from "@shared/schema";

export type MissedConnectionPost = {
  id: number;
  title: string;
  body: string;
  dayOfWeek?: string | null;
  venueHint?: string | null;
  eventId?: number | null;
  eventTitle?: string | null;
  eventVenue?: string | null;
  eventDay?: string | null;
  status: string;
  createdAt: string;
  isMine?: boolean;
  anonymous?: boolean;
};

type PostableEvent = Pick<Event, "id" | "title" | "venueName" | "dayOfWeek" | "dateStart">;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#000", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};

export default function MissedConnectionsPanel({
  mode,
  eventId,
  compact = false,
}: {
  mode: "board" | "event";
  eventId?: number;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", eventId: eventId ? String(eventId) : "" });
  const [replyingTo, setReplyingTo] = useState<MissedConnectionPost | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const postsQueryKey = mode === "event" && eventId
    ? ["/api/events", eventId, "missed-connections"]
    : ["/api/missed-connections"];

  const { data: posts = [], isLoading, isError, refetch } = useQuery<MissedConnectionPost[]>({
    queryKey: postsQueryKey,
    queryFn: async () => {
      const url = mode === "event" && eventId
        ? `/api/events/${eventId}/missed-connections`
        : "/api/missed-connections";
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load missed connections");
      return r.json();
    },
    enabled: !!user,
  });

  const { data: postableEvents = [] } = useQuery<PostableEvent[]>({
    queryKey: ["/api/missed-connections/postable-events", mode],
    queryFn: async () => {
      const scope = mode === "board" ? "today" : "window";
      const r = await fetch(`/api/missed-connections/postable-events?scope=${scope}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load events");
      return r.json();
    },
    enabled: !!user && mode === "board",
  });

  const { data: eventPostableCheck } = useQuery<PostableEvent[]>({
    queryKey: ["/api/missed-connections/postable-events", "event", eventId],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections/postable-events?scope=window", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load events");
      return r.json();
    },
    enabled: !!user && mode === "event" && !!eventId,
  });

  const canPostToEvent = mode === "event" && eventId
    ? (eventPostableCheck || []).some(e => e.id === eventId)
    : postableEvents.length > 0;

  const createMutation = useMutation({
    mutationFn: () => fetch("/api/missed-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title,
        body: form.body,
        eventId: mode === "event" ? eventId : Number(form.eventId),
        scope: mode === "board" ? "today" : undefined,
      }),
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not post");
      return data;
    }),
    onSuccess: () => {
      setForm(f => ({ ...f, title: "", body: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      if (eventId) queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Posted", description: "Your note is live — you stay anonymous until you both reveal in inbox." });
    },
    onError: (err: Error) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: () => fetch(`/api/missed-connections/${replyingTo!.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: replyBody }),
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not send reply");
      return data;
    }),
    onSuccess: () => {
      setReplyingTo(null);
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Reply sent", description: "Thread is private. Reveal yourself in inbox when you're ready." });
    },
    onError: () => toast({ title: "Could not send reply", variant: "destructive" }),
  });

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: compact ? "16px 0" : "24px 0" }}>
        <p style={{ color: "#aaa", lineHeight: 1.6, marginBottom: 14 }}>
          Log in to read or post. Replies stay anonymous until you both choose to reveal in inbox.
        </p>
        <button className="btn-neon solid" onClick={() => setShowAuth(true)}>Log in / Join</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div>
      {mode === "board" && (
        <section style={{ background: "#0a0a0a", border: "2px solid #FF00CC", padding: 20, marginBottom: 28 }}>
          <h2 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 8 }}>WRITE A NOTE</h2>
          <p style={{ color: "#888", fontSize: "0.82rem", marginBottom: 14, lineHeight: 1.5 }}>
            Pick an event happening today. Posts open 20 minutes after start and close 7 days later. You stay anonymous on the board.
          </p>
          {postableEvents.length === 0 ? (
            <p style={{ color: "#9d9a92", fontSize: "0.85rem", marginBottom: 0 }}>
              No events are open for missed-connection posts right now.
            </p>
          ) : (
            <>
              <select
                style={{ ...inputStyle, marginBottom: 10 }}
                value={form.eventId}
                onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
              >
                <option value="">Select today's event…</option>
                {postableEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.dayOfWeek} · {evt.title} @ {evt.venueName}
                  </option>
                ))}
              </select>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" maxLength={80} />
              <textarea
                style={{ ...inputStyle, minHeight: 120, resize: "vertical", marginTop: 10 }}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
                placeholder="What happened? Keep it kind, specific, and under 500 characters."
                maxLength={500}
              />
              <div style={{ color: form.body.length >= 500 ? "#FF2400" : "#555", fontSize: "0.75rem", marginTop: 4 }}>{form.body.length}/500</div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.title.trim() || !form.body.trim() || !form.eventId || createMutation.isPending}
                className="display"
                style={{ marginTop: 14, background: "#FF00CC", color: "#000", border: "none", padding: "10px 18px", cursor: "pointer", opacity: !form.title.trim() || !form.body.trim() || !form.eventId || createMutation.isPending ? 0.55 : 1 }}
              >
                {createMutation.isPending ? "POSTING..." : "POST ANONYMOUSLY"}
              </button>
            </>
          )}
        </section>
      )}

      {mode === "event" && canPostToEvent && (
        <section style={{ background: "#0a0a0a", border: "1px solid #333", padding: 16, marginBottom: 16 }}>
          <h3 className="display" style={{ color: "#FF00CC", fontSize: "1rem", marginBottom: 8 }}>POST A MISSED CONNECTION</h3>
          <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: 10 }}>Anonymous on the board until you both reveal in inbox.</p>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" maxLength={80} />
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", marginTop: 8 }}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
            placeholder="What happened?"
            maxLength={500}
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || !form.body.trim() || createMutation.isPending}
            className="display"
            style={{ marginTop: 10, background: "#FF00CC", color: "#000", border: "none", padding: "8px 16px", cursor: "pointer", fontSize: "0.8rem", opacity: !form.title.trim() || !form.body.trim() || createMutation.isPending ? 0.55 : 1 }}
          >
            {createMutation.isPending ? "POSTING..." : "POST"}
          </button>
        </section>
      )}

      {mode === "event" && !canPostToEvent && (
        <p style={{ color: "#666", fontSize: "0.78rem", marginBottom: 12 }}>
          Posting opens 20 minutes after this event starts and closes 7 days later.
        </p>
      )}

      {isLoading ? (
        <div style={{ color: "#9d9a92" }}>Loading...</div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: "24px 0", border: "2px dashed #FF00CC" }}>
          <p style={{ color: "#fff", marginBottom: 12 }}>Could not load missed connections.</p>
          <button className="btn-neon" style={{ fontSize: "0.78rem", padding: "8px 14px" }} onClick={() => refetch()}>TRY AGAIN</button>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#9d9a92", padding: compact ? "12px 0" : "32px 0" }}>
          {mode === "event" ? "No missed connections for this event yet." : "No active missed connections yet."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {posts.map(post => (
            <article key={post.id} style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", padding: compact ? 14 : 18 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {(post.eventDay || post.dayOfWeek) && (
                  <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>{post.eventDay || post.dayOfWeek}</span>
                )}
                {(post.eventVenue || post.venueHint) && (
                  <span className="sticker" style={{ color: "#777", borderColor: "#333" }}>{post.eventVenue || post.venueHint}</span>
                )}
                {post.eventTitle && (
                  <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>{post.eventTitle}</span>
                )}
              </div>
              <h3 className="display panel-heading" style={{ color: "#fff", marginBottom: 8, fontSize: compact ? "1rem" : undefined }}>{post.title}</h3>
              <p style={{ color: "#bbb", lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: compact ? "0.88rem" : undefined }}>{post.body}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <span style={{ color: "#444", fontSize: "0.76rem" }}>
                  {post.isMine ? "Your post (anonymous to others)" : "Posted anonymously"} · {new Date(post.createdAt).toLocaleDateString()}
                </span>
                {!post.isMine && (
                  <button onClick={() => setReplyingTo(post)} className="btn-neon" style={{ fontSize: "0.78rem", padding: "7px 14px" }}>
                    Reply Privately
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {replyingTo && (
        <div onClick={() => setReplyingTo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#090909", border: "2px solid #FF00CC", width: "100%", maxWidth: 520, padding: 22 }}>
            <h3 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 8 }}>PRIVATE REPLY</h3>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: 12, lineHeight: 1.5 }}>
              {replyingTo.title} — your reply stays anonymous in inbox until you both choose to reveal.
            </p>
            <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Write your reply..." />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => replyMutation.mutate()} disabled={!replyBody.trim() || replyMutation.isPending} style={{ background: "#FF00CC", color: "#000", border: "none", padding: "9px 16px", cursor: "pointer", opacity: !replyBody.trim() || replyMutation.isPending ? 0.55 : 1 }}>
                {replyMutation.isPending ? "SENDING..." : "SEND"}
              </button>
              <button onClick={() => setReplyingTo(null)} style={{ background: "transparent", color: "#666", border: "1px solid #333", padding: "9px 12px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}