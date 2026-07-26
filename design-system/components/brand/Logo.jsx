import React from "react";

const CSS = `
.pdxLogo{ display:inline-flex; align-items:center; gap:.6em; text-decoration:none; }
.pdxLogo__img{ display:block; width:var(--_sz,56px); height:var(--_sz,56px);
  border-radius:22.6%; flex:none; }
.pdxLogo__full{ display:block; height:var(--_fh,72px); width:auto; flex:none; }
.pdxLogo__wm{ display:flex; flex-direction:column; font-family:var(--font-display); font-weight:900;
  text-transform:uppercase; line-height:.86; letter-spacing:.01em; }
.pdxLogo__wm span{ display:block; }
.pdxLogo--light .pdxLogo__wm{ color:var(--text-hi); }
.pdxLogo--dark .pdxLogo__wm{ color:var(--ink-1000); }
.pdxLogo__rainbow{
  background:var(--grad-rainbow); -webkit-background-clip:text; background-clip:text;
  color:transparent; padding-right:.08em; margin-right:-.08em;
}
.pdxLogo__tm{ font-size:.34em; vertical-align:top; line-height:1; font-weight:700; margin-left:.04em; }
/* full baked lockup (badge + wordmark as one image) */
.pdxLogo--full{ gap:0; }
/* stacked (icon over centered wordmark) */
.pdxLogo--stacked{ flex-direction:column; gap:.5em; text-align:center; }
.pdxLogo--stacked .pdxLogo__wm{ align-items:center; }
/* wordmark only, bigger, hero use */
.pdxLogo--wordmark .pdxLogo__wm{ line-height:.84; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-logo-css")) {
  const s = document.createElement("style");
  s.id = "pdx-logo-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Logo, the official lockup: the app face tile + ZAYLIST wordmark
 * (spectrum gradient). Per brand rule the mark
 * always appears with the wordmark unless `variant="icon"`.
 */
export function Logo({
  variant = "lockup",      // full | lockup | stacked | icon | wordmark
  size = 56,               // icon px (drives wordmark scale in lockup/stacked)
  tone = "light",          // light (on dark) | dark (on paper)
  tm = true,               // append the ™ mark to the live-text wordmark
  src = "app-face/icons/zaylist-512.png",
  fullSrc = "assets/logo-lockup.png",
  alt = "Zaylist",
  className = "",
  href,
  ...rest
}) {
  const showIcon = variant !== "wordmark" && variant !== "full";
  const showText = variant !== "icon" && variant !== "full";
  // wordmark font-size ~= 40% of icon size in lockup, larger standalone
  const wmSize = variant === "wordmark" ? size : Math.round(size * 0.42);

  const cls = ["pdxLogo", `pdxLogo--${variant}`, `pdxLogo--${tone}`, className]
    .filter(Boolean).join(" ");

  // `full` renders the baked horizontal lockup (badge + wordmark as one image).
  const inner = variant === "full" ? (
    <img className="pdxLogo__full" src={fullSrc} alt=""
      style={{ "--_fh": `${size}px` }} aria-hidden="true" />
  ) : (
    <>
      {showIcon && (
        <img className="pdxLogo__img" src={src} alt={showText ? "" : alt}
          style={{ "--_sz": `${size}px` }} aria-hidden={showText ? "true" : undefined} />
      )}
      {showText && (
        <span className="pdxLogo__wm" style={{ fontSize: `${wmSize}px` }}>
          <span>ZAYLIST{tm && <sup className="pdxLogo__tm">™</sup>}</span>
        </span>
      )}
    </>
  );

  if (href) {
    return <a className={cls} href={href} aria-label={alt} {...rest}>{inner}</a>;
  }
  return <span className={cls} role="img" aria-label={alt} {...rest}>{inner}</span>;
}
