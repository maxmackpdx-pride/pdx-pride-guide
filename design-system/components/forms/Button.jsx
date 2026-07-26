import React from "react";

/* Button, canonical CTA. Deep Glass chrome (tokens/glass.css §1.7): black keyline,
   1px top bevel, floor shade, accent bloom. Hover lifts 1px and blooms wider,
   press sinks 1px with the bloom cut. The brutalist magenta offset survives only
   on the deliberate --sticker variant (collage flair, not chrome). */
const CSS = `
.pdxBtn{
  --_c: var(--neon-yellow); --c: var(--_c);
  display:inline-flex; align-items:center; justify-content:center; gap:.5em;
  font-family:var(--font-display); font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; line-height:1;
  border:0; border-radius:var(--chrome-radius-md); cursor:pointer; white-space:nowrap; text-decoration:none;
  color:#fff; background:var(--chrome-ink-fill);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 18%, transparent), var(--chrome-bevel-dark),
    inset 0 -10px 16px -12px rgba(0,0,0,.7), 0 10px 24px -16px color-mix(in srgb, var(--_c) 50%, transparent);
  transition:transform var(--dur-fast) var(--ease-out),
             filter var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out);
}
.pdxBtn:hover:not(:disabled){ text-decoration:none; transform:translateY(-1px); filter:brightness(1.12);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 34%, transparent), inset 0 1px 0 rgba(255,255,255,.16),
    0 14px 30px -16px color-mix(in srgb, var(--_c) 70%, transparent); }
.pdxBtn:active:not(:disabled){ transform:translateY(1px); transition-duration:60ms;
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 20%, transparent), inset 0 2px 6px rgba(0,0,0,.7); }
.pdxBtn:focus-visible{ outline:none;
  box-shadow:var(--chrome-keyline), var(--chrome-focus), var(--chrome-bevel-dark); }
.pdxBtn:disabled{ cursor:not-allowed; transform:none; filter:none;
  color:#5f5f68; background:#111114;
  box-shadow:var(--chrome-keyline), inset 0 1px 0 rgba(255,255,255,.05); }

/* sizes */
.pdxBtn--sm{ padding:9px 16px; font-size:.8125rem; letter-spacing:.10em; border-radius:var(--chrome-radius-sm); }
.pdxBtn--md{ padding:14px 26px; font-size:1.0625rem; }
.pdxBtn--lg{ padding:17px 34px; font-size:1.25rem; letter-spacing:.08em; border-radius:var(--chrome-radius-lg); }
.pdxBtn--block{ width:100%; }

/* SOLID, the primary. Lit acid fill, black text, bloom on the floor. */
.pdxBtn--solid{ color:#07070a; background:var(--acid-lit);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), var(--chrome-bloom), var(--chrome-drop); }
.pdxBtn--solid:hover:not(:disabled){ filter:brightness(1.05); background:var(--acid-lit-hover);
  box-shadow:var(--chrome-keyline), inset 0 1px 0 rgba(255,255,255,.85), var(--chrome-bloom-hover), var(--chrome-drop); }
.pdxBtn--solid:active:not(:disabled){ background:var(--acid-lit-press);
  box-shadow:var(--chrome-keyline), var(--chrome-press); }
.pdxBtn--solid:focus-visible{ box-shadow:var(--chrome-keyline), var(--chrome-focus), var(--chrome-bevel); }
.pdxBtn--lg.pdxBtn--solid{ box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), var(--chrome-bloom-lg), var(--chrome-drop); }
.pdxBtn--sm.pdxBtn--solid{ box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom-sm), 0 2px 4px rgba(0,0,0,.6); }

/* NEON, the default secondary. Inherits the base glass chassis. */
.pdxBtn--neon{ color:#fff; }

/* OUTLINE, quiet tertiary that still keys to the accent */
.pdxBtn--outline{ font-weight:700; color:var(--_c); background:rgba(255,255,255,.025);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--_c) 26%, transparent), inset 0 1px 0 rgba(255,255,255,.06); }
.pdxBtn--outline:hover:not(:disabled){ transform:none; filter:none; background:color-mix(in srgb, var(--_c) 8%, transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--_c) 50%, transparent), inset 0 1px 0 rgba(255,255,255,.06); }

/* STICKER, the collage CTA (e.g. "Claim this event"). Flair, not chrome.
   The flat magenta offset is retired: it is now a lit plate on a black
   keyline with its own accent blooming on the floor. Keeps the tilt. */
.pdxBtn--sticker{ --c:var(--_c); color:var(--_c); border:2px solid var(--_c); background:rgba(0,0,0,.62);
  border-radius:var(--chrome-radius-tag); box-shadow:var(--sticker-lit); }
.pdxBtn--sticker:hover:not(:disabled){ background:var(--_c); color:#000; transform:translateY(-2px);
  box-shadow:var(--sticker-lit-hover); filter:none; }
.pdxBtn--sticker:active:not(:disabled){ transform:translateY(1px); box-shadow:var(--sticker-lit-press); }

/* GRADIENT, rainbow / hot fills for special moments (enhancement) */
.pdxBtn--gradient{ color:#000; background:var(--grad-hot); background-size:160% 160%;
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), 0 12px 28px -14px rgba(0,255,255,.55), var(--chrome-drop); }
.pdxBtn--gradient:hover:not(:disabled){ background-position:100% 50%; color:#000; }

/* PILL, soft filled, for system dialogs (error boundary, confirms) */
.pdxBtn--pill{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; border-radius:6px; background:var(--_c); color:#000; box-shadow:none; }
.pdxBtn--pill:hover:not(:disabled){ filter:brightness(1.06); transform:none; box-shadow:none; }
.pdxBtn--pill:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

/* GHOST, tertiary */
.pdxBtn--ghost{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; color:var(--text-lo); background:none; border-radius:999px;
  padding-block:8px; box-shadow:none; }
.pdxBtn--ghost:hover:not(:disabled){ color:#fff; background:rgba(255,255,255,.05); transform:none; filter:none; box-shadow:none; }
.pdxBtn--ghost:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

.pdxBtn__dot{ width:.5em; height:.5em; border-radius:999px; background:currentColor;
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBtn__arrow{ font-weight:800; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-btn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-btn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* accent -> color. The bloom is derived from the accent itself now,
   so there is no second complementary-shadow hue to carry. */
const ACCENTS = {
  lime:    { c: "var(--neon-yellow)" },
  yellow:  { c: "var(--neon-yellow)" },
  cyan:    { c: "var(--neon-cyan)" },
  pink:    { c: "var(--neon-magenta)" },
  magenta: { c: "var(--neon-magenta)" },
  orange:  { c: "var(--neon-orange)" },
  purple:  { c: "var(--neon-violet)" },
};

/**
 * Button, the canonical neon CTA with the brutalist offset shadow.
 */
export function Button({
  children,
  variant = "neon",        // neon | solid | outline | gradient | pill | ghost | sticker
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
}) {
  const Tag = as;
  const a = ACCENTS[accent] || ACCENTS.lime;
  const cls = ["pdxBtn", `pdxBtn--${variant}`, `pdxBtn--${size}`,
    block ? "pdxBtn--block" : "", className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} style={{ "--_c": a.c, ...style }} {...rest}>
      {live && <span className="pdxBtn__dot" aria-hidden="true" />}
      {leadingIcon}
      {children}
      {trailingIcon}
      {arrow && <span className="pdxBtn__arrow" aria-hidden="true">&rarr;</span>}
    </Tag>
  );
}
