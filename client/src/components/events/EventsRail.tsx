import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NUDGE_KEY = "eventz-rail-nudged";

function quietMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.classList.contains("calm-mode")
    || document.documentElement.dataset.calm === "true";
}

/**
 * Horizontal rail with clear swipe cues: edge fade + arrow on whichever side has
 * more cards, a progress bar under the row, and a one-time nudge the first time
 * a rail scrolls into view (skipped in calm mode and reduced motion).
 */
export default function EventsRail({ open, label, nudge = false, children }: { open: boolean; label: string; nudge?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ left: false, right: false, progress: 0, thumb: 1 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || open) { setState({ left: false, right: false, progress: 0, thumb: 1 }); return; }
    const max = el.scrollWidth - el.clientWidth;
    const thumb = el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1;
    setState({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < max - 4,
      progress: max > 0 ? el.scrollLeft / max : 0,
      thumb,
    });
  }, [open]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  // One gentle nudge per session, on the first rail that has more to show.
  useEffect(() => {
    const el = ref.current;
    if (!nudge || open || !el || quietMotion() || typeof IntersectionObserver === "undefined") return;
    try { if (sessionStorage.getItem(NUDGE_KEY)) return; } catch { /* storage blocked: still nudge once per mount */ }
    let timers: number[] = [];
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || el.scrollWidth <= el.clientWidth + 8) return;
      io.disconnect();
      try { sessionStorage.setItem(NUDGE_KEY, "1"); } catch { /* ignore */ }
      timers.push(window.setTimeout(() => el.scrollTo({ left: 72, behavior: "smooth" }), 450));
      timers.push(window.setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 1150));
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(t => window.clearTimeout(t)); timers = []; };
  }, [nudge, open]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>(".events-rail__item");
    const step = item ? item.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: quietMotion() ? "auto" : "smooth" });
  };

  const scrollable = !open && (state.left || state.right);

  return (
    <div className={`events-rail-wrap${scrollable ? " is-scrollable" : ""}${state.left ? " has-left" : ""}${state.right ? " has-right" : ""}`}>
      <div ref={ref} className={open ? "events-rail events-rail--open" : "events-rail"} role="list" aria-label={label} onScroll={measure}>
        {children}
      </div>
      {scrollable && (
        <>
          <button type="button" className="events-rail-arrow events-rail-arrow--left" aria-label={`Previous in ${label}`} tabIndex={state.left ? 0 : -1} aria-hidden={!state.left} onClick={() => page(-1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" className="events-rail-arrow events-rail-arrow--right" aria-label={`More in ${label}`} tabIndex={state.right ? 0 : -1} aria-hidden={!state.right} onClick={() => page(1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <div className="events-rail-progress" aria-hidden="true">
            <span style={{ width: `${state.thumb * 100}%`, transform: `translateX(${(state.progress * (1 - state.thumb) / Math.max(state.thumb, 0.01)) * 100}%)` }} />
          </div>
        </>
      )}
    </div>
  );
}
