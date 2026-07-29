/**
 * Zaylist home stage — multi-slide hero (handoff: docs/design-handoff-home-2026-07-28).
 *
 * Shared video wallpaper + aurora/letter orbs + grain behind all slides.
 * Slides: Home hero, Events, Haüsing, Gifting, Gig Board, Missed Connections.
 * Chevrons + arrow keys. Calm / reduced-motion via data-calm + prefersStillMotion.
 * Sample cards: useHomeStageSamples (live API + demo fill) + HomeStageCard.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import {
  useHomeStageSamples,
  type HomeStageBoardKey,
  type HomeStageCardData,
  type HomeStageSamples,
} from "@/lib/homeStageSamples";
import "./HomeStage.css";

export type { HomeStageBoardKey, HomeStageCardData, HomeStageSamples };
export { useHomeStageSamples, HomeStageCard };

const SLIDE_COUNT = 6;
const WORDMARK = "/home/zaylist-wordmark-filled.png";
const WORDMARK_WHITE = "/home/zaylist-wordmark-white.png";
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

type Props = {
  /** Override samples (tests / story). Default: live API + demo fill. */
  samples?: HomeStageSamples;
  /** When false, skip demo fallbacks for empty boards. */
  includeDemoFallback?: boolean;
};

export default function HomeStage({ samples: samplesProp, includeDemoFallback }: Props) {
  const { calmMode } = useTheme();
  const { samples: liveSamples } = useHomeStageSamples({ includeDemoFallback });
  const samples = samplesProp ?? liveSamples;

  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  return (
    <div
      className="home-stage"
      data-zl-stage=""
      data-home-stage=""
      id="top"
      aria-roledescription="carousel"
      aria-label="Zaylist home stage"
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
            <img
              className="home-stage__board-bg"
              src="/home/festival-posters-wall.jpg"
              alt=""
              decoding="async"
            />
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
                  <h2 className="home-stage__board-title home-stage__board-title--events">Events</h2>
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
                </div>
                {card("events")}
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
                    <h2 className="home-stage__board-title">Haüsing</h2>
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
                {card("housing")}
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
                  <h2 className="home-stage__board-title">Gifting</h2>
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
                {card("gifting")}
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
                  <h2 className="home-stage__board-title home-stage__board-title--gig">Gig board</h2>
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
                {card("gigs")}
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
                  <h2 className="home-stage__board-title home-stage__board-title--mc">
                    Missed connections
                    <span className="home-stage__board-title-bang">!</span>
                  </h2>
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
                {card("spotted")}
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
