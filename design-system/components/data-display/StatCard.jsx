import React from "react";

/* StatCard = the admin dashboard tile: big accent number, uppercase label,
   optional "VIEW ->" action. Neon border in the accent color, rounded. */
const CSS = `
.pdxStatCard{
  position:relative; display:flex; flex-direction:column; gap:10px;
  padding:18px 18px 16px; min-height:150px; overflow:visible;
  --_c:var(--lime); border-radius:var(--radius-md);
  text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:
    0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxStatCard > *{ position:relative; z-index:3; }
.pdxStatCard__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  pointer-events:none; animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
  mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent); }
:root[data-calm="true"] .pdxStatCard, :root[data-calm="true"] .pdxStatCard__refract{ animation:none !important; }
a.pdxStatCard:hover{ transform:translateY(var(--hover-lift));
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 60px -26px color-mix(in srgb,var(--_c) 80%,transparent); text-decoration:none; }
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
      <span className="pdxStatCard__refract" aria-hidden="true" />
      <span className="pdxStatCard__num">{value}</span>
      <span className="pdxStatCard__label">{label}</span>
      {action && <span className="pdxStatCard__action">{action} <span aria-hidden="true">&rarr;</span></span>}
    </Tag>
  );
}
