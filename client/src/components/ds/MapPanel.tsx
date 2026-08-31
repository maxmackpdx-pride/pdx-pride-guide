// @ts-nocheck
import React from "react";
import { MapLegend } from "./MapLegend";

/* MapPanel = the dark neon map surface used on the Events and Directory pages.
   The tile layer is a Leaflet map in production; here it is a dark faux-street
   background so the branded parts read: glowing day-colored pins, the legend,
   the rainbow seams top and bottom, and the Expand control. Feed it `pins`
   with { x, y, day } (percentages) or { x, y, multi:true }. */
/* Deep-glass map surface - SoT §1.6 (overrides prior unframed radial map). */
const CSS = `
.pdxMap{
  position:relative; overflow:hidden; width:100%;
  border-radius:16px;
  background:var(--map-surface-bg, #06060A);
  border:1px solid #000;
  box-shadow:var(--map-frame-shadow,
    0 0 0 1px #000,
    inset 0 0 0 1px rgba(0,0,0,.85),
    inset 0 2px 3px rgba(0,0,0,.9),
    inset 0 0 28px -8px rgba(0,0,0,.95),
    inset 0 0 52px 10px rgba(0,0,0,.42),
    inset 0 4px 10px -2px rgba(0,0,0,.75),
    inset 0 -1px 0 rgba(255,255,255,.045));
}
.pdxMap__plate{
  position:absolute; inset:0; z-index:0; pointer-events:none;
  background:var(--map-grid-bg,
    repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
    radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%));
}
/* reduced hole-rim vignette + light shaft (under pins) */
.pdxMap__vignette{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background:var(--map-vignette-bg,
    radial-gradient(128% 128% at 50% 50%, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.48) 100%));
  box-shadow:var(--map-vignette-inset,
    inset 0 0 18px 2px rgba(0,0,0,.48), inset 0 0 56px 10px rgba(0,0,0,.4));
}
.pdxMap__shaft{
  position:absolute; top:-20%; bottom:-20%; left:48%; width:70px; z-index:1; pointer-events:none;
  background:var(--map-shaft-bg,
    linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015) 50%, transparent));
  transform:rotate(14deg); filter:blur(1px); opacity:.85;
}
/* river */
.pdxMap::before{ content:""; position:absolute; top:-10%; bottom:-10%; left:52%; width:90px; z-index:1;
  background:linear-gradient(180deg, rgba(40,60,90,.35), rgba(20,30,50,.28));
  transform:rotate(12deg); filter:blur(2px); pointer-events:none; }
/* Shared rainbow engine (3px) - not a second seam system */


 

.pdxMap__pins{ position:absolute; inset:0; z-index:2; }
.pdxMap__pin{ position:absolute; width:18px; height:18px; border-radius:var(--radius-pill,999px);
  transform:translate(-50%,-50%);
  background:#000; border:3px solid var(--_c,var(--green));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.06); }
.pdxMap__pin--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85); }

.pdxMap__legend{ position:absolute; top:16px; right:16px; z-index:5; }
.pdxMap__expand{ position:absolute; top:16px; right:16px; z-index:6;
  display:inline-flex; align-items:center; gap:7px; min-height:44px; padding:8px 14px 6px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:var(--lime);
  background:rgba(5,5,7,.88); border:1px solid #000; border-radius:4px; cursor:pointer;
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75);
  outline:1px solid color-mix(in srgb, var(--lime) 70%, #000); outline-offset:-2px; }
.pdxMap__expand:focus-visible{ outline:3px solid var(--chrome-focus, rgba(0,255,255,.72)); outline-offset:3px; }
.pdxMap__expand svg{ width:14px; height:14px; }
.pdxMap__attr{ position:absolute; bottom:8px; right:12px; z-index:5;
  font-family:var(--font-body); font-size:11px; color:var(--text-faint); }
.pdxMap__label{ position:absolute; z-index:1; transform:translate(-50%,-50%);
  font-family:var(--font-body); font-weight:var(--fw-bold); font-size:12px; letter-spacing:.14em;
  text-transform:uppercase; color:rgba(255,255,255,.16); }

html.calm-mode .pdxMap__pin:not(.pdxMap__pin--multi),
:root[data-calm="true"] .pdxMap__pin:not(.pdxMap__pin--multi){
  box-shadow:none;
}
`;
if (typeof document !== "undefined") {
  let s = document.getElementById("pdx-map-css");
  if (!s) {
    s = document.createElement("style");
    s.id = "pdx-map-css";
    document.head.appendChild(s);
  }
  s.textContent = CSS;
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
      <div className="pdxMap__plate" aria-hidden="true" />
      <div className="pdxMap__vignette" aria-hidden="true" />
      <div className="pdxMap__shaft" aria-hidden="true" />
      
      {showCityLabel && <span className="pdxMap__label" style={{ left: "44%", top: "46%" }}>Portland</span>}
      <div className="pdxMap__pins">
        {pins.map((p, i) => (
          <span key={i}
            className={`pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, "--_c": DAY_COLOR[p.day] || "var(--day-sat)" }} />
        ))}
      </div>
      {expandable
        ? <button type="button" className="pdxMap__expand" onClick={onExpand} aria-label="Expand map">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            Expand
          </button>
        : legend && <div className="pdxMap__legend"><MapLegend /></div>}
      <span className="pdxMap__attr">Leaflet | © OpenStreetMap © CARTO</span>
      
    </div>
  );
}
