import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";
import { Heart, Shield, Zap, Users, CheckCircle, ExternalLink, Calendar, MapPin } from "lucide-react";

const VENMO_URL = "https://venmo.com/tucker_pdmax";

const MISSION = [
  {
    icon: <Zap size={18} />,
    tone: "cyan",
    title: "Find events fast",
    text: "Monday through Sunday, all of it, in one place. Map it. Filter it. Put on pants. Go.",
  },
  {
    icon: <Users size={18} />,
    tone: "lime",
    title: "Support local spaces",
    text: "Bars, venues, orgs, collectives. Every listing here sends actual bodies through actual doors, which is how these places stay open.",
  },
  {
    icon: <Heart size={18} />,
    tone: "magenta",
    title: "Connect people",
    text: "The gig board, the submit form, the claimable events. Built so people can find each other, not so we can find out about you.",
  },
  {
    icon: <Shield size={18} />,
    tone: "orange",
    title: "Stay independent",
    text: "No investors. No feed deciding what you see. Sponsors are welcome to help. Nobody gets to steer.",
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
  "Free to browse. No paywall, no popup begging for your email, no selling anybody out.",
  "Local businesses can sponsor if they actually belong here. That's the whole bar.",
  "Want to post an event or a gig? Make a free account. It's how spam stays out and names stay attached.",
  "Your data is not for sale. Not now, not later, not for a nice offer.",
  "Pride is a protest. Sex-positive and nude events get listed and tagged honestly, no side-eye.",
  "One person builds this and keeps it running. Good people help. It's still not a committee.",
] as const;

const FAQ = [
  {
    q: "When is Portland Pride 2026?",
    a: "July 13 through 19, Monday to Sunday. Festivals, parties, marches, and the quiet stuff too. All seven days are in here.",
  },
  {
    q: "Where do I find PDX Pride events?",
    a: "The Events page. Every live listing on a map and a board. Filter by day, by type, by neighborhood, then open anything for times, venue, and tickets.",
  },
  {
    q: "How is this different from other Pride apps?",
    a: "It's free, it's run by a person, and it's built for this city. No corporate feed. No paying to rank higher. Promoters post their events and the community shows up.",
  },
  {
    q: "How do I list my event?",
    a: "Make an account, then submit a new event or claim one that's already listed. Head to the Promoters page. Once you're verified, you skip the line.",
  },
] as const;

export default function About() {
  usePageSeo(
    "About PDX Pride Guide — Portland Pride 2026",
    "Every Portland Pride 2026 event in one place. Find the party, back the queer spaces that host it, and stick around after July 19.",
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
        lede="A free Pride week directory, built by one guy in Portland, filled in by everybody else. Local businesses can pitch in. Nobody can buy the top spot."
        bgImage="/motifs/hero-about.png"
        bgPosition="56% center"
        actions={
          <>
            <Link href="/events"><Button as="span" variant="solid">Browse events</Button></Link>
            <Link href="/submit"><Button as="span" accent="cyan">Submit or claim</Button></Link>
          </>
        }
      />

      <div className="about-quick-facts">
        <div className="about-quick-facts__inner">
          <span className="about-quick-fact"><Calendar size={14} /> July 13–19, 2026</span>
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
            One place for the whole week. Nobody's algorithm, nobody's ad budget. Just real events in real rooms with real people in them.
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
                Hi. I'm Tucker Max. I host and run Yes Coach, and a pile of other nights around town, and I also built this entire website myself, from the first line of code to the thing you're reading right now. Portland deserved a guide that isn't owned by a corporation, buried by an algorithm, or sorted by whoever wrote the biggest check. So I made one.
              </p>
              <p className="board-copy about-creator-panel__copy">
                This year got rough. A lot of you helped, donated, and checked in on me, and that's the only reason year three exists. It's also why the site is finally custom-built instead of duct-taped together.
              </p>
              <p className="about-creator-panel__meta">Meta sucks. We deserve better. Free to use, independently run, built to last.</p>
              <p className="board-copy about-creator-panel__copy">
                And yes, I'm still looking for work. If you know somebody, you know where to find me.
              </p>
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
              Servers cost money. Domains cost money. Time costs the most. If this thing pointed you toward one good night, throw a coffee at it and it stays free for the next person.
            </p>
            <Button
              as="a"
              href={VENMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-donate"
              variant="solid"
              className="about-donate-callout__btn"
              trailingIcon={<ExternalLink size={15} />}
            >
              Buy me a coffee
            </Button>
            <p className="about-donate-callout__note">@tucker_pdmax on Venmo</p>
            <p className="about-donate-callout__ps">P.S. Tucker is looking for work.</p>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}