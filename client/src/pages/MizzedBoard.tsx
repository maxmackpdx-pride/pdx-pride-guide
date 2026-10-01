import BoardShader from '@/components/board/BoardShader';
import { RoomKicker } from "@/components/ds";
import RoomPlate from "@/components/board/RoomPlate";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import SpottedCard from "@/components/SpottedCard";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import { MizzedComposer } from "@/components/SpottedCardGrid";
import type { LinkableMissedConnectionEvent, MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";
import { mizzedSource } from "@/lib/mizzedSource";
import "./MizzedBoard.css";
import { roomTitle } from "@/lib/rooms";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import BoardStatsBar from "@/components/BoardStatsBar";
import RoomDoorways from "@/components/RoomDoorways";

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
  usePageSeo(roomTitle("mizzed"), "Anonymous connections from Eventz, Placez, OutZide and around Portland.", { image: shareCardUrl("spotted"), imageAlt: "Mizzed connections on Zaylist" });
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
  const roomStats = [
    { num: posts.length, label: "Connections", color: "var(--room-mizzed)" },
    { num: posts.filter(post => category(post) === "events").length, label: "At events", color: "var(--room-eventz)" },
    { num: posts.filter(post => category(post) !== "events").length, label: "Around town", color: "var(--room-mizzed)" },
  ];
  useEffect(() => { if (rail.current) rail.current.scrollLeft = 0; }, [filter]);
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("post"));
    if (id && posts.length) setSelected(posts.find(post => post.id === id) || null);
  }, [posts]);
  const openComposer = () => { if (!user) { setShowAuth(true); return; } setCompose(true); window.setTimeout(() => document.getElementById("mizzed-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  return <main className="mizzed-board board-shader-page" data-shader-room="mizzed" id="top">
    <BoardShader room="mizzed" />
    <RoomPlate room="mizzed" />
    {!isLoading && !isError && <BoardStatsBar variant="band" stats={roomStats} />}
    <section className="mizzed-board__head" aria-labelledby="mizzed-title">
      <div><RoomKicker room="mizzed" as="div">The board</RoomKicker><h1 id="mizzed-title">Mizzed connections<span>.</span></h1><p>Maybe they noticed you, too. Leave a note about the moment you shared.</p><small>Anonymous posts · Private replies · Reveal when you're both ready</small></div>
      <div className="mizzed-board__actions"><button className="mizzed-board__post" onClick={openComposer}><Plus size={17} /> Post to Mizzed <ArrowRight size={17} /></button></div>
    </section>
    {compose && user && <section className="mizzed-board__composer" id="mizzed-composer"><button className="mizzed-board__dismiss" type="button" onClick={() => setCompose(false)}>Close</button><h2>Post to Mizzed</h2><p>Tell them where you crossed paths and what stayed with you. The post stays anonymous, and replies arrive privately.</p><MizzedComposer linkableEvents={events} initialSource={initialSource} onPosted={() => { setCompose(false); void refetch(); }} /></section>}
    <div className="mizzed-board__browse"><div><RoomKicker room="mizzed" as="div">Explore the board</RoomKicker><h2>Find the moment<span>.</span></h2></div><span role="status">{isLoading ? "Loading" : isError ? "Connections unavailable" : `${visible.length} ${visible.length === 1 ? "connection" : "connections"}`}</span></div>
    <div className="mizzed-board__filters" role="group" aria-label="Filter connections by source">{filters.map(option => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div>
    {isLoading ? <p role="status">Loading connections…</p> : isError ? <p role="alert">Connections could not load. <button onClick={() => void refetch()}>Try again</button></p> : visible.length === 0 ? <div className="mizzed-board__empty"><h2>No connections here yet</h2><p>Still thinking about someone? Maybe they’re looking for you here, too.</p><button onClick={openComposer}>Post to Mizzed</button></div> : <>
      <div className="mizzed-board__rail" ref={rail} dir="rtl" aria-label="Mizzed connections">{visible.map((post, index) => <div dir="ltr" className="mizzed-board__item" key={post.id} id={`board-post-${post.id}`}><SpottedCard post={post} accentColor="#ff37c2" onReply={() => setSelected(post)} makeover motifIndex={index} /></div>)}</div>
      <div className="mizzed-board__controls"><span>SWIPE TO EXPLORE</span><button type="button" aria-label="Previous connections" onClick={() => rail.current?.scrollBy({ left: 350, behavior: "smooth" })}><ArrowLeft size={19}/></button><button type="button" aria-label="Next connections" onClick={() => rail.current?.scrollBy({ left: -350, behavior: "smooth" })}><ArrowRight size={19}/></button></div>
    </>}
    {selected && <SpottedDetailModal postId={selected.id} title={selected.title} body={selected.body} place={selected.placeName || selected.eventTitle || selected.venueHint || "Around town"} kindLabel={mizzedSource(selected)?.label || "That one spot by the…"} kindColor="#ff37c2" isMine={selected.isMine} status={selected.status} source={mizzedSource(selected)} onClose={() => setSelected(null)} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    <RoomDoorways current="mizzed" />
    <BoardCloseSeam line="Say the thing." url="zaylist.com/mizzed" />
  </main>;
}
