import React from "react";

/* Divider = the brand section divider. Default is the thin rainbow FLAG seam
   used under the header, at hero top/bottom, and between page sections.
   Optional centered label or glyph turns it into a labeled section break. */
const CSS = `
.pdxDivider{ display:flex; align-items:center; gap:14px; width:100%; border:0; margin:0; }
.pdxDivider__line{ flex:1; height:3px; border-radius:var(--radius-pill); }
.pdxDivider--rainbow .pdxDivider__line{ position:relative; overflow:hidden;
  background:linear-gradient(90deg,var(--neon-cyan),var(--neon-yellow),var(--neon-magenta),var(--neon-orange),var(--neon-cyan));
  background-size:200% 100%;
  animation:pdxSeamFlow 3.4s linear infinite, pdxSeamGlow 3.4s var(--ease-inout) infinite; }
.pdxDivider--rainbow .pdxDivider__line::after{ content:""; position:absolute; top:-1px; bottom:-1px; left:0; width:24%;
  transform:translateX(-165%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen; pointer-events:none; animation:pdxSeamGlint 3.4s var(--ease-inout) infinite; }
.pdxDivider--glow .pdxDivider__line{ background:var(--_c,var(--lime));
  box-shadow:0 0 14px -2px var(--_c,var(--lime)); }
.pdxDivider--faint .pdxDivider__line{ height:1px; background:var(--border-default); }

/* full-bleed seam (no label), sits flush under sticky headers. Animated flag sweep. */
.pdxSeam{ position:relative; height:3px; width:100%; border:0; margin:0; overflow:hidden;
  background:linear-gradient(90deg,var(--neon-cyan),var(--neon-yellow),var(--neon-magenta),var(--neon-orange),var(--neon-cyan));
  background-size:200% 100%;
  animation:pdxSeamFlow 3.4s linear infinite, pdxSeamGlow 3.4s var(--ease-inout) infinite; }
.pdxSeam::after{ content:""; position:absolute; top:-1px; bottom:-1px; left:0; width:24%;
  transform:translateX(-165%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen; pointer-events:none; animation:pdxSeamGlint 3.4s var(--ease-inout) infinite; }
.pdxSeam--thin{ height:2px; }

.pdxDivider__label{ font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.1em; text-transform:uppercase; color:var(--text-mid); white-space:nowrap; }
.pdxDivider__glyph{ color:var(--_c,var(--lime)); font-size:.9rem; line-height:1; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-divider-css")) {
  const s = document.createElement("style");
  s.id = "pdx-divider-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)" };

/**
 * Divider / Seam. Default renders the thin rainbow flag seam. Pass `label`
 * or `glyph` for a centered section break; `seam` for a flush full-bleed line.
 */
export function Divider({
  variant = "rainbow",   // rainbow | glow | faint
  color = "lime",
  label,
  glyph,
  seam = false,
  thin = false,
  className = "",
  style = {},
  ...rest
}) {
  if (seam) {
    return <hr className={`pdxSeam ${thin ? "pdxSeam--thin" : ""} ${className}`} style={style} {...rest} />;
  }
  const center = label != null || glyph != null;
  return (
    <div className={`pdxDivider pdxDivider--${variant} ${className}`}
      role="separator" style={{ "--_c": COLORS[color] || color, ...style }} {...rest}>
      <span className="pdxDivider__line" />
      {center && (glyph != null
        ? <span className="pdxDivider__glyph" aria-hidden="true">{glyph}</span>
        : <span className="pdxDivider__label">{label}</span>)}
      {center && <span className="pdxDivider__line" />}
    </div>
  );
}
