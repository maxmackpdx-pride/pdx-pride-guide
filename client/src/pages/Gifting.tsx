import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, HeartHandshake, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";
import BoardStatsBar from "@/components/BoardStatsBar";
import BoardActiveSection, { BoardFilterChip, BoardSelectField, BoardTextField } from "@/components/BoardActiveSection";
import { isOpenGrabPost, timeAgo } from "@/lib/boardFeed";

const CATEGORIES = [
  "Clothing", "Queer Closet", "Costumes and Theme Wear", "Circuit Party Wear", "Drag",
  "Kink Gear", "Leather / Rubber / Fetish Wear", "Event Supplies", "Pride Weekend Stuff",
  "Home Goods", "Furniture", "Kitchen", "Electronics", "Books and Media", "Art and Craft Supplies",
  "Pet Stuff", "Tickets or Passes", "Tools", "Decorations", "Camping / Beach / River Gear",
  "Beauty / Grooming", "Other",
];

const PICKUP = ["Open Grab", "Porch pickup", "Public meetup", "Event handoff", "Flexible pickup", "Message to coordinate"];

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

const HOW_IT_WORKS: Array<[string, string]> = [
  ["Post it", "Gift it or search for it."],
  ["Add photos", "Upload up to 2. The site makes them fit."],
  ["3 People max", "Only 3 people can raise their hand on a Gift post."],
  ["Pick one", "Poster chooses and messages."],
  ["Hand it off", "Porch pickup, public meetup, event handoff, or whatever feels safe."],
  ["Stamp it done", "Gifted or Found. Then it leaves the active feed."],
];

const blankForm = {
  postType: "GIFT",
  title: "",
  description: "",
  category: "Queer Closet",
  neighborhood: "",
  pickupPreference: "Message to coordinate",
  acceptRules: false,
};

const postTypeLabel = (type: string) => type === "ISO" ? "In search of" : "Gift";

const ACCENT: Record<string, string> = {
  GIFT: "#C8FA3C",
  ISO: "#19E3FF",
  GRAB: "#FF8C00",
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: posts = [], isLoading, isError, error } = useQuery<GiftingPost[]>({
    queryKey: ["/api/gifting"],
    queryFn: async () => {
      const r = await fetch("/api/gifting", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()) || r.statusText}`);
      return r.json();
    },
  });

  const stats = useMemo(() => {
    const active = (p: GiftingPost) => !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(p.status);
    return [
      { num: posts.filter(p => p.postType === "GIFT" && active(p)).length, label: "Gifts up now", color: "#C8FA3C" },
      { num: posts.filter(p => p.status === "GIFTED").length, label: "Homes found this season", color: "#FF1FA0" },
      { num: posts.filter(p => p.postType === "ISO" && active(p)).length, label: "In search of, open", color: "#19E3FF" },
    ];
  }, [posts]);

  const filtered = useMemo(() => {
    let rows = posts.slice();
    if (filter === "GIFT") rows = rows.filter(p => p.postType === "GIFT" && !isOpenGrabPost(p));
    if (filter === "ISO") rows = rows.filter(p => p.postType === "ISO");
    if (filter === "GRAB") rows = rows.filter(p => isOpenGrabPost(p));
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
        const uploadRes = await fetch("/api/upload/gifting", { method: "POST", body: fd, credentials: "include" });
        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        photoUrls = (await uploadRes.json()).urls || [];
      }
      const res = await fetch("/api/gifting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, photoUrls }),
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      return res;
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
    mutationFn: async ({ url, data }: { url: string; data?: any }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      return res;
    },
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

  const cardAccent = (post: GiftingPost) => {
    if (isOpenGrabPost(post)) return ACCENT.GRAB;
    return post.postType === "ISO" ? ACCENT.ISO : ACCENT.GIFT;
  };

  const cardStatus = (post: GiftingPost) => {
    if (post.postType === "ISO") return "Open — make an offer";
    if (isOpenGrabPost(post)) return "First come — grab it";
    if (post.interestCount >= 3) return "3 of 3 hands up";
    return `${post.interestCount} of 3 hands up`;
  };

  const cardCta = (post: GiftingPost) => {
    if (post.postType === "ISO") return "Offer it";
    if (isOpenGrabPost(post)) return "Grab it";
    if (post.interestCount >= 3) return "Full";
    return "Raise hand";
  };

  return (
    <div className="zine-page gifting-page board-page">
      <PageHero
        flush
        kicker="Pride season only · Now through July 26"
        titleLine1="Gift with"
        titleLine2="Pride"
        accent="rainbow"
        lede="A queer Portland free board for Pride-season closet chaos, event supplies, outfit saves, furniture, gear, tickets, décor, kink gear, circuit looks, and whatever else needs a new home."
        tagline="Give gay gifts. Queer homes. Keep it moving."
        taglineAccent="magenta"
        bgImage="/gift-with-pride-hero.jpg"
        actions={
          <>
            <button type="button" className="btn-neon" onClick={() => openForm("GIFT")}><Gift size={16} /> Post a gift</button>
            <button type="button" className="btn-neon cyan" onClick={() => openForm("ISO")}><Search size={16} /> Post an in search of</button>
            <a href="#how-it-works" className="gifting-how-link">How it works ↓</a>
          </>
        }
      />

      <BoardStatsBar stats={stats} />

      <ScrollReveal>
        <section id="how-it-works" className="gifting-how board-how board-how--inline diag">
          <div>
            <span className="board-sticker board-sticker--cyan">How it works</span>
            <h2 className="display section-heading gifting-how__title">How Gift with Pride works</h2>
            <p className="board-copy gifting-how__lede">Give what you can. Ask for what you need. Keep it local, free, and kind.</p>
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
          <div className="gifting-footer-line">Keep it free. Keep it kind. Keep it moving. · Now through July 26</div>
        </section>
      </ScrollReveal>

      {formOpen && (
        <ScrollReveal>
          <section id="gifting-form" className="gifting-form-panel">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={18} /></button>
            <h2 className="display section-heading">Post a {form.postType === "ISO" ? "in search of" : "gift"}</h2>
            <p className="board-copy-sm">No selling, trading, bartering, exact addresses, unsafe items, or hookup behavior. First-time posts are held for admin review.</p>
            <div className="gifting-form-grid">
              <label>Post type<select className="board-text-field" value={form.postType} onChange={e => setForm({ ...form, postType: e.target.value })}><option value="GIFT">Gift</option><option value="ISO">In search of</option></select></label>
              <label>Category<select className="board-text-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
              <label className="span">Title<input className="board-text-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={90} /></label>
              <label className="span">Description<textarea className="board-text-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} /></label>
              <label>Neighborhood / pickup area<input className="board-text-field" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label>
              <label>Pickup preference<select className="board-text-field" value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>{PICKUP.map(p => <option key={p}>{p}</option>)}</select></label>
              <label className="span">Photos, up to 2<input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} /></label>
            </div>
            <label className="gifting-rules"><input type="checkbox" checked={form.acceptRules} onChange={e => setForm({ ...form, acceptRules: e.target.checked })} /> I agree: Keep it free. Keep it kind. Keep it moving.</label>
            <button type="button" className="btn-neon solid" disabled={createMutation.isPending || !form.acceptRules} onClick={submitPost}>
              {createMutation.isPending ? "Posting…" : "Submit →"}
            </button>
          </section>
        </ScrollReveal>
      )}

      <BoardActiveSection
        className="diag"
        sticker="Active board"
        stickerTone="lime"
        title="Gifts & In Search Of"
        filters={
          <>
            {[
              { key: "ALL", label: "All" },
              { key: "GIFT", label: "Gift" },
              { key: "ISO", label: "In search of" },
              { key: "GRAB", label: "Open Grab" },
            ].map(f => (
              <BoardFilterChip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </BoardFilterChip>
            ))}
            <BoardSelectField value={category} onChange={setCategory}>
              <option value="ALL">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </BoardSelectField>
          </>
        }
        filterRow2={
          <>
            <BoardTextField value={neighborhood} onChange={setNeighborhood} placeholder="Neighborhood" />
            <BoardSelectField value={sort} onChange={setSort}>
              <option value="RECENT">Recently posted</option>
              <option value="EXPIRING">Expiring soon</option>
            </BoardSelectField>
          </>
        }
      >
        {isLoading ? (
          <BoardLoadingState label="Loading gifting posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#00FFFF" }}>
            <Gift size={40} style={{ color: "#00FFFF", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>COULD NOT LOAD POSTS</p>
            <p className="board-copy-sm">
              {error instanceof Error ? error.message : "The gifting board API is unavailable right now."}
            </p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gifting"] })} className="btn-neon" style={{ marginTop: 20 }}>
              TRY AGAIN
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">{posts.length === 0 ? "Nothing here yet" : "Nothing here yet"}</p>
            <p className="board-copy-sm">
              {posts.length === 0
                ? "No posts match this filter right now. Be the first — post a gift or an in search of."
                : "No posts match this filter right now. Try widening the search."}
            </p>
            {posts.length === 0 ? (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => openForm("GIFT")}>Post a gift</button>
            ) : (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="board-listing-grid">
            {filtered.map((post, index) => {
              const accent = cardAccent(post);
              const expanded = expandedId === post.id;
              const showDots = post.postType === "GIFT" && !isOpenGrabPost(post);
              return (
                <ScrollReveal key={post.id} delay={Math.min(index * 80, 400)}>
                  <article
                    className={`board-listing-card${expanded ? " is-expanded" : ""}`}
                    style={{ "--listing-accent": accent } as React.CSSProperties}
                    onClick={() => setExpandedId(expanded ? null : post.id)}
                  >
                    <div className="board-listing-card__row">
                      <div className="board-listing-card__thumb">
                        {post.photoUrls?.[0] ? (
                          <img src={post.photoUrls[0]} alt="" />
                        ) : (
                          <div
                            className="board-listing-card__thumb-fallback"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${post.postType === "ISO" ? "#A24BFF" : "#19E3FF"})` }}
                            aria-hidden="true"
                          />
                        )}
                        {(post.photoUrls?.length || 0) > 0 && (
                          <span className="board-listing-card__thumb-badge">▦ {post.photoUrls.length}</span>
                        )}
                      </div>
                      <div className="board-listing-card__main">
                        <div className="board-listing-card__tags">
                          <span className="board-listing-card__kind">{postTypeLabel(post.postType)}</span>
                          {isOpenGrabPost(post) && <span className="board-listing-card__grab">⊙ Open Grab</span>}
                          <span className="board-listing-card__time">{timeAgo(post.createdAt)}</span>
                        </div>
                        <h4 className="board-listing-card__title">{post.title}</h4>
                        <div className="board-listing-card__poster">
                          <UserAvatar
                            photoUrl={post.posterPhotoUrl}
                            avatarChoice={post.avatarChoice}
                            avatarRing={post.posterAvatarRing}
                            displayName={post.displayName}
                            username={post.username}
                            size={18}
                          />
                          <span>@{post.username} · {post.neighborhood || "Portland"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="board-listing-card__footer">
                      <div className="board-listing-card__status-wrap">
                        {showDots && (
                          <div className="board-listing-card__dots">
                            {[0, 1, 2].map(i => (
                              <span key={i} className={`board-listing-card__dot${i < post.interestCount ? " is-filled" : ""}`} />
                            ))}
                          </div>
                        )}
                        <span className="board-listing-card__status">{cardStatus(post)}</span>
                      </div>
                      <span className="board-listing-card__cta">{cardCta(post)} →</span>
                    </div>

                    {expanded && (
                      <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
                        <p>{post.description}</p>
                        <div className="gifting-details">{post.category} · {post.pickupPreference}</div>
                        {!post.isMine && !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(post.status) && (
                          <div className="gifting-response">
                            <textarea
                              placeholder={post.postType === "GIFT" ? "Short note: why you'd use this" : "Tell them what you have"}
                              value={activeNote[post.id] || ""}
                              onChange={e => setActiveNote(prev => ({ ...prev, [post.id]: e.target.value }))}
                              maxLength={240}
                            />
                            <button
                              onClick={() => submitResponse(post, post.postType === "GIFT" ? "interest" : "offer")}
                              disabled={!isOpenGrabPost(post) && post.postType === "GIFT" && post.interestCount >= 3}
                            >
                              {isOpenGrabPost(post) ? "On my way — grab it" : post.postType === "GIFT" && post.interestCount >= 3 ? "3 people interested. Poster choosing now." : post.postType === "GIFT" ? "I'm Interested" : "I have this"}
                            </button>
                          </div>
                        )}
                        {post.isMine && (
                          <div className="gifting-owner">
                            {post.interests?.length ? (
                              <div className="gifting-interest-list">
                                {post.interests.map(i => (
                                  <div key={i.id} className="gifting-interest-row">
                                    <UserAvatar photoUrl={i.photoUrl} avatarChoice={i.avatarChoice} avatarRing={i.avatarRing} displayName={i.displayName} username={i.username} size={28} />
                                    <span>{i.displayName || i.username}: {i.note}</span>
                                    {i.status === "INTERESTED" && <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/interests/${i.id}/choose` })}>Pick</button>}
                                  </div>
                                ))}
                              </div>
                            ) : <p>No responses yet.</p>}
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
                    )}
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </BoardActiveSection>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}
