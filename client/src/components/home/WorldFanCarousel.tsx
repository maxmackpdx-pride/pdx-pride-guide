/**
 * Fanned-arc carousel for the homepage world cards.
 *
 * Motion reference: 21st.dev card-fan-carousel (Aayush Duhan) — stacked cards
 * open into an arc around a point below the deck, spread further on hover, and
 * paginate one slot at a time with an elastic settle. World card anatomy is
 * unchanged; this only poses the slides.
 *
 * `selected` is the only source of truth, same contract as ZDeck, so dots and
 * autoplay cannot disagree. Child DOM is untouched: each world card keeps its
 * own links and slot motion. Only the front card is interactive; a click on a
 * neighbour brings it forward instead of following a link you cannot really
 * see on a tilted face.
 */

import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { prefersStillMotion } from "@/lib/motion";
import "./WorldFanCarousel.css";

const SPRING = 0.16;
const DAMPING = 0.72;
const REST = 0.08;
const HOVER_SPREAD = 1.28;
const MAX_ANGLE = 20;
const ORIGIN = 1.46;
const AUTOPLAY_MS = 5600;

type Pose = { r: number; x: number; s: number; o: number };

function wrapOffset(index: number, selected: number, total: number): number {
  if (total <= 0) return 0;
  let offset = index - selected;
  offset = ((offset % total) + total) % total;
  if (offset > total / 2) offset -= total;
  return offset;
}

function visibleWindow(width: number): number {
  if (width < 640) return 2;
  return 3;
}

function fitAngle(width: number, cardW: number, cardH: number): number {
  const originY = cardH * ORIGIN;
  const room = Math.max(24, width / 2 - cardW * 0.28);
  const sin = originY > 1 ? Math.min(0.42, room / originY) : 0.2;
  return Math.max(7, Math.min(MAX_ANGLE, (Math.asin(sin) * 180) / Math.PI));
}

function poseFor(
  offset: number,
  spread: number,
  cardW: number,
  cardH: number,
  width: number,
): Pose {
  const window = Math.max(1, visibleWindow(width));
  const hidden = Math.abs(offset) > window;
  const t = offset / window;
  const angle = fitAngle(width, cardW, cardH) * spread;
  const extraX = cardW * 0.06 * spread;
  return {
    r: t * angle,
    x: t * extraX,
    s: offset === 0 ? 1 : hidden ? 0.86 : 0.94,
    o: hidden ? 0 : 1,
  };
}

export function WorldFanCarousel({
  total,
  selected,
  onSelect,
  children,
  className,
  label,
  autoplay = true,
  autoplayMs = AUTOPLAY_MS,
  labelOf,
  accentOf,
}: {
  total: number;
  selected: number;
  onSelect: (index: number) => void;
  children: ReactNode[];
  className?: string;
  label: string;
  autoplay?: boolean;
  autoplayMs?: number;
  labelOf: (index: number) => string;
  accentOf?: (index: number) => string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bodyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cur = useRef<Pose[]>([]);
  const vel = useRef<Array<Pose>>([]);
  const tgt = useRef<Pose[]>([]);
  const offsetRef = useRef<number[]>([]);
  const delayUntil = useRef<number[]>([]);
  const size = useRef({ w: 0, cardW: 0, cardH: 0 });
  const spread = useRef(1);
  const spreadT = useRef(1);
  const raf = useRef<number | null>(null);
  const selectedRef = useRef(selected);
  const hovering = useRef(false);
  const inView = useRef(true);
  const entered = useRef(false);
  const drag = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  selectedRef.current = selected;

  const ensure = (n: number) => {
    while (cur.current.length < n) {
      cur.current.push({ r: 0, x: 0, s: 0.82, o: 0 });
      vel.current.push({ r: 0, x: 0, s: 0, o: 0 });
      tgt.current.push({ r: 0, x: 0, s: 0.82, o: 0 });
      offsetRef.current.push(0);
      delayUntil.current.push(0);
    }
  };

  const paint = useCallback(() => {
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const p = cur.current[i];
      if (!p) return;
      slide.style.transform =
        `translate3d(calc(-50% + ${p.x}px), 0, 0) rotate(${p.r}deg) scale(${p.s})`;
      slide.style.opacity = String(p.o);
      const offset = offsetRef.current[i] ?? 0;
      slide.style.zIndex = String(80 - Math.abs(offset));
      slide.style.pointerEvents = p.o < 0.2 ? "none" : "auto";
      slide.classList.toggle("is-front", offset === 0);
      const buried = offset !== 0;
      slide.setAttribute("aria-hidden", buried ? "true" : "false");
      const body = bodyRefs.current[i];
      if (body) body.inert = buried;
    });
  }, []);

  const kick = useCallback(() => {
    if (raf.current) return;
    const still = prefersStillMotion();
    const step = () => {
      const now = performance.now();
      spread.current += (spreadT.current - spread.current) * (still ? 1 : 0.18);
      let busy = Math.abs(spreadT.current - spread.current) > 0.002;
      const { w, cardW, cardH } = size.current;
      for (let i = 0; i < total; i++) {
        if (now < (delayUntil.current[i] ?? 0)) {
          busy = true;
          continue;
        }
        const offset = wrapOffset(i, selectedRef.current, total);
        const next = poseFor(offset, spread.current, cardW, cardH, w);
        tgt.current[i] = next;
        const c = cur.current[i];
        const v = vel.current[i];
        if (!c || !v) continue;
        if (still) {
          cur.current[i] = { ...next };
          vel.current[i] = { r: 0, x: 0, s: 0, o: 0 };
          continue;
        }
        (["r", "x", "s", "o"] as const).forEach(key => {
          v[key] += (next[key] - c[key]) * SPRING;
          v[key] *= DAMPING;
          c[key] += v[key];
          if (Math.abs(v[key]) > REST || Math.abs(next[key] - c[key]) > 0.01) busy = true;
        });
      }
      paint();
      if (busy && !still) {
        raf.current = requestAnimationFrame(step);
      } else {
        raf.current = null;
        if (still) paint();
      }
    };
    raf.current = requestAnimationFrame(step);
  }, [paint, total]);

  const retarget = useCallback((opts?: { stagger?: boolean; fromStack?: boolean }) => {
    ensure(total);
    const { w, cardW, cardH } = size.current;
    const now = performance.now();
    const still = prefersStillMotion();
    for (let i = 0; i < total; i++) {
      const prev = offsetRef.current[i] ?? 0;
      const offset = wrapOffset(i, selectedRef.current, total);
      const jumped = Math.abs(offset - prev) > total / 2;
      offsetRef.current[i] = offset;
      const next = poseFor(offset, spread.current, cardW, cardH, w);
      tgt.current[i] = next;
      if (opts?.fromStack) {
        cur.current[i] = { r: 0, x: 0, s: 0.82, o: 0 };
        vel.current[i] = { r: 0, x: 0, s: 0, o: 0 };
        delayUntil.current[i] = still ? 0 : now + Math.abs(offset) * 55 + 80;
      } else if (jumped || still) {
        cur.current[i] = { ...next };
        vel.current[i] = { r: 0, x: 0, s: 0, o: 0 };
        delayUntil.current[i] = 0;
      } else if (opts?.stagger) {
        delayUntil.current[i] = now + (offset > 0 ? i : total - i) * 18;
      } else {
        delayUntil.current[i] = 0;
      }
    }
    kick();
  }, [kick, total]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const card = slideRefs.current[0];
    if (!root || !card) return;
    size.current = {
      w: root.clientWidth,
      cardW: card.offsetWidth,
      cardH: card.offsetHeight,
    };
    if (!entered.current) return;
    retarget();
  }, [retarget]);

  useEffect(() => {
    ensure(total);
    paint();
  }, [paint, total]);

  useEffect(() => {
    if (!entered.current) return;
    retarget({ stagger: true });
  }, [selected, total, retarget]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const open = () => {
      if (entered.current) return;
      entered.current = true;
      measure();
      retarget({ fromStack: true });
    };
    if (typeof IntersectionObserver === "undefined") {
      open();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = Boolean(entry?.isIntersecting);
      if (entry?.isIntersecting) open();
    }, { threshold: 0.12 });
    observer.observe(root);
    const fallback = window.setTimeout(open, 900);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [measure, retarget]);

  useEffect(() => {
    if (!autoplay || total === 0) return;
    const timer = window.setInterval(() => {
      if (prefersStillMotion()) return;
      if (!drag.current && !hovering.current && inView.current) {
        onSelect((selectedRef.current + 1) % total);
      }
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayMs, onSelect, total]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const setHover = (on: boolean) => {
    hovering.current = on;
    spreadT.current = on && !prefersStillMotion() ? HOVER_SPREAD : 1;
    kick();
  };

  const step = (dir: number) => onSelect((selected + dir + total) % total);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const origin = event.target instanceof Element ? event.target : null;
    if (origin?.closest(".world-fan__pager, button")) return;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (Math.abs(event.clientX - current.x) > 8) current.moved = true;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    const dx = event.clientX - current.x;
    if (current.moved) {
      justDragged.current = true;
      if (Math.abs(dx) > 36) step(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={className ? `world-fan ${className}` : "world-fan"}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={event => {
        if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      }}
    >
      <div className="sr-only" aria-live="polite">{labelOf(selected)}</div>
      <div className="world-fan__stage">
        <div className="world-fan__track">
          {children.map((child, index) => (
            <div
              key={index}
              className="world-fan__slide"
              ref={node => { slideRefs.current[index] = node; }}
              onClickCapture={event => {
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
              <div
                className="world-fan__body"
                ref={node => { bodyRefs.current[index] = node; }}
              >
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="world-fan__pager">
        <button
          type="button"
          className="world-fan__nav"
          aria-label="Previous"
          onPointerDown={event => event.stopPropagation()}
          onClick={event => { event.stopPropagation(); step(-1); }}
        >
          &#8249;
        </button>
        <div className="world-fan__dots" role="tablist">
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={labelOf(index)}
              className={index === selected ? "pdx-glass-rebind is-on" : "pdx-glass-rebind"}
              style={accentOf ? ({ ["--c" as string]: accentOf(index) }) : undefined}
              onClick={() => onSelect(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="world-fan__nav"
          aria-label="Next"
          onPointerDown={event => event.stopPropagation()}
          onClick={event => { event.stopPropagation(); step(1); }}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}
