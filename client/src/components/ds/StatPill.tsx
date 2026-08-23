// @ts-nocheck
import React from "react";
import LiveWave from "@/components/LiveWave";
import CountUpValue from "@/components/CountUpValue";

/* StatPill = the little count pills: "1 EVENTS", "3 ACTION ITEMS",
   "52 EVENTS", "1 TOTAL", "1 POSTS", "LIVE". Rounded pill, accent-colored
   number, gray label. Outline or solid. Optional leading icon/dot. */
const CSS = `
.pdxStatPill{
  display:inline-flex; align-items:center; gap:7px;
  padding:6px 13px 5px; border-radius:var(--radius-pill);
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.05em; text-transform:uppercase; white-space:nowrap;
  border:2px solid var(--_c,var(--lime)); background:transparent; color:var(--text-lo);
}
.pdxStatPill__num{ color:var(--_c,var(--lime)); font-variant-numeric:tabular-nums; }
.pdxStatPill__icon{ display:inline-flex; color:var(--_c,var(--lime)); }
.pdxStatPill__icon svg{ width:14px; height:14px; }
.pdxStatPill__dot{ width:8px; height:8px; border-radius:var(--radius-pill); background:var(--_c,var(--lime)); }

/* solid */
.pdxStatPill--solid{ background:var(--_c,var(--lime)); border-color:var(--_c,var(--lime)); color:var(--text-inverse); }
.pdxStatPill--solid .pdxStatPill__num,
.pdxStatPill--solid .pdxStatPill__icon,
.pdxStatPill--solid .pdxStatPill__dot{ color:var(--text-inverse); background-color:currentColor; }
.pdxStatPill--solid .pdxStatPill__num{ background:none; }

.pdxStatPill--sm{ font-size:var(--chrome-xs); padding:4px 10px 3px; }
.pdxStatPill--glow.pdx-glass-rebind{ --c:var(--_c,var(--lime)); box-shadow:var(--neon-bloom); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-statpill-css")) {
  const s = document.createElement("style");
  s.id = "pdx-statpill-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)" };

/** StatPill, a compact count pill (number + label). */
export function StatPill({
  count,
  children,
  color = "lime",
  variant = "outline",   // outline | solid
  size = "md",
  glow = false,
  dot = false,
  icon = null,
  /** Opt-in LiveWave equalizer beside the live dot (default off). */
  liveWave = false,
  /** Opt-in count-up animation (default off). */
  animateCount = false,
  className = "",
  ...rest
}) {
  const cls = ["pdxStatPill", `pdxStatPill--${variant}`, size === "sm" ? "pdxStatPill--sm" : "",
    glow ? "pdxStatPill--glow" : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ "--_c": COLORS[color] || color }} {...rest}>
      {dot && <span className="pdxStatPill__dot" />}
      {liveWave && <LiveWave />}
      {icon && <span className="pdxStatPill__icon">{icon}</span>}
      {count != null && (
        <span className="pdxStatPill__num">
          {animateCount ? <CountUpValue value={Number(count) || 0} /> : count}
        </span>
      )}
      {children}
    </span>
  );
}
