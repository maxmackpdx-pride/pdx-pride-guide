import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import skylineImg from "@assets/pdx-skyline-neon.png";

// Countdown to July 17, 2026 (Portland Pride Weekend starts)
function useCountdown() {
  const target = new Date("2026-07-17T00:00:00-07:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

export default function Home() {
  const countdown = useCountdown();
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });
  const eventNames = events.map(event => event.title).filter(Boolean);
  const tickerItems = eventNames.length ? [...eventNames, ...eventNames] : [];

  return (
    <div className="zine-page home-page" style={{ background: "#000", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="zine-hero" style={{ position: "relative", overflow: "hidden", minHeight: 520, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${skylineImg})`,
          backgroundSize: "cover", backgroundPosition: "center 60%",
          backgroundRepeat: "no-repeat", opacity: 0.82,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
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

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", zIndex: 1 }}>
          <div style={{ maxWidth: 700 }}>
            <div className="paste-label" style={{
              display: "inline-block", fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#000", background: "#CCFF00", padding: "5px 12px", marginBottom: 24,
            }}>Portland Pride Weekend · July 17–20, 2026</div>

            <h1 className="display" style={{
              fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 0.92, marginBottom: 20,
              textShadow: "0 0 60px rgba(204,255,0,0.25), 0 0 120px rgba(204,255,0,0.1)",
            }}>
              PORTLAND<br />
              <span style={{ color: "#CCFF00" }}>PRIDE</span><br />
              GUIDE
            </h1>

            <p style={{ fontSize: "1rem", color: "#ccc", lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>
              Find events. Support queer spaces. Build community.
            </p>

            {/* Countdown */}
            {countdown && (
              <div style={{ display: "flex", gap: 16, marginBottom: 32, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "2.8rem", color: "#CCFF00", lineHeight: 1 }}>
                    {countdown.days}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "#999", letterSpacing: "0.12em", marginTop: 2 }}>DAYS</div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "2rem", color: "#888" }}>:</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "2.8rem", color: "#CCFF00", lineHeight: 1 }}>
                    {String(countdown.hours).padStart(2, "0")}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "#999", letterSpacing: "0.12em", marginTop: 2 }}>HRS</div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.65rem", color: "#aaa", letterSpacing: "0.1em", marginLeft: 4 }}>
                  UNTIL PRIDE<br />WEEKEND
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/events">
                <button className="btn-neon" style={{ fontSize: "0.85rem", padding: "10px 24px" }}>
                  VIEW ALL EVENTS →
                </button>
              </Link>
              <Link href="/pride-work">
                <button className="btn-neon" style={{ fontSize: "0.85rem", padding: "10px 24px", borderColor: "#FF6600", color: "#FF6600" }}>
                  PRIDE WORK →
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="torn-divider" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ── LIVE EVENT TICKER ───────────────────────────────────── */}
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

      {/* ── QUIET FOOTER LINK ────────────────────────────────────── */}
      <section style={{ background: "#000", borderTop: "1px solid #111" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", textAlign: "center" }}>
          <Link href="/submit" style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "#777", letterSpacing: "0.08em", textDecoration: "none" }}>
            PROMOTER OR ORGANIZER? SUBMIT OR CLAIM AN EVENT →
          </Link>
        </div>
      </section>

    </div>
  );
}
