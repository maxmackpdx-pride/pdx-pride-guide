// @ts-nocheck
import React from "react";

/* MapLegend — layout + pin dots only. Panel chrome = glass.css .pdxLegend (neutral deep-glass). */
const CSS = `
.pdxLegend{
  padding:12px 16px; display:flex; flex-direction:column; gap:9px;
}
.pdxLegend__row{ display:flex; align-items:center; gap:11px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:#c8c5bc; }
.pdxLegend__dot{ width:15px; height:15px; border-radius:var(--radius-pill);
  background:#000; border:3px solid var(--_c); box-sizing:border-box;
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85); flex:none; }
.pdxLegend__dot--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85); }
.pdxLegend__rule{ height:1px; background:rgba(255,255,255,.08); margin:2px 0; }
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
export function MapLegend({ days = WEEK, multi = true, className = "", ...rest }) {
  return (
    <div className={`pdxLegend ${className}`} {...rest}>
      {days.map((d) => (
        <div className="pdxLegend__row" key={d.label}>
          <span className="pdxLegend__dot" style={{ "--_c": d.c }} />
          {d.label}
        </div>
      ))}
      {multi && (
        <>
          <div className="pdxLegend__rule" />
          <div className="pdxLegend__row">
            <span className="pdxLegend__dot pdxLegend__dot--multi" />
            Multi-day
          </div>
        </>
      )}
    </div>
  );
}
