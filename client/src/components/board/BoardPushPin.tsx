import { boardMotionTiming } from "@shared/boardMotion";
import { useId, type CSSProperties } from "react";

/** Decorative hardware stays fixed while the card swings around its needle. */
export default function BoardPushPin({ postKey, label = "Pushpin" }: { postKey: string; label?: string }) {
  const wireId = `pin-wire-${useId().replace(/:/g, "")}`;
  const bodyId = `${wireId}-body`;
  const clock = boardMotionTiming(postKey);
  const seed = Array.from(postKey).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
  const variant = seed % 4;
  // Mix nearby post IDs so neighboring pins do not share a material-change beat.
  const timing = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
  const materialStyle = {
    "--pin-glitch-cycle": `${clock.pinCycle}s`,
    "--pin-glitch-phase": `${clock.pinPhase}s`,
    "--pin-wire-paint": `url(#${wireId})`,
    "--pin-material-cycle": `${(8.2 + (timing % 4901) / 1000).toFixed(3)}s`,
    "--pin-material-phase": `${-((timing >>> 7) % 13001) / 1000}s`,
  } as CSSProperties;
  return (
    <svg className={`ab-pin pdx-glass-rebind ab-pin--${variant}`} style={materialStyle} viewBox="0 0 40 48" role="img" aria-label={label} data-label={label} focusable="false">
      <title>{label}</title>
      <defs>
        <linearGradient id={wireId} gradientUnits="userSpaceOnUse" x1="10" y1="5" x2="30" y2="34">
          <stop offset="0" stopColor="var(--day-thu)" />
          <stop offset=".45" stopColor="var(--day-thu)" />
          <stop offset="1" stopColor="var(--ab-accent,var(--c))" />
        </linearGradient>
        <clipPath id={`${wireId}-slice-a`}><path d="M0 7H40V14H0Z"/></clipPath>
        <clipPath id={`${wireId}-slice-b`}><path d="M0 23H40V28H0Z"/></clipPath>
      </defs>
      <ellipse className="ab-pin__contact" cx="21" cy="41" rx="6" ry="2" />
      <g className="ab-pin__hardware">
        <path className="ab-pin__needle" d="M18 27 24 29 20 40Z" />
        <g id={bodyId} className="ab-pin__body">
        <g className="ab-pin__solid">
          <path className="ab-pin__side" d="m10 24 7-8 1-8 10 3-4 9 6 10-11 4-10-5Z" />
          <path className="ab-pin__face" d="m10 24 10-3 10 9-11 4-10-5Z" />
          <path className="ab-pin__neck" d="m17 16 1-8 10 3-4 9-4 1Z" />
          <path className="ab-pin__cap-side" d="m12 7 3-4 16 5 1 6-9 4-11-5Z" />
          <path className="ab-pin__cap" d="m12 7 10-4 9 5-9 5Z" />
          <path className="ab-pin__shine" d="m14 7 8-2 6 3M11 25l8-2 5 4" />
        </g>
        <g className="ab-pin__surface-wire">
          <path d="m12 7 10-4 9 5 1 6-9 4-11-5V7Zm0 0 10 6 9-5m-9 5 1 5m-6-2 3 5 4-1 4-9M17 16l-7 8-1 5 10 5 11-4-6-10M10 24l10-3 10 9m-11 4 1-13" />
          <path d="m16 5 11 6m-8-7 11 5M14 10l9 5 8-4M16 18l8 5m-10-2 12 5m-14 0 7 4 8-3m-13-4 5 11m4-12 2 9" />
        </g>
        <g className="ab-pin__wire">
          <path d="m22 3 9 5 1 6-9 4-1-5V3Zm0 10 9-5m-8 10 1 2 6 10-11 4 1-13 4-1m-4 1 10 9m-11 4 5-14" />
          <path className="ab-pin__mesh" d="m26 6-3 12m5-9-1 7m-7 9 7 1m-7 3 9 1" />
        </g>
        </g>
        <g clipPath={`url(#${wireId}-slice-a)`}><use href={`#${bodyId}`} className="ab-pin__tear ab-pin__tear--a"/></g>
        <g clipPath={`url(#${wireId}-slice-b)`}><use href={`#${bodyId}`} className="ab-pin__tear ab-pin__tear--b"/></g>
        <g className="ab-pin__glitch">
          <path d="M27 8h8m-13 9h8M9 26h9m7 4h9" />
          <path d="M30 11h4M7 28h5" />
        </g>
      </g>
    </svg>
  );
}
