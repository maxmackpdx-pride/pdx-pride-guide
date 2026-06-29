import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "./AuthModal";
import BoardLoadingState from "./BoardLoadingState";
import BoardActiveSection, { BoardSelectField, BoardTextField } from "./BoardActiveSection";
import MissedConnectionsBubbleBoard from "./MissedConnectionsBubbleBoard";
import ScrollReveal from "./ScrollReveal";
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

export type LinkableMissedConnectionEvent = Pick<Event, "id" | "title" | "venueName" | "dayOfWeek" | "dateStart" | "dateEnd"> & {
  postable?: boolean;
  timing?: "upcoming" | "live" | "past";
};

type PostableEvent = LinkableMissedConnectionEvent;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#000", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};

export default function MissedConnectionsPanel({
  mode,
  eventId,
  compact = false,
  boardLayout = false,
  onRequireAuth,
}: {
  mode: "board" | "event";
  eventId?: number;
  compact?: boolean;
  boardLayout?: boolean;
  onRequireAuth?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    eventId: eventId ? String(eventId) : "",
    eventLabel: "",
    venueHint: "",
    spotMode: eventId ? "event" as const : "around" as const,
  });
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
  });

  const { data: linkableEvents = [] } = useQuery<PostableEvent[]>({
    queryKey: ["/api/missed-connections/postable-events", mode === "board" ? "board" : "window"],
    queryFn: async () => {
      const scope = mode === "board" ? "board" : "window";
      const r = await fetch(`/api/missed-connections/postable-events?scope=${scope}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load events");
      return r.json();
    },
    enabled: !!user && (mode === "board" || mode === "event"),
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

  const canPostToEventStrict = mode === "event" && eventId
    ? (eventPostableCheck || []).some(e => e.id === eventId)
    : false;

  const deriveTitle = (title: string, body: string) => {
    const trimmed = title.trim();
    if (trimmed) return trimmed.slice(0, 80);
    const line = body.trim().split(/\n/)[0] || body.trim();
    return line.slice(0, 80) || "Spotted";
  };

  const createMutation = useMutation({
    mutationFn: () => fetch("/api/missed-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: deriveTitle(form.title, form.body),
        body: form.body,
        eventId: mode === "event" ? eventId : (form.eventId ? Number(form.eventId) : undefined),
        scope: mode === "board" || (mode === "event" && !canPostToEventStrict) ? "board" : undefined,
        ...(form.eventLabel ? { eventLabel: form.eventLabel } : {}),
        ...(form.venueHint ? { venueHint: form.venueHint } : {}),
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

  const requireAuth = () => {
    if (user) return true;
    if (onRequireAuth) onRequireAuth();
    else setShowAuth(true);
    return false;
  };

  if (!user && !boardLayout) {
    return (
      <div style={{ textAlign: "center", padding: compact ? "16px 0" : "24px 0" }}>
        <p style={{ color: "#aaa", lineHeight: 1.6, marginBottom: 14 }}>
          Log in to read or post. Replies stay anonymous until you both choose to reveal in inbox.
        </p>
        <button className="btn-neon solid" onClick={() => requireAuth()}>Log in / Join</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  const composeForm = mode === "board" && !boardLayout && (
    <section style={{ background: "#0a0a0a", border: "2px solid #FF00CC", padding: 20, marginBottom: 28 }}>
      <h2 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 8 }}>WRITE A NOTE</h2>
      <p className="board-copy-sm" style={{ marginBottom: 14 }}>
        Tie it to a Pride event, write your own spot, or post around town. You stay anonymous on the board.
      </p>
      <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" maxLength={80} />
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
        disabled={!form.body.trim() || createMutation.isPending}
        className="btn-neon solid"
        style={{ marginTop: 14, opacity: !form.body.trim() || createMutation.isPending ? 0.55 : 1 }}
      >
        {createMutation.isPending ? "POSTING..." : "POST ANONYMOUSLY"}
      </button>
    </section>
  );

  const listings = isLoading ? (
    <BoardLoadingState label="Loading missed connections" />
  ) : isError ? (
    boardLayout ? (
      <div className="board-empty board-empty--prototype">
        <p className="display section-heading">Could not load</p>
        <button className="btn-neon" style={{ marginTop: 16 }} onClick={() => refetch()}>Try again</button>
      </div>
    ) : (
      <div style={{ textAlign: "center", padding: "24px 0", border: "2px dashed #FF00CC" }}>
        <p style={{ color: "#fff", marginBottom: 12 }}>Could not load missed connections.</p>
        <button className="btn-neon" style={{ fontSize: "0.78rem", padding: "8px 14px" }} onClick={() => refetch()}>TRY AGAIN</button>
      </div>
    )
  ) : posts.length === 0 ? (
    boardLayout && mode === "board" ? (
      <div className="board-empty board-empty--prototype">
        <p className="display section-heading">Nothing here yet</p>
        <p className="board-copy-sm">No active missed connections yet. Be the first to post a note from today's events.</p>
      </div>
    ) : (
      <div style={{ color: "#9d9a92", padding: compact ? "12px 0" : "32px 0" }}>
        {mode === "event" ? "No missed connections for this event yet." : "No active missed connections yet."}
      </div>
    )
  ) : (
    <div style={{ display: "grid", gap: 14 }}>
      {posts.map((post, index) => (
        <ScrollReveal key={post.id} delay={Math.min(index * 80, 400)}>
        <article style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", padding: compact ? 14 : 18 }}>
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
              <button onClick={() => { if (requireAuth()) setReplyingTo(post); }} className="btn-neon" style={{ fontSize: "0.78rem", padding: "7px 14px" }}>
                Reply Privately
              </button>
            )}
          </div>
        </article>
        </ScrollReveal>
      ))}
    </div>
  );

  const replyModal = replyingTo && (
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
  );

  if (boardLayout && mode === "board") {
    return (
      <div className="board-active-feed diag">
        <div className="board-active-feed__inner">
          <div className="board-active-feed__head">
            <span className="board-sticker board-sticker--magenta">Active board</span>
            <h2 className="display section-heading board-active-feed__title">SPOTTED!</h2>
          </div>
          <div className="board-active-feed__body">
            <MissedConnectionsBubbleBoard
              posts={posts}
              isLoading={isLoading}
              isError={isError}
              refetch={refetch}
              linkableEvents={linkableEvents}
              canInteract={!!user}
              onRequireAuth={requireAuth}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {composeForm}

      {mode === "event" && (
        <section style={{ background: "#0a0a0a", border: "1px solid #333", padding: 16, marginBottom: 16 }}>
          <h3 className="display" style={{ color: "#FF00CC", fontSize: "1rem", marginBottom: 8 }}>POST TO SPOTTED!</h3>
          <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: 10 }}>
            Missed connections for this event · anonymous on the board until you both reveal in inbox.
            {!canPostToEventStrict && " (Posting early — goes live on Spotted now.)"}
          </p>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" maxLength={80} />
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", marginTop: 8 }}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
            placeholder="What happened?"
            maxLength={500}
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.body.trim() || createMutation.isPending}
            className="display"
            style={{ marginTop: 10, background: "#FF00CC", color: "#000", border: "none", padding: "8px 16px", cursor: "pointer", fontSize: "0.8rem", opacity: !form.body.trim() || createMutation.isPending ? 0.55 : 1 }}
          >
            {createMutation.isPending ? "POSTING..." : "POST"}
          </button>
        </section>
      )}

      {listings}
      {replyModal}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
