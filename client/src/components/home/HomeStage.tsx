import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/queryClient";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import HomeBeachWidget from "@/components/HomeBeachWidget";
import { eventsUpNext, formatUpNextWhen } from "@/lib/homeEvents";
import { formatListingWhen, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { resolveDirectoryLogo } from "@/lib/directoryLogos";
import {
  useHomeStageSamples,
  type HomeStageBoardKey,
  type HomeStageCardData,
  type HomeStageSamples,
} from "@/lib/homeStageSamples";
import "./HomeStage.css";

export type { HomeStageBoardKey, HomeStageCardData, HomeStageSamples };
export { useHomeStageSamples, HomeStageCard };

const WORDMARK = "/brand/family/zaylist-primary.svg";
const HERO_VIDEO = "/home/hero-loop.mp4";

type Props = {
  samples?: HomeStageSamples;
  includeDemoFallback?: boolean;
  afterWelcome?: ReactNode;
};

type World = {
  key: string;
  number: string;
  title: string;
  eyebrow: string;
  body: string;
  action: string;
  href: string;
  accent: string;
  sampleKey?: HomeStageBoardKey;
  feature?: boolean;
};

type HomeDirectoryPlace = {
  id: number;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
};

const WORLDS: World[] = [
  {
    key: "beaches",
    number: "01",
    title: "Nude beaches",
    eyebrow: "Live river conditions",
    body: "Weather, water, parking, carpools and check-ins from people there now.",
    action: "Check the river",
    href: "/nude-beaches",
    accent: "var(--neon-orange, #ff6600)",
    feature: true,
  },
  {
    key: "events",
    number: "02",
    title: "Up next events",
    eyebrow: "Flyers · Portland",
    body: "Every queer party, show, gathering and march in one place.",
    action: "Find the party",
    href: "/events",
    accent: "var(--neon-yellow, #ccff00)",
    sampleKey: "events",
  },
  {
    key: "directory",
    number: "03",
    title: "Places",
    eyebrow: "The directory for us",
    body: "Bars, food, shops, venues and services that are ours or truly for us.",
    action: "Spend queer",
    href: "/directory",
    accent: "var(--neon-cyan, #19e3ff)",
  },
  {
    key: "housing",
    number: "04",
    title: "THE HAÜZ",
    eyebrow: "Rooms and people",
    body: "Find a room, a roommate or the people to form a home with.",
    action: "Find your people",
    href: "/the-hauz",
    accent: "var(--board-housing, #00ffff)",
    sampleKey: "housing",
  },
  {
    key: "gifting",
    number: "05",
    title: "GifZ",
    eyebrow: "Give and ask",
    body: "Useful things move directly between people, without a marketplace.",
    action: "Open GifZ",
    href: "/gifting",
    accent: "var(--board-gifting, #ccff00)",
    sampleKey: "gifting",
  },
  {
    key: "gigs",
    number: "06",
    title: "Gig board",
    eyebrow: "Hiring both ways",
    body: "Find paid work or find the queer talent your event needs.",
    action: "Find a gig",
    href: "/pride-work",
    accent: "var(--board-gigs, #b06bff)",
    sampleKey: "gigs",
  },
  {
    key: "spotted",
    number: "07",
    title: "Missed connections",
    eyebrow: "Say the thing",
    body: "Post who you saw. Replies stay private and consent comes first.",
    action: "See who got spotted",
    href: "/spotted",
    accent: "var(--board-spotted, #ff1fa0)",
    sampleKey: "spotted",
  },
];

function EventPreview({ events, fallback }: { events: ReturnType<typeof eventsUpNext>; fallback?: HomeStageCardData }) {
  const slides = useMemo(() => {
    if (events.length) {
      return events.map((event) => ({
        id: String(event.id),
        href: eventPath(event.id, event.title, event.dayOfWeek),
        title: event.title,
        venue: event.venueName || event.neighborhood || "Portland",
        when: formatListingWhen(event) || formatUpNextWhen(event),
        poster: listingPosterUrl(event),
        color: `var(--day-${listingDay(event).toLowerCase()}, #ccff00)`,
        demo: false,
      }));
    }
    return fallback ? [{
      id: "github-demo-event",
      href: fallback.href,
      title: fallback.title,
      venue: fallback.line || "Portland",
      when: fallback.meta || fallback.kicker,
      poster: fallback.thumbUrl || null,
      color: fallback.accent || "var(--neon-yellow, #ccff00)",
      demo: true,
    }] : [];
  }, [events, fallback]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2 || prefersStillMotion()) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;
  const event = slides[active] ?? slides[0];

  return (
    <div className="home-front__event-preview" aria-label="Upcoming event flyers" style={{ ["--event-c" as string]: event.color }}>
      <Link className="home-front__event-feature" href={event.href}>
        {event.poster ? <img className="home-front__event-backdrop" src={event.poster} alt="" aria-hidden="true" /> : null}
        <span className="home-front__event-poster pdx-poster-well">
          {event.poster ? <img src={event.poster} alt={`${event.title} flyer`} /> : <strong>{event.title}</strong>}
        </span>
        <span className="home-front__event-info">
          <span className="home-front__event-when">{event.when}{event.demo ? " · Demo" : ""}</span>
          <strong>{event.title}</strong>
          <span>{event.venue}</span>
        </span>
      </Link>
      <div className="home-front__event-dots" aria-label="Choose event flyer">
        <span className="home-front__event-count">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <div>
          {slides.map((item, index) => (
            <button key={item.id} type="button" className={index === active ? "is-active" : ""} aria-label={`Show ${item.title}`} aria-pressed={index === active} onClick={() => setActive(index)} />
          ))}
        </div>
      </div>
    </div>
  );
}

type WorldMotifKind = "beaches" | "events" | "directory" | "housing" | "gifting" | "gigs" | "spotted";

function WorldMotif({ kind }: { kind: WorldMotifKind }) {
  if (kind === "beaches") {
    return (
      <svg className="home-front__object-motif home-front__object-motif--beaches" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M-30 94c78-35 137-31 195 10 62 44 127 43 194-2 71-48 149-42 311 22M-28 158c83-31 145-24 204 18 62 44 126 43 190 1 76-50 154-42 304 20M-24 228c75-34 140-28 202 14 61 42 126 43 192 2 78-49 155-43 294 13M-28 302c83-33 147-26 207 15 60 42 123 43 190 3 77-46 153-40 297 16" />
        <path className="detail" d="M86 390c50-55 78-105 84-151 7-53 35-90 85-113 47-22 73-56 78-103M268 420c-13-65 1-116 42-153 37-34 49-74 33-119-15-43-3-82 37-117M456 418c-20-58-11-105 28-142 35-34 45-73 28-116-16-39-7-75 29-108" />
        <circle cx="170" cy="239" r="8" /><circle cx="343" cy="148" r="7" /><circle cx="512" cy="160" r="6" />
      </svg>
    );
  }
  if (kind === "events") {
    return (
      <svg className="home-front__object-motif home-front__object-motif--events" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M42 72h556v298H42zM78 112h484v218H78zM102 304h436M130 304V190l54-38 54 38v114M278 304V154h84v150M402 304V190l54-38 54 38v114" />
        <path className="detail" d="M66 48v344M574 48v344M56 62h20M56 380h20M564 62h20M564 380h20M94 92h452M94 350h452" />
        <circle cx="320" cy="221" r="58" /><path d="M320 186v70M285 221h70" />
      </svg>
    );
  }
  if (kind === "directory") {
    return (
      <svg className="home-front__object-motif home-front__object-motif--directory" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M54 72h532v300H54zM120 72v300M208 72v300M310 72v300M430 72v300M520 72v300M54 132h532M54 214h532M54 302h532M64 356l512-268M80 88l486 266" />
        <path className="detail" d="M310 48v344M290 58h40M290 382h40M34 214h572M44 194v40M596 194v40" />
        <path d="M176 128c0 42-42 78-42 78s-42-36-42-78a42 42 0 1 1 84 0ZM492 264c0 42-42 78-42 78s-42-36-42-78a42 42 0 1 1 84 0Z" />
        <circle cx="134" cy="128" r="10" /><circle cx="450" cy="264" r="10" />
      </svg>
    );
  }
  if (kind === "housing") {
    return (
      <svg className="home-front__object-motif" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M74 366V122l168-82 168 82v244H74ZM242 40v326M74 218h336M320 122v96M150 218v148M242 290h168" />
        <path d="M108 158h82v60h-82zM276 254h96v72h-96zM278 142h52v42h-52z" />
        <path className="detail" d="M58 388h370M52 378v20M430 378v20M96 96l146-72 188 91M86 86l-8 21M432 105l-8 21" />
      </svg>
    );
  }
  if (kind === "gifting") {
    return (
      <svg className="home-front__object-motif" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M82 246h198v138H82zM66 210h230v46H66zM172 210v174M82 315h198M172 210c-54-24-71-65-44-86 28-22 63 14 44 86ZM172 210c51-27 72-66 43-88-28-21-61 18-43 88Z" />
        <path d="M336 142h216v242H336zM316 102h256v52H316zM444 102v282M336 264h216M444 102c-59-23-83-68-51-93 31-23 68 20 51 93ZM444 102c61-24 82-69 51-93-31-23-70 21-51 93Z" />
        <path className="detail" d="M54 404h532M52 394v20M586 394v20" />
      </svg>
    );
  }
  if (kind === "gigs") {
    return (
      <svg className="home-front__object-motif" viewBox="0 0 640 440" aria-hidden="true">
        <rect x="48" y="42" width="544" height="352" rx="6" />
        <path d="M86 96h138v116H86zM254 78h148v152H254zM430 112h120v98H430zM102 250h172v104H102zM306 270h214v84H306z" />
        <path className="detail" d="M108 128h92M108 151h72M108 174h84M278 112h98M278 136h78M278 160h91M454 140h72M454 164h58M126 282h120M126 307h94M336 300h154M336 326h118" />
        <circle cx="92" cy="100" r="7" /><circle cx="260" cy="84" r="7" /><circle cx="436" cy="118" r="7" /><circle cx="108" cy="256" r="7" /><circle cx="312" cy="276" r="7" />
      </svg>
    );
  }
  return (
    <svg className="home-front__object-motif home-front__object-motif--spotted" viewBox="0 0 640 440" aria-hidden="true">
      <path d="M66 68h176v244H66zM236 116h170v252H236zM398 54h176v260H398z" />
      <path className="detail" d="M92 152h124M92 182h100M92 212h112M262 204h118M262 234h94M262 264h108M424 142h124M424 172h92M424 202h110" />
      <text x="88" y="120">LOST</text><text x="258" y="174">FOUND</text><text x="420" y="112">LOOKING</text>
      <path d="M86 312l18 18 20-18 19 18 19-18 19 18 19-18 20 18M256 368l18-18 20 18 19-18 19 18 19-18 19 18 20-18M418 314l18 18 20-18 19 18 19-18 19 18 19-18 20 18" />
    </svg>
  );
}

export default function HomeStage({ samples: samplesProp, includeDemoFallback, afterWelcome }: Props) {
  const { calmMode } = useTheme();
  const { samples: liveSamples, events } = useHomeStageSamples({ includeDemoFallback });
  const samples = samplesProp ?? liveSamples;
  const { data: directoryPlaces = [] } = useQuery<HomeDirectoryPlace[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then((response) => response.json()),
    staleTime: 60_000,
  });
  const directoryTiles = useMemo(() => directoryPlaces.slice(0, 24), [directoryPlaces]);
  const upcoming = useMemo(() => {
    const strict = eventsUpNext(events, 8);
    if (strict.length >= 4) return strict;
    const used = new Set(strict.map((event) => event.id));
    const nearestScheduled = [...events]
      .filter((event) => !used.has(event.id) && event.status === "LIVE")
      .sort((a, b) => (Date.parse(b.dateStart || "") || 0) - (Date.parse(a.dateStart || "") || 0));
    return [...strict, ...nearestScheduled].slice(0, 8);
  }, [events]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const worldsRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; scrollLeft: number } | null>(null);
  const [manualRail, setManualRail] = useState(false);
  const [draggingRail, setDraggingRail] = useState(false);
  const [motifsRevealed, setMotifsRevealed] = useState(false);
  const [showVideo, setShowVideo] = useState(() => typeof window === "undefined" || !prefersStillMotion());

  useEffect(() => {
    const sync = () => setShowVideo(!prefersStillMotion());
    sync();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, [calmMode]);

  useEffect(() => {
    if (!showVideo || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => setShowVideo(false));
  }, [showVideo]);

  useEffect(() => {
    const section = worldsRef.current;
    if (!section || prefersStillMotion()) {
      setMotifsRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setMotifsRevealed(true);
      observer.disconnect();
    }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [calmMode]);

  // Auto-scroll the "What do you need?" rail on mobile: advance one card every
  // few seconds and loop back to the start (infinite feel). Only fires when the
  // rail is actually horizontally scrollable (mobile), respects reduced-motion,
  // and pauses briefly whenever the user touches/drags so it never fights them.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || prefersStillMotion()) return;
    let pausedUntil = 0;
    const bump = () => { pausedUntil = Date.now() + 6000; };
    rail.addEventListener("pointerdown", bump);
    rail.addEventListener("touchstart", bump, { passive: true });
    rail.addEventListener("wheel", bump, { passive: true });
    const id = window.setInterval(() => {
      // Desktop (>640px) runs the CSS marquee — don't double-drive it here.
      if (!window.matchMedia("(max-width: 640px)").matches) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if (max < 8) return;            // not a horizontal rail
      if (draggingRail) return;
      if (Date.now() < pausedUntil) return;
      const step = rail.clientWidth * 0.85;
      let next = rail.scrollLeft + step;
      if (next >= max - 4) next = 0;  // loop back to the first card
      rail.scrollTo({ left: next, behavior: "smooth" });
    }, 3600);
    return () => {
      window.clearInterval(id);
      rail.removeEventListener("pointerdown", bump);
      rail.removeEventListener("touchstart", bump);
      rail.removeEventListener("wheel", bump);
    };
  }, [draggingRail, calmMode]);

  return (
    <div className="home-front" id="top">
      <section className="home-front__welcome" aria-labelledby="home-front-title">
        {showVideo ? (
          <video ref={videoRef} className="home-front__video" src={HERO_VIDEO} autoPlay muted loop playsInline aria-hidden />
        ) : null}
        <div className="home-front__atmosphere" aria-hidden />
        <div className="home-front__hero">
          <p className="home-front__kicker"><span /> Portland · all year</p>
          <h1 id="home-front-title" className="sr-only">Zaylist</h1>
          <div className="home-front__mark">
            <div className="home-front__mark-art">
              <img className="home-front__mark-core" src={WORDMARK} alt="Zaylist" />
              <img className="home-front__mark-glitch home-front__mark-glitch--a" src={WORDMARK} alt="" aria-hidden="true" />
              <img className="home-front__mark-glitch home-front__mark-glitch--b" src={WORDMARK} alt="" aria-hidden="true" />
            </div>
          </div>
          <div className="home-front__hero-actions">
            <Link href="/nude-beaches" className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-orange, #ff6600)", fontWeight: 900 }}>Check the beaches</Link>
            <Link href="/events" className="pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-yellow, #ccff00)" }}>What&apos;s happening</Link>
          </div>
        </div>
        {afterWelcome}
      </section>

      <section
        ref={worldsRef}
        className={`home-front__worlds${motifsRevealed ? " is-motif-revealed" : ""}`}
        id="home-worlds"
        aria-labelledby="home-worlds-title"
      >
        <header className="home-front__worlds-head">
          <h2 id="home-worlds-title">What do <span>you</span> need?</h2>
        </header>
        <div
          ref={railRef}
          className={`home-front__grid${manualRail ? " home-front__grid--manual" : ""}${draggingRail ? " home-front__grid--dragging" : ""}`}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            const rail = railRef.current;
            if (!rail) return;
            setManualRail(true);
            setDraggingRail(true);
            dragRef.current = { pointerId:event.pointerId, x:event.clientX, scrollLeft:rail.scrollLeft };
            rail.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            const rail = railRef.current;
            if (!drag || !rail || drag.pointerId !== event.pointerId) return;
            rail.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId !== event.pointerId) return;
            dragRef.current = null;
            setDraggingRail(false);
          }}
          onPointerCancel={() => { dragRef.current = null; setDraggingRail(false); }}
        >
          {[false, true].map((duplicate) => (
          <div
            className={`home-front__grid-group${duplicate ? " home-front__grid-group--duplicate" : ""}`}
            key={duplicate ? "duplicate" : "primary"}
            aria-hidden={duplicate || undefined}
            {...(duplicate ? { inert: "" } : {})}
          >
          {WORLDS.map((world) => {
            const sample = world.sampleKey ? samples[world.sampleKey] : null;
            return (
              <article
                key={`${duplicate ? "duplicate" : "primary"}-${world.key}`}
                data-world={world.key}
                className={`home-front__world pdx-glass-card pdx-glass-rebind${world.feature ? " home-front__world--feature" : ""}`}
                style={{ ["--c" as string]: world.accent }}
              >
                <span className="pdx-refract-seam" aria-hidden />
                <Link
                  href={world.href}
                  className="home-front__world-hit"
                  aria-label={`Open ${world.title}`}
                />
                <div className="home-front__world-content">
                {world.key === "beaches" ? (
                  <svg className="home-front__topo" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <path d="M-20 58c78-31 152-17 210 19 55 34 108 34 169 4 74-37 153-35 301 18" />
                    <path d="M-8 98c69-28 137-19 198 13 65 35 127 36 190 3 67-35 143-31 278 15" />
                    <path d="M-26 148c87-23 150-10 211 25 57 33 120 34 186 2 74-36 155-27 294 18" />
                    <path d="M-10 210c78-34 151-27 216 8 61 34 121 36 188 3 75-37 146-31 269 8" />
                    <path d="M-24 272c86-26 154-12 218 25 62 36 126 38 193 7 72-34 147-28 273 15" />
                    <path d="M-6 335c70-29 138-19 199 12 67 34 129 38 194 6 68-33 143-30 271 9" />
                    <path d="M160 458c-12-74 6-125 54-167 38-33 51-71 36-114-17-48 2-91 54-130" />
                    <path d="M352 466c-25-72-18-129 21-174 34-39 39-82 16-127-22-43-11-84 35-125" />
                    <path d="M488 463c-14-65-1-117 39-155 37-36 47-75 29-118-17-42-5-80 35-115" />
                    <path className="home-front__topo-river" d="M80 450c47-61 80-110 87-164 7-50 36-88 86-114 49-25 76-61 81-108 5-37 28-65 67-86" />
                  </svg>
                ) : null}
                {world.key === "directory" ? (
                  <>
                    <svg className="home-front__city-map" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                      <path className="home-front__city-river" d="M328-20c-26 72-22 135 13 190 31 49 33 100 7 153-25 50-23 99 7 147" />
                      <path d="M-20 82h307M378 82h282M-20 146h320M371 146h289M-20 214h330M377 214h283M-20 284h326M374 284h286M-20 352h319M372 352h288" />
                      <path d="M54-20v480M118-20v480M188-20v480M257-20v480M410-20v480M478-20v480M548-20v480M610-20v480" />
                      <path d="M-20 30l314 158M385 231l275 139M-10 432L294 272M383 201L650 48" />
                      <circle cx="269" cy="214" r="8" /><circle cx="434" cy="284" r="7" /><circle cx="188" cy="146" r="6" />
                    </svg>
                    <img className="home-front__places-blueprint" src="/brand/waypoints/next-blueprint-reference-b.png" alt="" aria-hidden="true" />
                  </>
                ) : null}
                <WorldMotif kind={world.key as WorldMotifKind} />
                <div className="home-front__world-top">
                  <span className="home-front__world-number">{world.number}</span>
                  <span className="home-front__world-eyebrow">{world.eyebrow}</span>
                </div>
                {world.key !== "events" ? (
                  <div className="home-front__world-copy">
                    <h3>{world.title}</h3>
                    {world.key !== "beaches" ? <p>{world.body}</p> : null}
                  </div>
                ) : null}
                {world.key === "beaches" ? (
                  <div className="home-front__beach-live">
                    <HomeBeachWidget showBoth />
                  </div>
                ) : null}
                {world.key === "events" ? <EventPreview events={upcoming} fallback={samples.events} /> : null}
                {world.key === "directory" && directoryTiles.length ? (
                  <div className="home-front__directory-grid" aria-label="Local businesses in the Zaylist directory">
                    {directoryTiles.map((place) => {
                      const logo = resolveDirectoryLogo(place.name, place.imageUrl || undefined);
                      return (
                        <Link key={place.id} href={placePath(place.id, place.name)} className="home-front__directory-tile" title={place.name} aria-label={place.name}>
                          {logo ? <img src={logo} alt="" loading="lazy" /> : <span>{place.name.slice(0, 2)}</span>}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
                {sample && world.key !== "events" ? <HomeStageCard card={sample} className="home-front__sample" /> : null}
                {world.key !== "events" ? (
                  <Link href={world.href} className="home-front__world-action">
                    <span>{world.action}</span><span aria-hidden>↗</span>
                  </Link>
                ) : null}
                </div>
              </article>
            );
          })}
          </div>
          ))}
        </div>
      </section>
    </div>
  );
}
