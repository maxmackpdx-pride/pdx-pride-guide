// @ts-nocheck
import React from "react";
import CountUpValue from "@/components/CountUpValue";

/* StatCard = the admin dashboard tile: big accent number, uppercase label,
   optional "VIEW ->" action.
   Shell is the shared deep-glass card: the node carries
   .pdx-glass-card .pdx-glass-rebind and sets the semantic accent on --c, so
   fill, keyline, blur and floor bloom are the --glass-card-* recipes and the
   only outer glow is the 8% --neon-bloom. No flat --ink-1000 slab, no 2px
   accent rim, no hand-rolled halo. */
const CSS = `
.pdxStatCard{
  display:flex; flex-direction:column; gap:10px;
  padding:18px 18px 16px; min-height:150px;
  border-radius:var(--glass-card-radius,14px);
  box-shadow:var(--glass-card-shadow), var(--neon-bloom);
  text-decoration:none; color:inherit;
  transition:transform var(--dur-base) var(--ease-out), filter var(--dur-base) var(--ease-out);
}
/* Content above the card sheen (.pdx-glass-card::after sits at z-index 2) */
.pdxStatCard > *{ position:relative; z-index:3; }
a.pdxStatCard:hover,
button.pdxStatCard:hover{ transform:translateY(var(--hover-lift));
  filter:brightness(1.06) saturate(1.06); text-decoration:none; }
.pdxStatCard__num{ font-family:var(--font-display); font-weight:900; font-size:2.75rem;
  line-height:.85; color:var(--c); font-variant-numeric:tabular-nums;
  text-shadow:0 0 20px color-mix(in srgb, var(--c) 45%, transparent); }
.pdxStatCard__label{ font-family:var(--font-display); font-weight:700; font-size:.9375rem;
  letter-spacing:.04em; text-transform:uppercase; color:var(--text-lo); line-height:1.08; flex:1; }
.pdxStatCard__action{ font-family:var(--font-display); font-weight:700; font-size:.8125rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--c);
  display:inline-flex; align-items:center; gap:6px; }
.pdxStatCard--sm{ min-height:120px; padding:14px; }
.pdxStatCard--sm .pdxStatCard__num{ font-size:2rem; }
/* Calm: --neon-bloom collapses to \`none\`, which is not a valid box-shadow
   list item, so calm re-states the shared token on its own. */
html.calm-mode .pdxStatCard,
:root[data-calm="true"] .pdxStatCard{
  box-shadow:var(--glass-card-shadow);
}
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-statcard-css")) {
  const s = document.createElement("style");
  s.id = "pdx-statcard-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)", blue:"var(--blue)" };

/** StatCard, a big-number dashboard tile with a neon border. */
export function StatCard({
  value,
  label,
  action = "View",
  color = "lime",
  size = "md",
  href,
  onClick,
  /** Opt-in count-up (default off preserves prior behavior). */
  animateCount = false,
  className = "",
  ...rest
}: any) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  const cls = ["pdxStatCard", "pdx-glass-card", "pdx-glass-rebind",
    size === "sm" ? "pdxStatCard--sm" : "", className].filter(Boolean).join(" ");
  const num = typeof value === "number" ? value : Number(value);
  return (
    <Tag className={cls} href={href} onClick={onClick}
      style={{ "--c": COLORS[color] || color, textAlign: "left", cursor: (href || onClick) ? "pointer" : "default" }} {...rest}>
      <span className="pdxStatCard__num">
        {animateCount && Number.isFinite(num)
          ? <CountUpValue value={num} />
          : value}
      </span>
      <span className="pdxStatCard__label">{label}</span>
      {action && <span className="pdxStatCard__action">{action} <span aria-hidden="true">&rarr;</span></span>}
    </Tag>
  );
}
