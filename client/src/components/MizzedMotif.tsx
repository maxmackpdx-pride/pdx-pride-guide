import { useId } from "react";
import "./MizzedMotif.css";

const MOTIFS = [
  <><path d="M10 150C95 20 260 35 300 155S510 280 590 85"/><circle cx="302" cy="154" r="50"/><circle cx="302" cy="154" r="12"/></>,
  <><path d="M65 35C190 90 145 255 300 310S445 100 545 48"/><path d="M80 312C235 230 242 90 535 280"/><circle cx="300" cy="170" r="32"/></>,
  <><path d="M300 20v320M45 180h510M95 50l410 260M505 50L95 310"/><path d="M300 64l34 81 85 35-85 35-34 81-34-81-85-35 85-35Z"/></>,
  <><path d="M45 245q90-160 180 0t180 0 150 0"/><path d="M40 280q95-165 190 0t190 0 140 0"/><path d="M50 210q85-155 170 0t170 0 160 0"/></>,
  <><path d="M55 90C180 5 190 295 300 180S430 55 545 260"/><path d="M55 270C145 320 220 55 300 180S460 330 545 80"/><circle cx="300" cy="180" r="24"/></>,
  <><path d="M300 30c-125 0-210 120-210 195 0 90 85 125 210 125s210-35 210-125c0-75-85-195-210-195Z"/><path d="M300 80c-70 0-120 70-120 130s50 90 120 90 120-30 120-90S370 80 300 80Z"/><path d="M300 110v185M210 180h180"/></>,
];

/** Six distinct drawings, each with a reflected partner. Adjacent rail cards use different drawings. */
export default function MizzedMotif({ index }: { index: number }) {
  const variant = ((index % 12) + 12) % 12;
  const drawing = variant % 6;
  const mirrored = variant >= 6;
  const id = `mizzed-motif-${useId().replace(/:/g, "")}`;
  return <svg className={`mizzed-motif${mirrored ? " mizzed-motif--mirror" : ""}`} data-motif-variant={variant} viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff00cc"/><stop offset=".48" stopColor="#a855f7"/><stop offset="1" stopColor="#19e3ff"/></linearGradient></defs>
    <g transform={mirrored ? "translate(600 0) scale(-1 1)" : undefined}>
      <g className="mizzed-motif__mesh" fill="none" stroke={`url(#${id})`} strokeWidth="1.25">{Array.from({length:8},(_,i)=><path key={i} d={`M${i*90-50} 0L${i*90+220} 360`}/>)}</g>
      <g className="mizzed-motif__drawing" fill="none" stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{MOTIFS[drawing]}</g>
      <g className="mizzed-motif__points" fill="#ffb3e8">{Array.from({length:9},(_,i)=><circle key={i} cx={65+i*59} cy={i%2 ? 310 : 40} r={i%3 ? 2 : 3.5}/>)}</g>
    </g>
  </svg>;
}
