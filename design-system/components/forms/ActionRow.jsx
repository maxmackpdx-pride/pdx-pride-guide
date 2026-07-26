import React from "react";

/* ActionRow, promoter-intake row (tokens/glass.css §2.10): glass surface keyed to
   an accent, with a big number, title + lead/rest copy, an outlined status badge,
   and a trailing arrow. Stack a few (Submit=lime, Claim=cyan, Spotted=magenta). */
const CSS = `
.pdxActionRow{
  --_c:var(--lime);
  position:relative; overflow:hidden; display:flex; align-items:center; gap:18px;
  padding:20px 22px; border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 14%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 60%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxActionRow:hover{ transform:translateY(-3px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 48px -22px color-mix(in srgb,var(--_c) 75%,transparent); }
.pdxActionRow > *{ position:relative; z-index:3; }
.pdxActionRow__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
  mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); }
.pdxActionRow__num{ flex:none; font-family:var(--font-display); font-weight:900; font-size:2.4rem;
  line-height:.8; color:var(--_c); text-shadow:0 0 20px color-mix(in srgb,var(--_c) 45%,transparent); font-variant-numeric:tabular-nums; }
.pdxActionRow__main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:7px; }
.pdxActionRow__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.35rem; line-height:1; color:#fff; }
.pdxActionRow__copy{ font-family:var(--font-body); font-size:.92rem; line-height:1.45; color:var(--text-mid); }
.pdxActionRow__copy b{ color:#fff; font-weight:700; }
.pdxActionRow__badge{ align-self:flex-start; padding:4px 11px 3px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.64rem; letter-spacing:.05em; text-transform:uppercase;
  background:color-mix(in srgb,var(--_c) 16%,transparent); border:1px solid var(--_c); color:var(--_c); }
.pdxActionRow__arrow{ flex:none; color:var(--text-lo); }
:root[data-calm="true"] .pdxActionRow, :root[data-calm="true"] .pdxActionRow__refract{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-actionrow-css")) {
  const s = document.createElement("style");
  s.id = "pdx-actionrow-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", cyan:"var(--cyan)", pink:"var(--pink)", magenta:"var(--pink)",
  green:"var(--green)", orange:"var(--orange)", purple:"var(--purple)", blue:"var(--blue)" };

/** ActionRow, numbered promoter-intake action on the glass surface. */
export function ActionRow({
  number, title, lead, rest: restCopy, badge, color = "lime", href, onClick,
  className = "", style = {}, ...rest
}) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  return (
    <Tag className={`pdxActionRow ${className}`} href={href} onClick={onClick}
      style={{ "--_c": COLORS[color] || color, textAlign: "left", border: "none", cursor: (href || onClick) ? "pointer" : "default", ...style }} {...rest}>
      <span className="pdxActionRow__refract" aria-hidden="true" />
      {number != null && <span className="pdxActionRow__num">{number}</span>}
      <div className="pdxActionRow__main">
        <span className="pdxActionRow__title">{title}</span>
        {(lead || restCopy) && <span className="pdxActionRow__copy">{lead && <b>{lead}</b>} {restCopy}</span>}
        {badge && <span className="pdxActionRow__badge">{badge}</span>}
      </div>
      <span className="pdxActionRow__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </Tag>
  );
}
