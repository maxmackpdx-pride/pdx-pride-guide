import React from "react";

/* StatCard = the admin dashboard tile: big accent number, uppercase label,
   optional "VIEW ->" action. Neon border in the accent color, rounded. */
const CSS = `
.pdxStatCard{
  display:flex; flex-direction:column; gap:10px;
  padding:18px 18px 16px; min-height:150px;
  background:var(--ink-1000);
  border:2px solid var(--_c,var(--lime)); border-radius:var(--radius-md);
  box-shadow:0 0 22px -12px var(--_c,var(--lime));
  text-decoration:none; color:inherit;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxStatCard:hover{ transform:translateY(var(--hover-lift));
  box-shadow:0 0 26px -6px var(--_c,var(--lime)); text-decoration:none; }
.pdxStatCard__num{ font-family:var(--font-display); font-weight:900; font-size:2.75rem;
  line-height:.85; color:var(--_c,var(--lime));
  text-shadow:0 0 20px color-mix(in srgb, var(--_c,var(--lime)) 45%, transparent); }
.pdxStatCard__label{ font-family:var(--font-display); font-weight:700; font-size:.9375rem;
  letter-spacing:.04em; text-transform:uppercase; color:var(--text-lo); line-height:1.08; flex:1; }
.pdxStatCard__action{ font-family:var(--font-display); font-weight:700; font-size:.8125rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--_c,var(--lime));
  display:inline-flex; align-items:center; gap:6px; }
.pdxStatCard--sm{ min-height:120px; padding:14px; }
.pdxStatCard--sm .pdxStatCard__num{ font-size:2rem; }
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
  className = "",
  ...rest
}) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  const cls = ["pdxStatCard", size === "sm" ? "pdxStatCard--sm" : "", className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} href={href} onClick={onClick}
      style={{ "--_c": COLORS[color] || color, textAlign: "left", cursor: (href || onClick) ? "pointer" : "default" }} {...rest}>
      <span className="pdxStatCard__num">{value}</span>
      <span className="pdxStatCard__label">{label}</span>
      {action && <span className="pdxStatCard__action">{action} <span aria-hidden="true">&rarr;</span></span>}
    </Tag>
  );
}
