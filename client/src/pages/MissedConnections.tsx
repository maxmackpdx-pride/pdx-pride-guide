import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import MissedConnectionsHero from "@/components/MissedConnectionsHero";

type MissedConnection = {
  id: number;
  userId: number;
  title: string;
  body: string;
  dayOfWeek?: string | null;
  venueHint?: string | null;
  status: string;
  createdAt: string;
  username?: string;
  displayName?: string | null;
};

const DAYS = ["", "THU", "FRI", "SAT", "SUN", "MON"];

export default function MissedConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", dayOfWeek: "", venueHint: "" });
  const [replyingTo, setReplyingTo] = useState<MissedConnection | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingPost, setEditingPost] = useState<MissedConnection | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", dayOfWeek: "", venueHint: "" });

  const { data: posts = [], isLoading, isError, refetch } = useQuery<MissedConnection[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections");
      if (!r.ok) throw new Error("Could not load missed connections");
      return r.json();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => fetch("/api/missed-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dayOfWeek: form.dayOfWeek || null, venueHint: form.venueHint || null }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not post");
      return r.json();
    }),
    onSuccess: () => {
      setForm({ title: "", body: "", dayOfWeek: "", venueHint: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      toast({ title: "Posted", description: "Your note is live on the board." });
    },
    onError: () => toast({ title: "Could not post", description: "Try again in a moment.", variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: () => fetch(`/api/missed-connections/${replyingTo!.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not send reply");
      return r.json();
    }),
    onSuccess: () => {
      setReplyingTo(null);
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Reply sent", description: "Check your inbox for the private thread." });
    },
    onError: () => toast({ title: "Could not send reply", variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: () => fetch(`/api/missed-connections/${editingPost!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, dayOfWeek: editForm.dayOfWeek || null, venueHint: editForm.venueHint || null }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not update post");
      return r.json();
    }),
    onSuccess: () => {
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Updated" });
    },
    onError: () => toast({ title: "Could not update", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/missed-connections/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Could not delete", variant: "destructive" }),
  });

  const startEdit = (post: MissedConnection) => {
    setEditingPost(post);
    setEditForm({
      title: post.title || "",
      body: post.body || "",
      dayOfWeek: post.dayOfWeek || "",
      venueHint: post.venueHint || "",
    });
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#000" }}>
        <MissedConnectionsHero />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px 64px" }}>
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <p style={{ color: "#aaa", lineHeight: 1.6, marginBottom: 20 }}>
              Log in to read or post. Replies are private and go straight to inbox threads.
            </p>
            <button className="btn-neon solid" onClick={() => setShowAuth(true)}>Log in / Join</button>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <MissedConnectionsHero />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 48px" }}>

        <section style={{ background: "#0a0a0a", border: "2px solid #FF00CC", padding: 20, marginBottom: 28 }}>
          <h2 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 12 }}>WRITE A NOTE</h2>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" maxLength={80} />
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: "vertical", marginTop: 10 }}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
            placeholder="What happened? Keep it kind, specific, and under 500 characters."
            maxLength={500}
          />
          <div style={{ color: form.body.length >= 500 ? "#FF2400" : "#555", fontSize: "0.75rem", marginTop: 4 }}>{form.body.length}/500</div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginTop: 10 }}>
            <select style={inputStyle} value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
              {DAYS.map(day => <option key={day || "any"} value={day}>{day || "DAY?"}</option>)}
            </select>
            <input style={inputStyle} value={form.venueHint} onChange={e => setForm(f => ({ ...f, venueHint: e.target.value }))} placeholder="Optional venue hint" maxLength={80} />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || !form.body.trim() || createMutation.isPending}
            className="display"
            style={{ marginTop: 14, background: "#FF00CC", color: "#000", border: "none", padding: "10px 18px", cursor: "pointer", opacity: !form.title.trim() || !form.body.trim() || createMutation.isPending ? 0.55 : 1 }}
          >
            {createMutation.isPending ? "POSTING..." : "POST"}
          </button>
        </section>

        {isLoading ? (
          <div style={{ color: "#9d9a92" }}>Loading...</div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "32px 0", border: "2px dashed #FF00CC" }}>
            <p style={{ color: "#fff", marginBottom: 12 }}>Could not load missed connections.</p>
            <button className="btn-neon" style={{ fontSize: "0.78rem", padding: "8px 14px" }} onClick={() => refetch()}>
              TRY AGAIN
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ color: "#9d9a92", padding: "32px 0" }}>No active missed connections yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {posts.map(post => (
              <article key={post.id} style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", padding: 18 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {post.dayOfWeek && <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>{post.dayOfWeek}</span>}
                  {post.venueHint && <span className="sticker" style={{ color: "#777", borderColor: "#333" }}>{post.venueHint}</span>}
                </div>
                <h3 className="display panel-heading" style={{ color: "#fff", marginBottom: 8 }}>{post.title}</h3>
                <p style={{ color: "#bbb", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post.body}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ color: "#444", fontSize: "0.76rem" }}>
                    Posted by {post.displayName || post.username || `user #${post.userId}`} · {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  {post.userId === user.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(post)} className="btn-neon" style={{ fontSize: "0.78rem", padding: "7px 14px" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteMutation.mutate(post.id)} style={{ background: "transparent", color: "#FF2400", border: "1px solid #FF2400", padding: "7px 14px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingTo(post)} className="btn-neon" style={{ fontSize: "0.78rem", padding: "7px 14px" }}>
                      Reply Privately
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {replyingTo && (
        <div onClick={() => setReplyingTo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#090909", border: "2px solid #FF00CC", width: "100%", maxWidth: 520, padding: 22 }}>
            <h3 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 8 }}>PRIVATE REPLY</h3>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: 12 }}>{replyingTo.title}</p>
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

      {editingPost && (
        <div onClick={() => setEditingPost(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#090909", border: "2px solid #FF00CC", width: "100%", maxWidth: 560, padding: 22 }}>
            <h3 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 12 }}>EDIT MISSED CONNECTION</h3>
            <input style={inputStyle} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" maxLength={80} />
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical", marginTop: 10 }}
              value={editForm.body}
              onChange={e => setEditForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
              maxLength={500}
            />
            <div style={{ color: editForm.body.length >= 500 ? "#FF2400" : "#555", fontSize: "0.75rem", marginTop: 4 }}>{editForm.body.length}/500</div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginTop: 10 }}>
              <select style={inputStyle} value={editForm.dayOfWeek} onChange={e => setEditForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                {DAYS.map(day => <option key={day || "any-edit"} value={day}>{day || "DAY?"}</option>)}
              </select>
              <input style={inputStyle} value={editForm.venueHint} onChange={e => setEditForm(f => ({ ...f, venueHint: e.target.value }))} placeholder="Optional venue hint" maxLength={80} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => editMutation.mutate()} disabled={!editForm.title.trim() || !editForm.body.trim() || editMutation.isPending} style={{ background: "#FF00CC", color: "#000", border: "none", padding: "9px 16px", cursor: "pointer", opacity: !editForm.title.trim() || !editForm.body.trim() || editMutation.isPending ? 0.55 : 1 }}>
                {editMutation.isPending ? "SAVING..." : "SAVE"}
              </button>
              <button onClick={() => setEditingPost(null)} style={{ background: "transparent", color: "#666", border: "1px solid #333", padding: "9px 12px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#000", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};
