import { useCardMotifParallax } from "../resources/useCardMotifParallax";
import { useEffect, useState, type CSSProperties } from "react";
import { EVENT_WEEK_DAYS } from "@shared/eventWeek";
import "./DayMotif.css";
import { CardArtworkGlass } from '../CardArtworkGlass';
import { useMotifRecipes } from "../artwork/useMotifRecipes";
import type { MotifDay } from "@/lib/designMotifRecipes";

/**
 * Day motifs: one neon wireframe artwork per weekday, matched to the day's color.
 * Each motif uses the published weekday's two uploaded layers: its network and object.
 * Black paper becomes transparent through luminance masks. The layers drift on
 * different directions with gentle idle drift. Shared pointer and scroll motion adds
 * depth to the artwork while glass and content stay fixed.
 * Every card of a weekday gets the same motif, so a Friday card always reads as Friday.
 */

type Day = (typeof EVENT_WEEK_DAYS)[number];

type Motif = { name: string; focusY: number };

/** Keyed by day; colors follow the day tokens in shared/eventWeek.ts. */
const MOTIFS: Record<Day, Motif> = {
  MON: { name: "St. Johns", focusY: 48 },    // purple
  TUE: { name: "Willamette", focusY: 44 },   // blue
  WED: { name: "Steel Bridge", focusY: 41 }, // yellow
  THU: { name: "Rose", focusY: 46 },         // cyan
  FRI: { name: "Oregon", focusY: 48 },       // magenta
  SAT: { name: "Fremont", focusY: 47 },      // green
  SUN: { name: "Mt. Hood", focusY: 47 },     // orange
};

export const DAY_MOTIF_NAMES = Object.fromEntries(EVENT_WEEK_DAYS.map(d => [d, MOTIFS[d].name])) as Record<Day, string>;

export function motifDay(day: string | null | undefined): Day {
  const code = (day || "").toUpperCase();
  return (EVENT_WEEK_DAYS as readonly string[]).includes(code) ? (code as Day) : "FRI";
}

/**
 * placement:
 *  - "card": spans the whole closed card, strongest low, behind the reading layer
 *    (flyer cards: the flyer covers the top, the motif rises behind the copy)
 *  - "art": fills a flyer slot when an event has no flyer
 */
export default function DayMotif({ day, placement, className = "", glass = false, networkOnly = false }: { day: string | null | undefined; placement: "card" | "art"; className?: string; glass?: boolean; networkOnly?: boolean }) {
  const ref = useCardMotifParallax<HTMLSpanElement>();
  const recipes = useMotifRecipes();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const code = motifDay(day);
  const motif = MOTIFS[code];
  const pair = recipes?.dayPairs[code.toLowerCase() as MotifDay];
  const layers = pair ? [{ depth: "back", id: pair.backId }, ...(networkOnly ? [] : [{ depth: "top", id: pair.frontId }])] : [];
  return (
    <span
      ref={ref}
      className={`day-motif day-motif--${placement}${networkOnly ? " day-motif--network" : ""} ${className}`.trim()}
      data-day={code}
      style={{ "--dm-focus": `${motif.focusY}%` } as CSSProperties}
      aria-hidden="true"
    >
      {visible
        ? layers.map(layer => <span key={layer.depth} data-library-motif={layer.id} data-motif-depth={layer.depth === "back" ? "back" : "front"} className={`day-motif__layer day-motif__layer--${layer.depth}`} style={{ maskImage: `url("${recipes?.assets[layer.id].url}")`, WebkitMaskImage: `url("${recipes?.assets[layer.id].url}")` }} />)
        : null}
      {glass && <CardArtworkGlass />}
    </span>
  );
}
