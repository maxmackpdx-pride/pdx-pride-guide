import React from "react";

/* MapLegend = the day-color key shown on the map. Lime-outlined box, one
   glowing dot per day, plus a rainbow MULTI-DAY swatch. Uses the authoritative
   Pride-week day colors (Mon to Sun). */
const CSS = `
.pdxLegend{
  background:rgba(5,5,7,.82); backdrop-filter:blur(6px);
  border:2px solid var(--lime); border-radius:var(--radius-sm);
  box-shadow:0 0 18px -6px var(--lime);
  padding:12px 16px; display:flex; flex-direction:column; gap:9px;
}
.pdxLegend__row{ display:flex; align-items:center; gap:11px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:var(--text-hi); }
.pdxLegend__dot{ width:15px; height:15px; border-radius:var(--radius-pill);
  background:var(--_c); box-shadow:0 0 9px 0 var(--_c); flex:none; }
.pdxLegend__dot--multi{ background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 9px 0 rgba(255,255,255,.35); }
.pdxLegend__rule{ height:1px; background:var(--border-strong); margin:2px 0; }
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
