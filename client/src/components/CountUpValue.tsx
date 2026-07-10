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

function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  if (rect.width <= 0 && rect.height <= 0) return false;
  return rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
}

/**
 * Count-up number with optional +N float on increases.
 * Replays 0 → value on every mount (page reload / remount) when in view.
 * Reduced-motion / calm mode always show the final value.
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
  const targetRef = useRef(target);
  targetRef.current = target;

  const still = prefersStillMotion();
  // Motion: start at 0 so reload shows the climb. Still: final value only.
  const [display, setDisplay] = useState(() => (still ? target : 0));
  const [pop, setPop] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const prevRef = useRef(still ? target : 0);
  const revealedRef = useRef(still);
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

  // Every mount (incl. full page reload): count 0 → current when visible.
  // Effect-local `started` so React Strict Mode cleanup can re-run cleanly.
  useEffect(() => {
    if (still) {
      revealedRef.current = true;
      setDisplay(targetRef.current);
      prevRef.current = targetRef.current;
      return;
    }

    let cancelled = false;
    let started = false;
    const el = rootRef.current;
    if (!el) return;

    const startCountUp = () => {
      if (cancelled || started) return;
      started = true;
      revealedRef.current = true;
      const to = targetRef.current;
      setDisplay(0);
      animateTo(0, to, duration);
      prevRef.current = to;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        startCountUp();
        io.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -4% 0px" },
    );
    io.observe(el);

    // Page reload / above-the-fold: IO can lag a frame — kick immediately when visible.
    const kick = window.requestAnimationFrame(() => {
      if (!cancelled && isInViewport(el)) startCountUp();
    });

    // Safety: if never intersecting (off-screen forever), snap to final so we never stick at 0.
    const safety = window.setTimeout(() => {
      if (cancelled || started) return;
      setDisplay(targetRef.current);
      prevRef.current = targetRef.current;
      // Leave revealed false so a later scroll-in can still animate via IO…
      // but IO may have already disconnected only after start. Keep observing.
    }, 2500);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(kick);
      window.clearTimeout(safety);
      io.disconnect();
      cancelRaf();
      // Allow a remount (reload / Strict Mode re-run) to animate again.
      revealedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, still]);

  // Subsequent value changes after the first count-up (live metrics refresh).
  useEffect(() => {
    targetRef.current = target;
    if (still) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    if (!revealedRef.current) {
      // Pre-reveal: keep target ready; first paint stays 0 until count-up kicks.
      return;
    }
    const prev = prevRef.current;
    if (prev === target) return;
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
  }, [target, duration, still]);

  useEffect(
    () => () => {
      cancelRaf();
      if (deltaTimer.current) window.clearTimeout(deltaTimer.current);
    },
    [],
  );

  return (
    <span ref={rootRef} className={`pdxCountUp ${className}`.trim()}>
      <span className={`pdxCountUp__num${pop ? " is-pop" : ""}`}>{display}</span>
      {delta != null && (
        <span className="pdxCountUp__delta" aria-hidden="true">
          +{delta}
        </span>
      )}
    </span>
  );
}
