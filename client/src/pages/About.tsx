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
        <div className="motif motif-keep about-motif-keep" aria-hidden="true" />
        <div className="motif motif-protest about-motif-protest" aria-hidden="true" />
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
                text: "Create a free account, fill out the Submit form, and it enters the review queue. Account required to keep listings accountable — no anonymous spam.",
              },
              {
                num: "02",
                color: "#00FFFF",
                title: "Admins review every submission",
                text: "All submissions — events, claims, edits, and gig posts — go through admin review before going live. No spam, no favoritism.",
              },
              {
                num: "03",
                color: "#FF00CC",
                title: "Claimable events can be owned",
                text: "Some events are seeded by admins and marked as claimable. If you're the organizer, submit a claim and take ownership of your listing.",
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
            className="p-6 md:p-8 border-2 relative overflow-hidden"
            style={{ background: "#111", borderColor: "#8800FF" }}
          >
            <div className="motif motif-go-piss values-motif-badge" aria-hidden="true" />
            <ul className="space-y-4">
              {[
                "Free to browse, free forever. No paywalls, no ads.",
                "Submitting an event or posting a gig requires a free account — so I can keep out spam and keep listings accountable.",
                "No personal data sold or shared. Ever.",
                "Pride is a protest. Our bodies have always been political. Sex-positive and nude events are listed here — because they belong in our community and always have. I only tag them accurately, not judgmentally.",
                "Admins are community members — right now that's just me, Tucker. Two-admin approval means nothing goes live on my say alone.",
                "This site was built by one person. It's queer-owned because I own it.",
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
          <div style={{
            position: "relative", overflow: "hidden",
            backgroundImage: "url('/tucker-yes-coach.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            border: "2px solid #1a1a1a",
            minHeight: 340,
          }}>
            {/* Dark overlay — heavier on left so text is readable */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(100deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.35) 100%)",
              zIndex: 1,
            }} />
            {/* Content */}
            <div style={{ position: "relative", zIndex: 2, padding: "40px 40px 36px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem", letterSpacing: "0.14em", color: "#CCFF00", marginBottom: 12 }}>ABOUT THE CREATOR</div>
              <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", marginBottom: 16, lineHeight: 1.05, textShadow: "0 2px 12px #000" }}>
                MADE BY <span style={{ color: "#CCFF00" }}>TUCKER MAX</span>
              </h2>
              <p style={{ color: "#ccc", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 480, marginBottom: 14, textShadow: "0 1px 6px #000" }}>
                I'm Tucker Max, host and creator of <em>Yes Coach</em>. I built this guide myself, because I believe Portland's queer community deserves something that isn't controlled by a corporation, buried by algorithms, or driven by ad revenue.
              </p>
              <p style={{ color: "#ccc", fontSize: "0.92rem", lineHeight: 1.7, maxWidth: 480, marginBottom: 14, textShadow: "0 1px 6px #000" }}>
                I also want to say thank you to everyone who helped and donated when I fell on extremely hard times this year. I'm still working through it, but your support helped make sure I could do this for the third year in a row. And for the first time ever, I was able to build a completely customized website made just for us.
              </p>
              <p style={{ color: "#aaa", fontSize: "0.88rem", lineHeight: 1.7, maxWidth: 480, marginBottom: 24, textShadow: "0 1px 6px #000" }}>
                Meta sucks. We deserve better. This guide is free, community-moderated, and built to last.
              </p>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#CCFF00", letterSpacing: "0.1em", opacity: 0.7 }}>
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
