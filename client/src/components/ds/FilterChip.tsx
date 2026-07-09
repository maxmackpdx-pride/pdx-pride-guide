// @ts-nocheck
import React from "react";

/* FilterChip = Anton uppercase, outlined rectangle, near-square corners.
   Default: gray outline. Selected: fills (or outlines) in the accent color.
   Matches the events-page filter row and the places category row. */
const CSS = `
.pdxChip{
  display:inline-flex; align-items:center; gap:8px;
  padding:9px 15px 7px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.05em; text-transform:uppercase; white-space:nowrap;
  background:transparent; color:var(--text-mid);
  border:2px solid var(--border-strong); border-radius:4px; cursor:pointer;
  transition:transform var(--dur-fast) var(--ease-spring),
             border-color var(--dur-base) var(--ease-out),
             background var(--dur-base) var(--ease-out),
             color var(--dur-base) var(--ease-out),
             box-shadow var(--dur-base) var(--ease-out);
}
.pdxChip:hover{ border-color:var(--_c,var(--lime)); color:var(--text-hi); }
.pdxChip:active{ transform:scale(var(--press-scale)); }

/* selected, outline look (like "ALL") */
.pdxChip[aria-pressed="true"]{
  color:var(--_c,var(--lime)); border-color:var(--_c,var(--lime));
  box-shadow:0 0 14px -4px var(--_c,var(--lime));
}
/* selected, fill look (opt-in) */
.pdxChip--fill[aria-pressed="true"]{
  color:var(--text-inverse); background:var(--_c,var(--lime)); border-color:var(--_c,var(--lime));
}
.pdxChip--fill[aria-pressed="true"] .pdxChip__count{ color:var(--text-inverse); opacity:.75; }

.pdxChip__count{ font-family:var(--font-body); font-weight:var(--fw-bold);
  font-size:.6875rem; color:var(--text-faint); }
.pdxChip[aria-pressed="true"] .pdxChip__count{ color:var(--_c,var(--lime)); opacity:.9; }
.pdxChip__dot{ width:9px; height:9px; border-radius:var(--radius-pill); background:var(--_c,var(--lime)); flex:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-chip-css")) {
  const s = document.createElement("style");
  s.id = "pdx-chip-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const ACCENTS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)" };

/** FilterChip, toggleable Anton filter pill for events + places filters. */
export function FilterChip({
  children,
  selected = false,
  onToggle,
  accent = "lime",
  fill = false,
  count,
  showDot = false,
  className = "",
  ...rest
}: {
  children?: React.ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  accent?: string;
  fill?: boolean;
  count?: number | string | null;
  showDot?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  const cls = ["pdxChip", fill ? "pdxChip--fill" : "", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} aria-pressed={selected} onClick={onToggle}
      style={{ "--_c": ACCENTS[accent] || accent }} {...rest}>
      {showDot && <span className="pdxChip__dot" />}
      {children}
      {count != null && <span className="pdxChip__count">{count}</span>}
    </button>
  );
}
