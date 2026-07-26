import React from "react";

/* Tags. Deep Glass chrome (tokens/glass.css §1.7): mono uppercase on a tinted
   plate, 7px radius, black-keyed border, 1px inner bevel, soft accent glow.
   ONE solid-fill tag per card. Everything else on that card is tinted, or the
   card reads as competing stickers. */
const CSS = `
.pdxBadge{
  --_c:var(--lime); --c:var(--_c);
  display:inline-flex; align-items:center; gap:7px;
  font-family:var(--font-mono); font-weight:600;
  letter-spacing:.14em; text-transform:uppercase; white-space:nowrap;
  line-height:1; border-radius:var(--chrome-radius-tag); border:1px solid transparent;
}
.pdxBadge--sm{ font-size:.65625rem; padding:6px 11px; }
.pdxBadge--md{ font-size:.75rem; padding:7px 13px; }
.pdxBadge--lg{ font-size:.875rem; padding:9px 15px; }

/* solid fill: the one loud tag per card. Lit acid, black text. */
.pdxBadge--solid{ color:#0a0a0a; background:var(--acid-lit-tag); border-color:#000;
  box-shadow:var(--chrome-bevel), 0 0 18px -9px var(--_c); }
/* outline: the default tinted plate every other tag uses */
.pdxBadge--outline{ color:var(--_c);
  background:color-mix(in srgb, var(--_c) 12%, #08080b);
  border-color:color-mix(in srgb, var(--_c) 38%, #101014);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07), 0 0 18px -9px var(--_c); }
/* paper fill (white-ish, black text) for day + neutral status */
.pdxBadge--paper{ background:var(--paper); color:var(--paper-ink); border-color:#000;
  box-shadow:var(--chrome-bevel), 0 0 16px -10px rgba(255,255,255,.5); }
/* neutral: no accent, no glow */
.pdxBadge--neutral{ color:#b8b5ad; background:#111114; border-color:#26262e; box-shadow:none; }
/* glow (GRAND OPENING) */
.pdxBadge--glow{ box-shadow:var(--chrome-bevel), 0 0 20px -4px var(--_c); }

.pdxBadge__dot{ width:6px; height:6px; border-radius:var(--radius-pill);
  background:var(--_c); box-shadow:0 0 8px var(--_c); }
.pdxBadge--solid .pdxBadge__dot, .pdxBadge--paper .pdxBadge__dot{ background:currentColor; box-shadow:none; }
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
  variant = "outline",    // outline | solid | paper | neutral
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
  if (day && DAY[day]) { c = DAY[day]; if (label == null) label = day; if (variant === "solid") v = "paper"; }  if (category && CATEGORY[category]) { c = CATEGORY[category].color; if (label == null) label = CATEGORY[category].label; }

  const cls = ["pdxBadge", `pdxBadge--${v}`, `pdxBadge--${size}`, glow ? "pdxBadge--glow" : "", className]
    .filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ "--_c": COLORS[c] || c }} {...rest}>
      {dot && <span className="pdxBadge__dot" />}
      {label}
    </span>
  );
}
