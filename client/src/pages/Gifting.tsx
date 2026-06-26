import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, HeartHandshake, RefreshCw, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";

const CATEGORIES = [
  "Clothing", "Queer Closet", "Costumes and Theme Wear", "Circuit Party Wear", "Drag",
  "Kink Gear", "Leather / Rubber / Fetish Wear", "Event Supplies", "Pride Weekend Stuff",
  "Home Goods", "Furniture", "Kitchen", "Electronics", "Books and Media", "Art and Craft Supplies",
  "Pet Stuff", "Tickets or Passes", "Tools", "Decorations", "Camping / Beach / River Gear",
  "Beauty / Grooming", "Other",
];

const PICKUP = ["Porch pickup", "Public meetup", "Event handoff", "Flexible pickup", "Message to coordinate"];

type GiftingPost = {
  id: number;
  userId: number;
  postType: "GIFT" | "ISO";
  title: string;
  description: string;
  category: string;
  neighborhood: string;
  pickupPreference: string;
  photoUrls: string[];
  status: string;
  createdAt: string;
  expiresAt: string;
  username: string;
  displayName?: string | null;
  posterPhotoUrl?: string | null;
  posterAvatarRing?: string | null;
  avatarChoice?: number;
  interestCount: number;
  isMine?: boolean;
  interests?: Array<{ id: number; userId: number; note: string; status: string; username: string; displayName?: string; photoUrl?: string | null; avatarChoice?: number; avatarRing?: string | null }>;
};

const blankForm = {
  postType: "GIFT",
  title: "",
  description: "",
  category: "Queer Closet",
  neighborhood: "",
  pickupPreference: "Message to coordinate",
  acceptRules: false,
};

const postTypeLabel = (type: string) => type === "ISO" ? "IN SEARCH OF" : "GIFT";
const filterLabel = (type: string) => {
  if (type === "OPEN") return "Open only";
  if (type === "ISO") return "In Search Of";
  return type;
};

export default function Gifting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>(blankForm);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [neighborhood, setNeighborhood] = useState("");
  const [sort, setSort] = useState("RECENT");
  const [activeNote, setActiveNote] = useState<Record<number, string>>({});
  const [report, setReport] = useState<Record<number, string>>({});

  const { data: posts = [], isLoading, isError, error } = useQuery<GiftingPost[]>({ queryKey: ["/api/gifting"] });

  const filtered = useMemo(() => {
    let rows = posts.slice();
    if (filter === "GIFT" || filter === "ISO") rows = rows.filter(p => p.postType === filter);
    if (filter === "OPEN") rows = rows.filter(p => ["OPEN", "LOOKING", "REOPENED"].includes(p.status));
    if (category !== "ALL") rows = rows.filter(p => p.category === category);
    if (neighborhood.trim()) rows = rows.filter(p => p.neighborhood.toLowerCase().includes(neighborhood.trim().toLowerCase()));
    if (sort === "EXPIRING") rows.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    return rows;
  }, [posts, filter, category, neighborhood, sort]);

  const openForm = (postType: "GIFT" | "ISO") => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setForm({ ...blankForm, postType });
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("gifting-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] = [];
      if (photos?.length) {
        const fd = new FormData();
        Array.from(photos).slice(0, 2).forEach(file => fd.append("photos", file));
        const uploadRes = await fetch("/api/upload/gifting", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        photoUrls = (await uploadRes.json()).urls || [];
      }
      return apiRequest("POST", "/api/gifting", { ...form, photoUrls });
    },
    onSuccess: async res => {
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      toast({ title: body.firstPostHeld ? "Held for review" : "Posted", description: body.message });
      setForm(blankForm);
      setPhotos(null);
      setFormOpen(false);
    },
    onError: (err: any) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ url, data }: { url: string; data?: any }) => apiRequest("POST", url, data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      toast({ title: "Updated" });
    },
    onError: (err: any) => toast({ title: "Could not update", description: err.message, variant: "destructive" }),
  });

  const submitPost = () => {
    if (!form.acceptRules) {
      toast({ title: "Accept the community rules first", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Add a title", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Add a description", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  const clearFilters = () => {
    setFilter("ALL");
    setCategory("ALL");
    setNeighborhood("");
    setSort("RECENT");
  };

  const submitResponse = (post: GiftingPost, endpoint: "interest" | "offer") => {
    if (!user) return setShowAuth(true);
    const note = (activeNote[post.id] || "").trim();
    if (!note) return toast({ title: "Add a short note first", variant: "destructive" });
    actionMutation.mutate({ url: `/api/gifting/${post.id}/${endpoint}`, data: { note } });
    setActiveNote(prev => ({ ...prev, [post.id]: "" }));
  };

  return (
    <div className="zine-page gifting-page board-page">
      <PageHero
        titleLine1="GIFT WITH"
        titleLine2="PRIDE"
        accent="rainbow"
        lede="A queer Portland free board for Pride-season closet chaos, event supplies, outfit saves, furniture, gear, tickets, décor, kink gear, circuit looks, and whatever else needs a new home."
        tagline="Give gay gifts. Queer homes. Keep it moving."
        taglineAccent="cyan"
        bgImage="/gift-with-pride-hero.jpg"
        actions={
          <>
            <button className="btn-neon" onClick={() => openForm("GIFT")}><Gift size={16} /> Post a Gift</button>
            <button className="btn-neon cyan" onClick={() => openForm("ISO")}><Search size={16} /> Post an In Search Of</button>
          </>
        }
      />

      <ScrollReveal>
        <section id="how-it-works" className="gifting-how">
          <div>
            <h2 className="display section-heading">HOW GIFT WITH PRIDE WORKS</h2>
            <p className="board-copy">Give what you can. Ask for what you need. Keep it local, free, and kind.</p>
          </div>
          <div className="board-steps">
            {[
              ["POST IT", "Gift it or search for it."],
              ["ADD PHOTOS", "Upload up to 2. The site makes them fit."],
              ["3 QUEERS MAX", "Only 3 people can raise their hand on a Gift post."],
              ["PICK ONE", "Poster chooses and messages."],
              ["HAND IT OFF", "Porch pickup, public meetup, event handoff, or whatever feels safe."],
              ["STAMP IT DONE", "Gifted or Found. Then it leaves the active feed."],
            ].map(([title, text], i) => (
              <article className="board-step" key={title}>
                <span className="board-step__num" aria-hidden="true">{i + 1}</span>
                <h3 className="display panel-heading">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="gifting-footer-line">Keep it free. Keep it kind. Keep it moving. · Now through July 26</div>
        </section>
      </ScrollReveal>

      {formOpen && (
        <section id="gifting-form" className="gifting-form-panel">
          <button className="gifting-close" onClick={() => setFormOpen(false)}><X size={18} /></button>
          <h2 className="display section-heading">POST A {postTypeLabel(form.postType)}</h2>
          <p>No selling, trading, bartering, exact addresses, unsafe items, or hookup behavior. First-time posts are held for admin review.</p>
          <div className="gifting-form-grid">
            <label>Post Type<select value={form.postType} onChange={e => setForm({ ...form, postType: e.target.value })}><option value="GIFT">Gift</option><option value="ISO">In Search Of</option></select></label>
            <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
            <label className="span">Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={90} /></label>
            <label className="span">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} /></label>
            <label>Neighborhood / pickup area<input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label>
            <label>Pickup preference<select value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>{PICKUP.map(p => <option key={p}>{p}</option>)}</select></label>
            <label className="span">Photos, up to 2<input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} /></label>
          </div>
          <label className="gifting-rules"><input type="checkbox" checked={form.acceptRules} onChange={e => setForm({ ...form, acceptRules: e.target.checked })} /> I agree: Keep it free. Keep it kind. Keep it moving.</label>
          <button className="btn-neon" disabled={createMutation.isPending || !form.acceptRules} onClick={submitPost}>
            {createMutation.isPending ? "POSTING..." : "SUBMIT"}
          </button>
        </section>
      )}

      <section className="gifting-feed">
        <div className="gifting-feed-head">
          <div>
            <h2 className="display section-heading">GIFTS & IN SEARCH OF</h2>
          </div>
          <div className="gifting-filterbar">
            {["ALL", "GIFT", "ISO", "OPEN"].map(f => <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{filterLabel(f)}</button>)}
            <select value={category} onChange={e => setCategory(e.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <input placeholder="Neighborhood" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            <select value={sort} onChange={e => setSort(e.target.value)}><option value="RECENT">Recently posted</option><option value="EXPIRING">Expiring soon</option></select>
          </div>
        </div>

        {isLoading ? (
          <BoardLoadingState label="Loading gifting posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#00FFFF" }}>
            <Gift size={40} style={{ color: "#00FFFF", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>COULD NOT LOAD POSTS</p>
            <p className="board-copy-sm">
              {error instanceof Error ? error.message : "The gifting board API is unavailable right now."}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gifting"] })}
              className="btn-neon"
              style={{ marginTop: 20 }}
            >
              TRY AGAIN
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty">
            <Sparkles size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto" }} />
            <p className="display section-heading">
              {posts.length === 0 ? "NO POSTS YET" : "NO MATCHES"}
            </p>
            <p className="board-copy-sm">
              {posts.length === 0
                ? "Be the first to gift something or post an In Search Of."
                : "Nothing matches your filters. Try widening the search."}
            </p>
            {posts.length === 0 ? (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => openForm("GIFT")}>
                POST A GIFT
              </button>
            ) : (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={clearFilters}>
                CLEAR FILTERS
              </button>
            )}
          </div>
        ) : (
          <div className="gifting-grid">
            {filtered.map((post, index) => (
              <ScrollReveal key={post.id} delay={Math.min(index * 80, 400)}>
              <article className={`gifting-card ${post.postType.toLowerCase()}`}>
                <div className="gifting-photo">
                  {post.photoUrls?.[0] ? <img src={post.photoUrls[0]} alt="" /> : <div className="gifting-photo-empty"><Sparkles /> FREE BOARD</div>}
                  {post.photoUrls?.[1] && <span>+1 photo</span>}
                </div>
                {["GIFTED", "FOUND"].includes(post.status) && <div className="gifting-stamp">{post.status}</div>}
                <div className="gifting-card-body">
                  <div className="gifting-card-meta">
                    <span className="gifting-type">{postTypeLabel(post.postType)}</span>
                    <span>{post.status.replaceAll("_", " ")}</span>
                  </div>
                  <h3 className="display panel-heading">{post.title}</h3>
                  <p>{post.description}</p>
                  <div className="gifting-details">{post.category} · {post.neighborhood} · {post.pickupPreference}</div>
                  <div className="gifting-poster">
                    <UserAvatar
                      photoUrl={post.posterPhotoUrl}
                      avatarChoice={post.avatarChoice}
                      avatarRing={post.posterAvatarRing}
                      displayName={post.displayName}
                      username={post.username}
                      size={34}
                    />
                    <b>{post.displayName || post.username}</b>
                  </div>
                  {!post.isMine && !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(post.status) && (
                    <div className="gifting-response">
                      <textarea placeholder={post.postType === "GIFT" ? "Short note: why you'd use this" : "Tell them what you have"} value={activeNote[post.id] || ""} onChange={e => setActiveNote(prev => ({ ...prev, [post.id]: e.target.value }))} maxLength={240} />
                      <button onClick={() => submitResponse(post, post.postType === "GIFT" ? "interest" : "offer")} disabled={post.postType === "GIFT" && post.interestCount >= 3}>
                        {post.postType === "GIFT" && post.interestCount >= 3 ? "3 people interested. Poster choosing now." : post.postType === "GIFT" ? "I'm Interested" : "I have this"}
                      </button>
                    </div>
                  )}
                  {post.isMine && (
                    <div className="gifting-owner">
                      {post.interests?.length ? <div className="gifting-interest-list">{post.interests.map(i => (
                        <div key={i.id} className="gifting-interest-row">
                          <UserAvatar photoUrl={i.photoUrl} avatarChoice={i.avatarChoice} avatarRing={i.avatarRing} displayName={i.displayName} username={i.username} size={28} />
                          <span>{i.displayName || i.username}: {i.note}</span>
                          {i.status === "INTERESTED" && <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/interests/${i.id}/choose` })}>Pick</button>}
                        </div>
                      ))}</div> : <p>No responses yet.</p>}
                      {post.postType === "GIFT" && <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-gifted` })}><HeartHandshake size={14} /> Mark Gifted</button>}
                      {post.postType === "ISO" && <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-found` })}><HeartHandshake size={14} /> Mark Found</button>}
                      <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/reopen` })}><RefreshCw size={14} /> Reopen one spot</button>
                      <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/renew` })}><RefreshCw size={14} /> Renew once</button>
                    </div>
                  )}
                  <details className="gifting-report">
                    <summary><ShieldAlert size={13} /> Report</summary>
                    <input placeholder="What's wrong?" value={report[post.id] || ""} onChange={e => setReport(prev => ({ ...prev, [post.id]: e.target.value }))} />
                    <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/report`, data: { reason: report[post.id] } })}>Send report</button>
                  </details>
                </div>
              </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}
