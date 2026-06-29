import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "@/components/EventModal";
import EventTicker from "@/components/EventTicker";
import { MapView } from "./Events";
import { Briefcase, Gift, Search, UserRound } from "lucide-react";
import GlitchWord from "@/components/GlitchWord";
import HeroVideoOverlay from "@/components/HeroVideoOverlay";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import { spottedHeroProps } from "@/lib/spottedHero";
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

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showSoftLaunch, setShowSoftLaunch] = useState(() => {
    if (typeof window === "undefined") return false;
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
  const tickerSource = useMemo(
    () => events.map(event => ({ id: event.id, title: event.title })).filter(item => item.title),
    [events],
  );
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
            boxShadow: "0 0 36px rgba(204,255,0,0.24), 0 0 60px rgba(255,0,204,0.16)",
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
            <div className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", marginBottom: 14 }}>SOFTIE LAUNCH</div>
            <h2 id="soft-launch-title" className="display" style={{ color: "#fff", fontSize: "clamp(2rem, 8vw, 4rem)", lineHeight: 0.95, marginBottom: 14 }}>
              WELCOME
            </h2>
            <p style={{ color: "#bbb", fontSize: "1rem", lineHeight: 1.6, marginBottom: 18 }}>
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
        className="zine-hero home-hero"
        style={{ position: "relative", overflow: "hidden", isolation: "isolate", minHeight: 720, display: "flex", alignItems: "center" }}
      >
        <div
          className="home-hero-bg-desktop"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${skylineImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            opacity: 0.9,
          }}
        />
        <div className="home-hero-bg-mobile" aria-hidden="true" />
        <HeroVideoOverlay preset="home" />
        <div className="home-hero-scrim" aria-hidden="true" />
        <div className="home-hero-halftone" aria-hidden="true" />
        <div className="home-hero-watermark" aria-hidden="true">LOVE<br />LOUDER</div>


        <div className="home-hero-content">
          <div style={{ maxWidth: 820 }}>
            <div className="home-hero-kicker">Portland Pride Weekend · July 16–19, 2026</div>

            <h1 className="display home-hero-title">
              PORTLAND<br />
              <span className="home-hero-title-pride"><GlitchWord text="PRIDE" /></span><br />
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
                <button className="btn-neon home-hero-button" style={{ borderColor: "#FF00CC", color: "#FF00CC" }}>
                  PRIDE WERK →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {tickerSource.length > 0 && (
          <div className="home-hero-ticker">
            <div className="rainbow-bar rainbow-bar--bleed" aria-hidden="true" />
            <section className="event-ticker-band" aria-label="Live event ticker">
              <Link href="/events" className="event-ticker-label">
                LIVE EVENTS
              </Link>
              <EventTicker items={tickerSource} />
            </section>
            <div className="rainbow-bar rainbow-bar--bleed" aria-hidden="true" />
          </div>
        )}
      </section>

      {tickerSource.length === 0 && (
        <div className="rainbow-bar rainbow-bar--bleed home-section-divider" aria-hidden="true" />
      )}

      <section className="home-map-preview" aria-label="Events map preview">
        <MapView
          events={events}
          expanded={mapExpanded}
          onExpand={() => setMapExpanded(true)}
          onCollapse={() => setMapExpanded(false)}
          onSelect={setSelectedEvent}
          variant="home"
        />
      </section>

      <div className="rainbow-bar rainbow-bar--bleed home-section-divider" aria-hidden="true" />

      <section className="home-promo-stack">
        <ScrollReveal>
          <PageHero
            className="home-promo-panel home-gifting-panel"
            compact
            flush
            kicker="Pride season only · Now through July 26"
            titleLine1="GIFT WITH"
            titleLine2="PRIDE"
            accent="rainbow"
            lede="A queer Portland free board for Pride-season closet chaos, event supplies, outfit saves, furniture, gear, tickets, décor, kink gear, circuit looks, and whatever else needs a new home."
            tagline="Give gay gifts. Queer homes. Keep it moving."
            taglineAccent="magenta"
            bgImage="/gift-with-pride-hero.jpg"
            actions={
              <>
                <Link href="/gifting"><button type="button" className="btn-neon"><Gift size={16} /> Post a gift</button></Link>
                <Link href="/gifting"><button type="button" className="btn-neon cyan"><Search size={16} /> Post an in search of</button></Link>
              </>
            }
          />
        </ScrollReveal>
        <div className="rainbow-bar rainbow-bar--bleed home-section-divider" aria-hidden="true" />
        <ScrollReveal delay={120}>
          <PageHero
            className="home-promo-panel home-gigs-panel"
            compact
            flush
            kicker="Pride season & beyond"
            titleLine1="PRIDE"
            titleLine1Accent="rainbow"
            titleLine2="GIG BOARD"
            accent="lime"
            lede="Two-way board for Pride season and beyond. Post your availability, post a gig, or browse both. Workers and hosts in one place."
            tagline="Need work? Need help? Both belong here."
            taglineAccent="cyan"
            bgImage="/motifs/hero-gigs.jpg"
            actions={
              <>
                <Link href="/pride-work"><button type="button" className="btn-neon cyan"><UserRound size={16} /> Post your availability</button></Link>
                <Link href="/pride-work"><button type="button" className="btn-neon"><Briefcase size={16} /> Post a gig</button></Link>
              </>
            }
          />
        </ScrollReveal>
        <div className="rainbow-bar rainbow-bar--bleed home-section-divider" aria-hidden="true" />
        <ScrollReveal delay={180}>
          <PageHero
            {...spottedHeroProps({
              className: "home-promo-panel home-spotted-panel",
              compact: true,
              titleLine1: "SPOTTED! THEM AT",
              titleLine2: "PRIDE",
              accent: "rainbow",
              titleLine1Accent: undefined,
              actions: (
                <Link href="/spotted">
                  <button type="button" className="btn-neon" style={{ borderColor: "#FF00CC", color: "#FF00CC" }}>
                    Go to Spotted! →
                  </button>
                </Link>
              ),
            })}
          />
        </ScrollReveal>
      </section>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
