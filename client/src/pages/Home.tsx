import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "@/components/EventModal";
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
  const eventNames = events.map(event => event.title).filter(Boolean);
  const tickerItems = eventNames.length ? [...eventNames, ...eventNames] : [];
  const dismissSoftLaunch = () => {
    window.localStorage.setItem("softLaunchWelcomeDismissed", "true");
    setShowSoftLaunch(false);
  };

  return (
    <div className="zine-page home-page" style={{ background: "#000", minHeight: "100vh" }}>
      {/* TEST-BANNER-REMOVE-ME */}
      <div style={{ background: "#00EE44", color: "#000", textAlign: "center", padding: "10px", fontWeight: 900, fontFamily: "var(--font-display)", letterSpacing: "0.08em", textTransform: "uppercase", position: "relative", zIndex: 999 }}>
        TEST BANNER — HOME — SAFE TO REMOVE
      </div>
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
        style={{ position: "relative", overflow: "hidden", minHeight: 720, display: "flex", alignItems: "center" }}
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
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 42%, rgba(0,0,0,0.75) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, #CCFF00 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }} />
        <div style={{
          position: "absolute", right: "-2%", top: "50%", transform: "translateY(-50%)",
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(5rem, 14vw, 11rem)",
          color: "rgba(204,255,0,0.04)", letterSpacing: "-0.02em", lineHeight: 0.9,
          userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap",
        }}>LOVE<br />LOUDER</div>


        <div className="home-hero-content">
          <div style={{ maxWidth: 820 }}>
            <div className="home-hero-kicker">Portland Pride Weekend · July 16–19, 2026</div>

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
                <button className="btn-neon home-hero-button" style={{ borderColor: "#FF00CC", color: "#FF00CC" }}>
                  PRIDE WORK →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {tickerItems.length > 0 && (
          <section className="event-ticker-band" aria-label="Live event ticker">
            <Link href="/events" className="event-ticker-label">
              LIVE EVENTS
            </Link>
            <div className="event-ticker-window">
              <div className="event-ticker-track">
                {tickerItems.map((name, i) => (
                  <span className="event-ticker-item" key={`${name}-${i}`}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
        <div className="torn-divider" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
      </section>

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

      <section className="home-promo-stack">
        <div className="torn-divider full-bleed" />
        <article className="home-promo-panel home-gifting-panel">
          <div className="home-promo-inner">
            <div className="home-promo-copy">
              <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>GIFT WITH PRIDE</span>
              <h2 className="display">GIFTING</h2>
              <p className="home-promo-tag">Give gay gifts. Queer homes. Keep it moving.</p>
              <p>A Pride-season board for giving away what you do not need and asking for what you do.</p>
              <div className="gifting-actions">
                <Link href="/gifting"><button className="btn-neon"><Gift size={16} /> Post a Gift</button></Link>
                <Link href="/gifting"><button className="btn-neon cyan"><Search size={16} /> Post an In Search Of</button></Link>
              </div>
            </div>
          </div>
        </article>
        <div className="torn-divider full-bleed" />
        <article className="home-promo-panel home-gigs-panel">
          <div className="home-promo-inner">
            <div className="home-promo-copy">
              <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>PRIDE WORK</span>
              <h2 className="display">GIG BOARD</h2>
              <p className="home-promo-tag magenta">Paid, respected, valued.</p>
              <p>Post Pride work, find collaborators, and connect queer workers with queer gigs.</p>
              <div className="gifting-actions">
                <Link href="/pride-work"><button className="btn-neon"><Search size={16} /> Find Work</button></Link>
                <Link href="/pride-work"><button className="btn-neon cyan"><Gift size={16} /> Post a Gig</button></Link>
              </div>
            </div>
          </div>
        </article>
        <div className="torn-divider full-bleed" />
      </section>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
