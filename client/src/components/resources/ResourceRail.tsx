import { useEffect, useState, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { motion, useSpring } from "framer-motion";

// Adapted from 21st's Appica Carousel and Designali Scroll Progress patterns.
// The rail owns navigation and clipping; resource cards keep their own design.
export function ResourceRail({ id, title, color, count, quiet, children, room = "ReZources", itemName = "resource", focusIndex, deferOnMobile = false }: {
  id: string; title: string; color: string; count: number; quiet: boolean; children: ReactNode | (() => ReactNode); room?: string; itemName?: string; focusIndex?: number; deferOnMobile?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(!deferOnMobile);
  useEffect(() => {
    if (!deferOnMobile) return;
    const section = sectionRef.current;
    const media = window.matchMedia('(max-width: 719px), (pointer: coarse)');
    let observer: IntersectionObserver | undefined;
    const sync = () => {
      observer?.disconnect();
      if (!media.matches || (focusIndex !== undefined && focusIndex >= 0) || !section || !('IntersectionObserver' in window)) {
        setReady(true);
        return;
      }
      observer = new IntersectionObserver(entries => {
        if (entries[0]) setReady(entries[0].isIntersecting);
      }, { rootMargin: '20px 0px' });
      observer.observe(section);
    };
    sync();
    media.addEventListener('change', sync);
    return () => { observer?.disconnect(); media.removeEventListener('change', sync); };
  }, [focusIndex, deferOnMobile]);
  const plugins = useMemo(() => [WheelGesturesPlugin()], []);
  const [viewport, api] = useEmblaCarousel({ direction: "rtl", align: "center", startIndex: Math.floor(count / 2), containScroll: "trimSnaps", duration: quiet ? 0 : 25 }, plugins);
  const [position, setPosition] = useState({ progress: 0, previous: false, next: false, overflow: false });
  const progress = useSpring(0, { stiffness: 200, damping: 40 });
  useEffect(() => {
    if (!api) return;
    const update = () => {
      const value = Math.max(0, Math.min(1, api.scrollProgress()));
      const next = { progress: Math.round(value * 100) / 100, previous: api.canScrollPrev(), next: api.canScrollNext(), overflow: api.scrollSnapList().length > 1 };
      setPosition(current => current.progress === next.progress && current.previous === next.previous && current.next === next.next && current.overflow === next.overflow ? current : next);
      if (quiet) progress.jump(value); else progress.set(value);
    };
    api.scrollTo(Math.floor((api.scrollSnapList().length - 1) / 2), true);
    update();
    api.on("scroll", update).on("select", update).on("reInit", update);
    return () => { api.off("scroll", update).off("select", update).off("reInit", update); };
  }, [api, quiet, progress]);
  useEffect(() => {
    if (!api || focusIndex === undefined || focusIndex < 0) return;
    api.scrollTo(focusIndex, true);
  }, [api, focusIndex]);
  return <section ref={sectionRef} className="rg-resource-rail-section" aria-labelledby={`${id}-title`} style={{ "--rail-accent": color } as CSSProperties}>
    <header className="rg-rail-heading">
      <span className="rg-eyebrow">Explore {room}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{count} {itemName}{count === 1 ? "" : "s"}</p>

    </header>
    {ready ? <div className="rg-resource-rail" id={id} ref={viewport} dir="rtl" tabIndex={0}
      data-fade-left={position.next} data-fade-right={position.previous}
      aria-label={`${title} ${itemName}s, drag or use arrow keys`} onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); api?.scrollNext(quiet); }
        if (event.key === "ArrowRight") { event.preventDefault(); api?.scrollPrev(quiet); }
      }}>
      <div className="rg-rail-track">{typeof children === 'function' ? children() : children}</div>
    </div> : <div className="rg-resource-rail-placeholder"><button type="button" className="sr-only" onClick={() => setReady(true)}>Show {title} {itemName}s</button></div>}
    {ready && position.overflow && <div className="rg-rail-progress" role="progressbar" aria-label={`${title} rail position`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position.progress * 100)}>
      <motion.div style={{ scaleX: progress }} />
    </div>}
  </section>;
}
