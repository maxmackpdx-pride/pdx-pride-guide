import { Suspense, lazy, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { apiRequest } from "@/lib/queryClient";
import { WORLD_COLORS, WORLD_NAMES, type MapWorld } from "@/lib/mapWorlds";
import type { LinkableMissedConnectionEvent } from "./MissedConnectionsPanel";
const GigComposer=lazy(()=>import("@/pages/PrideWork").then(m=>({default:m.GigComposer})));
const GiftComposer=lazy(()=>import("@/pages/Gifting").then(m=>({default:m.GiftComposer})));
const SellzComposer=lazy(()=>import("@/pages/Sellz").then(m=>({default:m.SellzComposer})));
const MizzedComposer=lazy(()=>import("./SpottedCardGrid").then(m=>({default:m.MizzedComposer})));
const PlaceComposer=lazy(()=>import("./DirectoryAddPlaceForm"));

export default function MapComposerOverlay({world,onClose,onPosted}:{world:MapWorld;onClose:()=>void;onPosted:(id:number)=>void}) {
  const dialogRef=useModalA11y({onClose});
  const events=useQuery<LinkableMissedConnectionEvent[]>({queryKey:["/api/missed-connections/postable-events","board"],queryFn:()=>apiRequest("GET","/api/missed-connections/postable-events?scope=board").then(r=>r.json()),enabled:world==="mizzed"});
  return createPortal(<div className="board-detail-backdrop" onClick={onClose}><div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Post to ${WORLD_NAMES[world]}`} tabIndex={-1} className="map-world-composer" style={{"--listing-accent":WORLD_COLORS[world],"--c":WORLD_COLORS[world]} as CSSProperties} onClick={e=>e.stopPropagation()}>
    <Suspense fallback={<p role="status">Loading form…</p>}>
      {world==="places" && <PlaceComposer embedded onClose={onClose} onView={onPosted}/>}
      {world==="gigz" && <GigComposer onClose={onClose} onPosted={onPosted}/>}
      {world==="giftz" && <GiftComposer onClose={onClose} onPosted={onPosted}/>}
      {world==="sellz" && <SellzComposer onClose={onClose} onPosted={onPosted}/>}
      {world==="mizzed" && <section className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind"><button className="gifting-close" onClick={onClose} aria-label="Close form"><X size={18}/></button><h2 className="display section-heading">Post a Mizzed Connection</h2><p>Keep it kind and specific. No full names or outing. Replies stay private.</p>{events.isError && <p role="alert">Events could not load. <button onClick={()=>void events.refetch()}>Retry</button></p>}<MizzedComposer linkableEvents={events.data||[]} onPosted={onPosted}/></section>}
    </Suspense>
  </div></div>,document.body);
}
