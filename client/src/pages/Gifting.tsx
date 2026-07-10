import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, HeartHandshake, RefreshCw, ShieldAlert, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import CommunityBoardHeroRow from "@/components/CommunityBoardHeroRow";
import BoardHero from "@/components/BoardHero";
import BoardHowItWorks from "@/components/BoardHowItWorks";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";
import BoardStatsBar from "@/components/BoardStatsBar";
import BoardActiveSection, { BoardFilterChip, BoardSelectField, BoardTextField } from "@/components/BoardActiveSection";
import { Button } from "@/components/ds";
import { isOpenGrabPost, timeAgo } from "@/lib/boardFeed";
import { usePageSeo } from "@/hooks/usePageSeo";

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

const HOW_IT_WORKS: Array<{ title: string; body: string; color: string }> = [
  { title: "Post it", body: "Gift it, or search for it.", color: "#ccff00" },
  { title: "Add photos", body: "Up to two. The site makes them fit.", color: "#19e3ff" },
  { title: "Three hands max", body: "Only three people can raise a hand on a gift.", color: "#ff1fa0" },
  { title: "Poster picks", body: "They choose one and send a message.", color: "#ff8c00" },
  { title: "Hand it off", body: "Porch, public meetup, or event handoff.", color: "#ccff00" },
  { title: "Stamp it done", body: "Gifted or Found, then it leaves the feed.", color: "#19e3ff" },
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

const ACCENT = {
  GIFT: "#ccff00",
  ISO: "#19e3ff",
  GRAB: "#ff8c00",
} as const;

function isActivePost(p: GiftingPost) {
  return !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(p.status);
}

function ghostLetter(category: string) {
  return (category || "?").trim().charAt(0).toUpperCase();
}

function kindLabel(post: GiftingPost) {
  if (isOpenGrabPost(post)) return "Open grab";
  if (post.postType === "ISO") return "In search of";
  return "Gift";
}

function thumbGradient(post: GiftingPost) {
  if (isOpenGrabPost(post)) return "linear-gradient(135deg,#ff8c00,#ccff00)";
  if (post.postType === "ISO") return "linear-gradient(135deg,#19e3ff,#8a4bff)";
  return "linear-gradient(135deg,#ccff00,#19e3ff)";
}

export default function Gifting() {
  usePageSeo(
    "Gifting Board | PDX Pride Guide | Portland Pride 2026",
    "Give and find free stuff in Portland's queer community during Pride 2026 and beyond. PDX Pride gifting and ISO board.",
  );
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
    const active = posts.filter(isActivePost);
    return [
      { num: active.filter(p => p.postType === "GIFT").length, label: "Gifts up now", color: ACCENT.GIFT },
      { num: active.filter(p => p.postType === "ISO").length, label: "In search of, open", color: ACCENT.ISO },
      { num: posts.filter(p => p.status === "GIFTED" || p.status === "FOUND").length, label: "Homes found this season", color: "#ff1fa0" },
    ];
  }, [posts]);

  const filterCounts = useMemo(() => {
    const active = posts.filter(isActivePost);
    let gift = 0;
    let iso = 0;
    let grab = 0;
    for (const p of active) {
      if (isOpenGrabPost(p)) grab += 1;
      else if (p.postType === "ISO") iso += 1;
      else gift += 1;
    }
    return { ALL: active.length, GIFT: gift, ISO: iso, GRAB: grab };
  }, [posts]);

  const filtered = useMemo(() => {
    let rows = posts.slice();
    if (filter === "GIFT") rows = rows.filter(p => p.postType === "GIFT" && !isOpenGrabPost(p));
    if (filter === "ISO") rows = rows.filter(p => p.postType === "ISO");
    if (filter === "GRAB") rows = rows.filter(p => isOpenGrabPost(p));
    if (category !== "ALL") rows = rows.filter(p => p.category === category);
    if (neighborhood.trim()) {
      rows = rows.filter(p => (p.neighborhood || "").toLowerCase().includes(neighborhood.trim().toLowerCase()));
    }
    rows.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "LONGEST" ? ta - tb : tb - ta;
    });
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
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
      toast({ title: "Updated" });
    },
    onError: (err: any) => toast({ title: "Could not update", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gifting/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
      setExpandedId(null);
      toast({ title: "Post deleted" });
    },
    onError: (err: any) => toast({ title: "Could not delete", description: err.message, variant: "destructive" }),
  });

  const handleDeletePost = (post: GiftingPost) => {
    if (!confirm(`Delete "${post.title}"? This removes it from the board.`)) return;
    deleteMutation.mutate(post.id);
  };

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
    // Open Grab can proceed without a note; gift interest / ISO offer need one
    if (!isOpenGrabPost(post) && !note) {
      return toast({ title: "Add a short note first", variant: "destructive" });
    }
    actionMutation.mutate({ url: `/api/gifting/${post.id}/${endpoint}`, data: { note } });
    setActiveNote(prev => ({ ...prev, [post.id]: "" }));
  };

  const cardAccent = (post: GiftingPost) => {
    if (isOpenGrabPost(post)) return ACCENT.GRAB;
    return post.postType === "ISO" ? ACCENT.ISO : ACCENT.GIFT;
  };

  const cardStatus = (post: GiftingPost) => {
    if (post.status === "PENDING") return "Pending admin review";
    if (post.postType === "ISO") return "Open · make an offer";
    if (isOpenGrabPost(post)) return "First come · grab it";
    if (post.interestCount >= 3) return "3 of 3 hands up";
    return `${post.interestCount} of 3 hands up`;
  };

  const cardCta = (post: GiftingPost) => {
    if (post.postType === "ISO") return "Offer it";
    if (isOpenGrabPost(post)) return "Grab it";
    if (post.interestCount >= 3) return "Full";
    return "Raise hand";
  };

  const chipDefs: Array<{ key: string; label: string; accent: string }> = [
    { key: "ALL", label: "All", accent: "lime" },
    { key: "GIFT", label: "Gift", accent: "lime" },
    { key: "ISO", label: "In search of", accent: "cyan" },
    { key: "GRAB", label: "Open grab", accent: "orange" },
  ];

  return (
    <div className="zine-page gifting-page board-page board-page--makeover">
      <CommunityBoardHeroRow
        active="gifting"
        actions={
          <>
            <Button variant="solid" accent="lime" size="lg" arrow onClick={() => openForm("GIFT")}>
              Post a gift
            </Button>
            <Button variant="neon" accent="cyan" size="lg" onClick={() => openForm("ISO")}>
              Post an ISO
            </Button>
          </>
        }
      >
        <BoardHero
          accent="lime"
          kicker="Free board · Pride season 2026"
          title={<>Gift with <span className="board-hero__title-accent">Pride</span></>}
          lede="A queer Portland free board for closet chaos, event supplies, outfit saves, furniture, gear, tickets, and whatever else needs a new home. Give what you can. Ask for what you need."
        />
      </CommunityBoardHeroRow>

      <BoardStatsBar stats={stats} variant="band" showLive={false} />

      <ScrollReveal>
        <BoardHowItWorks
          className="gifting-how"
          kickerTone="cyan"
          title={<>How Gift with <span className="board-how__title-accent">Pride</span> works</>}
          lede="Give what you can. Ask for what you need. Keep it local, free, and kind. First-time posts are held for a quick admin review."
          steps={HOW_IT_WORKS}
          footerLine="Keep it free · keep it kind · keep it moving · now through July 26"
        />
      </ScrollReveal>

      {formOpen && (
        <ScrollReveal>
          <section id="gifting-form" className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <div className="board-section-kicker board-section-kicker--lime">New post</div>
            <h2 className="display section-heading">
              {form.postType === "ISO" ? "Post an in search of" : "Post a gift"}
            </h2>
            <p className="board-copy-sm">
              No selling, trading, exact addresses, unsafe items, or hookup behavior. Keep it free, keep it kind, keep it moving. First-time posts are held for admin review.
            </p>
            <div className="gifting-form-grid">
              <label>
                Post type
                <select className="board-text-field" value={form.postType} onChange={e => setForm({ ...form, postType: e.target.value })}>
                  <option value="GIFT">Gift</option>
                  <option value="ISO">In search of</option>
                </select>
              </label>
              <label>
                Category
                <select className="board-text-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="span">
                Title
                <input
                  className="board-text-field"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  maxLength={90}
                  placeholder="e.g. Rack of drag looks, sizes S to L"
                />
              </label>
              <label className="span">
                Description
                <textarea
                  className="board-text-field"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="What is it, what condition, any details worth knowing."
                />
              </label>
              <label>
                Neighborhood / pickup area
                <input
                  className="board-text-field"
                  value={form.neighborhood}
                  onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="e.g. Inner SE"
                />
              </label>
              <label>
                Pickup preference
                <select className="board-text-field" value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>
                  {PICKUP.map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="span">
                Photos, up to 2
                <input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} />
              </label>
            </div>
            <label className="gifting-rules">
              <input
                type="checkbox"
                checked={form.acceptRules}
                onChange={e => setForm({ ...form, acceptRules: e.target.checked })}
              />
              I agree: keep it free, keep it kind, keep it moving.
            </label>
            <Button
              variant="solid"
              accent="lime"
              size="lg"
              arrow
              disabled={createMutation.isPending || !form.acceptRules}
              onClick={submitPost}
            >
              {createMutation.isPending ? "Posting…" : "Post it"}
            </Button>
          </section>
        </ScrollReveal>
      )}

      <BoardActiveSection
        className="diag"
        sticker="Active board"
        stickerTone="lime"
        stickerStyle="mono"
        title="Gifts & in search of"
        resultCount={`${filtered.length} showing`}
        filters={
          <>
            {chipDefs.map(f => (
              <BoardFilterChip
                key={f.key}
                active={filter === f.key}
                onClick={() => setFilter(f.key)}
                accent={f.accent}
                count={filterCounts[f.key as keyof typeof filterCounts]}
              >
                {f.label}
              </BoardFilterChip>
            ))}
          </>
        }
        filterRow2={
          <>
            <BoardSelectField value={category} onChange={setCategory}>
              <option value="ALL">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </BoardSelectField>
            <BoardTextField value={neighborhood} onChange={setNeighborhood} placeholder="Neighborhood" />
            <BoardSelectField value={sort} onChange={setSort}>
              <option value="RECENT">Recently posted</option>
              <option value="LONGEST">Longest up</option>
            </BoardSelectField>
          </>
        }
      >
        {isLoading ? (
          <BoardLoadingState label="Loading gifting posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#00FFFF" }}>
            <Gift size={40} style={{ color: "#00FFFF", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>Could not load posts</p>
            <p className="board-copy-sm">
              {error instanceof Error ? error.message : "The gifting board API is unavailable right now."}
            </p>
            <Button variant="neon" accent="cyan" style={{ marginTop: 20 }} onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gifting"] })}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--makeover">
            <p className="display section-heading">Nothing on the shelf right now</p>
            <p className="board-copy-sm">
              Free stuff goes fast. Widen your search, or post what you are hunting for and let it find you.
            </p>
            <div className="board-empty__actions">
              <Button variant="solid" accent="lime" onClick={() => openForm("GIFT")}>
                Post a gift
              </Button>
              <Button variant="neon" accent="cyan" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="board-listing-grid board-listing-grid--makeover">
            {filtered.map((post, index) => {
              const accent = cardAccent(post);
              const expanded = expandedId === post.id;
              const showDots = post.postType === "GIFT" && !isOpenGrabPost(post);
              const grab = isOpenGrabPost(post);
              return (
                <ScrollReveal key={post.id} delay={Math.min(index * 80, 400)}>
                  <article
                    className={`board-listing-card board-listing-card--makeover${expanded ? " is-expanded" : ""}`}
                    style={{ "--listing-accent": accent } as React.CSSProperties}
                    onClick={() => setExpandedId(expanded ? null : post.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(expanded ? null : post.id);
                      }
                    }}
                  >
                    <div className="board-listing-card__row">
                      <div
                        className="board-listing-card__thumb"
                        style={
                          post.photoUrls?.[0]
                            ? undefined
                            : { background: thumbGradient(post) }
                        }
                      >
                        {post.photoUrls?.[0] ? (
                          <img src={post.photoUrls[0]} alt="" />
                        ) : (
                          <>
                            <span className="board-listing-card__ghost" aria-hidden="true">
                              {ghostLetter(post.category)}
                            </span>
                            <div className="board-listing-card__thumb-fallback" aria-hidden="true" />
                          </>
                        )}
                        {grab && <span className="board-listing-card__grab-badge">Grab</span>}
                        {!grab && (post.photoUrls?.length || 0) > 0 && (
                          <span className="board-listing-card__thumb-badge">▦ {post.photoUrls.length}</span>
                        )}
                      </div>
                      <div className="board-listing-card__main">
                        <div className="board-listing-card__tags">
                          <span className="board-listing-card__kind board-listing-card__kind--text">
                            {kindLabel(post)}
                          </span>
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
                        <div className="board-listing-card__footer">
                          <div className="board-listing-card__status-wrap">
                            {showDots && (
                              <div className="board-listing-card__dots">
                                {[0, 1, 2].map(i => (
                                  <span
                                    key={i}
                                    className={`board-listing-card__dot${i < post.interestCount ? " is-filled" : ""}`}
                                  />
                                ))}
                              </div>
                            )}
                            <span className="board-listing-card__status">{cardStatus(post)}</span>
                          </div>
                          <span className="board-listing-card__cta">{cardCta(post)} →</span>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
                        <p>{post.description}</p>
                        <div className="gifting-details">{post.category} · {post.pickupPreference}</div>
                        {!post.isMine && !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(post.status) && (
                          <div className="gifting-response">
                            <textarea
                              placeholder={
                                grab
                                  ? "Say hi (optional), then head over."
                                  : post.postType === "GIFT"
                                    ? "Short note: why you would use this."
                                    : "Tell them what you have."
                              }
                              value={activeNote[post.id] || ""}
                              onChange={e => setActiveNote(prev => ({ ...prev, [post.id]: e.target.value }))}
                              maxLength={240}
                            />
                            <button
                              onClick={() => submitResponse(post, post.postType === "GIFT" ? "interest" : "offer")}
                              disabled={!grab && post.postType === "GIFT" && post.interestCount >= 3}
                            >
                              {grab
                                ? "On my way, grab it"
                                : post.postType === "GIFT" && post.interestCount >= 3
                                  ? "Full, poster is choosing"
                                  : post.postType === "GIFT"
                                    ? "I'm interested"
                                    : "I have this"}
                            </button>
                          </div>
                        )}
                        {post.isMine && (
                          <div className="gifting-owner">
                            {post.status === "PENDING" && (
                              <p className="gifting-pending-note">
                                Held for admin review. Only you see this on the board until it&apos;s approved.
                              </p>
                            )}
                            {post.interests?.length ? (
                              <div className="gifting-interest-list">
                                {post.interests.map(i => (
                                  <div key={i.id} className="gifting-interest-row">
                                    <UserAvatar
                                      photoUrl={i.photoUrl}
                                      avatarChoice={i.avatarChoice}
                                      avatarRing={i.avatarRing}
                                      displayName={i.displayName}
                                      username={i.username}
                                      size={28}
                                    />
                                    <span>{i.displayName || i.username}: {i.note}</span>
                                    {i.status === "INTERESTED" && (
                                      <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/interests/${i.id}/choose` })}>
                                        Pick
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>No responses yet.</p>
                            )}
                            {post.postType === "GIFT" && (
                              <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-gifted` })}>
                                <HeartHandshake size={14} /> Mark Gifted
                              </button>
                            )}
                            {post.postType === "ISO" && (
                              <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-found` })}>
                                <HeartHandshake size={14} /> Mark Found
                              </button>
                            )}
                            <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/reopen` })}>
                              <RefreshCw size={14} /> Reopen one spot
                            </button>
                            <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/renew` })}>
                              <RefreshCw size={14} /> Renew once
                            </button>
                            <button
                              type="button"
                              className="gifting-delete-btn"
                              onClick={() => handleDeletePost(post)}
                              disabled={deleteMutation.isPending}
                            >
                              <X size={14} /> Delete post
                            </button>
                          </div>
                        )}
                        <details className="gifting-report">
                          <summary><ShieldAlert size={13} /> Report</summary>
                          <input
                            placeholder="What's wrong?"
                            value={report[post.id] || ""}
                            onChange={e => setReport(prev => ({ ...prev, [post.id]: e.target.value }))}
                          />
                          <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/report`, data: { reason: report[post.id] } })}>
                            Send report
                          </button>
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

      <BoardCloseSeam
        line="Pride is a protest. Take care of each other."
        url="prideguidepdx.com/gifting"
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}
