import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "@/components/EventModal";
import { MapView } from "./Events";
const skylineImg = "/pdx-skyline-neon.jpg";

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

  return (
    <div className="zine-page home-page" style={{ background: "#000", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="zine-hero home-hero" style={{ position: "relative", overflow: "hidden", minHeight: 720, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${skylineImg})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          backgroundRepeat: "no-repeat", opacity: 0.9,
        }} />
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
              Find events. Support queer spaces. Build community.
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
          onToggleExpand={() => setMapExpanded(p => !p)}
          onSelect={setSelectedEvent}
          variant="home"
        />
      </section>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
