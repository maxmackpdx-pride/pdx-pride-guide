// @ts-nocheck
import React from "react";

/* Divider = the brand section divider. Default is the thin rainbow FLAG seam
   used under the header, at hero top/bottom, and between page sections.
   Optional centered label or glyph turns it into a labeled section break.
   Optional `loading` enables Seam Charge (fill + glint + flash) without
   changing the resting full-seam look when loading is false. */
const CSS = `
.pdxDivider{ display:flex; align-items:center; gap:14px; width:100%; border:0; margin:0; }
.pdxDivider__line{ flex:1; height:3px; border-radius:var(--radius-pill); }
.pdxDivider--rainbow .pdxDivider__line{ background:var(--grad-flag); }
.pdxDivider--glow .pdxDivider__line{ background:var(--_c,var(--lime));
  box-shadow:0 0 14px -2px var(--_c,var(--lime)); }
.pdxDivider--faint .pdxDivider__line{ height:1px; background:var(--border-default); }

/* full-bleed seam (no label), sits flush under sticky headers */
.pdxSeam{ height:3px; width:100%; border:0; margin:0; background:var(--grad-flag); position:relative; overflow:hidden; }
.pdxSeam--thin{ height:2px; }

/* Seam Charge layers (only when loading) */
.pdxSeam__charge{ position:absolute; inset:0; overflow:hidden; pointer-events:none; }
.pdxSeam__fill{
  position:absolute; inset:0; transform-origin:left;
  background:var(--site-rainbow-bar, var(--grad-flag, var(--rainbow-bar)));
  animation:pdxaSeamFill 1.8s var(--ease-inout, cubic-bezier(.65,0,.35,1)) infinite;
}
.pdxSeam__glint{
  position:absolute; top:0; bottom:0; left:0; width:32%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen;
  animation:pdxaSeamGlint 1.8s var(--ease-inout, cubic-bezier(.65,0,.35,1)) infinite;
}
.pdxSeam__flash{
  position:absolute; inset:0; background:#fff; opacity:0; mix-blend-mode:screen;
  animation:pdxaSeamFlash 1.8s linear infinite;
}
/* Still path: full seam, no motion layers */
.pdxSeam--still .pdxSeam__charge{ display:none; }

.pdxDivider__label{ font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.1em; text-transform:uppercase; color:var(--text-mid); white-space:nowrap; }
.pdxDivider__glyph{ color:var(--_c,var(--lime)); font-size:.9rem; line-height:1; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-divider-css")) {
  const s = document.createElement("style");
  s.id = "pdx-divider-css";
  s.textContent = CSS;
  document.head.appendChild(s);
} else if (typeof document !== "undefined") {
  // Hot-reload / HMR: refresh CSS string if already injected
  const existing = document.getElementById("pdx-divider-css");
  if (existing && !existing.textContent.includes("pdxSeam__charge")) {
    existing.textContent = CSS;
  }
}

const COLORS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", amber:"var(--amber)" };

function seamStill(): boolean {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  if (root.dataset.calm === "true" || root.classList.contains("calm-mode")) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Divider / Seam. Default renders the thin rainbow flag seam. Pass `label`
 * or `glyph` for a centered section break; `seam` for a flush full-bleed line.
 * `loading` (default false) enables Seam Charge while true.
 */
export function Divider({
  variant = "rainbow",   // rainbow | glow | faint
  color = "lime",
  label = null,
  glyph = null,
  seam = false,
  thin = false,
  loading = false,
  className = "",
  style = {},
  ...rest
}: any) {
  if (seam) {
    const still = loading && seamStill();
    const showCharge = loading && !still;
    return (
      <div
        className={`pdxSeam ${thin ? "pdxSeam--thin" : ""} ${still ? "pdxSeam--still" : ""} ${className}`.trim()}
        style={style}
        role={loading ? "progressbar" : undefined}
        aria-busy={loading || undefined}
        aria-valuetext={loading ? "Loading" : undefined}
        {...rest}
      >
        {showCharge && (
          <span className="pdxSeam__charge" aria-hidden="true">
            <span className="pdxSeam__fill" />
            <span className="pdxSeam__glint" />
            <span className="pdxSeam__flash" />
          </span>
        )}
      </div>
    );
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
