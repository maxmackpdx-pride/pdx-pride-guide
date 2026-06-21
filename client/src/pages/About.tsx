import { Heart, Shield, Zap, Users, CheckCircle, ExternalLink } from "lucide-react";

const VENMO_URL = "https://venmo.com/tucker_pdmax";

export default function About() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Hero */}
      <div
        className="relative border-b-2 border-white/10 px-4 py-16 md:py-24 text-center overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        {/* Halftone BG decoration */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #CCFF00 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <span className="sticker mb-4 inline-block" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>
            About This Guide
          </span>
          <h1 className="display text-5xl md:text-7xl text-white mt-4 mb-6">
            BUILT FOR<br />
            <span style={{ color: "#CCFF00" }}>THE COMMUNITY.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            PDX Pride Guide is a free, community-powered event directory for Portland Pride Weekend 2026. 
            No ads, no corporate backing, no gatekeeping.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 md:px-8 space-y-16">

        {/* Mission */}
        <section>
          <h2 className="display text-4xl md:text-5xl text-white mb-8">
            THE <span style={{ color: "#FF00CC" }}>MISSION</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Zap size={20} />,
                color: "#CCFF00",
                title: "FIND EVENTS FAST",
                text: "Everything happening Thu–Sun in one place. Map it, filter it, show up.",
              },
              {
                icon: <Users size={20} />,
                color: "#00FFFF",
                title: "SUPPORT QUEER SPACES",
                text: "Bars, venues, orgs, and collectives — every listing drives foot traffic and awareness to queer-owned and queer-friendly spaces.",
              },
              {
                icon: <Heart size={20} />,
                color: "#FF00CC",
                title: "BUILD COMMUNITY",
                text: "The gig board, the submit form, the claimable events — all of it is designed to connect people, not extract data.",
              },
              {
                icon: <Shield size={20} />,
                color: "#FF6600",
                title: "STAY INDEPENDENT",
                text: "No VC money. No algorithms. Two-admin review on every listing. This site is a handshake, not a platform.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 border-2 border-white/10 transition-all hover:border-white/20"
                style={{ background: "#111" }}
              >
                <div className="flex items-center gap-3 mb-3" style={{ color: item.color }}>
                  {item.icon}
                  <span className="display text-sm" style={{ color: item.color }}>{item.title}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="display text-4xl md:text-5xl text-white mb-8">
            HOW IT <span style={{ color: "#00FFFF" }}>WORKS</span>
          </h2>
          <div className="space-y-0">
            {[
              {
                num: "01",
                color: "#CCFF00",
                title: "Events are submitted by the community",
                text: "Anyone can submit an event through the Submit page. Fill out the form and it enters the admin review queue.",
              },
              {
                num: "02",
                color: "#00FFFF",
                title: "Two admins must approve",
                text: "All submissions — events, claims, edits, and gig posts — require approval from two separate admins before going live. No single point of failure, no favoritism.",
              },
              {
                num: "03",
                color: "#FF00CC",
                title: "Claimable events can be owned",
                text: "Some events are seeded by admins and marked as claimable. If you're the organizer, submit a claim and take ownership of your listing.",
              },
              {
                num: "04",
                color: "#FF6600",
                title: "AI may help fill gaps — humans review it all",
                text: "Admins may use AI to help fill in missing event details from public sources. But AI-suggested content is always reviewed before it goes live. AI never invents ticket prices, age requirements, or private info.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="flex gap-6 py-6 border-t border-white/10"
              >
                <div className="display text-3xl flex-shrink-0 w-12" style={{ color: step.color }}>
                  {step.num}
                </div>
                <div>
                  <h3 className="display text-xl text-white mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transparency */}
        <section>
          <h2 className="display text-4xl md:text-5xl text-white mb-8">
            TRANSPARENCY <span style={{ color: "#8800FF" }}>&</span> VALUES
          </h2>
          <div
            className="p-6 md:p-8 border-2"
            style={{ background: "#111", borderColor: "#8800FF" }}
          >
            <ul className="space-y-4">
              {[
                "Free to list, free to use, free forever.",
                "No user accounts required to browse or submit.",
                "No personal data sold or shared with third parties.",
                "All event data is publicly visible — nothing behind a paywall.",
                "Admins are community members, not staff of any organization.",
                "This site is queer-owned and community-maintained.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#8800FF" }} />
                  <span className="text-white/70 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Donate */}
        <section>
          <div
            className="border-2 p-8 md:p-10 text-center relative overflow-hidden"
            style={{ background: "#0a0a0a", borderColor: "#CCFF00" }}
          >
            {/* Corner decoration */}
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-20"
              style={{
                background: "linear-gradient(135deg, #CCFF00 0%, transparent 70%)",
              }}
            />
            <Heart size={28} className="mx-auto mb-4" style={{ color: "#FF00CC" }} />
            <h2 className="display text-4xl md:text-5xl text-white mb-4">
              KEEP THIS GUIDE <span style={{ color: "#CCFF00" }}>ALIVE</span>
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Running this site costs real money — hosting, domain, time. 
              If you found it useful, a small donation keeps it free for everyone.
            </p>
            <a
              href={VENMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-donate"
              className="display text-xl px-8 py-4 inline-flex items-center gap-3 border-2 transition-all hover:opacity-90"
              style={{
                background: "#CCFF00",
                borderColor: "#CCFF00",
                color: "#000",
              }}
            >
              DONATE VIA VENMO
              <ExternalLink size={16} />
            </a>
            <p className="text-white/30 text-xs mt-4">@tucker_pdmax on Venmo</p>
          </div>
        </section>

        {/* Portland Pride info */}
        {/* Tucker Credit */}
        <section>
          <div style={{ border: "2px solid #1a1a1a", padding: "32px 36px", background: "#050505", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: -10, right: -10, fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "6rem", color: "rgba(204,255,0,0.025)", userSelect: "none", pointerEvents: "none",
            }}>YES COACH</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem", letterSpacing: "0.14em", color: "#CCFF00", marginBottom: 12 }}>ABOUT THE CREATOR</div>
              <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: 16, lineHeight: 1.1 }}>
                MADE BY <span style={{ color: "#CCFF00" }}>TUCKER CASEY</span>
              </h2>
              <p style={{ color: "#777", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 560, marginBottom: 16 }}>
                Tucker Casey is the host and creator of <em>Yes Coach</em>. He built this guide alone — no team, no budget, no sponsors — because he thinks Portland's queer community deserves something that isn't run by a corporation or driven by ad revenue.
              </p>
              <p style={{ color: "#555", fontSize: "0.88rem", lineHeight: 1.7, maxWidth: 560, marginBottom: 20 }}>
                Meta sucks. We deserve better. This guide is free, community-moderated, and not going anywhere.
              </p>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#444", letterSpacing: "0.08em" }}>
                NO SPONSORS · NO CORPORATE BACKING · BUILT WITH LOVE FOR PDX
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <h2 className="display text-4xl md:text-5xl text-white mb-8">
            PORTLAND PRIDE <span style={{ color: "#FF6600" }}>2026</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { day: "THU", date: "JULY 16", color: "#00FFFF" },
              { day: "FRI", date: "JULY 17", color: "#FF00CC" },
              { day: "SAT", date: "JULY 18", color: "#FF6600" },
              { day: "SUN", date: "JULY 19", color: "#FF2400" },
            ].map(({ day, date, color }) => (
              <div
                key={day}
                className="p-4 border-2 text-center"
                style={{ background: "#111", borderColor: color }}
              >
                <div className="display text-3xl mb-1" style={{ color }}>{day}</div>
                <div className="display text-lg text-white/60">{date}</div>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-sm mt-4">
            Portland, Oregon · Tom McCall Waterfront Park and surrounding venues · Free to attend
          </p>
        </section>

      </div>
    </div>
  );
}
