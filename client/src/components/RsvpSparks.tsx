import { useCallback, useRef } from "react";
import { DAY_PALETTE, prefersStillMotion } from "@/lib/motion";

const CSS = `
.pdxRsvpSparks{
  position:absolute; inset:0; overflow:visible; pointer-events:none; z-index:6;
}
.pdxRsvpSparks__spark{
  position:absolute; left:50%; top:50%; width:5px; height:5px; margin:-2.5px 0 0 -2.5px;
  border-radius:1px; background:var(--sp, #CCFF00);
  animation:pdxaSpark .72s var(--ease-out, cubic-bezier(.2,.8,.2,1)) forwards;
  opacity:1;
}
`;

function injectCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pdx-rsvp-sparks-css")) return;
  const s = document.createElement("style");
  s.id = "pdx-rsvp-sparks-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Burst confetti layer for RSVP off → on. Mount as a sibling overlay on the
 * button wrapper. Call `burst()` only when going becomes true.
 */
export function useRsvpSparks() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  const burst = useCallback(() => {
    injectCss();
    if (prefersStillMotion()) return;
    const layer = layerRef.current;
    if (!layer) return;
    const n = 16;
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "pdxRsvpSparks__spark";
      const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 40 + Math.random() * 46;
      el.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      el.style.setProperty("--sp", DAY_PALETTE[i % DAY_PALETTE.length]);
      layer.appendChild(el);
      nodes.push(el);
    }
    window.setTimeout(() => {
      nodes.forEach(n => n.remove());
    }, 760);
  }, []);

  const SparksLayer = (
    <div ref={layerRef} className="pdxRsvpSparks" aria-hidden="true" />
  );

  return { burst, SparksLayer, layerRef };
}

/** Imperative helper when you only have a button element ref. */
export function spawnRsvpSparks(host: HTMLElement | null) {
  injectCss();
  if (!host || prefersStillMotion()) return;
  let layer = host.querySelector(".pdxRsvpSparks") as HTMLDivElement | null;
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "pdxRsvpSparks";
    layer.setAttribute("aria-hidden", "true");
    const style = getComputedStyle(host);
    if (style.position === "static") host.style.position = "relative";
    host.appendChild(layer);
  }
  const n = 16;
  const nodes: HTMLSpanElement[] = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    el.className = "pdxRsvpSparks__spark";
    const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const dist = 40 + Math.random() * 46;
    el.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    el.style.setProperty("--sp", DAY_PALETTE[i % DAY_PALETTE.length]);
    layer.appendChild(el);
    nodes.push(el);
  }
  window.setTimeout(() => nodes.forEach(n => n.remove()), 760);
}
