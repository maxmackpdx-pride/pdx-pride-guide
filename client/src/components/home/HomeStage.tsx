/**
 * Zaylist home stage — multi-slide hero (handoff: docs/design-handoff-home-2026-07-28).
 *
 * Shared video wallpaper + aurora/letter orbs + grain behind all slides.
 * Slides: Home hero, Events, Haüsing, Gifting, Gig Board, Missed Connections,
 * Nude Beaches, and River Brats.
 * Chevrons + arrow keys. Calm / reduced-motion via data-calm + prefersStillMotion.
 * Sample cards: useHomeStageSamples (live API + demo fill) + HomeStageCard.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import HomeBeachWidget from "@/components/HomeBeachWidget";
import { eventsUpNext, formatUpNextWhen } from "@/lib/homeEvents";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import type { EventListing } from "@shared/multiDayEvents";
import {
  useHomeStageSamples,
  type HomeStageBoardKey,
  type HomeStageCardData,
  type HomeStageSamples,
} from "@/lib/homeStageSamples";
import "./HomeStage.css";

export type { HomeStageBoardKey, HomeStageCardData, HomeStageSamples };
export { useHomeStageSamples, HomeStageCard };

const SLIDE_COUNT = 8;
const WORDMARK = "/home/zaylist-wordmark-filled.png";
const WORDMARK_WHITE = "/brand/kit/wordmark/zaylist-wordmark-white.png";
const HERO_VIDEO = "/home/hero-loop.mp4";

const LETTER_ORBS = [
  { color: "#FF19D6", left: "6%", delay: "0s" },
  { color: "#FF5319", left: "19%", delay: "-1.4s" },
  { color: "#FFD119", left: "32%", delay: "-2.8s" },
  { color: "#9CFF19", left: "45%", delay: "-4.2s" },
  { color: "#19F7FF", left: "58%", delay: "-5.6s" },
  { color: "#1956FF", left: "71%", delay: "-7s" },
  { color: "#E419FF", left: "84%", delay: "-8.4s" },
] as const;

function stageTitleLines(title: string): string[] {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;

  let splitAt = 1;
  let closest = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(" ").length;
    const right = words.slice(i).join(" ").length;
    const distance = Math.abs(left - right);
    if (distance < closest) {
      closest = distance;
      splitAt = i;
    }
  }
  return [words.slice(0, splitAt).join(" "), words.slice(splitAt).join(" ")];
}

function StageTitle({ title, accentSuffix }: { title: string; accentSuffix?: string }) {
  const lines = stageTitleLines(title);
  return (
    <h2 className="home-stage__board-title" data-lines={lines.length} aria-label={`${title}${accentSuffix ?? ""}`}>
      {lines.map((line) => (
        <span key={line}>
          {line}
          {accentSuffix && line === lines[lines.length - 1] ? (
            <span className="home-stage__board-title-bang">{accentSuffix}</span>
          ) : null}
        </span>
      ))}
    </h2>
  );
}

/** Design-canvas Events utility: 2×2 flyer cards with day-color rail (no RSVP chrome). */
function EventsFlyerGrid({ events }: { events: EventListing[] }) {
  return (
    <div className="home-stage__events-flyers" aria-label="This week's events">
      {events.slice(0, 4).map((event) => {
        const poster = listingPosterUrl(event);
        const day = listingDay(event).toLowerCase();
        const dayColor = `var(--day-${day}, #ccff00)`;
        const locationLine =
          [event.venueName, event.neighborhood].filter(Boolean).join(" · ") || "Portland";
        return (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="home-stage__events-flyer"
            style={{ ["--ev-day" as string]: dayColor }}
          >
            <div className="home-stage__events-flyer-media">
              {poster ? (
                <img src={poster} alt="" loading="lazy" decoding="async" />
              ) : (
                <div className="home-stage__events-flyer-empty" aria-hidden />
              )}
            </div>
            <div className="home-stage__events-flyer-meta">
              <div className="home-stage__events-flyer-when">{formatUpNextWhen(event)}</div>
              <div className="home-stage__events-flyer-title">{event.title}</div>
              <div className="home-stage__events-flyer-venue">{locationLine}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

type Props = {
  /** Override samples (tests / story). Default: live API + demo fill. */
  samples?: HomeStageSamples;
  /** When false, skip demo fallbacks for empty boards. */
  includeDemoFallback?: boolean;
};

export default function HomeStage({ samples: samplesProp, includeDemoFallback }: Props) {
  const { calmMode } = useTheme();
  const { samples: liveSamples, events, stageLists } = useHomeStageSamples({ includeDemoFallback });
  const samples = samplesProp ?? liveSamples;
  const upNextEvents = useMemo(() => {
    const upcoming = eventsUpNext(events, 4);
    if (upcoming.length >= 4) return upcoming;

    const used = new Set(upcoming.map((event) => event.id));
    const nearestRealListings = [...events]
      .filter((event) => !used.has(event.id))
      .sort((a, b) => {
        const aTime = Date.parse(a.dateStart || "") || 0;
        const bTime = Date.parse(b.dateStart || "") || 0;
        return bTime - aTime;
      });

    return [...upcoming, ...nearestRealListings].slice(0, 4);
  }, [events]);

  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [showVideo, setShowVideo] = useState(() => {
    if (typeof window === "undefined") return true;
    return !prefersStillMotion();
  });

  const go = useCallback((delta: number) => {
    setIndex((i) => (i + delta + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    const syncStill = () => {
      if (prefersStillMotion()) {
        setShowVideo(false);
        const v = videoRef.current;
        if (v) {
          try {
            v.pause();
          } catch {
            /* ignore */
          }
        }
      } else {
        setShowVideo(true);
      }
    };
    syncStill();

    let mq: MediaQueryList | null = null;
    const onMq = () => syncStill();
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onMq);
    } catch {
      /* ignore */
    }

    const obs = new MutationObserver(syncStill);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-calm"],
    });

    return () => {
      if (mq) mq.removeEventListener("change", onMq);
      obs.disconnect();
    };
  }, [calmMode]);

  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    let cancelled = false;
    const toStill = () => {
      if (!cancelled) setShowVideo(false);
    };
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(toStill);
    const t = window.setTimeout(() => {
      if (!cancelled && v.paused) toStill();
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      try {
        v.pause();
      } catch {
        /* ignore */
      }
    };
  }, [showVideo]);

  const slideClass = (n: number) => {
    if (n === index) return "home-stage__slide is-on";
    if (n < index) return "home-stage__slide is-off is-left";
    return "home-stage__slide is-off is-right";
  };

  const card = (key: HomeStageBoardKey) => {
    const data = samples[key];
    if (!data) return null;
    return <HomeStageCard card={data} />;
  };

  const cardStack = (key: "gifting" | "gigs") => {
    const liveCards = stageLists[key];
    const giftFallback: HomeStageCardData = {
      key: "gifting",
      href: "/gifting",
      kicker: "In search of",
      title: "Folding table for community dinner",
      line: "Borrow or keep. Six feet is ideal; cosmetic wear is fine.",
      meta: "North Portland · pickup flexible",
      cta: "I can help →",
      accent: "var(--panel-lime, #c8fa3c)",
      isLive: false,
    };
    const gigFallback: HomeStageCardData = {
      key: "gigs",
      href: "/pride-work?post=5",
      kicker: "Talent available",
      title: "Social media promos",
      line: "Queer event photos, video, and social content for local businesses.",
      meta: "SE Portland · $17/hr",
      cta: "Say hi →",
      accent: "var(--panel-cyan, #19e3ff)",
      isLive: false,
    };
    const secondFallback = key === "gifting" ? giftFallback : gigFallback;
    const cards = liveCards.length
      ? [...liveCards, ...(liveCards.length < 2 ? [secondFallback] : [])].slice(0, 2)
      : key === "gifting" && samples.gifting
        ? [samples.gifting, giftFallback]
        : samples[key] ? [samples[key]!, secondFallback] : [secondFallback];
    return (
      <div className={`home-stage__card-stack home-stage__card-stack--${key}`}>
        {cards.map((item) => <HomeStageCard key={`${key}-${item.href}`} card={item} />)}
      </div>
    );
  };

  return (
    <div
      className="home-stage"
      data-zl-stage=""
      data-home-stage=""
      id="top"
      aria-roledescription="carousel"
      aria-label="Zaylist home stage"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current == null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > 44) go(delta < 0 ? 1 : -1);
      }}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className="home-stage__video zl-video"
          data-zl-video=""
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
      ) : null}

      <div className="home-stage__aurora" aria-hidden>
        <div className="home-stage__orb home-stage__orb--1 zl-orb" />
        <div className="home-stage__orb home-stage__orb--2 zl-orb" />
        <div className="home-stage__orb home-stage__orb--3 zl-orb" />
      </div>

      <div className="home-stage__veil" aria-hidden />
      <div className="home-stage__grain zl-grain" aria-hidden />
      <div className="home-stage__halftone" aria-hidden />

      <div className="home-stage__letters" data-zl-letters="" aria-hidden>
        {LETTER_ORBS.map((orb, i) => (
          <div
            key={i}
            className="home-stage__letter-orb zl-orb"
            style={{
              left: orb.left,
              background: orb.color,
              animationDelay: orb.delay,
            }}
          />
        ))}
      </div>

      <div className="home-stage__slides">
        {/* 0 — Home hero */}
        <div
          className={`${slideClass(0)} home-stage__slide--hero`}
          data-zl-slide="0"
          aria-hidden={index !== 0}
        >
          <div className="home-stage__hero-inner">
            <div className="home-stage__kicker">
              <span className="home-stage__dot zl-dot" aria-hidden />
              Portland · all year
            </div>
            <div className="home-stage__wordmark" data-zl-wordmark="">
              <div className="home-stage__welcome">Welcome, you&apos;re on</div>
              <img className="home-stage__wordmark-img" src={WORDMARK} alt="Zaylist" />
              <img
                className="home-stage__wordmark-glitch home-stage__wordmark-glitch--a zl-glitch"
                src={WORDMARK}
                alt=""
                aria-hidden
              />
              <img
                className="home-stage__wordmark-glitch home-stage__wordmark-glitch--b zl-glitch"
                src={WORDMARK}
                alt=""
                aria-hidden
              />
            </div>
            <h1 className="sr-only">Zaylist</h1>
          </div>
        </div>

        {/* 1 — Events */}
        <div className={slideClass(1)} data-zl-slide="1" data-zl-fit="" aria-hidden={index !== 1}>
          <section className="home-stage__board home-stage__board--events" aria-label="Events">
            <div className="home-stage__board-veil" aria-hidden />
            <div className="home-stage__board-grain zl-grain" aria-hidden />
            <div className="home-stage__board-body">
              <div className="home-stage__board-kicker" style={{ color: "#CCFF00" }}>
                <span className="home-stage__board-kicker-inner">
                  <span className="home-stage__dot zl-dot" aria-hidden />
                  Events · Portland, this week
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <StageTitle title="Events" />
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "#CCFF00" }}>
                      Did you get on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                    <span className="home-stage__mantra-q">?</span>
                  </div>
                  <p className="home-stage__lede home-stage__lede--events">
                    Here&apos;s the week. Every queer party, show, and march on one map.
                  </p>
                  <div className="home-stage__chip-row home-stage__chip-row--events">
                    <Link
                      href="/events"
                      className="home-stage__chip home-stage__chip--plate"
                      style={{ ["--c" as string]: "#CCFF00" }}
                    >
                      Find it
                    </Link>
                    <Link
                      href="/events"
                      className="home-stage__chip home-stage__chip--plate"
                      style={{ ["--c" as string]: "#CCFF00" }}
                    >
                      Save it
                    </Link>
                    <Link
                      href="/events"
                      className="home-stage__chip home-stage__chip--plate"
                      style={{ ["--c" as string]: "#CCFF00" }}
                    >
                      Pull up
                    </Link>
                  </div>
                </div>
                {upNextEvents.length ? (
                  <div className="home-stage__event-grid">
                    <EventsFlyerGrid events={upNextEvents} />
                  </div>
                ) : card("events")}
              </div>
              <div
                className="home-stage__close"
                style={{ ["--seam-c" as string]: "#CCFF00", ["--seam-hover" as string]: "#D8FF3D" }}
              >
                <Link href="/events" className="home-stage__close-link">
                  Open the events map →
                </Link>
                <span className="home-stage__close-mantra">Find it · save it · pull up</span>
              </div>
            </div>
          </section>
        </div>

        {/* 2 — HAÜSING */}
        <div className={slideClass(2)} data-zl-slide="2" data-zl-fit="" aria-hidden={index !== 2}>
          <section className="home-stage__board" aria-label="Haüsing">
            <div
              className="home-stage__board-wash"
              style={{
                background:
                  "radial-gradient(120% 90% at 8% 0%, color-mix(in srgb, var(--board-housing,#00FFFF) 14%, transparent) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, color-mix(in srgb, var(--neon-violet,#8800FF) 12%, transparent) 0%, transparent 60%)",
              }}
              aria-hidden
            />
            <div
              className="home-stage__board-dots"
              style={{ backgroundImage: "radial-gradient(#19e3ff 1px, transparent 1px)" }}
              aria-hidden
            />
            <div className="home-stage__board-body">
              <div className="home-stage__board-kicker" style={{ color: "var(--panel-cyan, #19e3ff)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span
                    className="home-stage__dot zl-dot"
                    style={{
                      background: "var(--panel-cyan, #19e3ff)",
                      boxShadow: "0 0 10px var(--panel-cyan, #19e3ff)",
                    }}
                    aria-hidden
                  />
                  Haüsing · Housing board
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <div className="home-stage__title-row">
                    <StageTitle title="Haüsing" />
                    <span className="home-stage__beta">Beta</span>
                  </div>
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--panel-cyan, #19e3ff)" }}>
                      Your home is on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <p className="home-stage__lede">
                    Rooms, roommates, and households in the making. No fees, no applications.
                  </p>
                  <div className="home-stage__chip-row">
                    <Link
                      href="/hausing"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-cyan, #19e3ff)" }}
                    >
                      Offering a room
                    </Link>
                    <Link
                      href="/hausing"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-purple, #b06bff)" }}
                    >
                      Looking for housing
                    </Link>
                    <Link
                      href="/hausing"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-orange, #ff8c00)" }}
                    >
                      Forming a haüs
                    </Link>
                  </div>
                </div>
                <Link
                  href="/hausing"
                  className="home-stage__housing-card pdx-glass-card pdx-glass-rebind"
                  style={{ ["--c" as string]: "var(--green-acid, #39ff14)" }}
                  aria-label="Forming a HAÜS: Wildrose HAÜS, looking for two more people"
                >
                  <span className="pdx-refract-seam" aria-hidden />
                  <div className="home-stage__housing-type">Forming a HAÜS</div>
                  <div className="home-stage__housing-well">
                    <img src="/hausing/forming-no-place.svg" alt="" aria-hidden />
                    <div className="home-stage__housing-well-title">Build a HAÜS</div>
                    <div className="home-stage__housing-household" aria-label="Three people in, two spots open">
                      <span className="home-stage__housing-person">M</span>
                      <span className="home-stage__housing-person">J</span>
                      <span className="home-stage__housing-person">S</span>
                      <span className="home-stage__housing-slot">+</span>
                      <span className="home-stage__housing-slot">+</span>
                      <small>3 in · 2 to go</small>
                    </div>
                  </div>
                  <p className="home-stage__housing-line">Building a queer household with room for two more.</p>
                  <div className="home-stage__housing-facts">
                    <span><small>Budget</small><b>$3.2k</b></span>
                    <span><small>Move in</small><b>Flexible</b></span>
                    <span><small>Looking in</small><b>SE PDX</b></span>
                  </div>
                  <div className="home-stage__housing-tags">
                    <span>Looking for 2 more</span>
                    <span>Chosen family</span>
                    <span>Quiet home</span>
                  </div>
                  <div className="home-stage__housing-trust">● 2 mutual connections · member since 2024</div>
                  <div className="home-stage__housing-actions">
                    <span>Save</span>
                    <span>Share</span>
                    <strong>Ask to join</strong>
                  </div>
                </Link>
              </div>
              <div
                className="home-stage__close"
                style={{
                  ["--seam-c" as string]: "var(--panel-cyan, #19e3ff)",
                  ["--seam-hover" as string]: "#7dfbff",
                }}
              >
                <Link href="/hausing" className="home-stage__close-link">
                  Open the haüsing board →
                </Link>
                <span className="home-stage__close-mantra">Find a room · find people</span>
              </div>
            </div>
          </section>
        </div>

        {/* 3 — Gifting */}
        <div className={slideClass(3)} data-zl-slide="3" data-zl-fit="" aria-hidden={index !== 3}>
          <section
            className="home-stage__board"
            aria-label="Gifting"
            style={{ borderTop: "1px solid var(--panel-border, #1c1c22)" }}
          >
            <div
              className="home-stage__board-wash"
              style={{
                background:
                  "radial-gradient(120% 90% at 8% 0%, color-mix(in srgb, var(--board-gifting,#CCFF00) 12%, transparent) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, color-mix(in srgb, var(--green-acid,#39FF14) 10%, transparent) 0%, transparent 60%)",
              }}
              aria-hidden
            />
            <div
              className="home-stage__board-dots"
              style={{ backgroundImage: "radial-gradient(#c8fa3c 1px, transparent 1px)" }}
              aria-hidden
            />
            <div className="home-stage__board-body">
              <div className="home-stage__board-kicker" style={{ color: "var(--panel-lime, #c8fa3c)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span
                    className="home-stage__dot zl-dot"
                    style={{
                      background: "var(--panel-lime, #c8fa3c)",
                      boxShadow: "0 0 10px var(--panel-lime, #c8fa3c)",
                    }}
                    aria-hidden
                  />
                  Gifting · Everything free
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <StageTitle title="Gifting" />
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--neon-yellow, #CCFF00)" }}>
                      Give it away on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <p className="home-stage__lede">
                    Someone needs the thing you are done with. Nothing is for sale here.
                  </p>
                  <div className="home-stage__chip-row">
                    <Link
                      href="/gifting"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-lime, #c8fa3c)" }}
                    >
                      Giving
                    </Link>
                    <Link
                      href="/gifting"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--green-acid, #39FF14)" }}
                    >
                      In search of
                    </Link>
                    <Link
                      href="/gifting"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-orange, #ff8c00)" }}
                    >
                      No money, ever
                    </Link>
                  </div>
                </div>
                {cardStack("gifting")}
              </div>
              <div
                className="home-stage__close"
                style={{
                  ["--seam-c" as string]: "var(--panel-lime, #c8fa3c)",
                  ["--seam-hover" as string]: "#D8FF3D",
                }}
              >
                <Link href="/gifting" className="home-stage__close-link">
                  Open the gifting board →
                </Link>
                <span className="home-stage__close-mantra">Keep it free · keep it moving</span>
              </div>
            </div>
          </section>
        </div>

        {/* 4 — Gig Board */}
        <div className={slideClass(4)} data-zl-slide="4" data-zl-fit="" aria-hidden={index !== 4}>
          <section
            className="home-stage__board"
            aria-label="Gig board"
            style={{ borderTop: "1px solid var(--panel-border, #1c1c22)" }}
          >
            <div
              className="home-stage__board-wash"
              style={{
                background:
                  "radial-gradient(120% 90% at 8% 0%, color-mix(in srgb, var(--board-gigs,#8800FF) 18%, transparent) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, color-mix(in srgb, var(--panel-cyan,#19e3ff) 10%, transparent) 0%, transparent 60%)",
              }}
              aria-hidden
            />
            <div
              className="home-stage__board-dots"
              style={{ backgroundImage: "radial-gradient(#b06bff 1px, transparent 1px)" }}
              aria-hidden
            />
            <div className="home-stage__board-body">
              <div className="home-stage__board-kicker" style={{ color: "var(--panel-purple, #b06bff)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span
                    className="home-stage__dot zl-dot"
                    style={{
                      background: "var(--green-acid, #39FF14)",
                      boxShadow: "0 0 10px var(--green-acid, #39FF14)",
                    }}
                    aria-hidden
                  />
                  Gig board · Hiring both ways
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <StageTitle title="Gig board" />
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--panel-purple, #b06bff)" }}>
                      That gig is on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <p className="home-stage__lede">
                    Need work? Need help at your event? Both belong here.
                  </p>
                  <div className="home-stage__chip-row">
                    <Link
                      href="/pride-work"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-purple, #b06bff)" }}
                    >
                      Hiring
                    </Link>
                    <Link
                      href="/pride-work"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--green-acid, #39FF14)" }}
                    >
                      For hire
                    </Link>
                    <Link
                      href="/pride-work"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-cyan, #19e3ff)" }}
                    >
                      Paid or trade
                    </Link>
                  </div>
                </div>
                {cardStack("gigs")}
              </div>
              <div
                className="home-stage__close"
                style={{
                  ["--seam-c" as string]: "var(--panel-purple, #b06bff)",
                  ["--seam-hover" as string]: "#c9a0ff",
                }}
              >
                <Link href="/pride-work" className="home-stage__close-link">
                  Open the gig board →
                </Link>
                <span className="home-stage__close-mantra">Ask for it · offer it · get paid</span>
              </div>
            </div>
          </section>
        </div>

        {/* 5 — Missed Connections */}
        <div className={slideClass(5)} data-zl-slide="5" data-zl-fit="" aria-hidden={index !== 5}>
          <section
            className="home-stage__board"
            aria-label="Missed connections"
            style={{ borderTop: "1px solid var(--panel-border, #1c1c22)" }}
          >
            <div
              className="home-stage__board-wash"
              style={{
                background:
                  "radial-gradient(120% 90% at 8% 0%, color-mix(in srgb, var(--board-spotted,#FF00CC) 14%, transparent) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, color-mix(in srgb, var(--panel-cyan,#19e3ff) 10%, transparent) 0%, transparent 60%)",
              }}
              aria-hidden
            />
            <div
              className="home-stage__board-dots"
              style={{ backgroundImage: "radial-gradient(#ff1fa0 1px, transparent 1px)" }}
              aria-hidden
            />
            <div className="home-stage__board-body">
              <div className="home-stage__board-kicker" style={{ color: "var(--panel-magenta, #ff1fa0)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span
                    className="home-stage__dot zl-dot"
                    style={{
                      background: "var(--panel-magenta, #ff1fa0)",
                      boxShadow: "0 0 10px var(--panel-magenta, #ff1fa0)",
                    }}
                    aria-hidden
                  />
                  Missed connections! · Anonymous
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <StageTitle title="Missed connections" accentSuffix="!" />
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--neon-magenta, #FF00CC)" }}>
                      That hottie posted on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <p className="home-stage__lede">
                    Post who you saw. Replies open a private thread, never the board.
                  </p>
                  <div className="home-stage__chip-row">
                    <Link
                      href="/spotted"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-magenta, #ff1fa0)" }}
                    >
                      At an event
                    </Link>
                    <Link
                      href="/spotted"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-orange, #ff8c00)" }}
                    >
                      At the beach
                    </Link>
                    <Link
                      href="/spotted"
                      className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind"
                      style={{ ["--c" as string]: "var(--panel-cyan, #19e3ff)" }}
                    >
                      Around town
                    </Link>
                  </div>
                </div>
                <div className="home-stage__motif-card home-stage__motif-card--missed">
                  <span className="home-stage__quote-motif" aria-hidden>“ ”</span>
                  {card("spotted")}
                </div>
              </div>
              <div
                className="home-stage__close"
                style={{
                  ["--seam-c" as string]: "var(--panel-magenta, #ff1fa0)",
                  ["--seam-hover" as string]: "#ff6ec7",
                }}
              >
                <Link href="/spotted" className="home-stage__close-link">
                  Open missed connections →
                </Link>
                <span className="home-stage__close-mantra">Stay kind · reveal when ready</span>
              </div>
            </div>
          </section>
        </div>

        {/* 6 — Nude Beaches */}
        <div className={slideClass(6)} data-zl-slide="6" data-zl-fit="" aria-hidden={index !== 6}>
          <section className="home-stage__board home-stage__board--beaches" aria-label="Nude beaches">
            <div className="home-stage__board-wash home-stage__board-wash--beaches" aria-hidden />
            <div className="home-stage__board-dots home-stage__board-dots--beaches" aria-hidden />
            <div className="home-stage__board-body">
              <MapMotif kind="rooster" />
              <div className="home-stage__board-kicker" style={{ color: "var(--neon-orange, #ff6600)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span className="home-stage__dot zl-dot" style={{ background: "var(--neon-orange, #ff6600)", boxShadow: "0 0 10px var(--neon-orange, #ff6600)" }} aria-hidden />
                  Nude beaches · Live conditions
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--neon-orange, #ff6600)" }}>
                      Check out the river on
                    </span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <StageTitle title="Nude beaches" />
                  <p className="home-stage__lede">
                    River level, weather, how busy it is and who is driving out. Rooster Rock and Collins Beach, updated by the people who are already there.
                  </p>
                </div>
                <div className="home-stage__beach-panel">
                  <HomeBeachWidget showCollins />
                </div>
              </div>
              <div className="home-stage__close" style={{ ["--seam-c" as string]: "var(--neon-orange, #ff6600)", ["--seam-hover" as string]: "#ff9a4d" }}>
                <Link href="/nude-beaches" className="home-stage__close-link">Open nude beaches →</Link>
                <span className="home-stage__close-mantra">Conditions · carpools · check-ins</span>
              </div>
            </div>
          </section>
        </div>

        {/* 7 — River Brats */}
        <div className={slideClass(7)} data-zl-slide="7" data-zl-fit="" aria-hidden={index !== 7}>
          <section className="home-stage__board home-stage__board--river" aria-label="River Brats">
            <div className="home-stage__board-wash home-stage__board-wash--river" aria-hidden />
            <div className="home-stage__board-dots home-stage__board-dots--river" aria-hidden />
            <div className="home-stage__board-body">
              <MapMotif kind="collins" />
              <div className="home-stage__board-kicker" style={{ color: "var(--green-acid, #39ff14)" }}>
                <span className="home-stage__board-kicker-inner">
                  <span className="home-stage__dot zl-dot" style={{ background: "var(--green-acid, #39ff14)", boxShadow: "0 0 10px var(--green-acid, #39ff14)" }} aria-hidden />
                  River Brats · Beach day chat
                </span>
              </div>
              <div className="home-stage__board-row">
                <div className="home-stage__board-copy">
                  <div className="home-stage__mantra">
                    <span className="home-stage__mantra-text" style={{ color: "var(--green-acid, #39ff14)" }}>The chat is on</span>
                    <img className="home-stage__mantra-mark" src={WORDMARK_WHITE} alt="Zaylist" />
                  </div>
                  <StageTitle title="River Brats" />
                  <p className="home-stage__lede">
                    One thread per beach day. Who is out, where they set up, what to bring and who has a seat in the car.
                  </p>
                  <div className="home-stage__chip-row">
                    <Link href="/nude-beaches" className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" style={{ ["--c" as string]: "var(--green-acid, #39ff14)" }}>Today&apos;s thread</Link>
                    <Link href="/nude-beaches" className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-orange, #ff6600)" }}>Who is driving</Link>
                    <Link href="/nude-beaches" className="home-stage__chip pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" style={{ ["--c" as string]: "var(--panel-cyan, #19e3ff)" }}>What to bring</Link>
                  </div>
                </div>
                <Link href="/nude-beaches" className="home-stage__chat-card pdx-glass-card pdx-glass-rebind" style={{ ["--c" as string]: "var(--green-acid, #39ff14)" }}>
                  <div className="home-stage__chat-meta"><span className="home-stage__chat-avatar">S</span><strong>Sam</strong><span>1:04 PM</span></div>
                  <div className="home-stage__chat-thread">
                    <p>Setting up past the second path around 1. Look for the orange umbrella.</p>
                    <span className="home-stage__chat-reply">I&apos;ll bring bug spray</span>
                    <p className="home-stage__chat-bubble--short">Perfect. Anyone need a ride?</p>
                    <span className="home-stage__chat-reply">Leaving Alberta in 20.</span>
                  </div>
                  <div className="home-stage__chat-foot"><span>7 in the thread</span><strong>Join the chat →</strong></div>
                </Link>
              </div>
              <div className="home-stage__close" style={{ ["--seam-c" as string]: "var(--green-acid, #39ff14)", ["--seam-hover" as string]: "#7dff69" }}>
                <Link href="/nude-beaches" className="home-stage__close-link">Open the river chat →</Link>
                <span className="home-stage__close-mantra">Check in · find a ride · meet up</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <button
        type="button"
        className="home-stage__nav home-stage__nav--prev"
        aria-label="Previous slide"
        data-zl-prev=""
        onClick={() => go(-1)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        className="home-stage__nav home-stage__nav--next"
        aria-label="Next slide"
        data-zl-next=""
        onClick={() => go(1)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

function MapMotif({ kind }: { kind: "rooster" | "collins" }) {
  return (
    <svg className={`home-stage__map-motif home-stage__map-motif--${kind}`} viewBox="0 0 884 639" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {kind === "rooster" ? (
        <>
          <path className="home-stage__map-water" d="M-20 56C103 84 177 61 278 79c111 20 174-3 283-12 123-11 213 26 343 13v246c-104-28-209-6-305-20-112-16-202 10-312 3-118-7-197-42-307-21z" />
          <path className="home-stage__map-land" d="M-25 330c75-27 126-38 193-30 58 7 103 34 157 29 56-5 87-44 145-42 56 2 86 40 141 37 93-5 161-54 298-37v372H-25z" />
          <path className="home-stage__map-island" d="M207 267c42-30 89-35 132-18 38 14 66 12 104-2 54-20 99-8 137 18-55 20-96 38-151 35-52-3-88-21-137-14-37 5-59 1-85-19z" />
          <path className="home-stage__map-island" d="M559 257c53-27 114-22 168-6 43 13 88 11 142-2l29 40c-74 24-138 16-197 20-55 3-99-11-142-52z" />
          <path className="home-stage__map-road" d="M-18 520C123 496 219 457 330 448c117-10 211 18 324 2 99-14 155-43 255-56" />
          <path className="home-stage__map-road home-stage__map-road--minor" d="M46 572c117-39 196-71 302-77 129-8 216 20 329-5 79-18 137-48 221-62" />
          <path className="home-stage__map-route" d="M124 455c42-54 89-71 141-64 39 6 70-17 104-48 33-30 71-42 118-32 50 11 92 4 126-23" />
          <path className="home-stage__map-route" d="M235 480c18-43 45-74 82-90 45-20 78-14 119-44 36-27 81-29 126-18" />
          <path className="home-stage__map-contour" d="M8 611c75-23 121-12 179-34 53-20 92-13 151-2s102-5 158-23c63-21 105-10 164-3 78 9 139-24 221-45M18 385c69-34 129-20 190-4 52 14 90-9 139-31" />
        </>
      ) : (
        <>
          <path className="home-stage__map-water" d="M0 0h884v639H0z" />
          <path className="home-stage__map-land" d="M372-28c49 26 91 52 122 94 24 33 42 67 76 92 39 28 57 64 46 109-9 37-2 68 20 99 24 34 23 72 2 107-22 36-27 77-19 119 7 38-7 70-45 98H231c-30-31-39-68-27-108 12-42 4-78-17-113-24-39-26-81-7-122 17-36 15-74-5-107-27-44-23-86 12-125 32-36 57-80 73-143z" />
          <path className="home-stage__map-channel" d="M338-18c31 58 38 102 21 153-15 45-9 85 17 122 30 43 30 88 4 133-24 42-27 86-7 131 17 38 19 81 6 127" />
          <path className="home-stage__map-channel" d="M503-4c-9 53 6 98 38 135 29 34 39 70 24 111-15 42-7 80 20 116 28 37 31 79 14 125-13 35-12 75 2 119" />
          <path className="home-stage__map-lake" d="M322 166c36-29 78-30 113-8 30 18 37 48 17 77-23 34-64 47-101 31-42-18-55-65-29-100z" />
          <path className="home-stage__map-lake" d="M433 309c32-20 70-14 88 17 16 28 5 62-25 78-33 18-69 4-82-27-11-26-4-50 19-68z" />
          <path className="home-stage__map-road" d="M287 639c-1-91 24-155 68-219 39-57 59-116 52-180-6-55 8-108 42-161 22-34 34-69 40-107" />
          <path className="home-stage__map-route" d="M470 89c49 44 66 84 58 126-7 41 3 76 30 108 31 37 35 76 21 116-15 43-12 82 9 120" />
          <path className="home-stage__map-contour" d="M49 47c75 48 107 93 97 143-9 47 6 86 45 117M735 17c-54 67-72 121-52 169 17 41 14 82-12 121-27 41-31 84-10 130M82 572c50-39 88-79 111-121" />
        </>
      )}
    </svg>
  );
}
