import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import { homeHalloweenActive } from "@/lib/homeHalloween";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "@/components/EventModal";
import { PortlandMetroGlobe } from "@/components/ui/portland-metro-globe";

export default function HomeFlight({ enabled = true, paused = false }: { enabled?: boolean; paused?: boolean }) {
  const [halloween,setHalloween]=useState(()=>homeHalloweenActive());
  const [selectedEvent,setSelectedEvent]=useState<Event|null>(null);
  const openingEvent=useRef(false);
  const openPonies=async()=>{
    if(openingEvent.current)return;
    openingEvent.current=true;
    try { const response=await apiRequest("GET","/api/events/1571"); if(!response.ok)throw new Error("Event unavailable"); setSelectedEvent(await response.json()); }
    catch { window.location.assign("/events/1571/pink-ponies-present-little-shop-of-ponies"); }
    finally { openingEvent.current=false; }
  };
  useEffect(()=>{
    const refresh=()=>setHalloween(homeHalloweenActive());
    const interval=window.setInterval(refresh,30_000);
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return ()=>{window.clearInterval(interval);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[]);
  const { calmMode } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [still, setStill] = useState(true);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const front = element.closest<HTMLElement>(".home-front");
    const header = document.querySelector<HTMLElement>(".site-header");
    const counter = element.parentElement?.querySelector<HTMLElement>(".home-hero-stats-boundary");
    let visible = false;
    const sync = () => {
      const style = header ? getComputedStyle(header) : null;
      const top = (header?.getBoundingClientRect().height ?? 0) + (parseFloat(style?.marginTop ?? '0') || 0) + (parseFloat(style?.marginBottom ?? '0') || 0);
      const bottom = (counter?.getBoundingClientRect().height ?? 96) + 12;
      element.style.setProperty('--home-flight-bottom',`${bottom}px`);
      front?.style.setProperty('--home-foreground-bottom',`${bottom}px`);
      front?.style.setProperty('--home-header-height',`${top}px`);
      setStill(calmMode || prefersStillMotion());
      setActive(enabled && visible && !document.hidden && !paused);
    };
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    intersection.observe(element);
    const resize = new ResizeObserver(sync);
    if (header) resize.observe(header);
    if (counter) resize.observe(counter);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = new MutationObserver(sync);
    root.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-calm']});
    motion.addEventListener('change',sync); document.addEventListener('visibilitychange',sync); sync();
    return () => { intersection.disconnect(); resize.disconnect(); root.disconnect(); motion.removeEventListener('change',sync); document.removeEventListener('visibilitychange',sync); };
  }, [enabled, paused, calmMode]);
  return <div ref={container} className="home-front__flight home-front__flight--globe">
    {enabled && <PortlandMetroGlobe active={active && !selectedEvent} still={still} halloween={halloween} onOpenPonies={openPonies} />}
    <div className="home-front__flight-credit">
      © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>
      {" · "}<a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>
    </div>
    {selectedEvent && <EventModal event={selectedEvent} onClose={()=>setSelectedEvent(null)} onEventUpdated={setSelectedEvent} />}
  </div>;
}
