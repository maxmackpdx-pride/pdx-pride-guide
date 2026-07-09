// @ts-nocheck
import React from "react";

const CSS = `
.pdxCountdown{ display:flex; align-items:stretch; gap:12px; flex-wrap:wrap; }
.pdxCountdown__unit{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-width:96px; padding:16px 14px 10px;
  background:rgba(255,255,255,.02);
  border:var(--bw-hair) solid rgba(255,255,255,.16); border-radius:var(--radius-sm);
}
.pdxCountdown__num{
  font-family:var(--font-display); font-weight:900; font-size:clamp(2.25rem,5vw,3.5rem); line-height:.9;
  color:var(--_c,var(--lime)); font-variant-numeric:tabular-nums; letter-spacing:.02em;
  /* off-center, slightly hand-drawn black sticker outline + neon glow underneath */
  text-shadow:
    2px 3px 0 #000, 3px 2px 0 #000,
    -1px -1px 0 #000, 1px -1px 0 #000, -1px 2px 0 #000,
    0 0 18px color-mix(in srgb, var(--_c,var(--lime)) 60%, transparent);
}
.pdxCountdown__label{
  font-family:var(--font-mono); font-size:.5625rem; font-weight:var(--fw-bold);
  letter-spacing:.2em; text-transform:uppercase; color:var(--text-lo); margin-top:8px;
}
.pdxCountdown--sm .pdxCountdown__unit{ min-width:64px; padding:9px 8px 6px; }
.pdxCountdown--sm .pdxCountdown__num{ font-size:1.6rem; }
.pdxCountdown__done{
  font-family:var(--font-display); font-weight:900; text-transform:uppercase; color:var(--_c,var(--lime));
  font-size:clamp(1.5rem,4vw,2.5rem); letter-spacing:.02em;
  text-shadow:0 0 22px color-mix(in srgb, var(--_c,var(--lime)) 60%, transparent);
}
.pdxCountdown--rainbow .pdxCountdown__num,
.pdxCountdown--rainbow .pdxCountdown__done{
  background:var(--grad-rainbow);
  -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  text-shadow:none;
  filter:
    drop-shadow(2px 3px 0 #000) drop-shadow(3px 2px 0 #000)
    drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000);
}
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-countdown-css")) {
  const s = document.createElement("style");
  s.id = "pdx-countdown-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const ACCENTS = { lime:"var(--lime)", pink:"var(--pink)", cyan:"var(--cyan)",
  purple:"var(--purple)", amber:"var(--amber)" };

function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
    done: ms === 0,
  };
}

/** Countdown, ticking boxes to a target date (Pride weekend). Supports solid accents + rainbow. */
export function Countdown({
  target = "2026-07-16T19:00:00",
  size = "md",
  accent = "lime",
  doneLabel = "It's Pride!",
  className = "",
  style = {},
  ...rest
}) {
  const [t, setT] = React.useState(() => diff(target));
  React.useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const isRainbow = accent === "rainbow";
  const accentVar = isRainbow ? undefined : (ACCENTS[accent] || accent);
  const accentClass = isRainbow ? "pdxCountdown--rainbow" : "";

  if (t.done) {
    return (
      <div
        className={`pdxCountdown ${accentClass} ${className}`.trim()}
        style={isRainbow ? style : { "--_c": accentVar, ...style }}
        {...rest}
      >
        <span className="pdxCountdown__done">{doneLabel}</span>
      </div>
    );
  }

  const pad = (n) => String(n).padStart(2, "0");
  const units = [
    { n: t.d, l: "Days" }, { n: t.h, l: "Hrs" },
    { n: t.m, l: "Min" }, { n: t.s, l: "Sec" },
  ];

  return (
    <div
      className={`pdxCountdown pdxCountdown--${size} ${accentClass} ${className}`.trim()}
      role="timer"
      aria-live="off"
      style={isRainbow ? style : { "--_c": accentVar, ...style }}
      {...rest}
    >
      {units.map((u, i) => (
        <div className="pdxCountdown__unit" key={u.l}>
          <span className="pdxCountdown__num">{i === 0 ? u.n : pad(u.n)}</span>
          <span className="pdxCountdown__label">{u.l}</span>
        </div>
      ))}
    </div>
  );
}
