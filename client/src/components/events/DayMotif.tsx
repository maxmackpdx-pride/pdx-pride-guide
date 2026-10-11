import { memo, useEffect, useId, useRef, useState } from "react";
import { EVENT_WEEK_DAYS } from "@shared/eventWeek";
import "./DayMotif.css";

/**
 * Day motifs: one drawing per weekday, in the Places motif art style.
 * Mesh layer: a sparse constellation joined by long straight lines, a ring bleeding
 * off one edge, sweeping arcs. Object layer: the day's drawing at Places scale (bigger
 * than the card), one fine line, a dashed depth echo, a sheen that slides along it and
 * a light that runs its outline. The two layers drift in opposite directions.
 * Color comes from the card's --c, so calm mode and day tokens keep working.
 * Every card of a weekday gets the same drawing, so a Friday card always reads as Friday.
 */

type Day = (typeof EVENT_WEEK_DAYS)[number];

const SILHOUETTES: Record<Day, string> = {
  // Moon
  MON: "M262 140 A112 112 0 1 0 262 362 A88 88 0 1 1 262 140 Z M318 168 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6 Z M300 300 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z",
  // Tide
  TUE: "M40 250 Q90 190 140 250 T240 250 T340 250 T440 250 M40 305 Q90 245 140 305 T240 305 T340 305 T440 305 M40 195 Q90 135 140 195 T240 195 T340 195 T440 195",
  // Hump
  WED: "M45 345 L150 190 L205 262 L268 158 L355 345 Z M150 190 L172 228 L192 214 M268 158 L242 206 L268 222 L292 200",
  // Crystal
  THU: "M200 135 L305 230 L200 365 L95 230 Z M95 230 H305 M150 230 L200 135 L250 230 M150 230 L200 365 L250 230",
  // Disco
  FRI: "M100 255 A100 100 0 1 1 300 255 A100 100 0 1 1 100 255 Z M100 255 H300 M114 205 H286 M114 305 H286 M142 168 H258 M142 342 H258 M200 155 Q150 255 200 355 M200 155 Q250 255 200 355 M200 155 Q112 255 200 355 M200 155 Q288 255 200 355 M200 118 V155",
  // Speaker
  SAT: "M105 212 H158 L228 152 V352 L158 292 H105 Z M262 212 Q292 252 262 292 M288 180 Q338 252 288 324 M314 150 Q384 252 314 354",
  // Sun
  SUN: "M140 252 A60 60 0 1 1 260 252 A60 60 0 1 1 140 252 Z M200 122 V162 M200 342 V382 M110 252 H70 M330 252 H290 M136 188 L108 160 M264 188 L292 160 M136 316 L108 344 M264 316 L292 344",
};

export const DAY_MOTIF_NAMES: Record<Day, string> = {
  MON: "Moon", TUE: "Tide", WED: "Hump", THU: "Crystal", FRI: "Disco", SAT: "Speaker", SUN: "Sun",
};

type Geometry = { lines: string; lasers: string; arcs: string; ticks: string; dots: { x: number; y: number; r: number }[]; ring: { x: number; y: number }; tilt: number };

const f = (n: number) => Math.round(n);

function build(index: number): Geometry {
  let seed = (11 + index * 131) >>> 0;
  const r = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const nodes = Array.from({ length: 15 }, () => ({ x: -20 + r() * 440, y: 60 + r() * 400 }));
  let lines = "";
  nodes.forEach((p, a) => nodes.slice(a + 1).forEach(q => {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d > 70 && d < 175) lines += `M${f(p.x)} ${f(p.y)}L${f(q.x)} ${f(q.y)}`;
  }));
  let lasers = "";
  for (let k = 0; k < 2; k++) lasers += `M-40 ${f(80 + r() * 340)}L440 ${f(80 + r() * 340)}`;
  lasers += `M${f(60 + r() * 120)} -20L${f(220 + r() * 160)} 520`;
  const side = index % 2 ? -1 : 1;
  const ring = { x: 200 + side * (250 + r() * 30), y: 180 + r() * 160 };
  const tilt = (r() - .5) * 8;
  let arcs = "";
  for (let n = 0; n < 3; n++) arcs += `M-40 ${300 + n * 26} Q${f(200 + tilt * 6)} ${170 + n * 34} 440 ${360 + n * 18}`;
  const dots = nodes.map((p, n) => ({ x: f(p.x), y: f(p.y), r: n % 5 === 0 ? 2.2 : 1.1 }));
  const ticks = nodes.filter((_, n) => n % 5 === 0).map(p => `M${f(p.x) - 6} ${f(p.y)}h12M${f(p.x)} ${f(p.y) - 6}v12`).join("");
  return { lines, lasers, arcs, ticks, dots, ring, tilt };
}

const GEOMETRY = Object.fromEntries(EVENT_WEEK_DAYS.map((d, i) => [d, build(i)])) as Record<Day, Geometry>;

export function motifDay(day: string | null | undefined): Day {
  const code = (day || "").toUpperCase();
  return (EVENT_WEEK_DAYS as readonly string[]).includes(code) ? (code as Day) : "FRI";
}

function quietMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.classList.contains("calm-mode")
    || document.documentElement.dataset.calm === "true";
}

const SCALE = "translate(200 250) scale(1.5) translate(-200 -250)";

const Artwork = memo(function Artwork({ day }: { day: Day }) {
  const g = GEOMETRY[day];
  const sil = SILHOUETTES[day];
  const uid = useId().replace(/:/g, "");
  const sheen = `dm-sheen-${uid}`;
  const bloom = `dm-bloom-${uid}`;
  const [still] = useState(quietMotion);
  return (
    <svg className="day-motif__svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={sheen} gradientUnits="userSpaceOnUse" x1="-400" y1="0" x2="0" y2="500">
          <stop offset="0" stopColor="currentColor" />
          <stop offset=".42" stopColor="currentColor" />
          <stop offset=".5" style={{ stopColor: "var(--text-hi)" }} />
          <stop offset=".58" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" />
          {still ? null : <animateTransform attributeName="gradientTransform" type="translate" values="0 0;800 0;800 0" keyTimes="0;.55;1" dur="7s" repeatCount="indefinite" />}
        </linearGradient>
        <radialGradient id={bloom}>
          <stop offset="0" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="day-motif__layer day-motif__layer--mesh">
        <g fill="none" stroke="currentColor" strokeWidth=".6">
          <path className="day-motif__mesh" d={g.lines} />
          <path className="day-motif__laser" d={g.lasers} />
          <path className="day-motif__arcs" d={g.arcs} />
        </g>
        <g className="day-motif__ring" fill="none" stroke="currentColor">
          <circle cx={f(g.ring.x)} cy={f(g.ring.y)} r="150" strokeWidth=".8" />
          <circle cx={f(g.ring.x)} cy={f(g.ring.y)} r="138" strokeWidth=".5" strokeDasharray="2 9" />
        </g>
        <g className="day-motif__nodes" fill="currentColor">{g.dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} />)}</g>
        <path className="day-motif__ticks" d={g.ticks} fill="none" stroke="currentColor" strokeWidth=".7" />
      </g>
      <g className="day-motif__layer day-motif__layer--object">
        <g fill="none" strokeLinejoin="round" strokeLinecap="round" transform={`rotate(${g.tilt.toFixed(1)} 200 250)`}>
          <ellipse cx="200" cy="250" rx="190" ry="170" fill={`url(#${bloom})`} stroke="none" />
          <path className="day-motif__echo" d={sil} transform={`translate(9 12) ${SCALE}`} stroke="currentColor" strokeWidth=".9" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
          <path className="day-motif__line" d={sil} transform={SCALE} stroke={`url(#${sheen})`} strokeWidth="1.15" vectorEffect="non-scaling-stroke" />
          <path className="day-motif__trace" d={sil} transform={SCALE} pathLength={100} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
    </svg>
  );
});

/**
 * placement:
 *  - "card": spans the whole closed card, strongest low, behind the reading layer
 *    (flyer cards: the flyer covers the top, the motif rises behind the copy)
 *  - "low": a compact rail card's copy area, behind title and time
 *  - "art": fills a flyer slot when an event has no flyer (replaces the old day posters)
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
  return (
    <span ref={ref} className={`day-motif day-motif--${placement} ${className}`.trim()} data-day={code} aria-hidden="true">
      {visible ? <Artwork day={code} /> : null}
    </span>
  );
}
