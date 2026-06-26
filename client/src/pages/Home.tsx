import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "@/components/EventModal";

import EventTicker from "@/components/EventTicker";
import HeroAurora from "@/components/HeroAurora";
import ScrollReveal from "@/components/ScrollReveal";
import { MapView } from "./Events";
import { Gift, Search } from "lucide-react";
const skylineImg = "/home-hero-desktop.jpg";

function parsePacificEventTime(value?: string | null) {
  if (!value) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).getTime();
  return new Date(`${value}-07:00`).getTime();
}

function useCountdown(target: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = target - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

// Squarespace-style parallax: backgrounds drift slower than scroll on
// alternating home panels (hero + gifting panel; map preview + gigs
// panel stay static). Respects prefers-reduced-motion.
function useHomeParallax() {
  const heroRef = useRef<HTMLElement>(null);
  const giftingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const nodes = [heroRef.current, giftingRef.current].filter(
      (node): node is HTMLElement => Boolean(node)
    );
    if (!nodes.length) return;

    let rafId = 0;
    const STRENGTH = 0.16;

    const update = () => {
      const vh = window.innerHeight;
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) * STRENGTH;
        node.style.setProperty("--parallax-y", `${offset}px`);
      }
      rafId = 0;
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return { heroRef, giftingRef };
}

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { heroRef, giftingRef } = useHomeParallax();
  const [showSoftLaunch, setShowSoftLaunch] = useState(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return false;
    return window.localStorage.getItem("softLaunchWelcomeDismissed") !== "true";
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });
  const firstEventTarget = useMemo(() => {
    const starts = events
      .map(event => parsePacificEventTime(event.dateStart))
      .filter((time): time is number => typeof time === "number" && Number.isFinite(time))
      .sort((a, b) => a - b);
    return starts[0] || new Date("2026-07-16T00:00:00-07:00").getTime();
  }, [events]);
  const countdown = useCountdown(firstEventTarget);
  const tickerItems = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => (parsePacificEventTime(a.dateStart) ?? 0) - (parsePacificEventTime(b.dateStart) ?? 0),
    );
    if (sorted.length === 0) {
      return [
        { id: "fallback-1", title: "Portland Pride Weekend" },
        { id: "fallback-2", title: "View all events" },
        { id: "fallback-3", title: "July 16–19, 2026" },
      ];
    }
    return sorted.map(event => ({ id: event.id, title: event.title }));
  }, [events]);
  const dismissSoftLaunch = () => {
    window.localStorage.setItem("softLaunchWelcomeDismissed", "true");
    setShowSoftLaunch(false);
  };

  return (
    <div className="zine-page home-page" style={{ background: "#000", minHeight: "100vh" }}>
      {showSoftLaunch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="soft-launch-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <div style={{
            width: "min(560px, 100%)",
            border: "3px solid var(--neon-yellow)",
            background: "#050505",
            boxShadow: "0 0 36px rgba(204,255,0,0.24), 0 0 60px rgba(0,255,255,0.18)",
            padding: 24,
            position: "relative",
          }}>
            <button
              type="button"
              aria-label="Close welcome"
              onClick={dismissSoftLaunch}
              style={{ position: "absolute", top: 10, right: 10, background: "transparent", border: "1px solid #333", color: "#999", width: 30, height: 30, cursor: "pointer" }}
            >
              X
            </button>
            <span className="board-sticker" style={{ color: "#00FFFF", marginBottom: 14, display: "inline-block" }}>SOFTIE LAUNCH</span>
            <h2 id="soft-launch-title" className="display" style={{ color: "#fff", fontSize: "clamp(1.4rem, 5.6vw, 2.8rem)", lineHeight: 0.95, marginBottom: 14 }}>
              WELCOME
            </h2>
            <p style={{ color: "#bbb", fontSize: "0.7rem", lineHeight: 1.6, marginBottom: 18 }}>
              Welcome to the softie launch. A couple more days working out the bugs and we will be ready. Play around, and please submit feedback at the bottom of the website if you run into any issue.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={dismissSoftLaunch} className="btn-neon solid">START EXPLORING</button>
              <a href="#feedback" onClick={dismissSoftLaunch} className="btn-neon" style={{ color: "#00FFFF", borderColor: "#00FFFF", textDecoration: "none" }}>SEND FEEDBACK</a>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="zine-hero home-hero"
        style={{ position: "relative", overflow: "hidden", minHeight: 720, display: "flex", alignItems: "center" }}
      >
        <div className="home-hero-backdrop" aria-hidden="true">
          <div
            className="home-hero-bg-desktop"
            style={{
              position: "absolute",
              top: "-8%",
              bottom: "-8%",
              left: 0,
              right: 0,
              backgroundImage: `url(${skylineImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              opacity: 0.9,
              transform: "translateY(var(--parallax-y, 0px))",
              willChange: "transform",
            }}
          />
          <div className="home-hero-bg-collage" />
          <div className="home-hero-bg-mobile" />
          <HeroAurora />
          <div className="home-hero-shade" />
          <div className="home-hero-halftone" />
          <div className="home-hero-watermark">LOVE<br />LOUDER</div>
        </div>

        <div className="home-hero-content">
          <div style={{ maxWidth: 820 }}>
            <div className="home-hero-kicker">July 16–19, 2026</div>

            <h1 className="display home-hero-title">
              PORTLAND<br />
              <span>PRIDE</span><br />
              GUIDE
            </h1>

            <p className="home-hero-subtitle">
              This is your welcoming spot to discover what's happening, connect with the right people, keep our venues and creators thriving, grow your connections, and take care of each other when it matters most.
            </p>

            {countdown && (
              <>
                <div className="home-countdown-grid" aria-label="Countdown to first event">
                  {[
                    ["DAYS", countdown.days],
                    ["HRS", countdown.hours],
                    ["MIN", countdown.minutes],
                    ["SEC", countdown.seconds],
                  ].map(([label, value]) => (
                    <div className="home-countdown-box" key={label}>
                      <div>{String(value).padStart(2, "0")}</div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="home-countdown-caption">UNTIL FIRST EVENT · PORTLAND TIME</div>
              </>
            )}

            <div className="home-hero-actions">
              <Link href="/events">
                <button className="btn-neon home-hero-button">
                  VIEW ALL EVENTS →
                </button>
              </Link>
              <Link href="/pride-work">
                <button className="btn-neon home-hero-button cyan">
                  PRIDE WORK →
                </button>
              </Link>
            </div>
          </div>
        </div>

        <section className="event-ticker-band" aria-label="Live event ticker">
          <Link href="/events" className="event-ticker-label">
            LIVE EVENTS
          </Link>
          <EventTicker items={tickerItems} />
        </section>
      </section>

      <div className="torn-divider full-bleed" />

      <section className="home-map-preview" aria-label="Events map preview">
        <MapView
          events={events}
          expanded={false}
          onExpand={() => {}}
          onCollapse={() => {}}
          onSelect={setSelectedEvent}
          variant="home"
        />
      </section>

      <div className="torn-divider full-bleed" />

      <section className="home-promo-stack">
        <ScrollReveal>
        <article ref={giftingRef} className="home-promo-panel home-gifting-panel">
          <div className="home-promo-inner">
            <div className="home-promo-panel-card">
              <h2 className="home-promo-title">
                <span className="home-promo-title-line">GIFT WITH</span>
                <span className="home-promo-accent home-promo-accent--rainbow">PRIDE</span>
              </h2>
              <p className="home-promo-tagline home-promo-tagline--magenta">Give gay gifts. Queer homes. Keep it moving.</p>
              <p className="home-promo-lede">A Pride-season board for giving away what you do not need and asking for what you do.</p>
              <div className="gifting-actions">
                <Link href="/gifting"><button className="btn-neon"><Gift size={16} /> Post a Gift</button></Link>
                <Link href="/gifting"><button className="btn-neon cyan"><Search size={16} /> Post an In Search Of</button></Link>
              </div>
            </div>
          </div>
        </article>
        </ScrollReveal>
        <div className="torn-divider full-bleed" />
        <ScrollReveal delay={120}>
        <article className="home-promo-panel home-gigs-panel">
          <div className="home-promo-inner">
            <div className="home-promo-panel-card">
              <h2 className="home-promo-title">
                <span className="home-promo-title-line">PRIDE</span>
                <span className="home-promo-accent home-promo-accent--lime">GIG BOARD</span>
              </h2>
              <p className="home-promo-tagline home-promo-tagline--cyan">Paid, respected, valued.</p>
              <p className="home-promo-lede">Post Pride work, find collaborators, and connect queer workers with queer gigs.</p>
              <div className="gifting-actions">
                <Link href="/pride-work"><button className="btn-neon"><Search size={16} /> Find Work</button></Link>
                <Link href="/pride-work"><button className="btn-neon cyan"><Gift size={16} /> Post a Gig</button></Link>
              </div>
            </div>
          </div>
        </article>
        </ScrollReveal>
        <div className="torn-divider full-bleed" />
      </section>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
