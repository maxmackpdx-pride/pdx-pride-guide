import { useResponsivePoster } from "@/lib/useResponsivePoster";
import { useEffect, useRef, type ImgHTMLAttributes } from "react";
import { restoreOriginalPoster } from "@/lib/responsivePoster";
import DayMotif, { motifDay } from "./DayMotif";
import EventFallbackLogo from "./EventFallbackLogo";

/**
 * Scroll parallax for a card flyer (the v12 study): the poster layer travels
 * vertically as the card moves through the viewport — up to ~10px each way —
 * while the card chrome never moves. The img is overscanned 10px top and
 * bottom (see .evz-plx__img) so the travel never opens a gap, and the flyer
 * stays locked at 100% of the card width. Gated by IntersectionObserver so
 * off-screen cards cost nothing; off under reduced-motion and calm mode.
 */
function useParallaxLayer(enabled: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = false;
    const tick = () => {
      if (visible) {
        const root = document.documentElement;
        const calm = root.dataset.calm === "true" || root.classList.contains("calm-mode");
        if (!calm) {
          const r = el.parentElement?.getBoundingClientRect();
          if (r) {
            const vh = window.innerHeight || 800;
            const off = (r.top + r.height / 2 - vh / 2) / vh;
            const y = Math.max(-10, Math.min(10, -off * 20));
            el.style.transform = `translateY(${y.toFixed(2)}px)`;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? false; }, { rootMargin: "80px" });
    io.observe(el);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [enabled]);
  return ref;
}

/**
 * The flyer slot of any event card: the real flyer when there is one, otherwise the
 * event's day motif with the weekday on it. Drop-in for `<img src={poster} />` inside
 * an art container that is position:relative (the container also needs --c set).
 */
export default function EventFlyerArt({
  src,
  day,
  showDay = true,
  title = "",
  venueName = "",
  glass = false,
  backdrop = true,
  parallax = false,
  alt = "",
  onError,
  ...img
}: { src: string | null | undefined; day: string | null | undefined; showDay?: boolean; title?: string; venueName?: string; glass?: boolean; backdrop?: boolean; parallax?: boolean } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const posterAttributes = useResponsivePoster(src, img.sizes);
  const plxRef = useParallaxLayer(parallax && Boolean(src));
  if (src) {
    const image = <img {...posterAttributes} alt={alt} loading="lazy" decoding="async" {...img} className={parallax ? "evz-plx__img" : img.className} onError={event => { if (!restoreOriginalPoster(event.currentTarget, src)) onError?.(event); }} />;
    if (parallax) return <>{backdrop && <DayMotif day={day} placement="art" networkOnly />}<span className="evz-plx" ref={plxRef} aria-hidden="true">{image}</span></>;
    return <>{backdrop && <DayMotif day={day} placement="art" networkOnly />}{image}</>;
  }
  return (
    <>
      <DayMotif day={day} placement="art" glass={glass} />
      {showDay ? <i className="day-motif-code">{motifDay(day)}</i> : null}
      <EventFallbackLogo title={title} venueName={venueName} />
    </>
  );
}
