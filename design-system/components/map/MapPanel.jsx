import React from "react";
import { MapLegend } from "./MapLegend.jsx";

/* MapPanel = the map surface used by Events, the home strip, Directory and the
   beaches. Values ported from client/src/components/ds/mapTheme.ts:
   MAP_SURFACE_BG, MAP_PIN_SIZE, mapFrameShadow, mapGridBackground,
   mapVignetteBackground/Inset, mapLightShaftBackground, mapPinStyle,
   mapPinMultiStyle, mapChipStyle, LIVE_MAP_CHROME_CSS.

   Frame rule from docs/LIVE_DESIGN_STANDARD.md: thin black outline plus
   inward-only deboss. No outer neon or neutral bloom on any map surface, and
   no bloom on any pin. In production the plate is Leaflet + CARTO dark tiles;
   the grid background stands in when tiles are offline. */
const CSS = `
.pdxMap{
  position:relative; overflow:hidden; width:100%; border-radius:16px;
  background:
    repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
    radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%);
  border:1px solid #000;
  box-shadow:
    0 0 0 1px #000,
    inset 0 0 0 1px rgba(0,0,0,.85),
    inset 0 2px 3px rgba(0,0,0,.9),
    inset 0 0 28px -8px rgba(0,0,0,.95),
    inset 0 0 52px 10px rgba(0,0,0,.42),
    inset 0 4px 10px -2px rgba(0,0,0,.75),
    inset 0 -1px 0 rgba(255,255,255,.045);
}
/* Hole-rim vignette over the tiles. z400, pointer-events none. */
.pdxMap__vignette{ position:absolute; inset:0; z-index:400; pointer-events:none; border-radius:inherit;
  background:radial-gradient(128% 128% at 50% 50%, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.48) 100%);
  box-shadow:inset 0 0 18px 2px rgba(0,0,0,.48), inset 0 0 56px 10px rgba(0,0,0,.4); }
/* Diagonal light shaft. z401. */
.pdxMap__shaft{ position:absolute; top:-20%; bottom:-20%; left:48%; width:70px; z-index:401; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015) 50%, transparent);
  transform:rotate(14deg); filter:blur(1px); opacity:.85; }

.pdxMap__pins{ position:absolute; inset:0; z-index:2; }
/* Pin: 18px, black core, 3px ring, thin black ring + inward hole only. */
.pdxMap__pin{ position:absolute; width:18px; height:18px; border-radius:999px; box-sizing:border-box;
  transform:translate(-50%,-50%);
  background:#000; border:3px solid var(--_c,var(--day-sat));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.06); }
.pdxMap__pin--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF)); }
/* RSVP feedback is a scale pulse, never an outer bloom. */
@keyframes pdxMapPinRsvp{ 0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:1 } 50%{ transform:translate(-50%,-50%) scale(1.14); opacity:.92 } }
.pdxMap__pin--rsvp{ animation:pdxMapPinRsvp 2.2s ease-in-out infinite; }
:root[data-calm="true"] .pdxMap__pin--rsvp{ animation:none !important; }

.pdxMap__legend{ position:absolute; left:16px; bottom:28px; z-index:500; }
.pdxMap__legend--home{ left:50%; right:auto; transform:translateX(-50%); bottom:14px; }
/* Chips: lime text, thin black edge, inset lime outline, no outer glow. */
.pdxMap__chip{ position:absolute; z-index:1001; display:inline-flex; align-items:center; gap:5px;
  padding:6px 10px; cursor:pointer; border-radius:0;
  font-family:var(--font-display); font-size:.6rem; font-weight:700;
  letter-spacing:.08em; text-transform:uppercase; color:var(--lime,#CCFF00);
  background:rgba(5,5,7,.88); border:1px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75);
  outline:1px solid color-mix(in srgb, var(--lime,#CCFF00) 70%, #000); outline-offset:-2px; }
.pdxMap__chip svg{ width:12px; height:12px; }
.pdxMap__chip--expand{ top:10px; right:10px; }
.pdxMap__chip--locate{ bottom:12px; right:12px; }
:root[data-calm="true"] .pdxMap__chip{ outline-color:#555; }
/* Leaflet attribution, ported values. */
.pdxMap__attr{ position:absolute; bottom:0; right:0; z-index:500;
  background:rgba(0,0,0,.65); color:var(--text-faint,#8a8a8a); font-size:9px; padding:2px 5px; }
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
/** No recognizable day reads neutral white, never a borrowed day color. */
const UNKNOWN_DAY = "#FFFFFF";

const DEFAULT_PINS = [
  { x: 30, y: 32, day: "SUN" }, { x: 35, y: 42, multi: true }, { x: 27, y: 55, day: "SAT" },
  { x: 40, y: 40, day: "THU" }, { x: 44, y: 34, day: "FRI" }, { x: 46, y: 52, day: "SAT" },
  { x: 33, y: 62, day: "SAT" }, { x: 50, y: 44, day: "SAT", rsvp: true }, { x: 54, y: 58, day: "SUN" },
  { x: 62, y: 30, day: "SAT" }, { x: 74, y: 52, day: "SUN" }, { x: 66, y: 12, day: "SUN" },
];

/** MapPanel, the debossed OLED map surface with day-ringed pins. */
export function MapPanel({
  pins = DEFAULT_PINS,
  height = 420,
  legend = true,
  legendVariant = "corner",
  legendDays,
  expandable = false,
  onExpand,
  locate = false,
  showCityLabel = true,
  className = "",
  style = {},
  ...rest
}) {
  return (
    <div className={`pdxMap ${className}`} style={{ height, ...style }} {...rest}>
      {showCityLabel && <span className="pdxMap__label" style={{ left: "44%", top: "46%" }}>Portland</span>}
      <div className="pdxMap__pins">
        {pins.map((p, i) => (
          <span key={i}
            className={`pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""} ${p.rsvp ? "pdxMap__pin--rsvp" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, "--_c": p.color || DAY_COLOR[p.day] || UNKNOWN_DAY }} />
        ))}
      </div>
      <div className="pdxMap__vignette" aria-hidden="true" />
      <div className="pdxMap__shaft" aria-hidden="true" />
      {expandable && (
        <button type="button" className="pdxMap__chip pdxMap__chip--expand" onClick={onExpand}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          Expand
        </button>
      )}
      {locate && (
        <button type="button" className="pdxMap__chip pdxMap__chip--locate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-8-8 19-2-9-9-2Z" /></svg>
          You
        </button>
      )}
      {legend && (
        <div className={`pdxMap__legend ${legendVariant === "home" ? "pdxMap__legend--home" : ""}`}>
          <MapLegend days={legendDays} home={legendVariant === "home"} />
        </div>
      )}
      <span className="pdxMap__attr">Leaflet | © OpenStreetMap © CARTO</span>
    </div>
  );
}
