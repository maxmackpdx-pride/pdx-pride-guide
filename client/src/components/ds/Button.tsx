// @ts-nocheck
import React from "react";

/* Button, canonical btn-neon (source: repo design-system/previews/buttons.html).
   Outlined rectangle, Barlow Condensed 700, sharp corners, and the signature
   brutalist magenta offset shadow. Tactile press: hover lifts up-left and the
   shadow grows; click pushes down-right and the shadow collapses onto it. */
const CSS = `
.pdxBtn{
  --_c: var(--neon-yellow);
  --_sh: rgba(255,0,204,0.36);
  --_shx: rgba(255,0,204,0.5);
  display:inline-flex; align-items:center; justify-content:center; gap:.5em;
  font-family:var(--font-display); font-weight:var(--fw-bold);
  text-transform:uppercase; letter-spacing:.08em; line-height:1;
  border:2px solid var(--_c); color:var(--_c); background:rgba(0,0,0,0.62);
  border-radius:2px; cursor:pointer; white-space:nowrap; text-decoration:none;
  box-shadow:4px 4px 0 var(--_sh);
  transition:background var(--dur-fast) var(--ease-out),
             color var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out);
}
.pdxBtn:hover{ text-decoration:none; background:var(--_c); color:#000;
  transform:translate(-1px,-1px); box-shadow:6px 6px 0 var(--_shx); }
/* tactile click: press down-right onto the shadow */
.pdxBtn:active{ transform:translate(3px,3px); box-shadow:1px 1px 0 var(--_sh);
  transition-duration:60ms; }
.pdxBtn:disabled{ opacity:.4; cursor:not-allowed; transform:none;
  box-shadow:4px 4px 0 var(--_sh); background:rgba(0,0,0,0.62); color:var(--_c); }

/* sizes */
.pdxBtn--sm{ padding:8px 15px; font-size:.75rem; }
.pdxBtn--md{ padding:10px 20px; font-size:.9rem; }
.pdxBtn--lg{ padding:14px 28px; font-size:1.0625rem; }
.pdxBtn--block{ width:100%; }

/* SOLID, filled accent (black text) */
.pdxBtn--solid{ background:var(--_c); color:#000; }
.pdxBtn--solid:hover{ filter:brightness(1.08); }

/* GRADIENT, rainbow / hot fills for special moments (enhancement) */
.pdxBtn--gradient{ color:#000; border-color:transparent; background:var(--grad-hot); background-size:160% 160%;
  box-shadow:4px 4px 0 rgba(0,255,255,0.3); }
.pdxBtn--gradient:hover{ background-position:100% 50%; color:#000; transform:translate(-1px,-1px); }

/* PILL, soft filled, for system dialogs (error boundary, confirms) */
.pdxBtn--pill{ font-family:var(--font-body); font-weight:var(--fw-bold); text-transform:none;
  letter-spacing:0; border:none; border-radius:6px; background:var(--_c); color:#000; box-shadow:none; }
.pdxBtn--pill:hover{ filter:brightness(1.06); transform:none; box-shadow:none; }
.pdxBtn--pill:active{ transform:scale(.98); box-shadow:none; }

/* GHOST, tertiary (rounded, grey to accent) */
.pdxBtn--ghost{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; border:1px solid #333; color:var(--text-lo); background:none;
  border-radius:999px; box-shadow:none; padding-block:8px; }
.pdxBtn--ghost:hover{ border-color:var(--_c); color:var(--_c); background:none; transform:none; }
.pdxBtn--ghost:active{ transform:scale(.98); box-shadow:none; }

.pdxBtn__dot{ width:.5em; height:.5em; border-radius:999px; background:currentColor;
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBtn__arrow{ font-weight:var(--fw-bold); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-btn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-btn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* accent -> {color, complementary brutal-shadow} */
const ACCENTS = {
  lime:    { c: "var(--neon-yellow)",  sh: "rgba(255,0,204,0.36)", shx: "rgba(255,0,204,0.5)" },
  yellow:  { c: "var(--neon-yellow)",  sh: "rgba(255,0,204,0.36)", shx: "rgba(255,0,204,0.5)" },
  cyan:    { c: "var(--neon-cyan)",    sh: "rgba(204,255,0,0.30)", shx: "rgba(204,255,0,0.45)" },
  pink:    { c: "var(--neon-magenta)", sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
  magenta: { c: "var(--neon-magenta)", sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
  orange:  { c: "var(--neon-orange)",  sh: "rgba(255,0,204,0.32)", shx: "rgba(255,0,204,0.46)" },
  purple:  { c: "var(--neon-violet)",  sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
};

/**
 * Button, the canonical neon CTA with the brutalist offset shadow.
 * @param {any} props
 */
export function Button({
  children,
  variant = "neon",        // neon | solid | gradient | pill | ghost
  accent = "lime",         // lime(=yellow primary) | cyan | pink | orange | purple
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
  const cls = ["pdxBtn", `pdxBtn--${variant}`, `pdxBtn--${size}`,
    block ? "pdxBtn--block" : "", className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} style={{ "--_c": a.c, "--_sh": a.sh, "--_shx": a.shx, ...style }} {...rest}>
      {live && <span className="pdxBtn__dot" aria-hidden="true" />}
      {leadingIcon}
      {children}
      {trailingIcon}
      {arrow && <span className="pdxBtn__arrow" aria-hidden="true">&rarr;</span>}
    </Tag>
  );
}
