// @ts-nocheck
import React from "react";

const CSS = `
.pdxHero{ position:relative; overflow:hidden; isolation:isolate;
  background:var(--ink-1000) center/cover no-repeat;
  border-radius:var(--radius-lg); }
.pdxHero--flush{ border-radius:0; }
.pdxHero__img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:-2; }
.pdxHero__scrim{ position:absolute; inset:0; z-index:-1; }
.pdxHero__scrim--bottom{ background:linear-gradient(to top, rgba(5,5,9,.94) 0%, rgba(5,5,9,.55) 32%, transparent 62%); }
.pdxHero__scrim--left{ background:linear-gradient(to right, rgba(5,5,9,.92) 0%, rgba(5,5,9,.62) 34%, transparent 66%); }
.pdxHero__scrim--bl{ background:linear-gradient(to top, rgba(5,5,9,.92), transparent 60%),
  linear-gradient(to right, rgba(5,5,9,.85), transparent 62%); }
.pdxHero__scrim--full{ background:rgba(5,5,9,.55); }
.pdxHero__scrim--none{ display:none; }

.pdxHero__content{ position:relative; display:flex; flex-direction:column;
  padding:clamp(20px,4vw,52px); gap:var(--space-5); }
.pdxHero--bl .pdxHero__content{ align-items:flex-start; justify-content:flex-end; }
.pdxHero--bottom .pdxHero__content{ align-items:flex-start; justify-content:flex-end; }
.pdxHero--center .pdxHero__content{ align-items:center; justify-content:center; text-align:center; }

/* subtle top rainbow seam so it reads as a branded band */
.pdxHero__seam{ position:absolute; left:0; right:0; top:0; height:4px; background:var(--grad-rainbow); z-index:1; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-hero-css")) {
  const s = document.createElement("style");
  s.id = "pdx-hero-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const SCRIM = { bottom: "bottom", left: "left", "bottom-left": "bl", full: "full", none: "none" };

/**
 * HeroBanner, full-bleed brand wallpaper with a legibility scrim and an
 * overlay content slot. Feed it one of the collage hero wallpapers.
 */
export function HeroBanner({
  image,
  focal = "center",         // background-position of the wallpaper
  minHeight = 480,
  scrim = "bottom-left",
  align = "bottom-left",    // bottom-left | bottom | center
  seam = true,
  flush = false,            // square corners for full-bleed page tops
  children,
  className = "",
  style = {},
  ...rest
}) {
  const alignKey = align === "center" ? "center" : align === "bottom" ? "bottom" : "bl";
  const cls = ["pdxHero", `pdxHero--${alignKey}`, flush ? "pdxHero--flush" : "", className]
    .filter(Boolean).join(" ");
  return (
    <section className={cls} style={{ minHeight, ...style }} {...rest}>
      {image && <img className="pdxHero__img" src={image} alt="" style={{ objectPosition: focal }} />}
      <div className={`pdxHero__scrim pdxHero__scrim--${SCRIM[scrim] || "bl"}`} />
      {seam && <div className="pdxHero__seam" aria-hidden="true" />}
      <div className="pdxHero__content">{children}</div>
    </section>
  );
}
