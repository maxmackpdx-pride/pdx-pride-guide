import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import MissedConnectionsHero from "@/components/MissedConnectionsHero";
import MissedConnectionsPanel, { type MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import ScrollReveal from "@/components/ScrollReveal";
import BoardStatsBar from "@/components/BoardStatsBar";

const HOW_IT_WORKS: Array<[string, string]> = [
  ["Pick a spot", "Link a live or past Pride event, write your own spot, or choose Around town."],
  ["Write it", "Short, kind, specific — you stay anonymous."],
  ["Wait", "Someone who was there can reply privately."],
  ["Reveal", "Choose to show your profile in inbox when you're both ready."],
];

export default function MissedConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [editingPost, setEditingPost] = useState<MissedConnectionPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "" });

  const { data: allPosts = [] } = useQuery<MissedConnectionPost[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!user,
  });

  const stats = useMemo(() => [
    { num: allPosts.length, label: "Spotted live", color: "#FF1FA0" },
    { num: allPosts.filter(p => p.eventId != null).length, label: "At events", color: "#19E3FF" },
    { num: allPosts.filter(p => p.eventId == null).length, label: "Around town", color: "#FF8C00" },
  ], [allPosts]);

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
        <div className="board-active-feed">
          <div className="board-active-feed__inner" style={{ textAlign: "center", padding: "48px 24px 64px" }}>
            <p className="board-copy-sm" style={{ marginInline: "auto" }}>
              Log in to read or post. Replies stay anonymous until you both choose to reveal in inbox.
            </p>
            <button className="btn-neon solid" style={{ marginTop: 20 }} onClick={() => setShowAuth(true)}>Log in / Join</button>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zine-page missed-page board-page min-h-screen">
      <MissedConnectionsHero />
      <BoardStatsBar stats={stats} liveLabel="Anonymous board · replies stay private" />

      <MissedConnectionsPanel mode="board" boardLayout />

      <ScrollReveal delay={60}>
        <section id="how-it-works" className="missed-how board-how board-how--inline diag">
          <div>
            <span className="board-sticker board-sticker--magenta">How it works</span>
            <h2 className="display section-heading">PRIVATE BY DEFAULT</h2>
            <p className="board-copy">Post a spotted note tied to an event or around town. Replies never show on the board — they open a private inbox thread.</p>
          </div>
          <div className="board-steps">
            {HOW_IT_WORKS.map(([title, text], i) => (
              <article className="board-step" key={title}>
                <span className="board-step__num" aria-hidden="true">{i + 1}</span>
                <h3 className="display panel-heading">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="missed-footer-line">Stay kind. Stay anonymous. Reveal when ready.</div>
        </section>
      </ScrollReveal>

      {myPosts.filter(p => p.status === "ACTIVE").length > 0 && (
        <ScrollReveal delay={80}>
          <section className="board-active-feed" style={{ paddingTop: 0 }}>
            <div className="board-active-feed__inner">
              <div className="board-active-feed__head">
                <span className="board-sticker board-sticker--magenta">Your posts</span>
                <h2 className="display section-heading board-active-feed__title">YOUR ACTIVE POSTS</h2>
              </div>
              <div className="board-listing-grid" style={{ gridTemplateColumns: "1fr" }}>
                {myPosts.filter(p => p.status === "ACTIVE").map(post => (
                  <div key={post.id} className="board-listing-card" style={{ "--listing-accent": "#FF1FA0", cursor: "default" } as React.CSSProperties}>
                    <div className="board-listing-card__main">
                      <h4 className="board-listing-card__title">{post.title}</h4>
                      <p style={{ margin: "8px 0 0", color: "#9d9a92", fontSize: "0.85rem" }}>
                        {post.eventTitle || post.venueHint || "Around town"} · anonymous to everyone else
                      </p>
                    </div>
                    <div className="board-listing-card__expand" style={{ borderTop: "none", paddingTop: 0, marginTop: 12 }}>
                      <div className="gifting-actions">
                        <button onClick={() => startEdit(post)} className="btn-neon" style={{ fontSize: "0.78rem", padding: "6px 12px" }}>Edit</button>
                        <button onClick={() => deleteMutation.mutate(post.id)} className="btn-neon magenta" style={{ fontSize: "0.78rem", padding: "6px 12px" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {editingPost && (
        <div onClick={() => setEditingPost(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#090909", border: "2px solid #FF00CC", width: "100%", maxWidth: 560, padding: 22 }}>
            <h3 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 12 }}>EDIT MISSED CONNECTION</h3>
            <input className="board-text-field" style={{ width: "100%", boxSizing: "border-box" }} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" maxLength={80} />
            <textarea
              className="board-text-field"
              style={{ width: "100%", boxSizing: "border-box", minHeight: 120, resize: "vertical", marginTop: 10 }}
              value={editForm.body}
              onChange={e => setEditForm(f => ({ ...f, body: e.target.value.slice(0, 500) }))}
              maxLength={500}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => editMutation.mutate()} disabled={!editForm.title.trim() || !editForm.body.trim() || editMutation.isPending} className="btn-neon solid" style={{ opacity: !editForm.title.trim() || !editForm.body.trim() || editMutation.isPending ? 0.55 : 1 }}>
                {editMutation.isPending ? "SAVING..." : "SAVE"}
              </button>
              <button onClick={() => setEditingPost(null)} className="btn-neon">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
