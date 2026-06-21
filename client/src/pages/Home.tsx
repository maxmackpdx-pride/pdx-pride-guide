import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import skylineImg from "@assets/pdx-skyline-neon.png";
import communityStampImg from "@assets/community-first-stamp.png";

const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#FF6600",
  SUN: "#FF2400",
};
const DAY_LABELS: Record<string, string> = {
  THU: "THU · JUL 17",
  FRI: "FRI · JUL 18",
  SAT: "SAT · JUL 19",
  SUN: "SUN · JUL 20",
};

export default function Home() {
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });

  const byDay = ["THU", "FRI", "SAT", "SUN"].map(day => ({
    day,
    count: events.filter((e: any) => e.dayOfWeek === day).length,
    sample: events.filter((e: any) => e.dayOfWeek === day).slice(0, 2),
  }));

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 520, display: "flex", alignItems: "center" }}>
        {/* Portland neon skyline backdrop */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${skylineImg})`,
          backgroundSize: "cover", backgroundPosition: "center 60%",
          backgroundRepeat: "no-repeat",
          opacity: 0.35,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)",
        }} />
        {/* Halftone dot texture overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, #CCFF00 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }} />
        {/* Atmospheric background text — low opacity, NOT the focus */}
        <div style={{
          position: "absolute", right: "-2%", top: "50%", transform: "translateY(-50%)",
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(5rem, 14vw, 11rem)",
          color: "rgba(204,255,0,0.04)", letterSpacing: "-0.02em", lineHeight: 0.9,
          userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          LOVE<br />LOUDER
        </div>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            {/* Badge */}
            <div style={{
              display: "inline-block", fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#000", background: "var(--neon-yellow)", padding: "5px 12px",
              marginBottom: 24, boxShadow: "3px 3px 0 rgba(204,255,0,0.3)",
            }}>
              Portland Pride Weekend · July 17–20, 2026
            </div>
            <h1 className="display" style={{
              fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 0.92, marginBottom: 24,
              textShadow: "0 0 40px rgba(204,255,0,0.15)",
            }}>
              PORTLAND<br />
              <span style={{ color: "var(--neon-yellow)" }}>PRIDE</span><br />
              GUIDE
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.6, marginBottom: 36, maxWidth: 480 }}>
              Find events. Support queer spaces. Build community.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/events">
                <button className="btn-neon solid" style={{ fontSize: "0.9rem", padding: "12px 28px" }}>
                  View All Events →
                </button>
              </Link>
              <Link href="/submit">
                <button className="btn-neon" style={{ fontSize: "0.9rem", padding: "12px 28px" }}>
                  Submit an Event
                </button>
              </Link>
              <Link href="/submit">
                <button className="btn-neon" style={{ fontSize: "0.9rem", padding: "12px 28px", borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)" }}>
                  Claim an Event
                </button>
              </Link>
            </div>
          </div>
        </div>
        {/* Bottom torn-paper divider */}
        <div className="torn-divider" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ── PRIDE WEEKEND DAYS ────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <h2 className="display" style={{ fontSize: "1.8rem" }}>THIS WEEKEND</h2>
          <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          <Link href="/events">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "#555", letterSpacing: "0.06em", cursor: "pointer" }}>VIEW ALL →</span>
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
          {byDay.map(({ day, count, sample }) => (
            <Link key={day} href={`/events?day=${day}`} style={{ textDecoration: "none" }}>
              <div style={{
                border: `2px solid ${DAY_COLORS[day]}22`,
                borderTop: `3px solid ${DAY_COLORS[day]}`,
                background: "#080808", padding: "20px 18px",
                cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = "#080808")}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.1rem", color: DAY_COLORS[day], letterSpacing: "0.06em", marginBottom: 6 }}>
                  {DAY_LABELS[day]}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 900, color: "#fff", marginBottom: 12 }}>
                  {count} <span style={{ fontSize: "0.9rem", color: "#555" }}>events</span>
                </div>
                {sample.map((ev: any) => (
                  <div key={ev.id} style={{ fontSize: "0.75rem", color: "#666", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    · {ev.title}
                  </div>
                ))}
                <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: "0.72rem", color: DAY_COLORS[day], letterSpacing: "0.08em" }}>
                  VIEW DAY →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TUCKER CREDIT — COMMUNITY FIRST ──────────────────────── */}
      <section style={{ borderTop: "1px solid #111", borderBottom: "1px solid #111", background: "#050505" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{
            border: "2px solid #1a1a1a", padding: "36px 40px",
            position: "relative", overflow: "hidden",
          }}>
            {/* Background accent */}
            <div style={{
              position: "absolute", top: -20, right: -10,
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "7rem",
              color: "rgba(204,255,0,0.03)", letterSpacing: "-0.02em", userSelect: "none",
              pointerEvents: "none",
            }}>COMMUNITY<br />FIRST</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* COMMUNITY FIRST stamp */}
              <img
                src={communityStampImg}
                alt="Community First"
                style={{
                  width: 100, height: 100, objectFit: "contain",
                  marginBottom: 20, transform: "rotate(-4deg)",
                  transformOrigin: "left center", display: "block",
                  filter: "drop-shadow(0 0 12px rgba(204,255,0,0.4))",
                }}
              />
              <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", marginBottom: 16, lineHeight: 1.1 }}>
                MADE BY ONE PERSON.<br />
                <span style={{ color: "var(--neon-yellow)" }}>NO SPONSORS. NO CORPORATE BACKING.</span>
              </h2>
              <p style={{ color: "#777", fontSize: "1rem", lineHeight: 1.7, maxWidth: 600, marginBottom: 24 }}>
                This guide was built by Tucker — alone — because Portland's queer community deserves something we actually own. Not a Meta product. Not a sponsored listing. Not a corporate rainbow campaign that disappears after June.
              </p>
              <p style={{ color: "#555", fontSize: "0.88rem", lineHeight: 1.7, maxWidth: 600, marginBottom: 28 }}>
                Meta sucks. We deserve better. This is free, community-moderated, and built to stay that way.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "#444", letterSpacing: "0.06em" }}>
                  COMMUNITY POWERED · QUEER OWNED · TWO-ADMIN APPROVED · FREE FOREVER
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROMOTERS CTA ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {/* Left: Submit */}
          <div style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "32px 28px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "var(--neon-cyan)", letterSpacing: "0.12em", marginBottom: 12 }}>PROMOTERS & ORGANIZERS</div>
            <h3 className="display" style={{ fontSize: "1.6rem", marginBottom: 12 }}>SUBMIT AN EVENT</h3>
            <p style={{ color: "#666", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 24 }}>
              Add your event to the guide. Reviewed by two admins before going live. Free forever.
            </p>
            <Link href="/submit">
              <button className="btn-neon" style={{ borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)" }}>
                Submit Now →
              </button>
            </Link>
          </div>
          {/* Right: Claim */}
          <div style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "32px 28px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "var(--neon-magenta)", letterSpacing: "0.12em", marginBottom: 12 }}>YOUR EVENT IS LISTED?</div>
            <h3 className="display" style={{ fontSize: "1.6rem", marginBottom: 12 }}>CLAIM IT</h3>
            <p style={{ color: "#666", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 24 }}>
              See your event listed but you didn't add it? Claim ownership, then keep it updated.
            </p>
            <Link href="/submit">
              <button className="btn-neon" style={{ borderColor: "var(--neon-magenta)", color: "var(--neon-magenta)" }}>
                Claim an Event →
              </button>
            </Link>
          </div>
        </div>
        {/* Two-admin badge */}
        <div style={{ marginTop: 16, padding: "12px 20px", background: "#050505", border: "1px solid #111", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, background: "var(--neon-yellow)", borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", color: "#555", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
            ALL SUBMISSIONS REQUIRE TWO-ADMIN APPROVAL BEFORE GOING LIVE. NO EXCEPTIONS.
          </span>
        </div>
      </section>

      {/* ── PRIDE WORK CALLOUT ────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #111", background: "#050505" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px", display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "var(--neon-orange)", letterSpacing: "0.12em", marginBottom: 12 }}>PRIDE WORK BOARD</div>
            <h2 className="display" style={{ fontSize: "2rem", marginBottom: 12 }}>
              PAID. RESPECTED.<br />
              <span style={{ color: "var(--neon-orange)" }}>VALUED.</span>
            </h2>
            <p style={{ color: "#666", fontSize: "0.88rem", lineHeight: 1.6 }}>
              DJs, photographers, bartenders, security, performers — find gigs or post them. Community-run. Two-admin approved.
            </p>
          </div>
          <div>
            <Link href="/pride-work">
              <button className="btn-neon" style={{ borderColor: "var(--neon-orange)", color: "var(--neon-orange)", fontSize: "0.9rem", padding: "12px 28px" }}>
                View the Gig Board →
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
