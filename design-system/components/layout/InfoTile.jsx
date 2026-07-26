import React from "react";

/* InfoTile, infrastructure-grid tile (tokens/glass.css §2.11): glass surface with
   a 4px left accent border, no title glow. Title in the accent, body copy, optional
   arrow. Use in a 2-up / responsive grid to route to sections. */
const CSS = `
.pdxInfoTile{
  --_c:var(--purple);
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:9px;
  padding:20px 22px; border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 14%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 40%, #101014); border-left:4px solid var(--_c);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 22px -10px color-mix(in srgb, var(--_c) 55%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 40%, rgba(255,255,255,.1));
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxInfoTile:hover{ transform:translateY(-3px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 40px -18px color-mix(in srgb,var(--_c) 70%,transparent); }
.pdxInfoTile > *{ position:relative; z-index:3; }
.pdxInfoTile__name{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.4rem; line-height:1; color:var(--_c); }
.pdxInfoTile__desc{ font-family:var(--font-body); font-size:.92rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxInfoTile__arrow{ margin-top:auto; font-family:var(--font-display); font-weight:800; font-size:.74rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--_c); display:inline-flex; align-items:center; gap:6px; }
:root[data-calm="true"] .pdxInfoTile{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-infotile-css")) {
  const s = document.createElement("style");
  s.id = "pdx-infotile-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)", blue:"var(--blue)", violet:"var(--neon-violet)" };

/** InfoTile, infrastructure-grid tile with a left accent border. */
export function InfoTile({
  title, description, action, color = "purple", href, className = "", style = {}, ...rest
}) {
  const Tag = href ? "a" : "div";
  return (
    <Tag className={`pdxInfoTile ${className}`} href={href}
      style={{ "--_c": COLORS[color] || color, ...style }} {...rest}>
      <span className="pdxInfoTile__name">{title}</span>
      {description && <p className="pdxInfoTile__desc">{description}</p>}
      {action && <span className="pdxInfoTile__arrow">{action} <span aria-hidden="true">&rarr;</span></span>}
    </Tag>
  );
}
