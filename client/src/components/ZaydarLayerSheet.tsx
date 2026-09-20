import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import SmoothDrawer, { SmoothDrawerGroup, SmoothDrawerItem } from "./ui/smooth-drawer";
import { NavGlassLayers, navGlassPointer } from "./ui/nav-glass";

export type ZaydarLayerId = "events" | "places" | "boards" | "zaydark";

export type ZaydarLayer = {
  id: ZaydarLayerId;
  label: string;
  color: string;
  enabled: boolean;
  onToggle: () => void;
  panel: ReactNode;
};

export default function ZaydarLayerSheet({ layers }: { layers: ZaydarLayer[] }) {
  const [active, setActive] = useState<ZaydarLayerId | null>(null);
  const open = active !== null;

  useEffect(() => {
    const root = document.documentElement;
    const state = open ? "open" : "compact";
    root.dataset.zaylistDrawer = state;
    window.dispatchEvent(new CustomEvent("zaylist:drawer", { detail: { open } }));
    if (open) window.dispatchEvent(new CustomEvent("zaylist:collapse-mobile-dock"));
    return () => {
      if (root.dataset.zaylistDrawer === state) delete root.dataset.zaylistDrawer;
    };
  }, [open]);

  useEffect(() => {
    const close = () => setActive(null);
    window.addEventListener("zaylist:map-sheet-close", close);
    return () => window.removeEventListener("zaylist:map-sheet-close", close);
  }, []);

  const openLayer = (id: ZaydarLayerId) => setActive(current => current === id ? null : id);
  const activeLayer = layers.find(layer => layer.id === active);

  return (
    <SmoothDrawer
      className={`zaydar-layer-sheet z-glass${open ? " is-open" : " is-peek"}`}
      data-seam="top"
      data-no-pull-to-refresh
      onPointerMove={navGlassPointer}
      onPointerLeave={navGlassPointer}
      aria-label="Map layers"
    >
      <NavGlassLayers />
      <div className="zaydar-layer-sheet__header">
        <button
          type="button"
          className="zaydar-layer-sheet__handle"
          aria-label={open ? "Close map layer panel" : "Open map layer panel"}
          aria-expanded={open}
          onClick={() => setActive(open ? null : "events")}
        >
          <span />
        </button>
        <div className="zaydar-layer-sheet__chips" role="group" aria-label="Map layer filters">
          {layers.map(layer => (
            <div className="zaydar-layer-chip" data-active={active === layer.id} key={layer.id} style={{ "--layer-color": layer.color } as CSSProperties}>
              <button
                type="button"
                className="zaydar-layer-chip__toggle"
                aria-pressed={layer.enabled}
                onClick={() => {
                  layer.onToggle();
                  if (!layer.enabled) setActive(layer.id);
                }}
              >
                {layer.label}
              </button>
              <button
                type="button"
                className="zaydar-layer-chip__open"
                aria-label={`${active === layer.id ? "Close" : "Open"} ${layer.label} panel`}
                aria-expanded={active === layer.id}
                onClick={() => openLayer(layer.id)}
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <SmoothDrawerGroup open={open} className="zaydar-layer-sheet__body" hidden={!open}>
        <SmoothDrawerItem className="zaydar-layer-sheet__panel" key={active || "closed"}>
          {activeLayer?.panel}
        </SmoothDrawerItem>
      </SmoothDrawerGroup>

      {open && (
        <button type="button" className="zaydar-layer-sheet__close" aria-label="Close map layer panel" onClick={() => setActive(null)}>
          <ChevronDown size={22} aria-hidden="true" />
        </button>
      )}
    </SmoothDrawer>
  );
}
