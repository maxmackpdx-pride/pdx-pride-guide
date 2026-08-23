// @ts-nocheck
import React from "react";

/* Button - deep-glass CTA (Card System §16 state sheet).
   Default: near-black fill + thin black ring + inward sheen (no outer bloom).
   solid: filled accent primary · outline: secondary · gradient: rainbow special. */
const CSS = `
.pdxBtn.pdx-glass-rebind{
  --_c: var(--neon-yellow);
  --c: var(--_c);
  display:inline-flex; align-items:center; justify-content:center; gap:.5em;
  font-family:var(--font-display); font-weight:var(--fw-bold);
  text-transform:uppercase; letter-spacing:.08em; line-height:1;
  border:2px solid #000; color:#fff;
  border-radius:9px; cursor:pointer; white-space:nowrap; text-decoration:none;
  background:
    radial-gradient(120% 100% at 50% 0%, color-mix(in srgb,var(--_c) 15%,#0b0b0d), #060608) padding-box,
    linear-gradient(#000,#000) border-box;
  --c:var(--_c);
  box-shadow:
    var(--chrome-keyline),
    inset 0 1px 0 rgba(255,255,255,.08),
    inset 0 -6px 12px -8px rgba(0,0,0,.55),
    var(--neon-bloom);
  transition:background .15s ease, color .15s ease, transform .15s ease,
             box-shadow .15s ease, filter .15s ease, opacity .15s ease;
}
.pdxBtn:hover:not(:disabled){ text-decoration:none; color:#fff;
  transform:translateY(-1px); filter:brightness(1.06);
  background:
    radial-gradient(120% 100% at 50% 0%, color-mix(in srgb,var(--_c) 24%,#0b0b0d), #060608) padding-box,
    linear-gradient(#000,#000) border-box;
  box-shadow:
    0 0 0 1px #000,
    inset 0 1px 0 rgba(255,255,255,.12),
    inset 0 -6px 12px -8px rgba(0,0,0,.55);
}
.pdxBtn:active:not(:disabled){ transform:translateY(1px) scale(.98); filter:none;
  background:
    radial-gradient(120% 100% at 50% 0%, color-mix(in srgb,var(--_c) 12%,#08080a), #050506) padding-box,
    linear-gradient(#000,#000) border-box;
  box-shadow:
    0 0 0 1px #000,
    inset 0 2px 5px rgba(0,0,0,.7);
  transition-duration:60ms;
}
.pdxBtn:disabled{ opacity:.55; cursor:not-allowed; transform:none; filter:none;
  color:#6a6870; border-color:#000;
  background:linear-gradient(#0b0b0d,#08080a) padding-box, linear-gradient(#000,#000) border-box;
  box-shadow:0 0 0 1px #1c1c22, inset 0 1px 0 rgba(255,255,255,.03);
}

/* sizes */
.pdxBtn--sm{ padding:8px 15px; font-size:.75rem; }
.pdxBtn--md{ padding:11px 20px; font-size:.86rem; }
.pdxBtn--lg{ padding:14px 28px; font-size:1.0625rem; }
.pdxBtn--block{ width:100%; }

/* SOLID primary CTA (filled accent) - no outer neon bloom */
.pdxBtn--solid{ background:var(--_c); color:#050506;
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 -6px 12px -6px rgba(0,0,0,.28); }
.pdxBtn--solid:hover:not(:disabled){ color:#050506; filter:brightness(1.06);
  background:var(--_c);
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.75),
    inset 0 -6px 12px -6px rgba(0,0,0,.28); }
.pdxBtn--solid:active:not(:disabled){ color:#050506; background:var(--_c);
  box-shadow:0 0 0 1px #000, inset 0 2px 5px rgba(0,0,0,.35); }

/* neon alias = default glass (compat with older call sites) */
.pdxBtn--neon{ /* inherits default */ }

/* OUTLINE secondary */
.pdxBtn--outline{ color:var(--_c); border:1px solid #000;
  background:rgba(0,0,0,.5);
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.08); }
.pdxBtn--outline:hover:not(:disabled){ color:var(--_c); filter:brightness(1.08);
  background:color-mix(in srgb,var(--_c) 10%,rgba(0,0,0,.55));
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.12); }

/* GRADIENT rainbow special */
.pdxBtn--gradient{ color:#050506; border:1px solid #000;
  background:linear-gradient(100deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#8800FF,#FF00CC);
  background-size:180% 180%;
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -6px 12px -6px rgba(0,0,0,.3); }
.pdxBtn--gradient:hover:not(:disabled){ color:#050506; filter:brightness(1.05);
  background-position:100% 50%; transform:translateY(-1px); }

/* PILL, soft filled (system dialogs) */
.pdxBtn--pill{ font-family:var(--font-body); font-weight:var(--fw-bold); text-transform:none;
  letter-spacing:0; border:none; border-radius:6px; background:var(--_c); color:#000; box-shadow:none; }
.pdxBtn--pill:hover:not(:disabled){ filter:brightness(1.06); transform:none; box-shadow:none; color:#000; }
.pdxBtn--pill:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

/* GHOST tertiary */
.pdxBtn--ghost{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; border:1px solid #333; color:var(--text-lo); background:none;
  border-radius:999px; box-shadow:none; padding-block:8px; }
.pdxBtn--ghost:hover:not(:disabled){ border-color:var(--_c); color:var(--_c); background:none; transform:none; filter:none; box-shadow:none; }
.pdxBtn--ghost:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

.pdxBtn__dot{ width:.5em; height:.5em; border-radius:999px; background:currentColor;
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBtn__arrow{ font-weight:var(--fw-bold); }

/* calm: keep chassis keyline; bloom already zero via tokens */
`;
if (typeof document !== "undefined") {
  let s = document.getElementById("pdx-btn-css");
  if (!s) {
    s = document.createElement("style");
    s.id = "pdx-btn-css";
    document.head.appendChild(s);
  }
  s.textContent = CSS;
}

const ACCENTS = {
  lime:    { c: "var(--neon-yellow)" },
  yellow:  { c: "var(--neon-yellow)" },
  cyan:    { c: "var(--neon-cyan)" },
  pink:    { c: "var(--neon-magenta)" },
  magenta: { c: "var(--neon-magenta)" },
  orange:  { c: "var(--neon-orange)" },
  green:   { c: "var(--neon-green)" },
  purple:  { c: "var(--neon-violet)" },
};

/**
 * Button - glass CTA (default) with solid / outline / gradient variants.
 * @param {any} props
 */
export function Button({
  children,
  variant = "neon",        // neon(=glass default) | solid | outline | gradient | pill | ghost
  accent = "lime",
  size = "md",
  block = false,
  live = false,
  arrow = false,
  leadingIcon = null,
  trailingIcon = null,
  as = "button",
  className = "",
  style = {},
  ...rest
}: any) {
  const Tag = as;
  const a = ACCENTS[accent] || ACCENTS.lime;
  const cls = ["pdxBtn", "pdx-glass-rebind", `pdxBtn--${variant}`, `pdxBtn--${size}`,
    block ? "pdxBtn--block" : "", className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} style={{ "--_c": a.c, "--c": a.c, ...style }} {...rest}>
      {live && <span className="pdxBtn__dot" aria-hidden="true" />}
      {leadingIcon}
      {children}
      {trailingIcon}
      {arrow && <span className="pdxBtn__arrow" aria-hidden="true">&rarr;</span>}
    </Tag>
  );
}
