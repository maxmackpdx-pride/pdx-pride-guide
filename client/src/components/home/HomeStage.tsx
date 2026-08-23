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
import { ZDeck, ZDeckDots } from "@/components/ZDeck";
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
    href: "/z/out",
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
    accent: "var(--neon-red, #ff2400)",
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
    title: "GIFTZ",
    eyebrow: "Give and ask",
    body: "Useful things move directly between people, without a marketplace.",
    action: "Open GIFTZ",
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
  const [selectedWorld, setSelectedWorld] = useState(0);
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

  // The rail motion is now pure CSS: an infinite marquee on mobile, and a plain
  // manual left/right scroll on desktop (drag handlers + native scrollbar).
  // No JS auto-advance — it would fight the CSS marquee on mobile.

  return (
    <div className="home-front" id="top">
      <section className="home-front__welcome" aria-labelledby="home-front-title">
        {showVideo ? (
          <video ref={videoRef} className="home-front__video" src={HERO_VIDEO} autoPlay muted loop playsInline aria-hidden />
        ) : null}
        <div className="home-front__atmosphere" aria-hidden />
        <div className="home-front__hero">
          <p className="home-front__kicker"><span /> made in Portland · still in beta</p>
          <h1 id="home-front-title" className="sr-only">Zaylist</h1>
          <div className="home-front__mark">
            <div className="home-front__mark-art">
              <img className="home-front__mark-core" src={WORDMARK} alt="Zaylist" />
              <img className="home-front__mark-glitch home-front__mark-glitch--a" src={WORDMARK} alt="" aria-hidden="true" />
              <img className="home-front__mark-glitch home-front__mark-glitch--b" src={WORDMARK} alt="" aria-hidden="true" />
            </div>
          </div>
          <div className="home-front__hero-actions">
            <Link href="/z/out" className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-orange, #ff6600)", fontWeight: 900 }}>Open OUTZ</Link>
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
          <h2 id="home-worlds-title"><span>You&apos;re</span> not<br />looking for content.</h2>
          <p>You&apos;re looking for the room, the ride, the person, or the thing that makes tonight feel good and tomorrow even better.</p>
        </header>
        <ZDeck
          total={WORLDS.length}
          selected={selectedWorld}
          onSelect={setSelectedWorld}
          className="home-front__deck"
          label="You&apos;re not looking for content."
          autoplayMs={3250}
          fade={0.12}
        >
          {WORLDS.map((world) => {
            const sample = world.sampleKey ? samples[world.sampleKey] : null;
            return (
              <article
                key={world.key}
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
        </ZDeck>
        <ZDeckDots
          total={WORLDS.length}
          selected={selectedWorld}
          onSelect={setSelectedWorld}
          labelOf={index => WORLDS[index].title}
          accentOf={index => WORLDS[index].accent}
          className="home-front__deck-dots"
        />
      </section>
    </div>
  );
}
