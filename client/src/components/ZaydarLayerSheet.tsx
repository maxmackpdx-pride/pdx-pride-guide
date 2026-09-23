import { useEffect, useLayoutEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import SmoothDrawer from "./ui/smooth-drawer";
import { NavGlassLayers, navGlassPointer } from "./ui/nav-glass";

export type ZaydarLayerId = "events" | "places" | "mizzed" | "gigz" | "giftz" | "sellz" | "houz";
export type ZaydarLayer = {
  id: ZaydarLayerId; label: string; color: string; enabled: boolean;
  onToggle?: () => void; panel: ReactNode; viewMore: { label: string; href: string }[];
};

export default function ZaydarLayerSheet({ layers, active, onActiveChange: setActive }: { layers: ZaydarLayer[]; active: ZaydarLayerId | null; onActiveChange: (id: ZaydarLayerId | null) => void }) {
  const lastActive = useRef<ZaydarLayerId>("events");
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panels = useRef(new Map<ZaydarLayerId, HTMLDivElement>());
  const positions = useRef(new Map<ZaydarLayerId, number>());
  const visited = useRef(new Set<ZaydarLayerId>());
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
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  const closePanel = () => {
    setActive(null);
    launcher.current?.focus({ preventScroll: true });
  };
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
    <button ref={launcher} type="button" className="zaydar-map-controls-launcher z-glass"
      aria-expanded={open} aria-controls={panelId} onClick={() => open ? closePanel() : setActive(lastActive.current)}>
      <SlidersHorizontal size={18} aria-hidden="true" /><span>Map controls</span><ChevronRight size={16} aria-hidden="true" />
    </button>
    <SmoothDrawer id={panelId} hidden={!open} className="zaydar-layer-sheet z-glass is-open"
      data-seam="top" data-no-pull-to-refresh onPointerMove={navGlassPointer} onPointerLeave={navGlassPointer}
      aria-label="Map controls and sections"
      style={{ "--active-layer-color": activeLayer?.color || "#00FFFF" } as CSSProperties}
      onKeyDown={event => { if (event.key === "Escape" && open) { event.stopPropagation(); closePanel(); } }}>
      <NavGlassLayers />
      <div className="zaydar-layer-sheet__title">
        <span><SlidersHorizontal size={18} aria-hidden="true" />Map controls</span>
        <button ref={closeButton} type="button" aria-label="Close map controls" onClick={closePanel}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="zaydar-layer-sheet__workspace">
        <div className="zaydar-layer-sheet__sections" role="group" aria-label="Map sections">
          {layers.map(layer => <button key={layer.id} type="button" className="zaydar-layer-section"
            style={{ "--layer-color": layer.color } as CSSProperties}
            aria-pressed={active === layer.id} aria-controls={`${panelId}-${layer.id}`} onClick={() => setActive(layer.id)}>
            <span className="zaydar-layer-section__dot" aria-hidden="true" />
            <span>{layer.label}</span><ChevronRight size={14} aria-hidden="true" />
          </button>)}
        </div>
        <div className="zaydar-layer-sheet__content">
          {layers.filter(layer => visited.current.has(layer.id)).map(layer => <div key={layer.id}
            ref={element => { if (element) panels.current.set(layer.id, element); else panels.current.delete(layer.id); }}
            id={`${panelId}-${layer.id}`} className="zaydar-layer-sheet__body" hidden={active !== layer.id}
            aria-label={`${layer.label} options`} onScroll={event => { positions.current.set(layer.id, event.currentTarget.scrollTop); }}>
            <div className="zaydar-layer-sheet__panel">
              {layer.onToggle && <label className="zaydar-layer-visibility">
                <input type="checkbox" checked={layer.enabled} onChange={layer.onToggle} />Show {layer.label} pins on map
              </label>}
              {layer.panel}
            </div>
          </div>)}
          <div className="zaydar-layer-sheet__footer">
            {activeLayer?.viewMore.map(link => <Link key={link.href} className="zaydar-layer-sheet__more" href={link.href}>{link.label}<ChevronRight size={18} aria-hidden="true" /></Link>)}
            <button type="button" className="zaydar-layer-sheet__back" onClick={closePanel}>Back to map</button>
          </div>
        </div>
      </div>
    </SmoothDrawer>
  </>;
}
