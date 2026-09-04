import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import SellzListingCard, { type SellzPost } from "@/components/board/SellzListingCard";
import { usePageSeo } from "@/hooks/usePageSeo";
import "./Sellz.css";

const CATEGORIES = ["Clothing", "Drag", "Leather and gear", "Home", "Furniture", "Electronics", "Art", "Tickets", "Tools", "Outdoor", "Collectibles", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair", "For parts"];
const PICKUP = ["Public meetup", "Porch pickup", "Event handoff", "Delivery available", "Message to coordinate"];
const blank = { title: "", description: "", category: "Clothing", condition: "Good", price: "", negotiable: false, neighborhood: "", pickupPreference: "Message to coordinate", acceptRules: false };

type View = "ALL" | "SAVED" | "MINE";
type Sort = "NEWEST" | "PRICE_LOW" | "PRICE_HIGH";

export default function Sellz() {
  usePageSeo("SELLZ | Zaylist", "Buy and sell with Portland's queer community. Simple listings, real people, local handoffs.");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [category, setCategory] = useState(() => new URLSearchParams(location.search).get("category") || "ALL");
  const [condition, setCondition] = useState("ALL");
  const [price, setPrice] = useState("ALL");
  const [view, setView] = useState<View>("ALL");
  const [sort, setSort] = useState<Sort>("NEWEST");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deepLinkHandled = useRef(false);
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
      setExpandedId(deepLinkPostId);
      setTimeout(() => document.getElementById(`sellz-post-${deepLinkPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
      deepLinkHandled.current = true;
      return;
    }
    if (user && mineIsLoading) return;
    if (user && minePosts.some(post => post.id === deepLinkPostId)) {
      setView("MINE");
      setExpandedId(deepLinkPostId);
      setTimeout(() => document.getElementById(`sellz-post-${deepLinkPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    }
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
  const reservedCount = posts.filter(post => post.status === "RESERVED").length;
  const filtersActive = Boolean(search.trim() || category !== "ALL" || condition !== "ALL" || price !== "ALL" || view !== "ALL" || sort !== "NEWEST");

  const clearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setCondition("ALL");
    setPrice("ALL");
    setView("ALL");
    setSort("NEWEST");
  };

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellz"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellz/mine"] });
      setFormOpen(false);
      setForm(blank);
      setPhotos(null);
      toast({ title: "Your listing is live" });
    },
    onError: (error: any) => toast({ title: "Could not post", description: error.message, variant: "destructive" }),
  });

  const openForm = () => {
    if (!user) return setShowAuth(true);
    setFormOpen(true);
    setTimeout(() => document.getElementById("sellz-form")?.scrollIntoView({ behavior: "smooth" }), 20);
  };

  return (
    <div className="zine-page board-page board-page--makeover sellz-page">
      <header className="sellz-market-header">
        <div className="sellz-market-header__identity">
          <div>
            <p className="sellz-market-header__kicker">Portland's queer marketplace</p>
            <img className="sellz-market-header__logo" src="/brand/family/sellz.svg" alt="SELLZ" />
            <p className="sellz-market-header__lede">Find something good. Message the seller. Make the handoff directly.</p>
          </div>
          <Button variant="solid" accent="green" size="lg" onClick={openForm}><Plus size={18} aria-hidden="true" /> Sell something</Button>
        </div>

        <div className="sellz-market-search">
          <Search size={23} aria-hidden="true" />
          <label className="sr-only" htmlFor="sellz-search">Search SELLZ</label>
          <input id="sellz-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search listings, categories, neighborhoods…" />
          {search ? <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={18} /></button> : null}
        </div>

        <div className="sellz-market-toolbar" aria-label="Marketplace filters">
          <div className="sellz-market-views" aria-label="Listing view">
            <button className={view === "ALL" ? "is-active" : ""} type="button" onClick={() => setView("ALL")}>All</button>
            <button className={view === "SAVED" ? "is-active" : ""} type="button" onClick={() => user ? setView("SAVED") : setShowAuth(true)}>Saved{user && saved.size ? <span>{saved.size}</span> : null}</button>
            <button className={view === "MINE" ? "is-active" : ""} type="button" onClick={() => user ? setView("MINE") : setShowAuth(true)}>My listings</button>
          </div>
          <div className="sellz-market-selects">
            <label><span>Category</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Condition</span><select value={condition} onChange={event => setCondition(event.target.value)}><option value="ALL">Any condition</option>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Price</span><select value={price} onChange={event => setPrice(event.target.value)}><option value="ALL">Any price</option><option value="UNDER25">Under $25</option><option value="25TO100">$25 to $100</option><option value="OVER100">Over $100</option></select></label>
            <label><span>Sort</span><select value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="NEWEST">Newest</option><option value="PRICE_LOW">Price: low to high</option><option value="PRICE_HIGH">Price: high to low</option></select></label>
          </div>
          {filtersActive ? <button className="sellz-market-clear" type="button" onClick={clearFilters}><RotateCcw size={14} aria-hidden="true" /> Reset</button> : null}
        </div>

        <div className="sellz-market-status">
          <span><strong>{activeCount}</strong> available</span>
          <span><strong>{reservedCount}</strong> reserved</span>
          <span className="sellz-market-status__safety"><ShieldCheck size={15} aria-hidden="true" /> No checkout or in-app payments</span>
        </div>
      </header>

      {formOpen ? <ScrollReveal><section id="sellz-form" className="gifting-form board-path-card pdx-glass-rebind"><button className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close"><X /></button><p className="board-section-kicker board-section-kicker--lime">New listing</p><h2 className="display section-heading">Sell something</h2><div className="gifting-form-grid"><label className="span">Title<input className="board-text-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What are you selling?" /></label><label className="span">Description<textarea className="board-text-field" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Useful details, dimensions, flaws, what is included." /></label><label>Price<input className="board-text-field" inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$" /></label><label>Category<select className="board-text-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label><label>Condition<select className="board-text-field" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></label><label>Neighborhood<input className="board-text-field" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label><label>Handoff<select className="board-text-field" value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>{PICKUP.map(value => <option key={value}>{value}</option>)}</select></label><label className="span">Photos, up to 6<input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} /></label></div><label className="gifting-rules"><input type="checkbox" checked={form.negotiable} onChange={e => setForm({ ...form, negotiable: e.target.checked })} />Open to offers</label><label className="gifting-rules"><input type="checkbox" checked={form.acceptRules} onChange={e => setForm({ ...form, acceptRules: e.target.checked })} />I own this item, described it honestly, and agree to the marketplace rules.</label><Button variant="solid" accent="green" size="lg" disabled={create.isPending || !form.acceptRules || !form.title || !form.price} onClick={() => create.mutate()}>{create.isPending ? "Posting…" : "Post listing"}</Button></section></ScrollReveal> : null}

      <main id="sellz-board" className="sellz-market-results">
        <div className="sellz-market-results__head">
          <div>
            <p className="sellz-market-results__kicker">Marketplace</p>
            <h1>What people are selling</h1>
          </div>
          <p aria-live="polite">{filtered.length} {filtered.length === 1 ? "listing" : "listings"}</p>
        </div>

        {resultsLoading ? <BoardFeedSkeleton label="Loading SELLZ listings" shape="board" count={6} /> : resultsError ? (
          <div className="board-empty board-empty--makeover sellz-market-empty" role="alert">
            <p className="display section-heading">Could not load SELLZ</p>
            <p>The marketplace did not load. Try again without losing your filters.</p>
            <Button variant="neon" accent="green" onClick={() => view === "MINE" ? refetchMine() : refetch()}>Try again</Button>
          </div>
        ) : filtered.length ? (
          <div className="board-listing-grid board-listing-grid--makeover sellz-market-grid">
            {filtered.map((post, index) => <ScrollReveal key={post.id} className={`sellz-market-cell${expandedId === post.id ? " is-expanded" : ""}`} delay={Math.min(index * 45, 270)}><SellzListingCard post={post} saved={saved.has(post.id)} expanded={expandedId === post.id} onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)} onRequireAuth={() => setShowAuth(true)} /></ScrollReveal>)}
          </div>
        ) : (
          <div className="board-empty board-empty--makeover sellz-market-empty">
            <Search size={38} />
            <p className="display section-heading">Nothing matches yet</p>
            <p>{view === "SAVED" ? "You have not saved a matching listing yet." : view === "MINE" ? "You do not have a matching listing yet." : "Try a broader search or reset the filters."}</p>
            <div className="sellz-market-empty__actions">
              {filtersActive ? <Button variant="neon" accent="green" onClick={clearFilters}>Reset filters</Button> : null}
              <Button variant="solid" accent="green" onClick={openForm}>Sell something</Button>
            </div>
          </div>
        )}
      </main>

      <section className="sellz-market-how" aria-labelledby="sellz-how-title">
        <div>
          <p className="sellz-market-results__kicker">How SELLZ works</p>
          <h2 id="sellz-how-title">Direct, local, and easy to close out</h2>
        </div>
        <ol>
          <li><strong>List it</strong><span>Add photos, condition, price, and neighborhood.</span></li>
          <li><strong>Message</strong><span>Buyers ask questions or send an offer through Inbox.</span></li>
          <li><strong>Reserve</strong><span>The seller chooses a buyer and pauses the listing.</span></li>
          <li><strong>Finish directly</strong><span>Arrange payment and pickup yourselves, then mark it sold.</span></li>
        </ol>
        <p className="sellz-market-how__rules">No weapons · no illegal goods · no counterfeit goods · no in-app payments</p>
      </section>

      <BoardCloseSeam line="Local stuff · real people · simple handoffs" url="zaylist.com/sellz" />
      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
    </div>
  );
}
