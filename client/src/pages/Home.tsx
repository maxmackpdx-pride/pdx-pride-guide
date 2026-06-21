import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import skylineImg from "@assets/pdx-skyline-neon.png";
import communityStampImg from "@assets/community-first-stamp.png";
import { getGoogleCalLink, downloadICS } from "@/utils/calendarLinks";

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

function CalButtons({ event }: { event: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={{
        fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.65rem",
        letterSpacing: "0.08em", textTransform: "uppercase",
        background: "none", border: "1px solid #333", color: "#666",
        padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap",
      }}>+ ADD TO CAL</button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "#111", border: "1px solid #333",
          minWidth: 160,
        }} onMouseLeave={() => setOpen(false)}>
          <a href={getGoogleCalLink(event)} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "10px 14px", color: "#fff", textDecoration: "none", fontSize: "0.78rem", fontFamily: "var(--font-display)", borderBottom: "1px solid #222" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >Google Calendar</a>
          <button onClick={() => { downloadICS(event); setOpen(false); }}
            style={{ display: "block", width: "100%", padding: "10px 14px", color: "#fff", background: "none", border: "none", fontSize: "0.78rem", fontFamily: "var(--font-display)", textAlign: "left", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >Apple Calendar (.ics)</button>
        </div>
      )}
    </div>
  );
}

function EventCard({ ev }: { ev: any }) {
  const color = DAY_COLORS[ev.dayOfWeek] || "#CCFF00";
  const types: string[] = (() => { try { return JSON.parse(ev.eventTypes); } catch { return []; } })();
  const time = ev.dateStart ? new Date(ev.dateStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const dateLabel = DAY_LABELS[ev.dayOfWeek] || ev.dayOfWeek;
  return (
    <div style={{
      background: "#080808", border: "1px solid #1a1a1a",
      borderTop: `3px solid ${color}`,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Day + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.68rem", letterSpacing: "0.1em", color, padding: "2px 8px", border: `1px solid ${color}33` }}>
          {dateLabel}
        </span>
        {time && <span style={{ fontSize: "0.72rem", color: "#555" }}>{time}</span>}
        {ev.ageRequirement !== "ALL_AGES" && (
          <span style={{ fontSize: "0.65rem", color: "#666", fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
            {ev.ageRequirement === "21_PLUS" ? "21+" : "18+"}
          </span>
        )}
        {ev.admission === "FREE" && (
          <span style={{ fontSize: "0.65rem", color: "#CCFF00", fontFamily: "var(--font-display)", letterSpacing: "0.08em", border: "1px solid #CCFF0066", padding: "1px 6px" }}>FREE</span>
        )}
      </div>

      {/* Title */}
      <div className="display" style={{ fontSize: "1rem", color: "#fff", lineHeight: 1.1 }}>{ev.title}</div>

      {/* Venue */}
      <div style={{ fontSize: "0.78rem", color: "#555" }}>{ev.venueName}{ev.address ? ` · ${ev.address}` : ""}</div>

      {/* Tags */}
      {types.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {types.slice(0, 3).map((t: string) => (
            <span key={t} style={{ fontSize: "0.6rem", fontFamily: "var(--font-display)", letterSpacing: "0.08em", color: "#444", border: "1px solid #222", padding: "2px 6px" }}>{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
        {ev.ticketUrl && (
          <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: color, color: "#000", border: "none",
            padding: "5px 12px", textDecoration: "none", display: "inline-block",
          }}>TICKETS →</a>
        )}
        <CalButtons event={ev} />
      </div>
    </div>
  );
}

export default function Home() {
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });

  const { data: gigs = [] } = useQuery<any[]>({
    queryKey: ["/api/gigs"],
    queryFn: () => fetch("/api/gigs").then(r => r.json()),
  });

  const filteredEvents = activeDay ? events.filter((e: any) => e.dayOfWeek === activeDay) : events;
  const days = ["THU", "FRI", "SAT", "SUN"];

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 480, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${skylineImg})`,
          backgroundSize: "cover", backgroundPosition: "center 60%",
          backgroundRepeat: "no-repeat", opacity: 0.55,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)",
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
            <div style={{
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
            <p style={{ fontSize: "1rem", color: "#888", lineHeight: 1.6, marginBottom: 32, maxWidth: 480 }}>
              Find events. Support queer spaces. Build community.
            </p>

            {/* Day pill filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
              <button onClick={() => setActiveDay(null)} style={{
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.72rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: !activeDay ? "#fff" : "transparent",
                color: !activeDay ? "#000" : "#555",
                border: `1px solid ${!activeDay ? "#fff" : "#333"}`,
                padding: "6px 14px", cursor: "pointer",
              }}>ALL</button>
              {days.map(d => (
                <button key={d} onClick={() => setActiveDay(activeDay === d ? null : d)} style={{
                  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.72rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: activeDay === d ? DAY_COLORS[d] : "transparent",
                  color: activeDay === d ? "#000" : DAY_COLORS[d],
                  border: `1px solid ${DAY_COLORS[d]}`,
                  padding: "6px 14px", cursor: "pointer",
                }}>{DAY_LABELS[d]}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/submit">
                <button className="btn-neon" style={{ fontSize: "0.85rem", padding: "10px 24px" }}>
                  Submit an Event
                </button>
              </Link>
              <Link href="/pride-work">
                <button className="btn-neon" style={{ fontSize: "0.85rem", padding: "10px 24px", borderColor: "#FF6600", color: "#FF6600" }}>
                  Gig Board →
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="torn-divider" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ── NEON DIVIDER ─────────────────────────────────────────── */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #00FFFF, #FF00CC, #FF6600, #FF2400)", boxShadow: "0 0 12px rgba(255,0,204,0.4)" }} />

      {/* ── ALL EVENTS ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <h2 className="display" style={{ fontSize: "1.8rem" }}>
            {activeDay ? `${DAY_LABELS[activeDay]} EVENTS` : "ALL EVENTS"}
          </h2>
          <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#444", letterSpacing: "0.06em" }}>
            {filteredEvents.length} EVENT{filteredEvents.length !== 1 ? "S" : ""}
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div style={{ color: "#444", padding: "40px 0", textAlign: "center" }}>No events for this day yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
            {filteredEvents.map((ev: any) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/events">
            <button className="btn-neon" style={{ fontSize: "0.85rem", padding: "10px 28px" }}>
              Full Events Page + Map →
            </button>
          </Link>
        </div>
      </section>

      {/* ── NEON DIVIDER ─────────────────────────────────────────── */}
      <div style={{ height: 2, background: "linear-gradient(90deg, #FF6600, #CCFF00, #00FFFF)", boxShadow: "0 0 8px rgba(204,255,0,0.3)" }} />

      {/* ── PRIDE WORK / GIG BOARD PREVIEW ──────────────────────────
      <section style={{ background: "#030303", borderTop: "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <h2 className="display" style={{ fontSize: "1.8rem", color: "#FF6600" }}>PRIDE WORK</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
            <Link href="/pride-work">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#FF6600", letterSpacing: "0.06em", cursor: "pointer" }}>VIEW ALL →</span>
            </Link>
          </div>

          <p style={{ color: "#555", fontSize: "0.88rem", marginBottom: 24, maxWidth: 560 }}>
            DJs, photographers, bartenders, performers — find gigs or post that you're available. Community-run. Two-admin approved.
          </p>

          {gigs.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2, marginBottom: 24 }}>
              {gigs.slice(0, 3).map((g: any) => (
                <div key={g.id} style={{ background: "#080808", border: "1px solid #1a1a1a", borderTop: "3px solid #FF6600", padding: "16px 18px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", color: "#FF6600", letterSpacing: "0.1em", marginBottom: 6 }}>
                    {g.postType === "LOOKING_FOR_WORK" ? "AVAILABLE FOR WORK" : "GIG POSTING"}
                    {g.gigDate && ` · ${g.gigDate}`}
                  </div>
                  <div className="display" style={{ fontSize: "0.95rem", color: "#fff", marginBottom: 6 }}>{g.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "#555", marginBottom: 8 }}>{g.name}{g.compensation ? ` · ${g.compensation}` : ""}</div>
                  <div style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.5 }}>{g.description.substring(0, 100)}{g.description.length > 100 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#333", fontSize: "0.88rem", marginBottom: 24 }}>No gigs posted yet — be the first.</div>
          )}

          <Link href="/pride-work">
            <button className="btn-neon" style={{ borderColor: "#FF6600", color: "#FF6600", fontSize: "0.85rem", padding: "10px 24px" }}>
              View Gig Board + Post a Gig →
            </button>
          </Link>
        </div>
      </section>

      {/* ── NEON DIVIDER ─────────────────────────────────────────── */}
      <div style={{ height: 2, background: "linear-gradient(90deg, #8800FF, #FF00CC, #00FFFF)", boxShadow: "0 0 8px rgba(136,0,255,0.3)" }} />

      {/* ── TUCKER CREDIT — COMMUNITY FIRST ──────────────────────── */}
      <section style={{ background: "#050505" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ border: "2px solid #1a1a1a", padding: "36px 40px", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: -20, right: -10,
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "7rem",
              color: "rgba(204,255,0,0.025)", letterSpacing: "-0.02em", userSelect: "none", pointerEvents: "none",
            }}>COMMUNITY<br />FIRST</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <img src={communityStampImg} alt="Community First" style={{
                width: 140, height: 140, objectFit: "contain",
                marginBottom: 20, transform: "rotate(-4deg)",
                transformOrigin: "left center", display: "block",
                filter: "drop-shadow(0 0 12px rgba(204,255,0,0.4))",
              }} />
              <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", marginBottom: 16, lineHeight: 1.1 }}>
                MADE BY ONE PERSON.<br />
                <span style={{ color: "#CCFF00" }}>NO SPONSORS. NO CORPORATE BACKING.</span>
              </h2>
              <p style={{ color: "#777", fontSize: "1rem", lineHeight: 1.7, maxWidth: 600, marginBottom: 16 }}>
                Built by Tucker Casey — host and creator of <em>Yes Coach</em> — alone, because Portland's queer community deserves something we actually own. Not a Meta product. Not a sponsored listing. Not a corporate rainbow campaign.
              </p>
              <p style={{ color: "#555", fontSize: "0.88rem", lineHeight: 1.7, maxWidth: 600, marginBottom: 28 }}>
                Meta sucks. We deserve better. This is free, community-moderated, and built to stay that way.
              </p>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "#333", letterSpacing: "0.06em" }}>
                COMMUNITY POWERED · QUEER OWNED · TWO-ADMIN APPROVED · FREE FOREVER
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBMIT QUIET LINK ─────────────────────────────────────── */}
      <section style={{ background: "#000", borderTop: "1px solid #111" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", textAlign: "center" }}>
          <Link href="/submit" style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "#444", letterSpacing: "0.08em", textDecoration: "none" }}>
            PROMOTER OR ORGANIZER? SUBMIT OR CLAIM AN EVENT →
          </Link>
        </div>
      </section>

    </div>
  );
}
