import { useEffect, useRef, useState } from "react";
import { prefersStillMotion } from "@/lib/motion";

const CSS = `
.pdxCountUp{ position:relative; display:inline-block; font-variant-numeric:tabular-nums; }
.pdxCountUp__num{ display:inline-block; }
.pdxCountUp__num.is-pop{ animation:pdxaNumPop .5s var(--ease-out, cubic-bezier(.2,.8,.2,1)); }
.pdxCountUp__delta{
  position:absolute; left:50%; top:0; transform:translateX(-50%);
  font-size:.65em; font-weight:700; color:inherit; pointer-events:none;
  animation:pdxaFloatUp .8s var(--ease-out, cubic-bezier(.2,.8,.2,1)) forwards;
  white-space:nowrap;
}
`;

function injectCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pdx-countup-css")) return;
  const s = document.createElement("style");
  s.id = "pdx-countup-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Count-up number with optional +N float on increases.
 * First paint and still-motion always show the final value (never stuck at 0).
 */
export default function CountUpValue({
  value,
  duration = 900,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  injectCss();
  const target = Number.isFinite(value) ? value : 0;
  // SSR / first paint: final value immediately
  const [display, setDisplay] = useState(target);
  const [pop, setPop] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const prevRef = useRef(target);
  const revealed = useRef(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const deltaTimer = useRef<number | null>(null);

  const cancelRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const animateTo = (from: number, to: number, ms: number) => {
    cancelRaf();
    if (prefersStillMotion() || from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const p = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * p));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Reveal on scroll into view (count from 0 once)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || revealed.current) return;
    if (prefersStillMotion()) {
      revealed.current = true;
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || revealed.current) return;
        revealed.current = true;
        setDisplay(0);
        animateTo(0, target, duration);
        prevRef.current = target;
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelRaf();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subsequent value changes
  useEffect(() => {
    if (!revealed.current) {
      // Keep final value before first reveal (no stuck 0)
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    const prev = prevRef.current;
    if (prev === target) return;
    if (prefersStillMotion()) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    animateTo(prev, target, Math.min(duration, 600));
    if (target > prev) {
      const d = target - prev;
      setDelta(d);
      setPop(true);
      if (deltaTimer.current) window.clearTimeout(deltaTimer.current);
      deltaTimer.current = window.setTimeout(() => {
        setDelta(null);
        setPop(false);
      }, 820);
    }
    prevRef.current = target;
    return () => {
      cancelRaf();
      if (deltaTimer.current) window.clearTimeout(deltaTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => () => {
    cancelRaf();
    if (deltaTimer.current) window.clearTimeout(deltaTimer.current);
  }, []);

  return (
    <span ref={rootRef} className={`pdxCountUp ${className}`.trim()}>
      <span className={`pdxCountUp__num${pop ? " is-pop" : ""}`}>{display}</span>
      {delta != null && (
        <span className="pdxCountUp__delta" aria-hidden="true">+{delta}</span>
      )}
    </span>
  );
}
