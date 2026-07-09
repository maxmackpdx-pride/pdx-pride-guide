import { useEffect, useRef, useState } from "react";
import { NEON_CYCLE, prefersStillMotion } from "@/lib/motion";

const BAR_COUNT = 7;
const BASE_DUR = [0.72, 0.9, 1.05, 0.8, 1.2, 0.95, 1.15];
const STILL_SCALE = [0.35, 0.7, 0.45, 0.9, 0.55, 0.8, 0.4];

const CSS = `
.pdxLiveWave{
  display:inline-flex; align-items:flex-end; gap:2px;
  height:14px; margin-left:4px; vertical-align:middle;
}
.pdxLiveWave__bar{
  width:2.5px; height:100%; border-radius:1px;
  transform-origin:bottom; background:var(--_c, #00FFFF);
  animation:pdxaEq var(--eq-dur, .9s) var(--ease-inout, cubic-bezier(.65,0,.35,1)) infinite;
  animation-delay:var(--eq-delay, 0s);
}
.pdxLiveWave--still .pdxLiveWave__bar{ animation:none !important; }
`;

function injectCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pdx-livewave-css")) return;
  const s = document.createElement("style");
  s.id = "pdx-livewave-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Neon equalizer adornment for LIVE indicators.
 * Opt-in only. Sits beside the existing live-dot blink; does not replace it.
 */
export default function LiveWave({
  cue = false,
  className = "",
}: {
  /** When true, briefly spike bar speeds then restore. */
  cue?: boolean;
  className?: string;
}) {
  injectCss();
  const [still, setStill] = useState(() => prefersStillMotion());
  const [cueing, setCueing] = useState(false);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cueTimer = useRef<number | null>(null);

  useEffect(() => {
    setStill(prefersStillMotion());
  }, []);

  useEffect(() => {
    if (!cue || still) return;
    setCueing(true);
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      bar.style.animationDuration = `${0.26 + (i % 3) * 0.05}s`;
    });
    if (cueTimer.current) window.clearTimeout(cueTimer.current);
    cueTimer.current = window.setTimeout(() => {
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        bar.style.animationDuration = `${BASE_DUR[i]}s`;
      });
      setCueing(false);
    }, 1300);
    return () => {
      if (cueTimer.current) window.clearTimeout(cueTimer.current);
    };
  }, [cue, still]);

  return (
    <span
      className={`pdxLiveWave${still ? " pdxLiveWave--still" : ""} ${className}`.trim()}
      aria-hidden="true"
      data-cueing={cueing || undefined}
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span
          key={i}
          ref={el => { barRefs.current[i] = el; }}
          className="pdxLiveWave__bar"
          style={{
            ["--_c" as string]: NEON_CYCLE[i % NEON_CYCLE.length],
            ["--eq-dur" as string]: `${BASE_DUR[i]}s`,
            ["--eq-delay" as string]: `${-i * 0.12}s`,
            transform: still ? `scaleY(${STILL_SCALE[i]})` : undefined,
          }}
        />
      ))}
    </span>
  );
}
