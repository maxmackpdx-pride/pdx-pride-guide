import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Bookmark, Plus, RotateCcw, Search, ShieldCheck, Tag, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import { Button } from "@/components/ds";
import SellzListingCard, { type SellzPost } from "@/components/board/SellzListingCard";
import BoardFollowButton from "@/components/BoardFollowButton";
import { usePageSeo } from "@/hooks/usePageSeo";
import { timeAgo } from "@/lib/boardFeed";
import "./PrideWork.css";
import "./Sellz.css";

const CATEGORIES = ["Clothing", "Drag", "Leather and gear", "Home", "Furniture", "Electronics", "Art", "Tickets", "Tools", "Outdoor", "Collectibles", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair", "For parts"];
const PICKUP = ["Public meetup", "Porch pickup", "Event handoff", "Delivery available", "Message to coordinate"];
const blank = { title: "", description: "", category: "Clothing", condition: "Good", price: "", negotiable: false, neighborhood: "", pickupPreference: "Message to coordinate", acceptRules: false };

type View = "ALL" | "SAVED" | "MINE";
type Sort = "NEWEST" | "PRICE_LOW" | "PRICE_HIGH";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

function SellzGrid({ posts, saved, selectedId, onSelect }: { posts: SellzPost[]; saved: Set<number>; selectedId: number | null; onSelect: (id: number) => void }) {
  return <div className="sellz-listing-grid">
    {posts.map((post, index) => <button type="button" key={post.id} className="gigz-opportunity sellz-listing" style={{ "--gigz-accent": ["#39ff14", "#83e35d", "#a5fb6e", "#49cb92"][index % 4] } as CSSProperties} onClick={() => onSelect(post.id)} aria-expanded={selectedId === post.id} aria-label={`View listing: ${post.title}`}>
      {post.photoUrls?.[0] ? <img src={post.photoUrls[0]} alt="" loading="lazy" /> : <span className="sellz-listing__fallback" aria-hidden="true"><Tag size={65} strokeWidth={1.2} /></span>}
      <span className="gigz-opportunity__shade" />
      <span className="gigz-opportunity__top"><span><em>{post.category}</em><small>{post.username === "hausing_demo" ? "DEMO LISTING" : `${post.status === "ACTIVE" ? "Available" : post.status.toLowerCase()} · ${timeAgo(post.createdAt)}`}</small></span><span className="gigz-opportunity__arrow"><ArrowUpRight size={20} /></span></span>
      <span className="gigz-opportunity__bottom"><strong>{post.title}</strong><span>{post.condition} · {post.neighborhood || "Portland"}</span><em>{money(post.priceCents)}{post.negotiable ? " OBO" : ""}</em></span>
      {saved.has(post.id) && <span className="sellz-listing__saved"><Bookmark size={13} fill="currentColor" /> Saved</span>}
    </button>)}
  </div>;
}

export default function Sellz() {
  usePageSeo("SELLZ | Zaylist", "Buy and sell with Portland's queer community. Simple listings, real people, local handoffs.");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [category, setCategory] = useState(() => new URLSearchParams(location.search).get("category") || "ALL");
  const [condition, setCondition] = useState("ALL");
  const [price, setPrice] = useState("ALL");
  const [view, setView] = useState<View>("ALL");
  const [sort, setSort] = useState<Sort>("NEWEST");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deepLinkHandled = useRef(false);
  const [missingLinkedPost, setMissingLinkedPost] = useState(false);
  const deepLinkPostId = useMemo(() => Number(new URLSearchParams(location.search).get("post")), []);

  const { data: posts = [], isLoading, isError, refetch } = useQuery<SellzPost[]>({
    queryKey: ["/api/sellz"],
    queryFn: async () => {
      const response = await fetch("/api/sellz", { credentials: "include" });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
  });
  const { data: savedIds = [] } = useQuery<number[]>({
    queryKey: ["/api/sellz/saved/ids"],
    queryFn: async () => {
      const response = await fetch("/api/sellz/saved/ids", { credentials: "include" });
      return response.ok ? response.json() : [];
    },
    enabled: !!user,
  });
  const {
    data: minePosts = [],
    isLoading: mineIsLoading,
    isError: mineIsError,
    refetch: refetchMine,
  } = useQuery<SellzPost[]>({
    queryKey: ["/api/sellz/mine", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/sellz/mine", { credentials: "include" });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    enabled: !!user && (view === "MINE" || deepLinkPostId > 0),
  });
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  useEffect(() => {
    deepLinkHandled.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading || deepLinkHandled.current || !deepLinkPostId || isLoading) return;
    const publicMatch = posts.some(post => post.id === deepLinkPostId);
    if (publicMatch) {
      setMissingLinkedPost(false);
      setExpandedId(deepLinkPostId);
      setTimeout(() => document.getElementById(`sellz-post-${deepLinkPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
      deepLinkHandled.current = true;
      return;
    }
    if (user && mineIsLoading) return;
    if (user && minePosts.some(post => post.id === deepLinkPostId)) {
      setMissingLinkedPost(false);
      setView("MINE");
      setExpandedId(deepLinkPostId);
      setTimeout(() => document.getElementById(`sellz-post-${deepLinkPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    }
    if (!posts.some(post => post.id === deepLinkPostId) && !minePosts.some(post => post.id === deepLinkPostId)) setMissingLinkedPost(true);
    deepLinkHandled.current = true;
  }, [authLoading, deepLinkPostId, isLoading, mineIsLoading, minePosts, posts, user]);

  useEffect(() => {
    if (!authLoading && !user && view === "MINE") setView("ALL");
  }, [authLoading, user, view]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    search ? params.set("q", search) : params.delete("q");
    category !== "ALL" ? params.set("category", category) : params.delete("category");
    history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}`);
  }, [search, category]);

  const filtered = useMemo(() => {
    const sourcePosts = view === "MINE" && user ? minePosts : posts;
    const matches = sourcePosts.filter(post => {
      if (category !== "ALL" && post.category !== category) return false;
      if (condition !== "ALL" && post.condition !== condition) return false;
      if (view === "SAVED" && !saved.has(post.id)) return false;
      if (view === "MINE" && !post.isMine) return false;
      if (price === "UNDER25" && post.priceCents >= 2500) return false;
      if (price === "25TO100" && (post.priceCents < 2500 || post.priceCents > 10000)) return false;
      if (price === "OVER100" && post.priceCents <= 10000) return false;
      const query = search.trim().toLowerCase();
      const haystack = [post.title, post.description, post.category, post.condition, post.neighborhood, post.pickupPreference, post.username]
        .map(value => String(value || "").toLowerCase());
      return !query || haystack.some(value => value.includes(query));
    });
    return matches.sort((a, b) => {
      if (sort === "PRICE_LOW") return a.priceCents - b.priceCents;
      if (sort === "PRICE_HIGH") return b.priceCents - a.priceCents;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [posts, minePosts, category, condition, view, user, saved, price, search, sort]);

  const ownerView = view === "MINE" && !!user;
  const resultsLoading = ownerView ? mineIsLoading : isLoading;
  const resultsError = ownerView ? mineIsError : isError;

  const activeCount = posts.filter(post => post.status === "ACTIVE").length;
  const filtersActive = Boolean(search.trim() || category !== "ALL" || condition !== "ALL" || price !== "ALL" || view !== "ALL" || sort !== "NEWEST");
  const activeListings = filtered.filter(post => post.status === "ACTIVE" || post.status === "RESERVED");
  const inactiveMine = ownerView ? filtered.filter(post => post.status !== "ACTIVE" && post.status !== "RESERVED") : [];
  const selected = filtered.find(post => post.id === expandedId) || minePosts.find(post => post.id === expandedId) || posts.find(post => post.id === expandedId);

  const clearFilters = () => {
    setSearch(""); setCategory("ALL"); setCondition("ALL"); setPrice("ALL"); setView("ALL"); setSort("NEWEST");
  };
  const openForm = () => {
    if (!user) return setShowAuth(true);
    setFormOpen(true);
    setTimeout(() => document.getElementById("sellz-form")?.scrollIntoView({ behavior: "smooth" }), 20);
  };
  const select = (id: number) => {
    setExpandedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("post", String(id));
    window.history.replaceState(null, "", url.pathname + url.search);
    setTimeout(() => document.getElementById("sellz-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
  };
  const closeDetail = () => {
    setExpandedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  return <main className="gigz-page sellz-page sellz-board-page">
    <div className="gigz-shell">
      <div className="gigz-identity"><img src="/brand/family/sellz.svg" alt="Sellz" /><span>Good stuff. New hands.</span></div>
      <div className="gigz-section-head"><div><div className="gigz-eyebrow">THE MARKETPLACE</div><h1>Find your next good thing<span>.</span></h1><p>Buy and sell with your community. Message, agree, and hand off directly.</p></div>
        <div className="sellz-board-actions"><BoardFollowButton board="sellz" /><button type="button" className="gigz-post" onClick={openForm}><Plus size={17} /> Sell something <ArrowUpRight size={16} /></button></div>
      </div>
      <div className="sellz-board-filters" aria-label="Filter Sellz listings">
        <label>Search Sellz<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search listings and neighborhoods" /></label>
        <label>View<select value={view} onChange={event => { const value = event.target.value as View; user || value === "ALL" ? setView(value) : setShowAuth(true); }}><option value="ALL">All listings</option><option value="SAVED">Saved</option><option value="MINE">My listings</option></select></label>
        <label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Condition<select value={condition} onChange={event => setCondition(event.target.value)}><option value="ALL">Any condition</option>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Price<select value={price} onChange={event => setPrice(event.target.value)}><option value="ALL">Any price</option><option value="UNDER25">Under $25</option><option value="25TO100">$25 to $100</option><option value="OVER100">Over $100</option></select></label>
        <label>Sort<select value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="NEWEST">Newest</option><option value="PRICE_LOW">Price: low to high</option><option value="PRICE_HIGH">Price: high to low</option></select></label>
        {filtersActive && <button type="button" onClick={clearFilters}><RotateCcw size={14} /> Clear filters</button>}
      </div>
      <div className="sellz-board-summary"><span>{activeCount} available · {activeListings.length} showing</span><span><ShieldCheck size={15} /> No checkout or in-app payments</span></div>
      {formOpen && <SellzComposer onClose={() => setFormOpen(false)} onPosted={id => { setFormOpen(false); select(id); }} />}
      {missingLinkedPost && <div role="status" className="gigz-empty">This shared listing is no longer available. It may have been sold or removed.</div>}
      {resultsLoading ? <BoardFeedSkeleton label="Loading Sellz listings" shape="board" count={4} /> : resultsError ? <div className="gigz-empty" role="alert">Could not load Sellz. <button type="button" onClick={() => void (ownerView ? refetchMine() : refetch())}>Try again</button></div> : activeListings.length ? <SellzGrid posts={activeListings} saved={saved} selectedId={expandedId} onSelect={select} /> : <div className="gigz-empty"><Search size={30} /><p>{view === "SAVED" ? "You have no matching saved listings." : view === "MINE" ? "You have no matching active listings." : "Nothing matches yet. Try broader filters or start a listing."}</p><button type="button" onClick={filtersActive ? clearFilters : openForm}>{filtersActive ? "Clear filters" : "Sell something"}</button></div>}
      {inactiveMine.length > 0 && <section className="sellz-inactive" aria-label="Your other listings"><h2>Your other listings</h2><p>Review and manage completed or pending listings.</p><div>{inactiveMine.map(post => <button type="button" key={post.id} onClick={() => select(post.id)}>{post.title} <span>{post.status}</span></button>)}</div></section>}
      {selected && <section id="sellz-detail" className="gigz-detail sellz-detail" aria-label="Selected Sellz listing"><button type="button" className="gigz-detail__close" onClick={closeDetail} aria-label="Close details"><X size={18} /></button><SellzListingCard key={selected.id} post={selected} saved={saved.has(selected.id)} expanded onToggle={closeDetail} onRequireAuth={() => setShowAuth(true)} onDeleted={closeDetail} /></section>}
      <p className="sellz-board-rules">No weapons · no illegal goods · no counterfeit goods · no in-app payments</p>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  </main>;
}


export function SellzComposer({onClose, onPosted}: {onClose: () => void; onPosted: (id: number) => void}) {
  const {toast} = useToast();
  const [form, setForm] = useState<any>(blank);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const create = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] = [];
      if (photos?.length) {
        const formData = new FormData();
        Array.from(photos).slice(0, 6).forEach(file => formData.append("photos", file));
        const upload = await fetch("/api/upload/sellz", { method: "POST", credentials: "include", body: formData });
        if (!upload.ok) throw new Error(await upload.text());
        photoUrls = (await upload.json()).urls || [];
      }
      const response = await fetch("/api/sellz", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrls }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || response.statusText);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellz"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellz/mine"] });
      onPosted(data.id);
      setForm(blank);
      setPhotos(null);
      toast({ title: "Your listing is live" });
    },
    onError: (error: any) => toast({ title: "Could not post", description: error.message, variant: "destructive" }),
  });

  return <section id="sellz-form" className="gifting-form board-path-card pdx-glass-rebind"><button className="gifting-close" onClick={onClose} aria-label="Close"><X /></button><p className="board-section-kicker board-section-kicker--lime">New listing</p><h2 className="display section-heading">Sell something</h2><div className="gifting-form-grid"><label className="span">Title<input className="board-text-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What are you selling?" /></label><label className="span">Description<textarea className="board-text-field" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Useful details, dimensions, flaws, what is included." /></label><label>Price<input className="board-text-field" inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$" /></label><label>Category<select className="board-text-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label><label>Condition<select className="board-text-field" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></label><label>Neighborhood<input className="board-text-field" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label><label>Handoff<select className="board-text-field" value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>{PICKUP.map(value => <option key={value}>{value}</option>)}</select></label><label className="span">Photos, up to 6<input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} /></label></div><label className="gifting-rules"><input type="checkbox" checked={form.negotiable} onChange={e => setForm({ ...form, negotiable: e.target.checked })} />Open to offers</label><label className="gifting-rules"><input type="checkbox" checked={form.acceptRules} onChange={e => setForm({ ...form, acceptRules: e.target.checked })} />I own this item, described it honestly, and agree to the marketplace rules.</label><Button variant="solid" accent="green" size="lg" disabled={create.isPending || !form.acceptRules || !form.title || !form.price} onClick={() => create.mutate()}>{create.isPending ? "Posting…" : "Post listing"}</Button></section>;
}
