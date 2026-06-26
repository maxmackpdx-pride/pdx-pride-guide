import { useEffect, useRef } from "react";

type EventTickerProps = {
  titles: string[];
};

export default function EventTicker({ titles }: EventTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = [...titles, ...titles];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      track.style.transform = "none";
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();
    let offset = 0;
    const speed = 52;

    const measureHalf = () => Math.max(track.scrollWidth / 2, 1);

    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const half = measureHalf();
      offset -= speed * dt;
      if (offset <= -half) offset += half;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      const half = measureHalf();
      if (offset <= -half) offset = offset % half;
    });
    ro.observe(track);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      track.style.transform = "";
    };
  }, [titles]);

  return (
    <div className="event-ticker-window">
      <div ref={trackRef} className="event-ticker-track">
        {items.map((title, index) => (
          <span className="event-ticker-item" key={`${title}-${index}`} title={title}>
            {title}
            <span className="event-ticker-sep" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}