import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";
import { Heart, Shield, Zap, Users, CheckCircle, ExternalLink, Calendar, MapPin } from "lucide-react";

const VENMO_URL = "https://venmo.com/tucker_pdmax";

const MISSION = [
  {
    icon: <Zap size={18} />,
    tone: "cyan",
    title: "Find events fast",
    text: "Everything happening Thu–Sun in one place. Map it, filter it, show up.",
  },
  {
    icon: <Users size={18} />,
    tone: "lime",
    title: "Support local spaces",
    text: "Bars, venues, orgs, and collectives — every listing drives foot traffic to the places that host us.",
  },
  {
    icon: <Heart size={18} />,
    tone: "magenta",
    title: "Connect people",
    text: "The gig board, submit form, and claimable events help people find each other — not extract data.",
  },
  {
    icon: <Shield size={18} />,
    tone: "orange",
    title: "Stay independent",
    text: "No VC money. No algorithmic feed. Local sponsor support is welcome; control of the guide is not for sale.",
  },
] as const;

const HOW_IT_WORKS = [
  [
    "Submit your event",
    "Create a free account, fill out the Promoters form, and it enters the review queue. Accounts keep listings accountable — no anonymous spam.",
  ],
  [
    "Admin review",
    "Events, claims, edits, and gig posts go through review before going live. No spam, no favoritism.",
  ],
  [
    "Claim a listing",
    "Some events are seeded and marked claimable. If you're the organizer, submit a claim and take ownership.",
  ],
] as const;

const VALUES = [
  "Free to browse. No paywalls, no junk ads, no selling user data.",
  "Open to sponsors from local businesses that align with this guide and the community it serves.",
  "Submitting an event or posting a gig requires a free account — so spam stays out and listings stay accountable.",
  "No personal data sold or shared. Ever.",
  "Pride is a protest. Sex-positive and nude events are listed here and tagged accurately — not judgmentally.",
  "Built and maintained by Tucker. Review tools and outside eyes help, but this is not a committee project.",
] as const;

const FAQ = [
  {
    q: "When is Portland Pride 2026?",
    a: "Portland Pride Weekend 2026 is July 16–19 (Thursday through Sunday). PDX Pride Guide lists festivals, parties, marches, and community events across the full weekend.",
  },
  {
    q: "Where do I find PDX Pride events?",
    a: "Use the Events page to browse every live listing on a map and board — filter by day (Thu–Sun), type, and neighborhood, or open any event for times, venue, and tickets.",
  },
  {
    q: "How is this different from other Pride apps?",
    a: "PDX Pride Guide is free, community-run, and built for Portland — no corporate feed, no pay-to-rank listings. Promoters submit or claim events; the community shows up.",
  },
  {
    q: "How do I list my event?",
    a: "Create an account and submit a new event or claim an existing listing from the Promoters page. Verified promoters can publish directly after review.",
  },
] as const;

export default function About() {
  usePageSeo(
    "About PDX Pride Guide — Portland Pride 2026",
    "Community-run Portland Pride 2026 event directory for PDX. Built by submissions and local support.",
  );

  return (
    <div className="zine-page about-page board-page">
      <PageHero
        flush
        flipLightLeaks
        kicker="About this guide"
        titleLine1="BUILT FOR"
        titleLine2="THE COMMUNITY"
        accent="lime"
        lede="A free, independently built event directory for Portland Pride Weekend 2026. Made by Tucker, shaped by submissions, and open to support from local businesses that fit the mission."
        bgImage="/motifs/hero-about.png"
        bgPosition="56% center"
        actions={
          <>
            <Link href="/events" className="btn-neon solid">Browse events</Link>
            <Link href="/submit" className="btn-neon cyan">Submit or claim</Link>
          </>
        }
      />

      <div className="about-quick-facts">
        <div className="about-quick-facts__inner">
          <span className="about-quick-fact"><Calendar size={14} /> July 16–19, 2026</span>
          <span className="about-quick-fact"><MapPin size={14} /> Portland, OR</span>
          <span className="about-quick-fact">Free to browse</span>
          <span className="about-quick-fact">Community-run</span>
        </div>
      </div>

      <ScrollReveal>
        <section className="about-mission board-how diag">
          <span className="board-sticker board-sticker--lime">Why this exists</span>
          <h2 className="display section-heading">THE MISSION</h2>
          <p className="board-copy">
            One place for Pride weekend — independent, accountable, and built to send people to real events in real venues.
          </p>
          <div className="about-mission-grid">
            {MISSION.map(item => (
              <article key={item.title} className={`about-mission-card about-mission-card--${item.tone}`}>
                <div className="about-mission-card__icon" aria-hidden="true">{item.icon}</div>
                <h3 className="display panel-heading">{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="about-footer-line">Free. Independent. Built for PDX.</div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <section id="how-it-works" className="about-how board-how board-how--inline diag">
          <span className="board-sticker board-sticker--cyan">How it works</span>
          <h2 className="display section-heading">FROM SUBMISSION TO LIVE</h2>
          <p className="board-copy">Every listing on the guide goes through the same review path — whether it's brand new or a claim on an existing event.</p>
          <div className="board-steps">
            {HOW_IT_WORKS.map(([title, text], i) => (
              <article className="board-step" key={title}>
                <span className="board-step__num" aria-hidden="true">{i + 1}</span>
                <h3 className="display panel-heading">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="about-footer-line">Account required · Admin review · No pay-to-rank</div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={140}>
        <section className="about-values zine-content">
          <span className="board-sticker board-sticker--magenta">Transparency</span>
          <h2 className="display section-heading">VALUES &amp; RULES</h2>
          <div className="about-values-panel">
            <div className="motif values-motif-badge" style={{ backgroundImage: 'url("/motifs/go-piss-girl.jpg")' }} aria-hidden="true" />
            <ul className="about-values-list">
              {VALUES.map(item => (
                <li key={item}>
                  <CheckCircle size={16} className="about-values-list__icon" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <section className="about-creator zine-content">
          <div className="about-creator-panel">
            <div className="about-creator-panel__overlay" aria-hidden="true" />
            <div className="about-creator-panel__content">
              <span className="board-sticker board-sticker--lime">About the creator</span>
              <h2 className="display section-heading">
                MADE BY <span className="about-creator-panel__accent">TUCKER MAX</span>
              </h2>
              <p className="board-copy about-creator-panel__copy">
                I'm Tucker Max, host and creator of <em>Yes Coach</em>. I built this guide because Portland deserves something that isn't controlled by a corporation, buried by algorithms, or shaped by whoever pays the most.
              </p>
              <p className="board-copy about-creator-panel__copy">
                Thank you to everyone who helped and donated when I fell on extremely hard times this year. Your support helped make a third year possible — and for the first time, a fully custom site built just for this community.
              </p>
              <p className="about-creator-panel__meta">Meta sucks. We deserve better. Free to use, independently run, built to last.</p>
              <a
                href="https://www.instagram.com/tucker_pdmax"
                target="_blank"
                rel="noopener noreferrer"
                className="about-creator-panel__link"
              >
                @tucker_pdmax on Instagram
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={260}>
        <section className="about-faq zine-content">
          <span className="board-sticker board-sticker--lime">FAQ</span>
          <h2 className="display section-heading">PORTLAND PRIDE 2026</h2>
          <div className="about-faq-list">
            {FAQ.map(item => (
              <details key={item.q} className="about-faq-item">
                <summary className="display panel-heading">{item.q}</summary>
                <p className="board-copy-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={320}>
        <section className="about-donate zine-content">
          <div className="zine-callout about-donate-callout">
            <Heart size={26} className="about-donate-callout__icon" aria-hidden="true" />
            <h2 className="display section-heading">KEEP THIS GUIDE ALIVE</h2>
            <p className="board-copy about-donate-callout__copy">
              Hosting, domain, and time add up. If the guide helped you find something good this weekend, buying me a coffee keeps it free for everyone.
            </p>
            <a
              href={VENMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-donate"
              className="btn-neon solid about-donate-callout__btn"
            >
              Buy me a coffee
              <ExternalLink size={15} />
            </a>
            <p className="about-donate-callout__note">@tucker_pdmax on Venmo</p>
            <p className="about-donate-callout__ps">P.S. Tucker is looking for work.</p>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}