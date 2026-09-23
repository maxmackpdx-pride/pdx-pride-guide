import BrowseStatus from "@/components/BrowseStatus";
import PageRecovery from "@/components/PageRecovery";
import { useQuery } from "@tanstack/react-query";
import { outzShareId, outzSharePath } from "@shared/outzShare";
import AuthModal from "@/components/AuthModal";
import {useAuth} from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";

/** Keep the field map's canvas, dialogs and styles isolated from the site shell. */
export type OutzDiscoveryPlace = { id: string; name: string; region: string; kind: string; short: string; accent: string; cardAccent?: string; note: string; href: string; lat?: number; lng?: number; logo?: string };

export default function Outz() {
  const sharedId = outzShareId(window.location.pathname);
  const {data: sharedPlace, isPending: sharePending, isError: shareError, refetch: retryShare} = useQuery({queryKey: ['outz-share', sharedId], enabled: !!sharedId, queryFn: async () => {
    const response = await fetch('/outzide-map/places.json');
    if (!response.ok) throw new Error('Destination unavailable');
    const data = await response.json();
    return data.places.find((place: {id: string; name: string}) => place.id === sharedId) as {id: string; name: string} | undefined ?? null;
  }});
  usePageSeo(sharedPlace ? sharedPlace.name + ' | OutZide by Zaylist' : "Outzide | Northwest field map | Zaylist", "Explore trails, campgrounds, hot springs, beaches and community stays across Oregon and Washington.", {
    image: sharedId ? 'https://www.zaylist.com/api/og/outzide/' + encodeURIComponent(sharedId) + '?v=1' : shareCardUrl("outzide"),
    url: sharedId ? 'https://www.zaylist.com' + outzSharePath(sharedId) : undefined,
    imageAlt: "OutZide by Zaylist — Northwest mountain, river, rainbow trails and outdoor waypoints",
  });
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapSlow, setMapSlow] = useState(false);
  const retryMap = () => { setMapReady(false); setMapSlow(false); setAttempt(value => value + 1); };
  useEffect(() => {
    if (mapReady) return;
    const timer = window.setTimeout(() => setMapSlow(true), 15000);
    return () => window.clearTimeout(timer);
  }, [attempt, mapReady]);
  const {user,loading}=useAuth();
  const [showAuth,setShowAuth]=useState(false);
  const [requested,setRequested]=useState(()=>new URLSearchParams(window.location.search).get('signup')==='1');
  const publish=()=>frame.current?.contentWindow?.postMessage({source:'outzide-host',type:'auth-state',allowed:!!user&&!loading},window.location.origin);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='outzide-map')return;
      if(event.data.type==='ready')publish();
      if(event.data.type==='browse-ready')setMapReady(true);
      if(event.data.type==='browse-error')setMapSlow(true);
      if(event.data.type==='require-auth'){setRequested(true);publish();if(!loading&&!user)setShowAuth(true);}
    };
    window.addEventListener('message',receive);publish();
    if(requested&&!loading&&!user)setShowAuth(true);
    if(user){setShowAuth(false);setRequested(false);}
    return()=>window.removeEventListener('message',receive);
  },[user,loading,requested]);
  const closeSignup=()=>{setShowAuth(false);setRequested(false);frame.current?.contentWindow?.postMessage({source:'outzide-host',type:'auth-cancel'},window.location.origin);};
  useEffect(() => {
    const resize = () => {
      if (!frame.current) return;
      const dockSpace = window.innerWidth < 960 ? (document.documentElement.dataset.mobileDock === "collapsed" ? 80 : 102) : 0;
      frame.current.style.height = `${Math.max(240, window.innerHeight - frame.current.getBoundingClientRect().top - dockSpace)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("zaylist:mobile-dock", resize);
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("zaylist:mobile-dock", resize); };
  }, [attempt, sharedId]);
  if(sharedId && !sharePending && (shareError || !sharedPlace))return <PageRecovery section="OutZide" title={shareError ? "This destination couldn’t load" : "Destination not found"} description="Browse Outzide to find a destination, or try this link again." href="/outzide" label="Browse Outzide" missing={!shareError} retry={shareError ? () => {void retryShare();} : undefined}/>;
  return <><div style={{ position: "relative" }}>
    {!mapReady && <div style={{ position: "absolute", inset: "12px 12px auto", zIndex: 2, background: "var(--ink-900, #08090b)", borderRadius: 16 }}><BrowseStatus
      title={mapSlow ? "Outzide is taking longer than expected" : "Loading Outzide…"}
      description={mapSlow ? "Try loading the field guide again." : "Getting destinations and the map ready."}
      onAction={retryMap} actionLabel="Reload Outzide" /></div>}
    <iframe key={attempt} onLoad={publish} ref={frame} src={"/outzide-map/index.html?v=mobile-optics-20260923&place=" + encodeURIComponent(sharedId || new URLSearchParams(window.location.search).get("place") || "") + (sharedId ? "&guestPlace=" + encodeURIComponent(sharedId) : "")} title="Outzide Northwest field map" allow="geolocation" style={{ display: "block", width: "100%", height: "calc(100dvh - 80px)", border: 0 }} /></div>{showAuth&&<AuthModal defaultTab="register" onClose={closeSignup}/>}</>;
}
