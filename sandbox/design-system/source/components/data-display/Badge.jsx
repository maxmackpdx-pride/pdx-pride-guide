import React from "react";

/* Badges are Anton, uppercase, near-square corners. Two looks:
   solid neon fill with black text, OR neon outline. Used for admission,
   day, place category, status ("GRAND OPENING"), and generic tags. */
const CSS = `
.pdxBadge{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-display); font-weight:700;
  letter-spacing:.06em; text-transform:uppercase; white-space:nowrap;
  line-height:1; border-radius:3px; border:2px solid transparent;
}
.pdxBadge--sm{ font-size:.625rem; padding:4px 7px 3px; }
.pdxBadge--md{ font-size:.75rem; padding:5px 9px 4px; }
.pdxBadge--lg{ font-size:.9375rem; padding:7px 12px 5px; }

/* solid fill (black text) */
.pdxBadge--solid{ background:var(--_c,var(--lime)); color:var(--text-inverse); border-color:var(--_c,var(--lime)); }
/* outline (colored text) */
.pdxBadge--outline{ background:transparent; color:var(--_c,var(--lime)); border-color:var(--_c,var(--lime)); }
/* paper fill (white-ish, black text) for day + neutral status */
.pdxBadge--paper{ background:var(--paper); color:var(--paper-ink); border-color:var(--paper); }
/* glow (GRAND OPENING) */
.pdxBadge--glow{ box-shadow:0 0 16px -2px var(--_c,var(--yellow)); }

.pdxBadge__dot{ width:7px; height:7px; border-radius:var(--radius-pill); background:currentColor; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-badge-css")) {
  const s = document.createElement("style");
  s.id = "pdx-badge-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = {
  lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)", yellow:"var(--yellow)",
  blue:"var(--blue)", red:"var(--red)", neutral:"var(--text-lo)",
};

/* Admission enum -> color + default label (solid) */
const ADMISSION = {
  FREE: { color: "lime", label: "Free" },
  TICKETED: { color: "cyan", label: "Ticketed" },
  SUGGESTED_DONATION: { color: "amber", label: "Donation" },
};
/* Day -> color (paper look by default like the detail modal "FRI") */
const DAY = { THU:"cyan", FRI:"pink", SAT:"green", SUN:"orange" };
/* Place category -> color + label */
const CATEGORY = {
  bars: { color: "pink", label: "Bars & Clubs" },
  food: { color: "orange", label: "Restaurants" },
  cafes: { color: "green", label: "Cafes" },
  venues: { color: "cyan", label: "Venues" },
  services: { color: "purple", label: "Services" },
  shops: { color: "amber", label: "Shops" },
  hotels: { color: "blue", label: "Hotels" },
};

/** Badge, the Anton neon tag. Admission / day / category / status / generic. */
export function Badge({
  children,
  color = "lime",
  variant = "solid",      // solid | outline | paper
  size = "sm",
  glow = false,
  dot = false,
  admission,
  day,
  category,
  className = "",
  ...rest
}) {
  let c = color, label = children, v = variant;
  if (admission && ADMISSION[admission]) { c = ADMISSION[admission].color; if (label == null) label = ADMISSION[admission].label; }
  if (day && DAY[day]) { c = DAY[day]; if (label == null) label = day; if (variant === "solid") v = "paper"; }
  if (category && CATEGORY[category]) { c = CATEGORY[category].color; if (label == null) label = CATEGORY[category].label; }

  const cls = ["pdxBadge", `pdxBadge--${v}`, `pdxBadge--${size}`, glow ? "pdxBadge--glow" : "", className]
    .filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ "--_c": COLORS[c] || c }} {...rest}>
      {dot && <span className="pdxBadge__dot" />}
      {label}
    </span>
  );
}
