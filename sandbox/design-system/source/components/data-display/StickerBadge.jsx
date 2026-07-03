import React from "react";

const CSS = `
.pdxSticker{
  --_bg:var(--lime); --_fg:var(--text-inverse); --_rot:-4deg;
  display:inline-block; transform:rotate(var(--_rot));
  font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  letter-spacing:.02em; line-height:.98;
  padding:10px 16px 8px; border-radius:var(--radius-sm);
  background:var(--_bg); color:var(--_fg);
  border:var(--bw-chunk) solid var(--ink-1000);
  box-shadow:var(--shadow-hard);
  transition:transform var(--dur-base) var(--ease-spring);
  will-change:transform;
}
.pdxSticker:hover{ transform:rotate(calc(var(--_rot) * -0.5)) scale(1.04); }
.pdxSticker--sm{ font-size:.9rem; padding:6px 11px 4px; box-shadow:var(--shadow-hard-sm); }
.pdxSticker--md{ font-size:1.4rem; }
.pdxSticker--lg{ font-size:2.2rem; padding:14px 22px 11px; box-shadow:var(--shadow-hard-lg); }

/* fills */
.pdxSticker--lime{ --_bg:var(--lime); --_fg:var(--text-inverse); }
.pdxSticker--pink{ --_bg:var(--pink); --_fg:var(--text-inverse); }
.pdxSticker--cyan{ --_bg:var(--cyan); --_fg:var(--text-inverse); }
.pdxSticker--purple{ --_bg:var(--purple); --_fg:#fff; }
.pdxSticker--yellow{ --_bg:var(--yellow); --_fg:var(--text-inverse); }
.pdxSticker--rainbow{ --_fg:var(--text-inverse); background:var(--grad-rainbow); }
/* paper/outline treatment */
.pdxSticker--paper{ --_bg:var(--paper); --_fg:var(--ink-1000); }
.pdxSticker--outline{ background:transparent; color:var(--_oc,var(--lime));
  border-color:var(--_oc,var(--lime)); box-shadow:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-sticker-css")) {
  const s = document.createElement("style");
  s.id = "pdx-sticker-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * StickerBadge, the collage slogan sticker. Rotated, chunky display type
 * on a hard-shadow neon chip. "KEEP PORTLAND WEIRD", "PRIDE IS A PROTEST".
 */
export function StickerBadge({
  children,
  color = "lime",
  size = "md",
  rotate = -4,
  className = "",
  style = {},
  ...rest
}) {
  const cls = ["pdxSticker", `pdxSticker--${color}`, `pdxSticker--${size}`, className]
    .filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ "--_rot": `${rotate}deg`, ...style }} {...rest}>
      {children}
    </span>
  );
}
