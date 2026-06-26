import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import MissedConnectionsHero from "@/components/MissedConnectionsHero";
import MissedConnectionsPanel, { type MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import ScrollReveal from "@/components/ScrollReveal";

export default function MissedConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [editingPost, setEditingPost] = useState<MissedConnectionPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "" });

  const { data: myPosts = [] } = useQuery<MissedConnectionPost[]>({
    queryKey: ["/api/missed-connections/mine"],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections/mine", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load your posts");
      return r.json();
    },
    enabled: !!user,
  });

  const editMutation = useMutation({
    mutationFn: () => fetch(`/api/missed-connections/${editingPost!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editForm),
    }).then(async r => {
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
      const r = await fetch(`/api/missed-connections/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Could not delete", variant: "destructive" }),
  });

  const startEdit = (post: MissedConnectionPost) => {
    setEditingPost(post);
    setEditForm({ title: post.title || "", body: post.body || "" });
  };

  if (!user) {
    return (
      <div className="zine-page missed-page board-page min-h-screen">
        <MissedConnectionsHero />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px 64px" }}>
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <p style={{ color: "#aaa", lineHeight: 1.6, marginBottom: 20 }}>
              Log in to read or post. Replies stay anonymous until you both choose to reveal in inbox.
            </p>
            <button className="btn-neon solid" onClick={() => setShowAuth(true)}>Log in / Join</button>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zine-page missed-page board-page min-h-screen">
      <MissedConnectionsHero />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 48px" }}>
        <ScrollReveal>
          <MissedConnectionsPanel mode="board" />
        </ScrollReveal>

        {myPosts.filter(p => p.status === "ACTIVE").length > 0 && (
          <ScrollReveal delay={80}>
          <section style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #222" }}>
            <h2 className="display" style={{ color: "#FF00CC", fontSize: "1.1rem", marginBottom: 14 }}>YOUR ACTIVE POSTS</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {myPosts.filter(p => p.status === "ACTIVE").map(post => (
                <div key={post.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 14px", background: "#0b0b0b", border: "1px solid #222" }}>
                  <div>
                    <div className="display" style={{ color: "#fff", fontSize: "0.9rem" }}>{post.title}</div>
                    <div style={{ color: "#666", fontSize: "0.75rem", marginTop: 4 }}>
                      {post.eventTitle || post.venueHint || "Event"} · anonymous to everyone else
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(post)} className="btn-neon" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>Edit</button>
                    <button onClick={() => deleteMutation.mutate(post.id)} style={{ background: "transparent", color: "#FF2400", border: "1px solid #FF2400", padding: "6px 12px", cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </ScrollReveal>
        )}
      </div>

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