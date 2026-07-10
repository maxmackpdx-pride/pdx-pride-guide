// @ts-nocheck
import React from "react";
import { MapLegend } from "./MapLegend";

/* MapPanel = the dark neon map surface used on the Events and Directory pages.
   The tile layer is a Leaflet map in production; here it is a dark faux-street
   background so the branded parts read: glowing day-colored pins, the legend,
   the rainbow seams top and bottom, and the Expand control. Feed it `pins`
   with { x, y, day } (percentages) or { x, y, multi:true }. */
const CSS = `
.pdxMap{
  position:relative; overflow:hidden; width:100%;
  background:
    repeating-linear-gradient(0deg,   transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
    repeating-linear-gradient(90deg,  transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
    radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%);
  border-block:0;
}
/* river */
.pdxMap::before{ content:""; position:absolute; top:-10%; bottom:-10%; left:52%; width:90px;
  background:linear-gradient(180deg, rgba(40,60,90,.35), rgba(20,30,50,.28));
  transform:rotate(12deg); filter:blur(2px); }
.pdxMap__seam{ position:absolute; left:0; right:0; height:3px; z-index:4; overflow:hidden;
  background:linear-gradient(90deg,var(--neon-cyan),var(--neon-yellow),var(--neon-magenta),var(--neon-orange),var(--neon-cyan));
  background-size:200% 100%;
  animation:pdxSeamFlow 3.4s linear infinite, pdxSeamGlow 3.4s var(--ease-inout, ease-in-out) infinite; }
.pdxMap__seam::after{ content:""; position:absolute; top:-1px; bottom:-1px; left:0; width:24%;
  transform:translateX(-165%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen; pointer-events:none; animation:pdxSeamGlint 3.4s var(--ease-inout, ease-in-out) infinite; }
.pdxMap__seam--top{ top:0; } .pdxMap__seam--bottom{ bottom:0; }

.pdxMap__pins{ position:absolute; inset:0; z-index:2; }
.pdxMap__pin{ position:absolute; width:18px; height:18px; border-radius:var(--radius-pill);
  transform:translate(-50%,-50%);
  background:var(--ink-1000); border:3px solid var(--_c,var(--green));
  box-shadow:0 0 12px 1px var(--_c,var(--green)); }
.pdxMap__pin--multi{ border:0;
  background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 12px 1px rgba(255,255,255,.4); }

.pdxMap__legend{ position:absolute; top:16px; right:16px; z-index:5; }
.pdxMap__expand{ position:absolute; top:16px; right:16px; z-index:6;
  display:inline-flex; align-items:center; gap:7px; padding:8px 14px 6px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:var(--lime);
  background:rgba(5,5,7,.7); border:2px solid var(--lime); border-radius:4px; cursor:pointer;
  box-shadow:0 0 14px -4px var(--lime); }
.pdxMap__expand svg{ width:14px; height:14px; }
.pdxMap__attr{ position:absolute; bottom:8px; right:12px; z-index:5;
  font-family:var(--font-body); font-size:11px; color:var(--text-faint); }
.pdxMap__label{ position:absolute; z-index:1; transform:translate(-50%,-50%);
  font-family:var(--font-body); font-weight:var(--fw-bold); font-size:12px; letter-spacing:.14em;
  text-transform:uppercase; color:rgba(255,255,255,.16); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-map-css")) {
  const s = document.createElement("style");
  s.id = "pdx-map-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const DAY_COLOR = {
  MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)", THU:"var(--day-thu)",
  FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)",
};

const DEFAULT_PINS = [
  { x: 30, y: 32, day: "SUN" }, { x: 35, y: 42, multi: true }, { x: 27, y: 55, day: "SAT" },
  { x: 40, y: 40, day: "THU" }, { x: 44, y: 34, day: "FRI" }, { x: 46, y: 52, day: "SAT" },
  { x: 33, y: 62, day: "SAT" }, { x: 50, y: 44, day: "SAT" }, { x: 54, y: 58, day: "SUN" },
  { x: 62, y: 30, day: "SAT" }, { x: 74, y: 52, day: "SUN" }, { x: 66, y: 12, day: "SUN" },
];

/** MapPanel, the dark neon map surface with day-colored glowing pins. */
export function MapPanel({
  pins = DEFAULT_PINS,
  height = 420,
  legend = true,
  expandable = false,
  onExpand,
  showCityLabel = true,
  className = "",
  style = {},
  ...rest
}) {
  return (
    <div className={`pdxMap ${className}`} style={{ height, ...style }} {...rest}>
      <span className="pdxMap__seam pdxMap__seam--top" />
      {showCityLabel && <span className="pdxMap__label" style={{ left: "44%", top: "46%" }}>Portland</span>}
      <div className="pdxMap__pins">
        {pins.map((p, i) => (
          <span key={i}
            className={`pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, "--_c": DAY_COLOR[p.day] || "var(--day-sat)" }} />
        ))}
      </div>
      {expandable
        ? <button type="button" className="pdxMap__expand" onClick={onExpand}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            Expand
          </button>
        : legend && <div className="pdxMap__legend"><MapLegend /></div>}
      <span className="pdxMap__attr">Leaflet | © OpenStreetMap © CARTO</span>
      <span className="pdxMap__seam pdxMap__seam--bottom" />
    </div>
  );
}
