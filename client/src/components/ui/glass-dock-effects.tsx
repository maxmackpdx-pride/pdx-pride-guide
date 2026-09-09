import { useEffect, useId, useState, type CSSProperties, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Adapted from 21st.dev/ruixen.ui: Floating Nav and LumaBar.
// One measured indicator preserves real route buttons, labels and tab colors.
export function GlassDockIndicator({ dockRef, activeKey }: { dockRef: RefObject<HTMLDivElement>; activeKey: string }) {
  const [box, setBox] = useState({ left: 6, top: 6, width: 0, height: 70, color: "#19e3ff", visible: false });
  const reduced = useReducedMotion();
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const update = () => {
      const tabs = Array.from(dock.querySelectorAll<HTMLElement>(".hub-mobile-tab"));
      const tab = tabs.find(t => t.getAttribute("aria-expanded") === "true") || tabs.find(t => t.classList.contains("is-active"));
      if (!tab) { setBox(previous => ({ ...previous, visible: false })); return; }
      setBox({ left: tab.offsetLeft, top: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight, color: getComputedStyle(tab).getPropertyValue("--c").trim() || "#19e3ff", visible: true });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dock);
    return () => observer.disconnect();
  }, [dockRef, activeKey]);
  return <motion.span className="glass-dock-indicator" aria-hidden="true" initial={false}
    animate={{ x: box.left, y: box.top, width: box.width, height: box.height, opacity: box.visible ? 1 : 0 }}
    style={{ "--indicator-color": box.color } as CSSProperties}
    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 34 }}><span /></motion.span>;
}

// Rounded-rectangle displacement adapted from manfromexistence/LiquidGlass.
// Generate a bounded texture only after resize settles; no per-frame canvas work.
export function LiquidDockLens({ hostRef }: { hostRef: RefObject<HTMLElement> }) {
  const id = `dock-lens-${useId().replace(/:/g, "")}`;
  const [map, setMap] = useState("");
  useEffect(() => {
    const host = hostRef.current;
    if (!host || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const generate = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const w = Math.min(320, Math.round(rect.width)), h = Math.max(32, Math.round(w * rect.height / rect.width));
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      const context = canvas.getContext("2d"); if (!context) return;
      const pixels = context.createImageData(w, h);
      const radius = Math.min(28 * w / rect.width, h / 2);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ix = x - w / 2, iy = y - h / 2;
        const qx = Math.abs(ix) - w / 2 + radius, qy = Math.abs(iy) - h / 2 + radius;
        const distance = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
        const t = Math.max(0, Math.min(1, (distance + 12) / 12));
        const edge = t * t * (3 - 2 * t);
        const length = Math.hypot(ix, iy) || 1, offset = (y * w + x) * 4;
        pixels.data[offset] = 128 + ix / length * edge * 100;
        pixels.data[offset + 1] = 128 + iy / length * edge * 100;
        pixels.data[offset + 2] = 128; pixels.data[offset + 3] = 255;
      }
      context.putImageData(pixels, 0, 0); setMap(canvas.toDataURL());
    };
    const observer = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(generate, 160); });
    observer.observe(host);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [hostRef]);
  return <>
    <svg width="0" height="0" className="z-filter-defs" aria-hidden="true"><defs><filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      {map && <feImage href={map} width="100%" height="100%" preserveAspectRatio="none" result="lens" />}
      <feDisplacementMap in="SourceGraphic" in2="lens" scale={map ? 7 : 0} xChannelSelector="R" yChannelSelector="G" />
    </filter></defs></svg>
    <span className="glass-dock-lens" aria-hidden="true" style={{ "--dock-lens": `url("#${id}")` } as CSSProperties} />
  </>;
}
