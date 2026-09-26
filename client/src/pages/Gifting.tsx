import BoardShareButton from "@/components/BoardShareButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowUpRight, Gift, MapPin, Plus, Search, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import GiftListingCard, { type GiftingPost } from "@/components/board/GiftListingCard";
import { Button } from "@/components/ds";
import { isOpenGrabPost } from "@/lib/boardFeed";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";
import SafetyGuide from "@/components/SafetyGuide";
import BoardFollowButton from "@/components/BoardFollowButton";
import { trackProductEvent } from "@/lib/analytics";
import { timeAgo } from "@/lib/boardFeed";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import type { CSSProperties } from "react";
import "./PrideWork.css";
import "./Gifting.css";

const CATEGORIES = [
  "Clothing", "Party Closet", "Costumes and Theme Wear", "Circuit Party Wear", "Drag",
  "Kink Gear", "Leather / Rubber / Fetish Wear", "Event Supplies", "Pride Weekend Stuff",
  "Home Goods", "Furniture", "Kitchen", "Electronics", "Books and Media", "Art and Craft Supplies",
  "Pet Stuff", "Tickets or Passes", "Tools", "Decorations", "Camping / Beach / River Gear",
  "Beauty / Grooming", "Other",
];

const PICKUP = ["Open Grab", "Porch pickup", "Public meetup", "Event handoff", "Flexible pickup", "Message to coordinate"];

const blankForm = {
  postType: "GIFT",
  title: "",
  description: "",
  category: "Party Closet",
  neighborhood: "",
  pickupPreference: "Message to coordinate",
  acceptRules: false,
};

function isActivePost(p: GiftingPost) {
  return !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(p.status);
}

function GiftRail({ posts, type, selected, onSelect }: {
  posts: GiftingPost[]; type: "GIFT" | "ISO"; selected: number | null; onSelect: (id: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    if (!api) return;
    const update = () => { setCanPrev(api.canScrollPrev()); setCanNext(api.canScrollNext()); };
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  return <>
    <Carousel setApi={setApi} opts={{ align: "start", dragFree: true, direction: "rtl" }} className="gigz-rail" dir="rtl">
      <CarouselContent className="gigz-rail__track">
        {posts.map((post, index) => <CarouselItem key={post.id} className="gigz-rail__item" dir="ltr">
          {type === "GIFT" ? <button type="button" className="gigz-opportunity giftz-offer" style={{ "--gigz-accent": ["#ccff00", "#a4d84a", "#e1ff80", "#89d69d"][index % 4] } as CSSProperties} onClick={() => onSelect(post.id)} aria-expanded={selected === post.id} aria-label={`View gift: ${post.title}`}>
            {post.photoUrls?.[0] ? <img src={post.photoUrls[0]} alt="" loading="lazy" /> : <span className="giftz-offer__fallback" aria-hidden="true"><Gift size={76} strokeWidth={1.2} /></span>}
            <span className="gigz-opportunity__shade" /><span className="gigz-opportunity__top"><span><em>{post.category || "GIFT OFFERED"}</em><small>{post.username === "hausing_demo" ? "DEMO LISTING" : `Gift offered · ${timeAgo(post.createdAt)}`}</small></span><span className="gigz-opportunity__arrow"><ArrowUpRight size={20} /></span></span>
            <span className="gigz-opportunity__bottom"><strong>{post.title}</strong><span>{post.neighborhood || "Portland"} · {post.pickupPreference || "Message to coordinate"}</span><em>FREE</em></span>
          </button> : <button type="button" className="gigz-talent giftz-iso" style={{ "--gigz-accent": ["#ccff00", "#b9eb75", "#e0ff87"][index % 3] } as CSSProperties} onClick={() => onSelect(post.id)} aria-expanded={selected === post.id} aria-label={`View ISO: ${post.title}`}>
            <span className="gigz-talent__status"><span><i /> In search of</span><small>{post.username === "hausing_demo" ? "DEMO LISTING" : `Posted ${timeAgo(post.createdAt)}`}</small></span>
            <span className="gigz-talent__portrait">{post.photoUrls?.[0] ? <img src={post.photoUrls[0]} alt="" loading="lazy" /> : <Search size={66} strokeWidth={1.2} aria-hidden="true" />}</span>
            <strong>{post.title}</strong><span className="giftz-iso__category">{post.category || "COMMUNITY REQUEST"}</span>
            <span className="gigz-talent__location"><MapPin size={14} />{post.neighborhood || "Portland"} · {post.pickupPreference || "Message to coordinate"}</span>
            <span className="gigz-talent__hire">I have something <ArrowUpRight size={18} /></span><span className="gigz-talent__caption"><Search size={15} /> Community request</span>
          </button>}
        </CarouselItem>)}
      </CarouselContent>
    </Carousel>
    <div className="gigz-rail__controls"><span>SWIPE TO EXPLORE <ArrowLeft size={15} /></span><div><button type="button" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={`Previous ${type === "GIFT" ? "gifts" : "ISO posts"}`}><ArrowRight size={18} /></button><button type="button" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={`Next ${type === "GIFT" ? "gifts" : "ISO posts"}`}><ArrowLeft size={18} /></button></div></div>
  </>;
}


export default function Gifting() {
  const contentStartedAt = useRef(performance.now());
  usePageSeo(
    "GIFTZ | Zaylist",
    "Give and find free stuff for the scene - all year on GIFTZ.",
    { image: shareCardUrl("gifting"), imageAlt: "GIFTZ on Zaylist" },
  );
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [composeType, setComposeType] = useState<"GIFT" | "ISO">("GIFT");
  const [filter, setFilter] = useState(() => {
    const type = new URLSearchParams(window.location.search).get("type")?.toUpperCase();
    return type === "GIFT" || type === "ISO" ? type : "ALL";
  });
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get("category") || "ALL");
  const [neighborhood, setNeighborhood] = useState(() => new URLSearchParams(window.location.search).get("neighborhood") || "");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [onlyMine, setOnlyMine] = useState(() => new URLSearchParams(window.location.search).get("mine") === "1");
  const [sort, setSort] = useState(() => new URLSearchParams(window.location.search).get("sort") === "oldest" ? "LONGEST" : "RECENT");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deepLinkHandled = useRef(false);

  const { data: posts = [], isLoading, isError, error } = useQuery<GiftingPost[]>({
    queryKey: ["/api/gifting"],
    queryFn: async () => {
      const r = await fetch("/api/gifting", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()) || r.statusText}`);
      return r.json();
    },
  });
  const { data: giftingStatus, isPending: giftingStatusPending } = useQuery<{ postingOpen: boolean; message: string }>({
    queryKey: ["/api/gifting/status"],
  });
  const postingOpen = giftingStatus?.postingOpen === true;
  // A filtered board is a shareable place, not disposable component state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filter === "ALL") params.delete("type"); else params.set("type", filter);
    if (category === "ALL") params.delete("category"); else params.set("category", category);
    if (neighborhood.trim()) params.set("neighborhood", neighborhood.trim()); else params.delete("neighborhood");
    if (search.trim()) params.set("q", search.trim()); else params.delete("q");
    if (onlyMine) params.set("mine", "1"); else params.delete("mine");
    if (sort === "LONGEST") params.set("sort", "oldest"); else params.delete("sort");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [category, filter, neighborhood, onlyMine, search, sort]);
  useEffect(() => {
    if (!isLoading) trackProductEvent("time_to_content", "gifz", performance.now() - contentStartedAt.current);
  }, [isLoading]);

  // Canonical product deep-links open the requested post expanded.
  useEffect(() => {
    if (deepLinkHandled.current || !posts.length) return;
    const pid = new URLSearchParams(window.location.search).get("post");
    if (!pid) { deepLinkHandled.current = true; return; }
    const id = Number(pid);
    if (Number.isFinite(id) && posts.some(p => p.id === id)) {
      deepLinkHandled.current = true;
      setExpandedId(id);
      window.setTimeout(() => {
        document.getElementById(`board-post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    } else if (posts.length) {
      deepLinkHandled.current = true;
    }
  }, [posts]);

  const filtered = useMemo(() => {
    let rows = posts.slice();
    if (filter === "GIFT") rows = rows.filter(p => p.postType === "GIFT" && !isOpenGrabPost(p));
    if (filter === "ISO") rows = rows.filter(p => p.postType === "ISO");
    if (filter === "GRAB") rows = rows.filter(p => isOpenGrabPost(p));
    if (category !== "ALL") rows = rows.filter(p => p.category === category);
    if (onlyMine && user) rows = rows.filter(p => p.isMine);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(p =>
        [p.title, p.description, p.category, p.neighborhood, p.pickupPreference]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(q)),
      );
    }
    if (neighborhood.trim()) {
      rows = rows.filter(p => (p.neighborhood || "").toLowerCase().includes(neighborhood.trim().toLowerCase()));
    }
    rows.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "LONGEST" ? ta - tb : tb - ta;
    });
    return rows;
  }, [posts, filter, category, neighborhood, onlyMine, search, sort, user]);

  const openForm = (postType: "GIFT" | "ISO") => {
    if (giftingStatusPending) {
      toast({ title: "Checking posting availability", description: "The existing GIFTZ board is still available while this loads." });
      return;
    }
    if (!postingOpen) {
      toast({ title: "New GIFTZ posts are paused", description: giftingStatus?.message });
      return;
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    setComposeType(postType);
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("gifting-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const clearFilters = () => {
    setFilter("ALL");
    setCategory("ALL");
    setNeighborhood("");
    setSearch("");
    setOnlyMine(false);
    setSort("RECENT");
  };

  const offered = filtered.filter(post => isActivePost(post) && post.postType === "GIFT");
  const requested = filtered.filter(post => isActivePost(post) && post.postType === "ISO");
  const inactiveMine = onlyMine ? filtered.filter(post => post.isMine && !isActivePost(post)) : [];
  const selected = posts.find(post => post.id === expandedId);
  const select = (id: number) => {
    setExpandedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("post", String(id));
    window.history.replaceState(null, "", url.pathname + url.search);
    window.setTimeout(() => document.getElementById("giftz-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
  };
  const closeDetail = () => {
    setExpandedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  return <main className="gigz-page giftz-page gifting-page">
    <div className="gigz-shell">
      <div className="gigz-identity board-share-header"><BoardShareButton title="Giftz" path="/gifting" /><img src="/brand/family/giftz.svg" alt="Giftz" /><span>Pass it on. Find what you need.</span></div>
      <div className="gigz-section-head"><div><div className="gigz-eyebrow">THE BOARD</div><h1>Good things move around<span>.</span></h1><p>Give what you can. Find what you need. Keep it free.</p></div>
        <div className="giftz-actions"><BoardFollowButton board="giftz" /><button type="button" className="gigz-post" disabled={!postingOpen} onClick={() => openForm("GIFT")}><Plus size={17} />{giftingStatusPending ? "Checking posting…" : postingOpen ? "Post a gift" : "Posting paused"}<ArrowUpRight size={16} /></button></div>
      </div>
      {!postingOpen && giftingStatus && <p className="giftz-posting-status" role="status">{giftingStatus.message}</p>}
      <div className="giftz-filters" aria-label="Filter Giftz posts">
        <label>Search Giftz<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles and details" /></label>
        <label>Show<select value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">Offered & ISO</option><option value="GIFT">Gifts offered</option><option value="ISO">In search of</option><option value="GRAB">Open grab</option></select></label>
        <label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Neighborhood<input type="search" value={neighborhood} onChange={event => setNeighborhood(event.target.value)} placeholder="Anywhere nearby" /></label>
        {user && <label className="giftz-filters__check"><input type="checkbox" checked={onlyMine} onChange={event => setOnlyMine(event.target.checked)} /> My posts</label>}
        <label>Sort<select value={sort} onChange={event => setSort(event.target.value)}><option value="RECENT">Recently posted</option><option value="LONGEST">Longest up</option></select></label>
        {(filter !== "ALL" || search || category !== "ALL" || neighborhood || onlyMine || sort !== "RECENT") && <button type="button" onClick={clearFilters}>Clear filters</button>}
      </div>
      {isError ? <div className="gigz-empty" role="alert">Could not load Giftz posts. <button type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gifting"] })}>Try again</button></div> : <>
        {isLoading ? <BoardFeedSkeleton label="Loading gifts offered" shape="board" count={3} /> : offered.length ? <GiftRail posts={offered} type="GIFT" selected={expandedId} onSelect={select} /> : <div className="gigz-empty">No gifts offered match right now. {postingOpen && <button type="button" onClick={() => openForm("GIFT")}>Post a gift</button>}</div>}
        <div className="gigz-talent-zone"><div className="gigz-section-head"><div><div className="gigz-eyebrow">IN SEARCH OF</div><h2>On someone’s wish list<span>.</span></h2><p>See what neighbors are looking for. You might have just the thing.</p></div><button type="button" className="gigz-post" disabled={!postingOpen} onClick={() => openForm("ISO")}><Plus size={17} /> Post an ISO <ArrowUpRight size={16} /></button></div>
          {!isLoading && (requested.length ? <GiftRail posts={requested} type="ISO" selected={expandedId} onSelect={select} /> : <div className="gigz-empty">No ISO posts match right now. {postingOpen && <button type="button" onClick={() => openForm("ISO")}>Post what you need</button>}</div>)}
        </div>
      </>}
      {!isLoading && !isError && inactiveMine.length > 0 && <section className="giftz-inactive" aria-label="Your other posts"><h2>Your other posts</h2><p>Pending and completed posts are here so you can review and manage them.</p><div>{inactiveMine.map(post => <button type="button" key={post.id} onClick={() => select(post.id)}>{post.title} <span>{post.status}</span></button>)}</div></section>}
      {selected && <section id="giftz-detail" className="gigz-detail giftz-detail" aria-label="Selected Giftz post"><button type="button" className="gigz-detail__close" onClick={closeDetail} aria-label="Close details"><X size={18} /></button><GiftListingCard post={selected} expanded onToggle={closeDetail} onRequireAuth={() => setShowAuth(true)} onDeleted={closeDetail} /></section>}
      {formOpen && <GiftComposer initialType={composeType} onClose={() => setFormOpen(false)} onPosted={id => { setFormOpen(false); select(id); }} />}
      <SafetyGuide context="gifts" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  </main>;
}

export function GiftComposer({initialType = "GIFT", onClose, onPosted}: {initialType?: "GIFT" | "ISO"; onClose: () => void; onPosted: (id: number) => void}) {
  const {toast} = useToast();
  const status = useQuery<{postingOpen: boolean; message: string}>({queryKey: ["/api/gifting/status"]});
  const postingOpen = status.data?.postingOpen === true;
  const [form, setForm] = useState<typeof blankForm>({ ...blankForm, postType: initialType });
  const [photos, setPhotos] = useState<FileList | null>(null);
  const createMutation = useMutation({
    mutationFn: async () => {
      trackProductEvent("post_attempt", "gifz");
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
      trackProductEvent("post_completed", "gifz");
      const body = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
      toast({ title: "Posted", description: body.message });
      setForm(blankForm);
      setPhotos(null);
      onPosted(body.id);
    },
    onError: (err: any) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
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

  return <>
    {status.isPending ? <p role="status">Checking posting availability…</p> : status.isError ? <p role="alert">Posting availability could not load. <button onClick={() => void status.refetch()}>Retry</button></p> : !postingOpen ? <p role="status">{status.data?.message}</p> : null}
          <section id="gifting-form" className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind">
            <button type="button" className="gifting-close" onClick={onClose} aria-label="Close form">
              <X size={18} />
            </button>
            <div className="board-section-kicker board-section-kicker--lime">New post</div>
            <h2 className="display section-heading">
              {form.postType === "ISO" ? "Post an in search of" : "Post a gift"}
            </h2>
            <p className="board-copy-sm">
              No selling, trading, exact addresses, unsafe items, or hookup behavior. Keep it free, keep it kind, keep it moving. Posts go live right away and are removed if they break the rules.
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
              disabled={!postingOpen || createMutation.isPending || !form.acceptRules}
              onClick={submitPost}
            >
              {createMutation.isPending ? "Posting…" : "Post it"}
            </Button>
          </section>
  </>;
}
