import { useEffect, useRef } from "react";
import { useReducedMotion, useSpring } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

type Entry = { svg: SVGSVGElement; x: number; y: number };
const entries = new Map<HTMLElement, Entry>();
const visible = new Set<HTMLElement>();
let observer: IntersectionObserver | undefined;
let frame = 0;
function schedule() {
 if (frame) return;
 frame = requestAnimationFrame(() => {
  frame = 0;
  for (const card of visible) {
   const entry = entries.get(card);
   if (!entry) continue;
   const rect = card.getBoundingClientRect();
   const scroll = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight / 2 + rect.height / 2)));
   entry.svg.style.setProperty("--rg-parallax-x", `${entry.x.toFixed(2)}px`);
   entry.svg.style.setProperty("--rg-parallax-y", `${(scroll * 7 + entry.y).toFixed(2)}px`);
  }
 });
}
export function useCardMotifParallax() {
 const ref = useRef<SVGSVGElement>(null);
 const reduced = useReducedMotion();
 // Spring-following tilt inspired by 21st's Motion Primitives Tilt.
 const springX = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const springY = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const { calmMode } = useTheme();
 useEffect(() => {
  const svg = ref.current;
  const card = svg?.closest<HTMLElement>(".rg-directory-card, .rg-safety-summary, .room-doorways__door");
  if (!svg || !card || reduced || calmMode) return;
  if (!observer) {
   observer = new IntersectionObserver(changes => {
    for (const change of changes) {
     if (change.isIntersecting) visible.add(change.target as HTMLElement);
     else visible.delete(change.target as HTMLElement);
    }
    schedule();
   });
   window.addEventListener("scroll", schedule, { passive: true });
   window.addEventListener("resize", schedule, { passive: true });
  }
  const entry = { svg, x: 0, y: 0 };
  entries.set(card, entry);
  observer.observe(card);
  const updateSurface = () => {
   const x = springX.get();
   const y = springY.get();
   entry.x = -x * 12;
   entry.y = -y * 10;
   card.style.setProperty("--rg-card-shift-x", `${x * 4}px`);
   card.style.setProperty("--rg-card-shift-y", `${y * 3}px`);
   card.style.setProperty("--rg-card-tilt-x", `${-y * 1.6}deg`);
   card.style.setProperty("--rg-card-tilt-y", `${x * 2}deg`);
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
  const resetCard = () => {
   for (const property of ["--rg-card-shift-x", "--rg-card-shift-y", "--rg-card-tilt-x", "--rg-card-tilt-y"]) card.style.removeProperty(property);
  };
  const leave = () => { springX.set(0); springY.set(0); };
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerleave", leave);
  return () => {
   card.removeEventListener("pointermove", move);
   card.removeEventListener("pointerleave", leave);
   stopX(); stopY(); springX.jump(0); springY.jump(0);
   resetCard();
   observer?.unobserve(card);
   entries.delete(card); visible.delete(card);
   svg.style.removeProperty("--rg-parallax-x"); svg.style.removeProperty("--rg-parallax-y");
   if (!entries.size) {
    observer?.disconnect(); observer = undefined;
    window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame); frame = 0;
   }
  };
 }, [reduced, calmMode, springX, springY]);
 return ref;
}
