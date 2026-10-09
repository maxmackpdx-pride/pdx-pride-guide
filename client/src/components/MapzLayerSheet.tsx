import { useEffect, useLayoutEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import SmoothDrawer from "./ui/smooth-drawer";
import { NavGlassLayers, navGlassPointer } from "./ui/nav-glass";

export type MapzLayerId = "events" | "places" | "rezources" | "mizzed" | "gigz" | "giftz" | "sellz" | "houz";
export type MapzLayer = {
  id: MapzLayerId; label: string; color: string; enabled: boolean;
  onToggle?: () => void; panel: ReactNode; viewMore: { label: string; href: string }[];
};

const LAYER_LOGOS: Record<MapzLayerId, string> = {
  events: "/brand/family/eventz.png",
  places: "/brand/family/our-placez.svg",
  rezources: "/brand/family/rezources.png",
  mizzed: "/brand/family/mizzed-connection.svg",
  gigz: "/brand/family/gigz.svg",
  giftz: "/brand/family/giftz.svg",
  sellz: "/brand/family/sellz.svg",
  houz: "/brand/family/the-hauz.svg",
};

export default function MapzLayerSheet({ layers, active, onActiveChange: setActive }: { layers: MapzLayer[]; active: MapzLayerId | null; onActiveChange: (id: MapzLayerId | null) => void }) {
  const lastActive = useRef<MapzLayerId>("events");
  const panels = useRef(new Map<MapzLayerId, HTMLDivElement>());
  const positions = useRef(new Map<MapzLayerId, number>());
  const visited = useRef(new Set<MapzLayerId>());
  const panelId = useId();
  const open = active !== null;
  if (active) visited.current.add(active);
  const activeLayer = layers.find(layer => layer.id === active);

  useLayoutEffect(() => {
    if (!active) return;
    lastActive.current = active;
    const panel = panels.current.get(active);
    if (panel) panel.scrollTop = positions.current.get(active) || 0;
  }, [active]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.zaylistDrawer = open ? "open" : "compact";
    window.dispatchEvent(new CustomEvent("zaylist:drawer", { detail: { open, restorePrevious: true } }));
    return () => { delete root.dataset.zaylistDrawer; };
  }, [open]);
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent("zaylist:drawer", { detail: { open: false, restorePrevious: true } }));
  }, []);
  useEffect(() => {
    const close = () => setActive(null);
    window.addEventListener("zaylist:map-sheet-close", close);
    return () => window.removeEventListener("zaylist:map-sheet-close", close);
  }, [setActive]);

  return <>
    <SmoothDrawer id={panelId} hidden={!open} className="mapz-layer-sheet z-glass pdx-glass-rebind is-open"
      data-seam="top" data-no-pull-to-refresh onPointerMove={navGlassPointer} onPointerLeave={navGlassPointer}
      aria-label="Map controls and sections"
      style={{ "--active-layer-color": activeLayer?.color || "var(--neon-cyan)" } as CSSProperties}>
      <NavGlassLayers />
      <div className="mapz-layer-sheet__title">
        <span><SlidersHorizontal size={18} aria-hidden="true" />Map controls</span>
      </div>
      <div className="mapz-layer-sheet__workspace">
        <div className="mapz-layer-sheet__sections" role="group" aria-label="Map sections">
          {layers.map(layer => <button key={layer.id} type="button" className="mapz-layer-section"
            style={{ "--layer-color": layer.color } as CSSProperties}
            aria-pressed={active === layer.id} aria-controls={`${panelId}-${layer.id}`} onClick={() => setActive(layer.id)}>
            <span className="mapz-layer-section__dot" aria-hidden="true" />
            <img loading="lazy" className="mapz-layer-section__logo" src={LAYER_LOGOS[layer.id]} alt="" aria-hidden="true" />
            <span className="sr-only">{layer.label}</span><ChevronRight size={14} aria-hidden="true" />
          </button>)}
        </div>
        <div className="mapz-layer-sheet__content">
          {layers.filter(layer => visited.current.has(layer.id)).map(layer => <div key={layer.id}
            ref={element => { if (element) panels.current.set(layer.id, element); else panels.current.delete(layer.id); }}
            id={`${panelId}-${layer.id}`} className="mapz-layer-sheet__body" hidden={active !== layer.id}
            aria-label={`${layer.label} options`} onScroll={event => { positions.current.set(layer.id, event.currentTarget.scrollTop); }}>
            <div className="mapz-layer-sheet__panel">
              <div className="mapz-layer-sheet__brand" aria-hidden="true"><small>In this view</small><img src={LAYER_LOGOS[layer.id]} alt="" /></div>
              {layer.onToggle && <label className="mapz-layer-visibility">
                <input type="checkbox" checked={layer.enabled} onChange={layer.onToggle} />Show {layer.label} pins on map
              </label>}
              {layer.panel}
            </div>
          </div>)}
          <div className="mapz-layer-sheet__footer">
            {activeLayer?.viewMore.map(link => <Link key={link.href} className="mapz-layer-sheet__more" href={link.href}>{link.label}<ChevronRight size={18} aria-hidden="true" /></Link>)}
          </div>
        </div>
      </div>
    </SmoothDrawer>
  </>;
}
