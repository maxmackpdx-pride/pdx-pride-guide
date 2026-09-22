import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronDown, House } from "lucide-react";
import SmoothDrawer, { SmoothDrawerGroup, SmoothDrawerItem } from "./ui/smooth-drawer";
import { NavGlassLayers, navGlassPointer } from "./ui/nav-glass";

export type ZaydarLayerId = "events" | "places" | "mizzed" | "gigz" | "stuff" | "houz";

export type ZaydarLayer = {
  id: ZaydarLayerId;
  label: string;
  color: string;
  enabled: boolean;
  onToggle?: () => void;
  panel: ReactNode;
  viewMore: { label: string; href: string }[];
};

export default function ZaydarLayerSheet({ layers, active, onActiveChange: setActive }: { layers: ZaydarLayer[]; active: ZaydarLayerId | null; onActiveChange: (id: ZaydarLayerId | null) => void }) {
  const lastActive = useRef<ZaydarLayerId>("events");
  const triggers = useRef(new Map<ZaydarLayerId, HTMLButtonElement>());
  const chips = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const panelId = useId();
  const open = active !== null;

  useEffect(() => { if (body.current) body.current.scrollTop = 0; if (active) lastActive.current = active; }, [active]);
  useEffect(() => {
    if (active && chips.current) triggers.current.get(active)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const closePanel = (restoreFocus = false) => {
    if (restoreFocus && active) triggers.current.get(active)?.focus({ preventScroll: true });
    setActive(null);
  };

  useEffect(() => {
    const root = document.documentElement;
    const state = open ? "open" : "compact";
    root.dataset.zaylistDrawer = state;
    // Closing the map sheet leaves the Z dock collapsed. Only its own restore
    // button should expand site navigation and move the compact rail upward.
    window.dispatchEvent(new CustomEvent("zaylist:drawer", { detail: { open } }));
    if (open) window.dispatchEvent(new CustomEvent("zaylist:collapse-mobile-dock"));
    return () => {
      if (root.dataset.zaylistDrawer === state) delete root.dataset.zaylistDrawer;
    };
  }, [open]);

  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent("zaylist:drawer", { detail: { open: false } }));
  }, []);

  useEffect(() => {
    const close = () => setActive(null);
    window.addEventListener("zaylist:map-sheet-close", close);
    return () => window.removeEventListener("zaylist:map-sheet-close", close);
  }, [setActive]);

  const openLayer = (id: ZaydarLayerId) => {
    lastActive.current = id;
    setActive(active === id ? null : id);
  };
  const activeLayer = layers.find(layer => layer.id === active);

  return (
    <SmoothDrawer
      className={`zaydar-layer-sheet z-glass${open ? " is-open" : " is-peek"}`}
      data-seam="top"
      data-no-pull-to-refresh
      onPointerMove={navGlassPointer}
      onPointerLeave={navGlassPointer}
      aria-label="Map layers"
      style={{ "--active-layer-color": activeLayer?.color || "#00FFFF" } as CSSProperties}
      onKeyDown={event => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          closePanel(true);
        }
      }}
    >
      <NavGlassLayers />
      <div className="zaydar-layer-sheet__header">
        <button
          type="button"
          className="zaydar-layer-sheet__handle"
          aria-label={open ? "Collapse map layer drawer" : "Expand map layer drawer"}
          aria-expanded={open}
          aria-controls={panelId}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            suppressClick.current = false;
            gesture.current = { y: event.clientY, moved: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            if (gesture.current && Math.abs(event.clientY - gesture.current.y) > 12) gesture.current.moved = true;
          }}
          onPointerUp={event => {
            const start = gesture.current;
            gesture.current = null;
            if (start?.moved) {
              suppressClick.current = true;
              if (event.clientY - start.y > 32) closePanel();
              else if (start.y - event.clientY > 32) setActive(lastActive.current);
            }
          }}
          onPointerCancel={() => { gesture.current = null; suppressClick.current = true; }}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            setActive(open ? null : lastActive.current);
          }}
        >
          <span />
        </button>
        <div ref={chips} className="zaydar-layer-sheet__chips" role="group" aria-label="Map layer filters">
          {layers.map(layer => (
            <div className="zaydar-layer-chip" data-active={active === layer.id} data-enabled={layer.enabled} data-single={!layer.onToggle} key={layer.id} style={{ "--layer-color": layer.color } as CSSProperties}>
              {layer.onToggle ? <>
                <button
                  type="button"
                  className="zaydar-layer-chip__toggle"
                  aria-label={`${layer.label} map filter`}
                  aria-pressed={layer.enabled}
                  title={`${layer.enabled ? "Hide" : "Show"} ${layer.label} pins`}
                  onClick={layer.onToggle}
                >
                  {layer.id === "houz" && <House className="zaydar-layer-chip__house" size={16} aria-hidden="true" />}
                  <span>{layer.label}</span>
                </button>
                <button
                  type="button"
                  ref={element => { if (element) triggers.current.set(layer.id, element); else triggers.current.delete(layer.id); }}
                  className="zaydar-layer-chip__open"
                  aria-label={`${active === layer.id ? "Close" : "Open"} ${layer.label} panel`}
                  aria-controls={panelId}
                  aria-expanded={active === layer.id}
                  onClick={() => openLayer(layer.id)}
                >
                  <ChevronDown className="zaydar-layer-chip__chevron" size={16} aria-hidden="true" />
                </button>
              </> : <button
                type="button"
                ref={element => { if (element) triggers.current.set(layer.id, element); else triggers.current.delete(layer.id); }}
                className="zaydar-layer-chip__open zaydar-layer-chip__single"
                aria-label={`${active === layer.id ? "Close" : "Open"} ${layer.label} panel`}
                aria-controls={panelId}
                aria-expanded={active === layer.id}
                onClick={() => openLayer(layer.id)}
              >{layer.label}<ChevronDown className="zaydar-layer-chip__chevron" size={16} aria-hidden="true" /></button>}
            </div>
          ))}
        </div>
      </div>

      <div ref={body} id={panelId} className="zaydar-layer-sheet__body" hidden={!open} aria-label={activeLayer ? `${activeLayer.label} options` : undefined}>
      <SmoothDrawerGroup open={open}>
        <SmoothDrawerItem className="zaydar-layer-sheet__panel" key={active || "closed"}>
          {activeLayer?.panel}
          {activeLayer?.onToggle && <label className="zaydar-layer-visibility">
            <input type="checkbox" checked={activeLayer.enabled} onChange={activeLayer.onToggle} />
            Show {activeLayer.label} pins on map
          </label>}
        </SmoothDrawerItem>
      </SmoothDrawerGroup>
      </div>

      {open && (
        <div className="zaydar-layer-sheet__footer">
          {activeLayer?.viewMore.map(link => <Link key={link.href} className="zaydar-layer-sheet__more" href={link.href}>{link.label}<ChevronDown size={18} aria-hidden="true" /></Link>)}
          <button type="button" className="zaydar-layer-sheet__close" aria-label="Close map layer panel" aria-controls={panelId} onClick={() => closePanel(true)}>
            <ChevronDown size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </SmoothDrawer>
  );
}
