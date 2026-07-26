import React from "react";

/* MapLegend = the map key. Ported from live `.map-legend` chrome in
   client/src/components/ds/mapTheme.ts (LIVE_MAP_CHROME_CSS) and index.css:
   an OLED glass well, and swatches that are the pin shape itself (black core +
   3px day ring), never glowing dots. Sits bottom-left over the map by default;
   the home strip uses the horizontal variant. */
const CSS = `
.pdxLegend{
  color:#c8c5bc; padding:14px 16px; border-radius:16px;
  display:flex; flex-direction:column; gap:8px;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.05), transparent 55%),
    radial-gradient(90% 80% at 50% 100%, rgba(0,0,0,.55), transparent 60%),
    #08080c;
  border:1px solid rgba(255,255,255,.07);
  box-shadow:
    0 0 0 1px #000,
    0 18px 40px -16px rgba(0,0,0,.92),
    inset 0 1px 0 rgba(255,255,255,.07),
    inset 0 -10px 28px -14px rgba(0,0,0,.75);
}
.pdxLegend__row{ display:flex; align-items:center; gap:8px;
  font-family:var(--font-display); font-weight:700; font-size:.65rem;
  letter-spacing:.08em; text-transform:uppercase; color:#c8c5bc; }
/* Swatch keeps the pin shape: black core, 3px ring, inward shadow only. */
.pdxLegend__sw{ width:12px; height:12px; border-radius:999px; flex:none; box-sizing:border-box;
  background:#000; border:3px solid var(--_c,var(--day-sat));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85); }
.pdxLegend__sw--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF)); }
.pdxLegend__row--multi{ margin-top:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,.08); }
/* Home strip: one horizontal row */
.pdxLegend--home{ flex-direction:row; align-items:center; gap:14px; padding:10px 14px; }
.pdxLegend--home .pdxLegend__row--multi{ margin-top:0; padding-top:0; border-top:0; padding-left:12px; border-left:1px solid rgba(255,255,255,.08); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-legend-css")) {
  const s = document.createElement("style");
  s.id = "pdx-legend-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const WEEK = [
  { label: "Mon", c: "var(--day-mon)" },
  { label: "Tue", c: "var(--day-tue)" },
  { label: "Wed", c: "var(--day-wed)" },
  { label: "Thu", c: "var(--day-thu)" },
  { label: "Fri", c: "var(--day-fri)" },
  { label: "Sat", c: "var(--day-sat)" },
  { label: "Sun", c: "var(--day-sun)" },
];

/** MapLegend, the day-color key for the map. */
export function MapLegend({ days = WEEK, multi = true, home = false, className = "", ...rest }) {
  return (
    <div className={`pdxLegend ${home ? "pdxLegend--home" : ""} ${className}`} aria-label="Map key" {...rest}>
      {days.map((d) => (
        <div className="pdxLegend__row" key={d.label}>
          <span className="pdxLegend__sw" style={{ "--_c": d.c }} />
          {d.label}
        </div>
      ))}
      {multi && (
        <div className="pdxLegend__row pdxLegend__row--multi">
          <span className="pdxLegend__sw pdxLegend__sw--multi" />
          Multi-day
        </div>
      )}
    </div>
  );
}
