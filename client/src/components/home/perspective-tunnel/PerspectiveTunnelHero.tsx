import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { Link } from "wouter";
import { HandwritingText } from "@/components/ui/handwriting-text";
import { PortlandMetroGlobe } from "@/components/ui/portland-metro-globe";
import type { EventListing } from "@shared/multiDayEvents";
import { prefersStillMotion } from "@/lib/motion";
import { OUTZ_CATALOG_FALLBACK, pickTunnelCards, type OutzideMapPlace, type TunnelCardData } from "./tunnelCards";
import { TUNNEL, computePose, createPose, makeSlots } from "./tunnelMath";
// HomeStage.css owns the real hero classes reused below (home-front__*). It must load before our overrides.
import "@/components/home/HomeStage.css";
import "./PerspectiveTunnelHero.css";

const NO_EVENTS: readonly EventListing[] = [];

export type PerspectiveTunnelHeroProps = {
  /** Live events (the `/api/events` payload). Only public LIVE ones are used. */
  events?: readonly EventListing[];
  /** `places[]` from `/outzide-map/places.json` (385 destinations). Falls back to the static catalog. */
  outzPlaces?: readonly OutzideMapPlace[];
  /** Tagline under the wordmark. Default is the real hero line from HomeStage's IDENTITY_LINES. */
  tagline?: string;
  /** Optional slot under the tagline (the hero's CTA row). Receives pointer events. */
  children?: ReactNode;
  /** Replaces the default tagline node (the homepage passes its cycling identity line). */
  identity?: ReactNode;
  /** Rendered inside the brand group before the wordmark (the homepage's BETA badge). */
  brandAccessory?: ReactNode;
  /** Ref to the wordmark <img> (the homepage waits for it to decode before starting the globe). */
  wordmarkRef?: Ref<HTMLImageElement>;
  /**
   * A globe that renders its own `.home-front__flight` wrapper (the homepage's HomeFlight). Mounted directly in the
   * hero layer, so exactly one globe canvas exists. Takes the place of `globe`.
   */
  globeLayer?: ReactNode;
  /**
   * Pinned to the bottom of the sticky stage, above the cards (the homepage's stat strip, `.home-hero-stats-boundary`).
   * Its height is measured and becomes the globe's footer inset, exactly as in the pre-tunnel hero.
   */
  foreground?: ReactNode;
  /**
   * Globe layer. Default: the homepage's own `PortlandMetroGlobe` (a single 2D canvas, NOT WebGL/MapLibre).
   * Pass `null` when the page already mounts HomeFlight underneath, so there is only one globe canvas.
   */
  globe?: ReactNode | null;
  /** Scroll runway in svh (sticky stage height x this / 100). Progress 0..1 is mapped across this range. Default 320. */
  scrollLength?: number;
  /** Force the reduced-motion arrangement (e.g. from ThemeContext calmMode). OS preference is always honoured. */
  still?: boolean;
  /** Total card counts (half events, half Outzide). Defaults 10 desktop / 6 compact. */
  desktopCount?: number;
  compactCount?: number;
  /** Fix the shuffle (tests, screenshots). Omit in production: a fresh random seed is drawn once per mount. */
  seed?: number;
  className?: string;
};

const WORDMARK = "/brand/family/zaylist-primary.svg"; // same asset HomeStage uses
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
  events = NO_EVENTS,
  outzPlaces,
  tagline = "Show up together",
  children,
  identity,
  brandAccessory,
  wordmarkRef,
  globeLayer,
  foreground,
  globe,
  scrollLength = 320,
  still: stillProp,
  desktopCount = 10,
  compactCount = 6,
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
  const frontRef = useRef<HTMLDivElement>(null);
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
      // Same geometry the real hero gives the globe: it centres on the area above a bottom inset (px, because the
      // globe parses these with parseFloat). On phones the globe sits above the middle, so the card world follows it.
      const front = frontRef.current;
      const strip = front?.querySelector<HTMLElement>(":scope > .home-hero-stats-boundary");
      // With a foreground strip the host (HomeFlight) owns the insets; mirror its numbers. Otherwise use 12%.
      const bottom = strip ? Math.round(strip.getBoundingClientRect().height + 12) : Math.round(r.height * 0.12);
      const header = front ? parseFloat(getComputedStyle(front).getPropertyValue("--home-header-height")) || 0 : 0;
      const cy = r.width < 600 ? header + (r.height - header - bottom) / 2 : r.height / 2;
      if (front && !globeLayer) {
        front.style.setProperty("--home-foreground-bottom", `${bottom}px`);
        front.style.setProperty("--home-flight-bottom", `${bottom}px`);
      }
      stage.style.setProperty("--ptunnel-cy", `${cy}px`);
      paint(still ? TUNNEL.stillProgress : progress.get(), true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const strip = frontRef.current?.querySelector<HTMLElement>(":scope > .home-hero-stats-boundary");
    if (strip) ro.observe(strip);
    // The host sets --home-header-height on the front layer after mount; re-measure when it does.
    const mo = frontRef.current ? new MutationObserver(measure) : null;
    if (mo && frontRef.current) mo.observe(frontRef.current, { attributes: true, attributeFilter: ["style"] });
    return () => { ro.disconnect(); mo?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, still, globeLayer]);

  // The globe takes the pointer (hover glow, Halloween vines) only while the cards are still hidden behind it;
  // once they launch, pointer events fall through the globe canvas so every card is clickable.
  const globeLive = useRef(true);
  const syncGlobeLive = (p: number) => {
    const live = still ? false : p < TUNNEL.globeLiveUntil;
    if (live === globeLive.current) return;
    globeLive.current = live;
    stageRef.current?.setAttribute("data-globe-live", live ? "1" : "0");
  };
  useMotionValueEvent(progress, "change", p => {
    syncGlobeLive(p);
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
        data-globe-live="1"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      >
        <div className="ptunnel__camera" aria-hidden={still ? undefined : true}>
          <motion.div className="ptunnel__world" style={{ rotateX: tiltX, rotateY: tiltY }}>
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

        {/* The real hero, as its own layer above the cards: opaque globe sphere (cards launch from behind it) and the
            wordmark + tagline, laid out by HomeStage.css exactly as on the homepage. `home-front` is what the globe
            looks for when it keeps holograms off the wordmark. */}
        <div ref={frontRef} className="home-front ptunnel__front" style={{ "--home-header-height": "0px" } as CSSProperties}>
          {globeLayer}
          {!globeLayer && globe !== null && (
            <div className="home-front__flight home-front__flight--globe ptunnel__flight">
              {globe ?? <PortlandMetroGlobe active={active && !still} still={still} />}
              <div className="home-front__flight-credit">
                © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>
                {" · "}<a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>
              </div>
            </div>
          )}
          <div className="home-front__hero">
            <div className="home-front__brand-group">
              <h1 id="ptunnel-title" className="sr-only">Zaylist</h1>
              {brandAccessory}
              <div className="home-front__mark">
                <div className="home-front__mark-art">
                  <img ref={wordmarkRef} className="home-front__mark-core" src={WORDMARK} alt="Zaylist" width="2393" height="824" loading="eager" decoding="sync" />
                </div>
              </div>
            </div>
            <div className="home-front__welcome-copy">
              <p className="home-front__identity-line">
                {identity ?? <HandwritingText text={tagline} animate={!still} className="home-front__identity-script" height="1.35em" />}
              </p>
              {children ? <div className="home-front__hero-actions ptunnel__slot">{children}</div> : null}
            </div>
          </div>
          {foreground}
        </div>
      </div>
    </section>
  );
}
