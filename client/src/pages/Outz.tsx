import AuthModal from "@/components/AuthModal";
import {useAuth} from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";

/** Keep the field map's canvas, dialogs and styles isolated from the site shell. */
export type OutzDiscoveryPlace = { id: string; name: string; region: string; kind: string; short: string; accent: string; cardAccent?: string; note: string; href: string; lat?: number; lng?: number; logo?: string };

export default function Outz() {
  usePageSeo("OutZide | Northwest field map | Zaylist", "Explore trails, campgrounds, hot springs, beaches and community stays across Oregon and Washington.");
  const frame = useRef<HTMLIFrameElement>(null);
  const {user,loading}=useAuth();
  const [showAuth,setShowAuth]=useState(false);
  const [requested,setRequested]=useState(()=>new URLSearchParams(window.location.search).get('signup')==='1');
  const publish=()=>frame.current?.contentWindow?.postMessage({source:'outzide-host',type:'auth-state',allowed:!!user&&!loading},window.location.origin);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='outzide-map')return;
      if(event.data.type==='ready')publish();
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
      const bottomNav = window.innerWidth < 768 ? 72 : 0;
      frame.current.style.height = `${Math.max(360, window.innerHeight - frame.current.getBoundingClientRect().top - bottomNav)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <><iframe onLoad={publish} ref={frame} src={"/outzide-map/index.html?v=20260922&place=" + encodeURIComponent(new URLSearchParams(window.location.search).get("place") || "")} title="Outzide Northwest field map" allow="geolocation" style={{ display: "block", width: "100%", height: "calc(100dvh - 80px)", border: 0 }} />{showAuth&&<AuthModal defaultTab="register" onClose={closeSignup}/>}</>;
}
