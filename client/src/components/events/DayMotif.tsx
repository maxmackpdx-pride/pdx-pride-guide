import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EVENT_WEEK_DAYS } from "@shared/eventWeek";
import "./DayMotif.css";

/**
 * Day motifs: one neon wireframe artwork per weekday, matched to the day's color.
 * Each motif is a stack of image layers from /motifs/days/: an opaque back layer and a
 * transparent top layer (Wednesday adds a transparent middle layer). The layers drift on
 * opposite diagonals: the back runs top-left to bottom-right, the top runs center-right
 * to bottom-left at 60% of the back's speed (the middle at 80%). Scroll drives the drift
 * where the browser supports scroll-driven animation; elsewhere it idles slowly.
 * Every card of a weekday gets the same motif, so a Friday card always reads as Friday.
 */

type Day = (typeof EVENT_WEEK_DAYS)[number];

type Motif = { name: string; mid: boolean; focusY: number };

/** Keyed by day; colors follow the day tokens in shared/eventWeek.ts. */
const MOTIFS: Record<Day, Motif> = {
  MON: { name: "St. Johns", mid: false, focusY: 48 },    // purple
  TUE: { name: "Willamette", mid: false, focusY: 44 },   // blue
  WED: { name: "Steel Bridge", mid: true, focusY: 41 },  // yellow
  THU: { name: "Rose", mid: false, focusY: 46 },         // cyan
  FRI: { name: "Oregon", mid: false, focusY: 48 },       // magenta
  SAT: { name: "Fremont", mid: false, focusY: 47 },      // green
  SUN: { name: "Mt. Hood", mid: false, focusY: 47 },     // orange
};

export const DAY_MOTIF_NAMES = Object.fromEntries(EVENT_WEEK_DAYS.map(d => [d, MOTIFS[d].name])) as Record<Day, string>;

export function motifDay(day: string | null | undefined): Day {
  const code = (day || "").toUpperCase();
  return (EVENT_WEEK_DAYS as readonly string[]).includes(code) ? (code as Day) : "FRI";
}

const layerSrc = (day: Day, layer: "back" | "mid" | "top") => `/motifs/days/${day.toLowerCase()}-${layer}.webp`;

/**
 * placement:
 *  - "card": spans the whole closed card, strongest low, behind the reading layer
 *    (flyer cards: the flyer covers the top, the motif rises behind the copy)
 *  - "low": a compact rail card's copy area, behind title and time
 *  - "art": fills a flyer slot when an event has no flyer
 */
export default function DayMotif({ day, placement, className = "" }: { day: string | null | undefined; placement: "card" | "low" | "art"; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
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
  const layers: ("back" | "mid" | "top")[] = motif.mid ? ["back", "mid", "top"] : ["back", "top"];
  return (
    <span
      ref={ref}
      className={`day-motif day-motif--${placement} ${className}`.trim()}
      data-day={code}
      style={{ "--dm-focus": `${motif.focusY}%` } as CSSProperties}
      aria-hidden="true"
    >
      {visible
        ? layers.map(layer => (
            <img key={layer} className={`day-motif__layer day-motif__layer--${layer}`} src={layerSrc(code, layer)} alt="" loading="lazy" decoding="async" draggable={false} />
          ))
        : null}
    </span>
  );
}
