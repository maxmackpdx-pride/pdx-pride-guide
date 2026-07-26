import React from "react";

const CSS = `
.pdxMarquee{
  --_bg:var(--pink); --_fg:var(--text-inverse);
  overflow:hidden; white-space:nowrap; background:var(--_bg); color:var(--_fg);
  border-block:var(--bw-bold) solid var(--ink-1000);
  padding-block:8px; position:relative;
}
.pdxMarquee--rainbow{ background:var(--grad-rainbow); }
.pdxMarquee__track{ display:inline-flex; align-items:center; gap:0;
  animation:pdxMarquee var(--_dur,26s) linear infinite; }
.pdxMarquee:hover .pdxMarquee__track{ animation-play-state:paused; }
.pdxMarquee__item{ display:inline-flex; align-items:center; gap:16px; padding:0 16px;
  font-family:var(--font-display); font-weight:700; text-transform:uppercase; font-size:1.05rem; letter-spacing:.04em; }
.pdxMarquee__star{ font-family:var(--font-body); font-weight:var(--fw-bold); opacity:.85; }
@keyframes pdxMarquee{ from{ transform:translateX(0); } to{ transform:translateX(-50%); } }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-marquee-css")) {
  const s = document.createElement("style");
  s.id = "pdx-marquee-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** Marquee, infinite scrolling ticker of slogans / dates. Zine/club motif. */
export function Marquee({
  items = ["Events", "July 16–19", "Keep Portland Weird", "Take Care of Each Other"],
  color = "pink",
  separator = "✦",
  speed = 26,
  className = "",
  ...rest
}) {
  const loop = [...items, ...items];
  return (
    <div className={`pdxMarquee ${color === "rainbow" ? "pdxMarquee--rainbow" : ""} ${className}`}
      style={{ "--_bg": color === "rainbow" ? undefined : `var(--${color})`, "--_dur": `${speed}s` }}
      {...rest}>
      <div className="pdxMarquee__track">
        {loop.map((it, i) => (
          <span className="pdxMarquee__item" key={i}>
            {it}<span className="pdxMarquee__star" aria-hidden="true">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
