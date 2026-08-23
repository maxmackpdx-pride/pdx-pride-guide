import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardHero from "@/components/BoardHero";
import BoardHowItWorks from "@/components/BoardHowItWorks";
import BoardStatsBar from "@/components/BoardStatsBar";
import BoardActiveSection, { BoardFilterChip, BoardSelectField, BoardTextField } from "@/components/BoardActiveSection";
import BoardLoadingState from "@/components/BoardLoadingState";
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

export default function Sellz() {
  usePageSeo("SELLZ | Zaylist", "Buy and sell with Portland's queer community. Simple listings, real people, local handoffs.");
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [category, setCategory] = useState(() => new URLSearchParams(location.search).get("category") || "ALL");
  const [condition, setCondition] = useState("ALL");
  const [price, setPrice] = useState("ALL");
  const [view, setView] = useState<"ALL" | "SAVED" | "MINE">("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deepLinkHandled = useRef(false);
  const { data: posts = [], isLoading, isError } = useQuery<SellzPost[]>({ queryKey: ["/api/sellz"], queryFn: async () => { const r = await fetch("/api/sellz", { credentials: "include" }); if (!r.ok) throw new Error(await r.text()); return r.json(); } });
  const { data: savedIds = [] } = useQuery<number[]>({ queryKey: ["/api/sellz/saved/ids"], queryFn: async () => { const r = await fetch("/api/sellz/saved/ids", { credentials: "include" }); return r.ok ? r.json() : []; }, enabled: !!user });
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  useEffect(() => {
    if (deepLinkHandled.current || !posts.length) return;
    const id = Number(new URLSearchParams(location.search).get("post"));
    if (id && posts.some(post => post.id === id)) { setExpandedId(id); setTimeout(() => document.getElementById(`sellz-post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250); }
    deepLinkHandled.current = true;
  }, [posts]);
  useEffect(() => { const p = new URLSearchParams(location.search); search ? p.set("q", search) : p.delete("q"); category !== "ALL" ? p.set("category", category) : p.delete("category"); history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`); }, [search, category]);
  const filtered = useMemo(() => posts.filter(post => {
    if (category !== "ALL" && post.category !== category) return false;
    if (condition !== "ALL" && post.condition !== condition) return false;
    if (view === "SAVED" && !saved.has(post.id)) return false;
    if (view === "MINE" && !post.isMine) return false;
    if (price === "UNDER25" && post.priceCents >= 2500) return false;
    if (price === "25TO100" && (post.priceCents < 2500 || post.priceCents > 10000)) return false;
    if (price === "OVER100" && post.priceCents <= 10000) return false;
    const q = search.trim().toLowerCase();
    return !q || [post.title, post.description, post.category, post.neighborhood].some(value => value.toLowerCase().includes(q));
  }), [posts, category, condition, view, saved, price, search]);
  const create = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] = [];
      if (photos?.length) { const fd = new FormData(); Array.from(photos).slice(0, 6).forEach(file => fd.append("photos", file)); const upload = await fetch("/api/upload/sellz", { method: "POST", credentials: "include", body: fd }); if (!upload.ok) throw new Error(await upload.text()); photoUrls = (await upload.json()).urls || []; }
      const r = await fetch("/api/sellz", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, photoUrls }) });
      const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || r.statusText); return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sellz"] }); setFormOpen(false); setForm(blank); setPhotos(null); toast({ title: "Your listing is live" }); },
    onError: (error: any) => toast({ title: "Could not post", description: error.message, variant: "destructive" }),
  });
  const openForm = () => { if (!user) return setShowAuth(true); setFormOpen(true); setTimeout(() => document.getElementById("sellz-form")?.scrollIntoView({ behavior: "smooth" }), 20); };
  return <div className="zine-page board-page board-page--makeover sellz-page">
    <BoardHero kicker="Local marketplace · real people" title="SELLZ" lede="Buy and sell with the scene. Search fast, message a real person, and work out payment and pickup together." accent="green" actions={<><Button variant="solid" accent="green" size="lg" arrow onClick={openForm}>Sell something</Button><Button variant="neon" accent="green" size="lg" onClick={() => document.getElementById("sellz-board")?.scrollIntoView({ behavior: "smooth" })}>Browse listings</Button></>} />
    <BoardStatsBar stats={[{ num: posts.filter(p => p.status === "ACTIVE").length, label: "Available now", color: "#39ff14" }, { num: posts.filter(p => p.status === "RESERVED").length, label: "Reserved", color: "#19e3ff" }, { num: CATEGORIES.length, label: "Categories", color: "#ff8c00" }]} variant="band" showLive={false} />
    <ScrollReveal><BoardHowItWorks className="sellz-how" kickerTone="lime" title="Sell it without making it complicated" lede="Post what you have, find a real person nearby, make a plan, and mark it sold." steps={[{ title: "List it", body: "Photos, price, condition, neighborhood. Nothing else required.", color: "#39ff14" }, { title: "Find it", body: "Search, category, condition, price, and saved listings.", color: "#19e3ff" }, { title: "Message", body: "Ask if it is available or send an offer through the Zaylist inbox.", color: "#ff8c00" }, { title: "Reserve", body: "The seller chooses a buyer and the listing visibly pauses.", color: "#39ff14" }, { title: "Meet safely", body: "Coordinate payment and handoff directly. Zaylist never holds funds.", color: "#19e3ff" }, { title: "Mark sold", body: "Close the loop so the board stays clean and current.", color: "#ff1fa0" }]} footerLine="No weapons · no illegal goods · no counterfeit goods · no in-app payments" /></ScrollReveal>
    {formOpen ? <ScrollReveal><section id="sellz-form" className="gifting-form board-path-card pdx-glass-rebind"><button className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close"><X /></button><p className="board-section-kicker board-section-kicker--lime">New listing</p><h2 className="display section-heading">Sell something</h2><div className="gifting-form-grid"><label className="span">Title<input className="board-text-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What are you selling?" /></label><label className="span">Description<textarea className="board-text-field" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Useful details, dimensions, flaws, what is included." /></label><label>Price<input className="board-text-field" inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$" /></label><label>Category<select className="board-text-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></label><label>Condition<select className="board-text-field" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{CONDITIONS.map(x => <option key={x}>{x}</option>)}</select></label><label>Neighborhood<input className="board-text-field" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label><label>Handoff<select className="board-text-field" value={form.pickupPreference} onChange={e => setForm({ ...form, pickupPreference: e.target.value })}>{PICKUP.map(x => <option key={x}>{x}</option>)}</select></label><label className="span">Photos, up to 6<input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)} /></label></div><label className="gifting-rules"><input type="checkbox" checked={form.negotiable} onChange={e => setForm({ ...form, negotiable: e.target.checked })} />Open to offers</label><label className="gifting-rules"><input type="checkbox" checked={form.acceptRules} onChange={e => setForm({ ...form, acceptRules: e.target.checked })} />I own this item, described it honestly, and agree to the marketplace rules.</label><Button variant="solid" accent="green" size="lg" disabled={create.isPending || !form.acceptRules || !form.title || !form.price} onClick={() => create.mutate()}>{create.isPending ? "Posting…" : "Post listing"}</Button></section></ScrollReveal> : null}
    <div id="sellz-board"><BoardActiveSection className="diag" sticker="Marketplace" stickerTone="lime" title="What people are selling" resultCount={`${filtered.length} showing`} filters={<><BoardFilterChip active={view === "ALL"} onClick={() => setView("ALL")} accent="green">All</BoardFilterChip><BoardFilterChip active={view === "SAVED"} onClick={() => user ? setView("SAVED") : setShowAuth(true)} accent="cyan">Saved</BoardFilterChip><BoardFilterChip active={view === "MINE"} onClick={() => user ? setView("MINE") : setShowAuth(true)} accent="orange">My listings</BoardFilterChip></>} filterRow2={<><BoardTextField type="search" value={search} onChange={setSearch} placeholder="Search SELLZ" /><BoardSelectField value={category} onChange={setCategory}><option value="ALL">All categories</option>{CATEGORIES.map(x => <option key={x}>{x}</option>)}</BoardSelectField><BoardSelectField value={condition} onChange={setCondition}><option value="ALL">Any condition</option>{CONDITIONS.map(x => <option key={x}>{x}</option>)}</BoardSelectField><BoardSelectField value={price} onChange={setPrice}><option value="ALL">Any price</option><option value="UNDER25">Under $25</option><option value="25TO100">$25 to $100</option><option value="OVER100">Over $100</option></BoardSelectField></>}>
      {isLoading ? <BoardLoadingState label="Loading SELLZ listings" /> : isError ? <div className="board-empty"><p className="display section-heading">Could not load SELLZ</p></div> : filtered.length ? <div className="board-listing-grid board-listing-grid--makeover">{filtered.map((post, i) => <ScrollReveal key={post.id} delay={Math.min(i * 60, 360)}><SellzListingCard post={post} saved={saved.has(post.id)} expanded={expandedId === post.id} onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)} onRequireAuth={() => setShowAuth(true)} /></ScrollReveal>)}</div> : <div className="board-empty board-empty--makeover"><Search size={38} /><p className="display section-heading">Nothing matches yet</p><p>Clear a filter or post the thing someone is looking for.</p><Button variant="solid" accent="green" onClick={openForm}>Sell something</Button></div>}
    </BoardActiveSection></div>
    <BoardCloseSeam line="Local stuff · real people · simple handoffs" url="zaylist.com/sellz" />
    {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
  </div>;
}
