import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { Link } from "wouter";
import type { EventListing } from "@shared/multiDayEvents";
import { prefersStillMotion } from "@/lib/motion";
import { OUTZ_CATALOG_FALLBACK, pickTunnelCards, type OutzideMapPlace, type TunnelCardData } from "./tunnelCards";
import { TUNNEL, computePose, createPose, makeSlots } from "./tunnelMath";
import "./PerspectiveTunnelHero.css";

export type PerspectiveTunnelHeroProps = {
  /** Live events (the `/api/events` payload). Only public LIVE ones are used. */
  events?: readonly EventListing[];
  /** `places[]` from `/outzide-map/places.json` (385 destinations). Falls back to the static catalog. */
  outzPlaces?: readonly OutzideMapPlace[];
  /** Central title. It stays anchored in the middle of the viewport for the whole scroll. */
  title?: string;
  eyebrow?: string;
  /** Optional slot under the title (CTA row etc). Receives pointer events. */
  children?: ReactNode;
  /** Replace the default CSS globe, e.g. with a lightweight image. Keep it WebGL-free on phones. */
  globe?: ReactNode;
  /** Scroll runway in svh (sticky stage height x this / 100). Progress 0..1 is mapped across this range. Default 320. */
  scrollLength?: number;
  /** Force the reduced-motion arrangement (e.g. from ThemeContext calmMode). OS preference is always honoured. */
  still?: boolean;
  /** Card counts. Defaults 22 desktop / 12 compact. */
  desktopCount?: number;
  compactCount?: number;
  /** Fix the shuffle (tests, screenshots). Omit in production: a fresh random seed is drawn once per mount. */
  seed?: number;
  className?: string;
};

const COMPACT_QUERY = "(max-width: 700px)";

function useMedia(query: string, initial = false) {
  const [match, setMatch] = useState(() => (typeof window === "undefined" ? initial : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return match;
}

/** Reduced motion = OS preference, calm mode (via prefersStillMotion) or the explicit `still` prop. */
function useStill(force?: boolean) {
  const [still, setStill] = useState(() => Boolean(force) || prefersStillMotion());
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(Boolean(force) || prefersStillMotion());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [force]);
  return still;
}

function TunnelCard({ card, interactive, setRef }: { card: TunnelCardData; interactive: boolean; setRef: (el: HTMLAnchorElement | null) => void }) {
  return (
    <Link
      href={card.href}
      ref={setRef}
      className="ptunnel__card"
      data-kind={card.kind}
      style={{ "--c": card.accent } as CSSProperties}
      // Flying cards are a pointer/touch enhancement; keep them out of the tab order while they move.
      tabIndex={interactive ? 0 : -1}
    >
      {card.imageUrl ? <img className="ptunnel__img" src={card.imageUrl} alt="" loading="lazy" decoding="async" draggable={false} /> : null}
      <span className="ptunnel__scrim" aria-hidden="true" />
      <span className="ptunnel__kicker">
        <i aria-hidden="true" />
        {card.kind === "outzide" ? "Outzide · " : ""}
        {card.kicker}
      </span>
      <span className="ptunnel__title">{card.title}</span>
      <span className="ptunnel__line">{card.line}</span>
    </Link>
  );
}

export default function PerspectiveTunnelHero({
  events = [],
  outzPlaces,
  title = "INTO THE ETHER",
  eyebrow,
  children,
  globe,
  scrollLength = 320,
  still: stillProp,
  desktopCount = 22,
  compactCount = 12,
  seed: seedProp,
  className = "",
}: PerspectiveTunnelHeroProps) {
  const compact = useMedia(COMPACT_QUERY);
  const still = useStill(stillProp);
  const count = compact ? compactCount : desktopCount;

  // One seed per mount: different on every load, stable for the session.
  const seedRef = useRef<number>(seedProp ?? (Math.random() * 4294967296) >>> 0);
  const seed = seedProp ?? seedRef.current;

  const cards = useMemo(
    () => pickTunnelCards(events, outzPlaces ?? OUTZ_CATALOG_FALLBACK, count, seed),
    [events, outzPlaces, count, seed],
  );
  const slots = useMemo(() => makeSlots(cards.length, seed), [cards.length, seed]);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLAnchorElement | null)[]>([]);
  // Preallocated: nothing below allocates objects or arrays per frame.
  const pose = useRef(createPose());
  const half = useRef({ w: 600, h: 400 });
  const lastT = useRef<Float32Array>(new Float32Array(0));
  const progressNow = useRef(0);

  // Scroll progress 0..1 across the sticky runway, smoothed by a spring.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.6, restDelta: 0.0004 });

  const paint = (p: number, force = false) => {
    progressNow.current = p;
    const els = cardEls.current;
    const cache = lastT.current;
    const { w, h } = half.current;
    const pz = pose.current;
    for (let i = 0; i < slots.length; i++) {
      const el = els[i];
      if (!el) continue;
      computePose(pz, slots[i], p, w, h);
      // Cards that have not launched yet (or whose state did not change) need no style write.
      if (!force && pz.t === cache[i]) continue;
      cache[i] = pz.t;
      el.style.opacity = String(pz.opacity);
      el.style.transform = `translate3d(${pz.x.toFixed(1)}px,${pz.y.toFixed(1)}px,${pz.z.toFixed(1)}px) rotateX(${pz.rotX.toFixed(2)}deg) rotateY(${pz.rotY.toFixed(2)}deg) rotateZ(${pz.rotZ.toFixed(2)}deg) scale(${slots[i].size.toFixed(3)})`;
    }
  };

  // Keep the last measured size and progress in sync with layout, count and still-mode changes.
  useLayoutEffect(() => {
    lastT.current = new Float32Array(slots.length).fill(-1);
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const r = stage.getBoundingClientRect();
      half.current.w = r.width / 2;
      half.current.h = r.height / 2;
      paint(still ? TUNNEL.stillProgress : progress.get(), true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, still]);

  useMotionValueEvent(progress, "change", p => {
    if (!still) paint(p);
  });

  // will-change only while the hero is on screen.
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Parallax pointer: subtle camera tilt, spring-smoothed, applied through motion values (no re-render).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const tiltY = useSpring(px, { stiffness: 90, damping: 18, mass: 0.5 });
  const tiltX = useSpring(py, { stiffness: 90, damping: 18, mass: 0.5 });
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (still) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    const amp = e.pointerType === "mouse" ? 4 : 2.5; // gentler on touch
    px.set(nx * amp);
    py.set(-ny * amp);
  };
  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  const style = { "--ptunnel-perspective": `${TUNNEL.perspective}px`, "--ptunnel-len": scrollLength } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      className={`ptunnel ${className}`.trim()}
      data-still={still ? "1" : "0"}
      data-compact={compact ? "1" : "0"}
      data-active={active ? "1" : "0"}
      style={style}
      aria-labelledby="ptunnel-title"
    >
      <div
        ref={stageRef}
        className="ptunnel__stage"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      >
        <div className="ptunnel__camera" aria-hidden={still ? undefined : true}>
          <motion.div className="ptunnel__world" style={{ rotateX: tiltX, rotateY: tiltY }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className="ptunnel__ring" style={{ transform: `translateZ(${-n * 320}px)` }} aria-hidden="true" />
            ))}
            {cards.map((card, i) => (
              <TunnelCard
                key={card.key}
                card={card}
                interactive={still}
                setRef={el => {
                  cardEls.current[i] = el;
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Anchor: always painted above the cards, so the title never gets covered and cards read as emerging from behind it. */}
        <div className="ptunnel__anchor">
          <div className="ptunnel__globe" aria-hidden="true">
            {globe ?? <span className="ptunnel__globe-default" />}
          </div>
          <div className="ptunnel__copy">
            {eyebrow ? <p className="ptunnel__eyebrow">{eyebrow}</p> : null}
            <h1 id="ptunnel-title" className="ptunnel__headline">{title}</h1>
            {children ? <div className="ptunnel__slot">{children}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
