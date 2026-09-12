import { useId } from "react";

// Exact Hero/Prime Z outline from client/public/brand/family/prime-z.svg.
// Only its separate TM subpaths are omitted for small-size readability.
export const HERO_Z_PATH = "M 57 62 L 140 166 L 458 167 L 112 577 L 628 555 L 708 461 L 345 458 L 692 62 Z";

export function HeroZSymbol() {
  return <svg viewBox="32 37 701 565" width="30" height="26" fill="currentColor" aria-hidden="true" focusable="false"><path d={HERO_Z_PATH} /></svg>;
}

export function HologramWaypoint() {
  const id = useId().replace(/:/g, "");
  return <svg className="znav-waypoint znav-hologram" width="48" height="54" viewBox="0 0 48 54" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <mask id={`z-cutout-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="36" style={{ maskType: "luminance" }}>
        <rect width="48" height="36" fill="white" />
        <path d={HERO_Z_PATH} transform="translate(8.72 6.52) scale(.04)" style={{ fill: "black" }} />
      </mask>
      <linearGradient id={`z-beam-${id}`} x1="24" y1="34" x2="24" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity=".02" />
      </linearGradient>
    </defs>
    <path d="M8 5H40L44 32H4Z" style={{ fill: "currentColor" }} fillOpacity=".9" mask={`url(#z-cutout-${id})`} />
    <path d="M8 5H40L44 32H4Z" style={{ fill: "none" }} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M8 35H40L28 47H20Z" style={{ fill: `url(#z-beam-${id})` }} />
    <path d="M8 35 20 47M40 35 28 47" style={{ fill: "none" }} stroke="currentColor" strokeOpacity=".3" strokeWidth="1" />
    <ellipse cx="24" cy="49" rx="8" ry="2.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>;
}

