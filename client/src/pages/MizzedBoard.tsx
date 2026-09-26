import BoardShareButton from "@/components/BoardShareButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BoardFollowButton from "@/components/BoardFollowButton";
import SpottedCard from "@/components/SpottedCard";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import { MizzedComposer } from "@/components/SpottedCardGrid";
import type { LinkableMissedConnectionEvent, MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";
import { mizzedSource } from "@/lib/mizzedSource";
import "./MizzedBoard.css";

type Category = "all" | "events" | "placez" | "outzide" | "spot";
const filters: Array<{ id: Category; label: string }> = [
  { id: "all", label: "All connections" }, { id: "events", label: "Events" },
  { id: "placez", label: "Placez" }, { id: "outzide", label: "OutZide" },
  { id: "spot", label: "That one spot by the…" },
];
function category(post: MissedConnectionPost): Category {
  return post.eventId ? "events" : post.placeId ? "placez" : post.beachId ? "outzide" : "spot";
}

export default function MizzedBoard() {
  usePageSeo("Mizzed connections | Zaylist", "Anonymous connections from Eventz, Placez, OutZide and around Portland.", { image: shareCardUrl("spotted"), imageAlt: "Mizzed connections on Zaylist" });
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialSource = useMemo(() => ({ eventId: initialParams.get("event") || undefined, placeId: initialParams.get("place") || undefined, beachId: initialParams.get("beach") || undefined }), [initialParams]);
  const [compose, setCompose] = useState(() => window.location.pathname.endsWith("/new") || !!(initialSource.eventId || initialSource.placeId || initialSource.beachId));
  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<MissedConnectionPost | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const { data: posts = [], isLoading, isError, refetch } = useQuery<MissedConnectionPost[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: async () => { const response = await fetch("/api/missed-connections", { credentials: "include" }); if (!response.ok) throw new Error("Could not load connections"); return response.json(); },
  });
  const { data: events = [] } = useQuery<LinkableMissedConnectionEvent[]>({
    queryKey: ["/api/missed-connections/postable-events", "board"],
    enabled: !!user && compose,
    queryFn: async () => { const response = await fetch("/api/missed-connections/postable-events?scope=board", { credentials: "include" }); if (!response.ok) throw new Error("Could not load events"); return response.json(); },
  });
  const visible = useMemo(() => posts.filter(post => filter === "all" || category(post) === filter), [posts, filter]);
  useEffect(() => { if (rail.current) rail.current.scrollLeft = 0; }, [filter]);
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("post"));
    if (id && posts.length) setSelected(posts.find(post => post.id === id) || null);
  }, [posts]);
  const openComposer = () => { if (!user) { setShowAuth(true); return; } setCompose(true); window.setTimeout(() => document.getElementById("mizzed-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  return <main className="mizzed-board" id="top">
    <div className="mizzed-board__identity board-share-header"><BoardShareButton title="Mizzed Connections" path="/spotted" /><img src="/brand/family/mizzed-connection.svg" alt="Mizzed connections" /><span>Keep the secret. Find the spark.</span></div>
    <section className="mizzed-board__head" aria-labelledby="mizzed-title">
      <div><div className="mizzed-board__eyebrow">THE BOARD</div><h1 id="mizzed-title">Mizzed connections<span>.</span></h1><p>That moment you can't stop thinking about. See if they remember it too.</p><small>Anonymous posts · Private replies · Reveal when you're both ready</small></div>
      <div className="mizzed-board__actions"><BoardFollowButton board="mizzed" /><button className="mizzed-board__post" onClick={openComposer}><Plus size={17} /> Post to Mizzed <ArrowRight size={17} /></button></div>
    </section>
    {compose && user && <section className="mizzed-board__composer" id="mizzed-composer"><button className="mizzed-board__dismiss" type="button" onClick={() => setCompose(false)}>Close</button><h2>Post to Mizzed</h2><p>Choose where it happened. The post stays anonymous, and replies arrive privately.</p><MizzedComposer linkableEvents={events} initialSource={initialSource} onPosted={() => { setCompose(false); void refetch(); }} /></section>}
    <div className="mizzed-board__filters" role="group" aria-label="Filter connections by source">{filters.map(option => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div>
    {isLoading ? <p role="status">Loading connections…</p> : isError ? <p role="alert">Connections could not load. <button onClick={() => void refetch()}>Try again</button></p> : visible.length === 0 ? <div className="mizzed-board__empty"><h2>No connections here yet</h2><p>Someone has to make the first move.</p><button onClick={openComposer}>Post to Mizzed</button></div> : <>
      <div className="mizzed-board__rail" ref={rail} dir="rtl" aria-label="Mizzed connections">{visible.map(post => <div dir="ltr" className="mizzed-board__item" key={post.id} id={`board-post-${post.id}`}><SpottedCard post={post} accentColor="#ff37c2" onReply={() => setSelected(post)} makeover /></div>)}</div>
      <div className="mizzed-board__controls"><span>SWIPE TO EXPLORE</span><button type="button" aria-label="Previous connections" onClick={() => rail.current?.scrollBy({ left: 350, behavior: "smooth" })}><ArrowLeft size={19}/></button><button type="button" aria-label="Next connections" onClick={() => rail.current?.scrollBy({ left: -350, behavior: "smooth" })}><ArrowRight size={19}/></button></div>
    </>}
    {selected && <SpottedDetailModal postId={selected.id} title={selected.title} body={selected.body} place={selected.placeName || selected.eventTitle || selected.venueHint || "Around town"} kindLabel={mizzedSource(selected)?.label || "That one spot by the…"} kindColor="#ff37c2" isMine={selected.isMine} status={selected.status} source={mizzedSource(selected)} onClose={() => setSelected(null)} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
  </main>;
}
