import "../CardMotifMotion.css";
import { useEffect, useId, useRef } from "react";
import { useReducedMotion, useSpring } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

type Surface = HTMLElement | SVGElement;
type Entry = { surface: Surface; card: HTMLElement; x: number; y: number };
const entries = new Map<Surface, Entry>();
const visible = new Set<Surface>();
let observer: IntersectionObserver | undefined;
let frame = 0;
function schedule() {
 if (frame || document.hidden) return;
 frame = requestAnimationFrame(() => {
  frame = 0;
  // Read every rectangle before writing styles, avoiding a layout flush per card.
  const rectangles = new Map<HTMLElement,DOMRect>();
  for (const surface of visible) {
   const entry=entries.get(surface);
   if (entry && !rectangles.has(entry.card)) rectangles.set(entry.card,entry.card.getBoundingClientRect());
  }
  for (const surface of visible) {
   const entry = entries.get(surface);
   if (!entry) continue;
   const rect=rectangles.get(entry.card)!;
   const scroll = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight / 2 + rect.height / 2)));
   surface.style.setProperty("--rg-parallax-x", `${entry.x.toFixed(2)}px`);
   surface.style.setProperty("--rg-parallax-y", `${(scroll * 7 + entry.y).toFixed(2)}px`);
  }
 });
}
function visibilityChanged() {
 for (const surface of entries.keys()) surface.style.setProperty("--motif-playing",!document.hidden&&visible.has(surface)?"running":"paused");
 if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();
}
export function useCardMotifParallax<T extends Surface = SVGSVGElement>() {
 const ref = useRef<T>(null);
 const instance=useId();
 const reduced = useReducedMotion();
 // Spring-following artwork moves behind the stationary glass frame.
 const springX = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const springY = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const { calmMode } = useTheme();
 useEffect(() => {
  const svg = ref.current;
  const card = svg?.closest<HTMLElement>(".ab-card, .rg-directory-card, .rg-safety-summary, .room-doorways__door, .eb-detail--place, .event-rail-card, .ds-listing-card, .event-modal, .board-spotted-card, article, [role=dialog]");
  if (!svg) return;
  svg.dataset.cardMotif="";
  const seed=Array.from(instance).reduce((n,c)=>n+c.charCodeAt(0),0);
  svg.style.setProperty("--motif-phase",`${-(seed%23)}s`);
  if (!card || reduced || calmMode) { svg.style.setProperty("--motif-playing","paused"); return; }
  if (!observer) {
   observer = new IntersectionObserver(changes => {
    for (const change of changes) {
     if (change.isIntersecting) visible.add(change.target as Surface);
     else visible.delete(change.target as Surface);
    }
    visibilityChanged();
   });
   document.addEventListener("visibilitychange",visibilityChanged);
   window.addEventListener("scroll", schedule, { passive: true });
   window.addEventListener("resize", schedule, { passive: true });
  }
  const entry = { surface: svg, card, x: 0, y: 0 };
  entries.set(svg, entry);
  observer.observe(svg);
  const updateSurface = () => {
   const x = springX.get();
   const y = springY.get();
   entry.x = -x * 12;
   entry.y = -y * 10;
   schedule();
  };
  const stopX = springX.on("change", updateSurface);
  const stopY = springY.on("change", updateSurface);
  const move = (event: PointerEvent) => {
   if (event.pointerType !== "mouse") return;
   const rect = card.getBoundingClientRect();
   springX.set(Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5)));
   springY.set(Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5)));
  };
  const leave = () => { springX.set(0); springY.set(0); };
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerleave", leave);
  return () => {
   card.removeEventListener("pointermove", move);
   card.removeEventListener("pointerleave", leave);
   stopX(); stopY(); springX.jump(0); springY.jump(0);
   observer?.unobserve(svg);
   entries.delete(svg); visible.delete(svg);
   svg.style.setProperty("--motif-playing","paused");
   svg.style.removeProperty("--rg-parallax-x"); svg.style.removeProperty("--rg-parallax-y");
   if (!entries.size) {
    observer?.disconnect(); observer = undefined;
    document.removeEventListener("visibilitychange",visibilityChanged);
    window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame); frame = 0;
   }
  };
 }, [reduced, calmMode, springX, springY, instance]);
 return ref;
}
