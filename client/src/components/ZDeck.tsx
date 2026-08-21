import { useCallback, useEffect, useRef } from "react";
import "./ZDeck.css";

/**
 * Z/DECK, the shared coverflow deck.
 *
 * One implementation, used by the z/ index rail and the Next preview on the
 * home page. Two copies of this physics would drift the moment one of them was
 * tuned, so callers change the look with CSS custom properties
 * (--cf-card, --cf-card-h) and a modifier class, never by forking the maths.
 *
 * `selected` is the only source of truth. The deck animates a floating
 * position toward it and reports drag-driven changes back up, so dots, chips,
 * search and autoplay all steer the same value and cannot disagree.
 *
 * Child DOM is untouched: each child is positioned by a wrapper, so a card
 * keeps whatever content, links and headings it already had.
 *
 * NOTE: this is a component name, not a z/ address. Nothing here adds `z/deck`
 * to the namespace; zNamespace.ts stays the only place addresses are declared,
 * and only for boards that have been approved.
 */

const CF_ROTATE = 26;
const CF_DEPTH = 0.5;
const CF_FALLOFF = 0.6;
const CF_FADE = 0.24;
const CF_GAP = 0.1;

export const Z_DECK_AUTOPLAY_MS = 2600;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ZDeck({
  total,
  selected,
  onSelect,
  children,
  className,
  label,
  autoplay = true,
  showNav = true,
}: {
  total: number;
  selected: number;
  onSelect: (index: number) => void;
  children: React.ReactNode[];
  /** Modifier for the caller's own sizing and chrome. */
  className?: string;
  label: string;
  autoplay?: boolean;
  showNav?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pos = useRef(0);
  const target = useRef(0);
  const width = useRef(0);
  const raf = useRef<number | null>(null);
  const drag = useRef<
    { id: number; x: number; startX: number; v: number; t: number; moved: boolean } | null
  >(null);
  const hovering = useRef(false);
  const justDragged = useRef(false);

  const paint = useCallback(() => {
    const cardWidth = width.current;
    if (!cardWidth || total === 0) return;
    const pitch = cardWidth * (1 + CF_GAP);
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      let offset = index - pos.current;
      offset = ((offset % total) + total) % total;
      if (offset > total / 2) offset -= total;
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, CF_FALLOFF);
      const tilt = Math.min(CF_ROTATE * ramp, 82) * Math.sign(offset);
      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px))`
        + ` translateZ(${-CF_DEPTH * cardWidth * ramp}px)`
        + ` rotateY(${-tilt}deg)`;
      const edge = Math.min(1, Math.max(0, total / 2 - distance));
      card.style.opacity = String(Math.max(0, 1 - CF_FADE * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
      // Only the front card is reachable: the rest are visually stacked behind
      // it, so leaving them focusable would tab into cards nobody can see.
      const buried = distance >= 1;
      card.setAttribute("aria-hidden", buried ? "true" : "false");
      card.inert = buried;
    });
  }, [total]);

  const measure = useCallback(() => {
    const card = cardRefs.current[0];
    if (!card) return;
    width.current = card.offsetWidth;
    paint();
  }, [paint]);

  const settle = useCallback((to: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    target.current = to;
    if (prefersReducedMotion()) {
      pos.current = to;
      paint();
      raf.current = null;
      return;
    }
    const step = () => {
      const remaining = to - pos.current;
      if (Math.abs(remaining) < 0.0004) {
        pos.current = to;
        paint();
        raf.current = null;
        return;
      }
      pos.current += remaining * 0.16;
      paint();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [paint]);

  // Animate to whichever wrap of `selected` is nearest, so last -> first slides
  // forward across the seam instead of rewinding the whole deck.
  useEffect(() => {
    if (total === 0) return;
    const nearest = selected + Math.round((target.current - selected) / total) * total;
    settle(nearest);
  }, [selected, total, settle]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    measure();
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!autoplay || total === 0 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      if (!drag.current && !hovering.current) onSelect((selected + 1) % total);
    }, Z_DECK_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [selected, total, onSelect, autoplay]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const indexAt = (value: number) => ((Math.round(value) % total) + total) % total;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    target.current = pos.current;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      startX: event.clientX,
      v: 0,
      t: performance.now(),
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const pitch = width.current * (1 + CF_GAP);
    if (!pitch) return;
    const now = performance.now();
    const previous = pos.current;
    if (Math.abs(event.clientX - current.startX) > 4) current.moved = true;
    pos.current = pos.current - (event.clientX - current.x) / pitch;
    current.x = event.clientX;
    current.v = ((pos.current - previous) / Math.max(now - current.t, 1)) * 1000;
    current.t = now;
    paint();
    const next = indexAt(pos.current);
    if (next !== selected) onSelect(next);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    justDragged.current = current.moved;
    const carried = Math.max(-2, Math.min(2, current.v * 0.18));
    onSelect(indexAt(pos.current + carried));
  };

  return (
    <div
      className={className ? `z-deck ${className}` : "z-deck"}
      ref={frameRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
    >
      <div className="z-deck__track">
        {children.map((child, index) => (
          <div
            key={index}
            className="z-deck__slide"
            ref={node => { cardRefs.current[index] = node; }}
            onClickCapture={event => {
              // A drag that ends on a card must not also follow its link.
              if (justDragged.current) {
                justDragged.current = false;
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              if (index !== selected) {
                event.preventDefault();
                event.stopPropagation();
                onSelect(index);
              }
            }}
          >
            {child}
          </div>
        ))}
      </div>
      {showNav ? (
        <>
          <button
            type="button"
            className="z-deck__nav z-deck__nav--prev"
            aria-label="Previous"
            onClick={() => onSelect((selected - 1 + total) % total)}
          >
            &#8249;
          </button>
          <button
            type="button"
            className="z-deck__nav z-deck__nav--next"
            aria-label="Next"
            onClick={() => onSelect((selected + 1) % total)}
          >
            &#8250;
          </button>
        </>
      ) : null}
    </div>
  );
}

/** Dot pager for a ZDeck. `accentOf` lets each dot carry its own board colour. */
export function ZDeckDots({
  total,
  selected,
  onSelect,
  labelOf,
  accentOf,
  className,
}: {
  total: number;
  selected: number;
  onSelect: (index: number) => void;
  labelOf: (index: number) => string;
  accentOf?: (index: number) => string;
  className?: string;
}) {
  return (
    <div className={className ? `z-deck__dots ${className}` : "z-deck__dots"} role="tablist">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === selected}
          aria-label={labelOf(index)}
          className={index === selected ? "is-on" : undefined}
          style={accentOf ? ({ ["--c" as string]: accentOf(index) }) : undefined}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
