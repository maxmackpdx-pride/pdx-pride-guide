import React from "react";

/* IconButton, square glass plate holding a single glyph. Deep Glass chrome
   (tokens/glass.css §1.7): ink radial fill, keyline ring, 1px top bevel. */
const CSS = `
.pdxIconBtn{
  --_c:var(--neon-cyan); --c:var(--_c);
  display:inline-flex; align-items:center; justify-content:center;
  border:1px solid #000; color:#c8c4bb; cursor:pointer; flex:none;
  border-radius:var(--chrome-radius-md);
  background:radial-gradient(130% 110% at 50% 0%, rgba(255,255,255,.06), #0b0b0f 62%, #08080b);
  box-shadow:0 0 0 1px #1c1c22, inset 0 1px 0 rgba(255,255,255,.1);
  transition:color var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out),
             background var(--dur-base) var(--ease-out);
}
.pdxIconBtn:hover:not(:disabled){ color:#fff; box-shadow:0 0 0 1px #2e2e38, inset 0 1px 0 rgba(255,255,255,.14); }
.pdxIconBtn:active:not(:disabled){ box-shadow:0 0 0 1px #1c1c22, var(--chrome-press); }
.pdxIconBtn:focus-visible{ outline:none; box-shadow:var(--chrome-keyline), var(--chrome-focus), inset 0 1px 0 rgba(255,255,255,.1); }
.pdxIconBtn:disabled{ opacity:.4; cursor:not-allowed; }
.pdxIconBtn svg{ width:1.06em; height:1.06em; stroke:currentColor; stroke-width:2.2;
  stroke-linecap:round; stroke-linejoin:round; fill:none; }

.pdxIconBtn--sm{ width:34px; height:34px; font-size:14px; border-radius:var(--chrome-radius-sm); }
.pdxIconBtn--md{ width:42px; height:42px; font-size:16px; }
.pdxIconBtn--lg{ width:52px; height:52px; font-size:19px; border-radius:var(--chrome-radius-lg); }

.pdxIconBtn--outline:hover:not(:disabled){ color:var(--_c);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 40%, transparent), inset 0 1px 0 rgba(255,255,255,.14); }
/* SOLID, lit acid plate with the bloom on the floor */
.pdxIconBtn--solid{ color:#07070a; border:1px solid #000; background:var(--acid-lit);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom-sm); }
.pdxIconBtn--solid:hover:not(:disabled){ color:#07070a; filter:brightness(1.05); background:var(--acid-lit-hover);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom); }
.pdxIconBtn--ghost{ border-color:transparent; background:none; box-shadow:none; }
.pdxIconBtn--ghost:hover:not(:disabled){ background:rgba(255,255,255,.05); box-shadow:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-iconbtn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-iconbtn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** IconButton, square-ish circular button holding a single glyph. */
export function IconButton({
  children,
  label,
  variant = "outline",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["pdxIconBtn", `pdxIconBtn--${variant}`, `pdxIconBtn--${size}`, className]
    .filter(Boolean).join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
