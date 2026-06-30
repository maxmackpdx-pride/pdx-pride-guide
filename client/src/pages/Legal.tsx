import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";
import { Shield, FileText, Lock, Users } from "lucide-react";

const SECTIONS = [
  {
    icon: <FileText size={18} />,
    tone: "cyan",
    title: "Terms of use",
    bullets: [
      "PDX Pride Guide is a free community directory for Portland Pride Weekend and related queer events.",
      "Listings are submitted by promoters and community members; accuracy is not guaranteed — verify details with official venues and organizers.",
      "Do not use this site to harass, spam, scrape personal data, or post misleading or harmful content.",
      "We may remove listings or accounts that violate community standards or applicable law.",
    ],
  },
  {
    icon: <Lock size={18} />,
    tone: "lime",
    title: "Privacy",
    bullets: [
      "We do not sell your personal data.",
      "Account info (email, username, profile fields) is used to run the site: submissions, messaging, RSVPs, and moderation.",
      "Messages and inbox threads are private between participants; hosts and admins only see what the product surfaces for support or review.",
      "Optional Google sign-in shares your verified email and basic profile with us for authentication only.",
      "Contact hello.tuckercasey@gmail.com for privacy questions or removal requests.",
    ],
  },
  {
    icon: <Users size={18} />,
    tone: "magenta",
    title: "Community guidelines",
    bullets: [
      "Be honest in event submissions and claims — only claim listings you represent.",
      "Sex-positive, leather, and adult-themed events are welcome when tagged accurately.",
      "Gifting and Spotted posts must follow posted community rules; no restricted items or harassment.",
      "Pride Werk gig posts should use real contact info and describe paid or volunteer work clearly.",
    ],
  },
  {
    icon: <Shield size={18} />,
    tone: "orange",
    title: "Disclaimer",
    bullets: [
      "PDX Pride Guide is independently run and is not affiliated with Pride Northwest unless a listing says otherwise.",
      "Event times, prices, and policies can change — always confirm with the organizer.",
      "This site is provided as-is without warranties; use at your own discretion.",
    ],
  },
] as const;

export default function Legal() {
  usePageSeo(
    "Legal — PDX Pride Guide",
    "Terms of use, privacy policy, and community guidelines for PDX Pride Guide.",
  );

  return (
    <div className="zine-page about-page board-page">
      <PageHero
        flush
        kicker="Legal"
        titleLine1="TERMS &"
        titleLine2="PRIVACY"
        accent="cyan"
        lede="How PDX Pride Guide works, what we collect, and how we expect the community to show up."
        bgImage="/motifs/hero-about.png"
        bgPosition="40% center"
        actions={
          <>
            <Link href="/about" className="btn-neon solid">About the guide</Link>
            <a href="mailto:hello.tuckercasey@gmail.com" className="btn-neon cyan">Contact</a>
          </>
        }
      />

      <ScrollReveal>
        <section className="about-mission board-how diag" style={{ paddingTop: 48 }}>
          <span className="board-sticker board-sticker--cyan">Last updated June 2026</span>
          <h2 className="display section-heading">LEGAL & COMMUNITY</h2>
          <p className="board-copy">
            Plain-language policies for a community-run Pride directory. Not legal advice — just how we operate.
          </p>
          <div className="about-mission-grid">
            {SECTIONS.map(section => (
              <article key={section.title} className={`about-mission-card about-mission-card--${section.tone}`}>
                <div className="about-mission-card__icon" aria-hidden="true">{section.icon}</div>
                <h3 className="display panel-heading">{section.title}</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-meta)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                  {section.bullets.map(item => (
                    <li key={item} style={{ marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="board-how" style={{ paddingBottom: 64 }}>
          <p className="board-copy" style={{ maxWidth: 640 }}>
            Questions about a listing, your account, or a report? Email{" "}
            <a href="mailto:hello.tuckercasey@gmail.com" style={{ color: "var(--neon-cyan)" }}>hello.tuckercasey@gmail.com</a>
            {" "}or use the feedback button in the site footer.
          </p>
        </section>
      </ScrollReveal>
    </div>
  );
}