import React from "react";

const CSS = `
.pdxSection{ display:flex; align-items:flex-end; justify-content:space-between; gap:20px;
  flex-wrap:wrap; margin-bottom:var(--space-6); }
.pdxSection__lead{ min-width:0; }
.pdxSection__kicker{ display:inline-flex; align-items:center; gap:8px;
  font-family:var(--font-display); font-size:var(--chrome-sm); font-weight:var(--fw-bold);
  letter-spacing:var(--tracking-kicker); text-transform:uppercase; color:var(--_c,var(--pink));
  margin-bottom:10px; }
.pdxSection__kicker::before{ content:""; width:22px; height:3px; border-radius:var(--radius-pill);
  background:var(--_c,var(--pink)); }
.pdxSection__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  line-height:var(--lh-display); letter-spacing:var(--tracking-display); color:var(--text-hi);
  font-size:var(--display-2); margin:0; }
.pdxSection__title .hl{ color:var(--_c,var(--pink)); }
.pdxSection__sub{ font-family:var(--font-body); color:var(--text-mid); font-size:var(--body-md);
  max-width:var(--w-prose); margin-top:10px; }
.pdxSection__action{ flex:none; }
.pdxSection--center{ flex-direction:column; align-items:center; text-align:center; }
.pdxSection--center .pdxSection__kicker::before{ display:none; }
.pdxSection--sm .pdxSection__title{ font-size:var(--display-3); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-section-css")) {
  const s = document.createElement("style");
  s.id = "pdx-section-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const ACCENTS = { pink:"var(--pink)", cyan:"var(--cyan)", purple:"var(--purple)",
  lime:"var(--lime)", amber:"var(--amber)" };

/** SectionHeader, mono kicker + loud display title + optional action. */
export function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  accent = "pink",
  align = "left",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["pdxSection", align === "center" ? "pdxSection--center" : "",
    size === "sm" ? "pdxSection--sm" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ "--_c": ACCENTS[accent] || accent }} {...rest}>
      <div className="pdxSection__lead">
        {kicker && <div className="pdxSection__kicker">{kicker}</div>}
        {title && <h2 className="pdxSection__title">{title}</h2>}
        {subtitle && <p className="pdxSection__sub">{subtitle}</p>}
      </div>
      {action && <div className="pdxSection__action">{action}</div>}
    </div>
  );
}
