import React from "react";

const CSS = `
.pdxIconBtn{
  --_bg:transparent; --_fg:var(--text-hi); --_bd:var(--border-strong);
  display:inline-flex; align-items:center; justify-content:center;
  border:var(--bw-bold) solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-pill); cursor:pointer; flex:none;
  transition:transform var(--dur-fast) var(--ease-spring),
             border-color var(--dur-base) var(--ease-out),
             background var(--dur-base) var(--ease-out),
             color var(--dur-base) var(--ease-out);
}
.pdxIconBtn:active{ transform:scale(var(--press-scale)); }
.pdxIconBtn:disabled{ opacity:.4; cursor:not-allowed; }
.pdxIconBtn svg{ width:1.25em; height:1.25em; }

.pdxIconBtn--sm{ width:34px; height:34px; font-size:14px; }
.pdxIconBtn--md{ width:44px; height:44px; font-size:16px; }
.pdxIconBtn--lg{ width:52px; height:52px; font-size:19px; }

.pdxIconBtn--outline:hover{ --_bd:var(--cyan); color:var(--cyan); }
.pdxIconBtn--solid{ --_bg:var(--pink); --_fg:var(--text-inverse); --_bd:transparent; }
.pdxIconBtn--solid:hover{ box-shadow:var(--glow-pink); background:var(--pink-hot); }
.pdxIconBtn--ghost{ --_bd:transparent; }
.pdxIconBtn--ghost:hover{ background:#ffffff12; }
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
