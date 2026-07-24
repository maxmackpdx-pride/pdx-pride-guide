import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { EventListing } from "@shared/multiDayEvents";
import type { Event } from "@shared/schema";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import EventModal from "@/components/EventModal";
import ScrollReveal from "@/components/ScrollReveal";
import BoardStatsBar from "@/components/BoardStatsBar";
import { SupportPanel, AffiliatePartners, SponsorsPanel } from "@/components/support";
import InfrastructureGrid from "@/components/home/InfrastructureGrid";
import "./About.css";

const IG_URL = "https://www.instagram.com/tucker_pdmax";
const PROFILE_URL = "/u/tucker_pdmax";
const DIGGN_URL = "https://open.spotify.com/search/Digg%27n%20For%20Bones";

/** Match Yes Coach / Stank by title - never hardcode event ids (they differ local vs prod). */
function isYesCoachEvent(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes("yes coach") || /stank\W*yes\W*coach|yes\W*coach\W*stank/i.test(title);
}

const VALUES = [
  { title: "Free to browse.", text: "No paywall, no popup begging for your email." },
  { title: "Sponsors can buy in.", text: "Featured feed posts and ads are on the table, only for businesses that are part of this community or already show up for us." },
  { title: "Post with a free account.", text: "That is how spam stays out and names stay on." },
  { title: "Your data is not for sale.", text: "Not now, not later, not for a nice offer." },
  { title: "We moderate the clearly over the line stuff.", text: "The rest of the community runs free." },
  { title: "One person builds this.", text: "Good people help. It is still not a committee." },
] as const;

const FAQ = [
  {
    q: "Is this just for Pride Week?",
    a: "Not anymore. It started as the Pride Week guide and now runs all year - parties, drag, marches, community nights, and the quiet stuff too. Pride is every day here.",
  },
  {
    q: "Where do I find events?",
    a: "The Events page. Every live listing on a map and a board. Filter by day, type, or neighborhood, then open anything for times, venue, and tickets.",
  },
  {
    q: "How is this different from other event apps?",
    a: "It is free, run by a person, and built for this city. No corporate feed. No paying to rank higher. Promoters post their events and the community shows up.",
  },
  {
    q: "How do I list my event?",
    a: "Make an account, then submit a new event or claim one that is already listed. Head to Submit. Once you are a verified promoter, you skip the line.",
  },
  {
    q: "Can my business sponsor?",
    a: "If you are part of the community or already support what we are building, yes. Sponsors can buy featured posts in the feed and/or ads. Pitch via Contact or message Tucker.",
  },
] as const;

export default function About() {
  usePageSeo(
    "About Zaylist | Portland Pride 2026",
    "Built by one person in Portland. Free Pride week directory with zero interest in being a sanitized corporate pamphlet.",
  );

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const eventCount = events.length;
  const [contactModal, setContactModal] = useState<"message" | "sponsor" | "order" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const yesCoachEvent = useMemo(
    () => events.find(e => isYesCoachEvent(e.title)) ?? null,
    [events],
  );

  const openYesCoachCard = useCallback(async () => {
    if (yesCoachEvent) {
      setSelectedEvent(yesCoachEvent);
      return;
    }
    // Fallback: list may still be loading or title variant differs - fetch by search among all events
    try {
      const res = await apiRequest("GET", "/api/events");
      if (!res.ok) return;
      const list = (await res.json()) as EventListing[];
      const match = list.find(e => isYesCoachEvent(e.title));
      if (match) setSelectedEvent(match);
    } catch {
      // Stay on About if the event cannot be resolved
    }
  }, [yesCoachEvent]);

  const heroStats = useMemo(
    () => [
      { num: eventCount, label: "Events, and counting", color: "#ccff00" },
      { num: 7, label: "Days, one guide", color: "#19e3ff" },
      { num: 0, label: "To browse. Always. ($0)", color: "#ff1fa0" },
      { num: 1, label: "Guide - room for more", color: "#ffb020" },
    ],
    [eventCount],
  );

  return (
    <div className="about-v2 board-page--makeover">
      {/* Poster-wall hero (pride-posters-wall.jpg) - restored */}
      <section className="about-v2-hero" aria-label="About">
        <div className="about-v2-hero__scrim" aria-hidden="true" />
        <div className="about-v2-hero__inner">
          <div>
            <div className="about-v2-hero__kicker">
              <span className="about-v2-hero__dot" aria-hidden="true" />
              About · Portland nights · all year
            </div>
            <h1 className="about-v2-hero__h1">
              <span className="about-v2-hero__stat" data-testid="about-events-count">
                <CountUpValue
                  key={eventCount > 0 ? "events-ready" : "events-pending"}
                  value={eventCount}
                />{" "}
                events.
              </span>
              <span className="about-v2-hero__lede">
                And approximately zero interest in being a sanitized corporate Pride pamphlet.
              </span>
            </h1>
            <div className="about-v2-hero__actions">
              <Link href="/events">
                <Button as="span" variant="neon" accent="cyan" size="lg">
                  Browse the {eventCount || "list"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <BoardStatsBar stats={heroStats} variant="band" showLive={false} />

      {/* MANIFESTO */}
      <section className="about-v2-manifesto" aria-labelledby="about-manifesto-title">
        <ScrollReveal>
          <div className="about-v2__inner">
            <h2 id="about-manifesto-title" className="about-v2-manifesto__h2">
              What this <span className="about-v2-manifesto__h2-accent">actually is</span>
            </h2>
            <div className="about-v2-manifesto__copy">
              <p>
                Pride starts now, it ends never, and this thing is already loaded: parties,
                community events, weird little gems, places to eat, spots to shop, gigs,
                gifting, missed connections, and all the real homosexual infrastructure that
                keeps the scene alive.
              </p>
              <p>
                The family-friendly newspaper roundups are cute. The local moms&apos; Pride
                lists have their place. But this is for the people who want the whole city, not
                the sanitized version corporations can sell back to us.
              </p>
            </div>
            <div className="about-v2-manifesto__shout">
              <p>
                <span className="about-v2-manifesto__glitch">Fuck Meta.</span>
              </p>
              <p>
                Stop censoring our community.
                <br />
                Stop pretending our nights only matter once they&apos;ve been scrubbed clean.
              </p>
              <p>
                This app is really gay. This app really is{" "}
                <span className="about-v2-manifesto__glitch">ours.</span>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* MADE BY TUCKER */}
      <section className="about-v2-creator">
        <ScrollReveal delay={30}>
          <div className="about-v2__inner">
            <div className="about-v2__kicker about-v2__kicker--lime">Who&apos;s behind it</div>
            <h2 className="about-v2__title about-v2__title--xl">
              Made by <span className="hl">Tucker Max</span>
            </h2>

            <div className="about-v2-creator__grid">
              <div className="about-v2-creator__photo-col">
                <div className="about-v2-creator__photo">
                  <div className="about-v2-creator__photo-frame">
                    <img
                      src="/about/tucker-portrait.jpg"
                      alt="Tucker Max"
                      width={864}
                      height={1152}
                      decoding="async"
                    />
                  </div>
                  <span className="about-v2-creator__hire">Available for hire · full time</span>
                  <div className="about-v2-creator__stickers">
                    <Link href={PROFILE_URL} className="about-v2-creator__pg-sticker">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      Follow Me On Zaylist
                    </Link>
                    <a
                      href={IG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-v2-creator__ig-sticker"
                    >
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5.5" />
                        <circle cx="12" cy="12" r="4.2" />
                        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
                      </svg>
                      Follow @tucker_pdmax
                    </a>
                  </div>
                </div>
                <div className="about-v2-creator__credits">
                  Artist · Yes Coach · Brand promoter
                  <br />
                  Digg&apos;n For Bones · Former Oregon State Pet
                </div>
              </div>

              <div className="about-v2-creator__body">
                <p>
                  Hi, I&apos;m Tucker. I run Yes Coach, I host LockerRoom at The Eagle, I make disco balls shaped
                  like naked people tied in shibari, and I produced the Digg&apos;n For Bones podcast. A couple years
                  ago I was Oregon State Pet. Right now I&apos;m between full-time gigs. Unemployed, not idle,
                  pouring everything I have into this and the projects I care about. If you&apos;ve got a role
                  that deserves that kind of energy, I&apos;m available, and whoever brings me on gets all of it.
                </p>
                <p>
                  I&apos;ve watched so many of you grow, figure out what you like, discover what you don&apos;t,
                  and find your place. I&apos;ve loved every minute of it.
                </p>
                <blockquote className="about-v2-creator__pull">
                  <p>
                    This community keeps each other going: donating, checking in, keeping the scene alive.
                    You showed up for me, and I hope this is me doing something for you.
                  </p>
                </blockquote>
                <p>
                  I built this because I&apos;m done being tied down to their platforms. No engineering degree,
                  just one person with every tool I could get my hands on and a stupid number of hours. Built by a
                  slutty puppy with a cocky attitude, but run by heart and hopefully the community if it takes off.
                </p>
                <p>
                  I&apos;m tired of Meta deciding what our community gets to see. I&apos;m tired of the censorship,
                  the labels, and the way they&apos;ve gutted so many of us. So I made something better. Something
                  that works for us, with less bullshit for promoters and the people actually running the show.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* OPEN FOR BUSINESS + COLLABORATIVE PROJECTS */}
      <section className="about-v2-work">
        <ScrollReveal>
          <div className="about-v2__inner about-v2__inner--work">
            <div className="about-v2-work__card">
              <div className="about-v2-work__top">
                <span className="about-v2-work__badge">
                  <span className="dot" aria-hidden="true" />
                  Open for business
                </span>
                <span className="about-v2-work__loc">Portland, OR · Collabs welcome</span>
              </div>
              <h3 className="about-v2-work__headline">
                Open for{" "}
                <span className="about-v2-work__headline-cyan">business</span>
                {" "}and{" "}
                <span className="about-v2-work__headline-lime">collaborative projects.</span>
              </h3>
              <p className="about-v2-work__support">
                Looking for partners who want to build with the community: brand work, events, platforms,
                and joint projects that move real people. If you&apos;ve got a pitch or a half-formed idea,
                send it.
              </p>
              <div className="about-v2-work__chips" aria-label="Collaboration focus areas">
                <span className="about-v2-work__chip">Brand &amp; marketing</span>
                <span className="about-v2-work__chip">Events &amp; community</span>
                <span className="about-v2-work__chip">Collaborative projects</span>
              </div>
              <div className="about-v2-work__footer">
                <span className="about-v2-work__foot-note">
                  Business inquiries, collabs, and a good handshake on request.
                </span>
                <div className="about-v2-work__ctas">
                  <Link href="/resume" className="about-v2-work__cta-link">
                    <Button as="span" variant="solid" accent="cyan" size="md" arrow className="about-v2-work__btn">
                      View resume
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="neon"
                    accent="cyan"
                    size="md"
                    className="about-v2-work__btn"
                    onClick={() => setContactModal("message")}
                  >
                    Pitch me
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* PROJECT CARDS */}
      <section className="about-v2-projects">
        <ScrollReveal delay={30}>
          <div className="about-v2__inner">
            <div className="about-v2__kicker about-v2__kicker--pink">What else I&apos;m making</div>
            <div className="about-v2-projects__list">
              <button
                type="button"
                className="about-v2-project about-v2-project--button"
                onClick={() => void openYesCoachCard()}
              >
                <img src="/posters/stank-yes-coach.jpg" alt="" width={120} height={120} />
                <div>
                  <div className="about-v2-project__meta">Yes Coach · Stank</div>
                  <h3 className="about-v2-project__title">Stank: Yes Coach!</h3>
                  <p className="about-v2-project__desc">Hosted by Tucker Max and Spencer Stanks · Sat, Sanctuary Club · Pride Week 2026</p>
                </div>
                <span className="about-v2-project__go">Open event →</span>
              </button>

              <a
                className="about-v2-project"
                href={DIGGN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/about/diggn-for-bones.jpg" alt="" width={120} height={120} />
                <div>
                  <div className="about-v2-project__meta">Podcast · Season 3</div>
                  <h3 className="about-v2-project__title">Digg&apos;n For Bones</h3>
                  <p className="about-v2-project__desc">Produced by Tucker Max · new episodes out now on Spotify</p>
                </div>
                <span className="about-v2-project__go">Listen →</span>
              </a>

              <button
                type="button"
                className="about-v2-project about-v2-project--button"
                onClick={() => setContactModal("order")}
              >
                <img
                  src="/about/disco/card-thumb.jpg"
                  alt="Constrained and Sparkling Bro, shibari disco body sculptures"
                  width={120}
                  height={120}
                />
                <div>
                  <div className="about-v2-project__meta">Art · Made to order · $1600 for 18″</div>
                  <h3 className="about-v2-project__title">Constrained and Sparkling Bro</h3>
                  <p className="about-v2-project__desc">
                    Disco bodies in shibari · custom mirror mosaic · ~1 month · 14″ · 18″ · 24″ + bigger
                  </p>
                </div>
                <span className="about-v2-project__go">Order →</span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SUPPORT: donate + sponsors merged */}
      <section className="about-v2-support">
        <ScrollReveal>
          <div className="about-v2__inner">
            <SupportPanel />
            <AffiliatePartners />
            <SponsorsPanel onPitch={() => setContactModal("sponsor")} />
          </div>
        </ScrollReveal>
      </section>

      {/* INFRASTRUCTURE */}
      <section className="about-v2-infra">
        <ScrollReveal>
          <div className="about-v2__inner">
            <div className="about-v2__kicker about-v2__kicker--cyan">Necessary homosexual infrastructure</div>
            <h2 className="about-v2__title" style={{ ["--_c" as string]: "var(--cyan)" }}>
              The whole city, <span className="hl">not the sanitized bits</span>
            </h2>
            <InfrastructureGrid />
          </div>
        </ScrollReveal>
      </section>

      {/* VALUES */}
      <section className="about-v2-values">
        <ScrollReveal>
          <div className="about-v2__inner">
            <div className="about-v2__kicker about-v2__kicker--pink">Transparency</div>
            <h2 className="about-v2__title" style={{ ["--_c" as string]: "var(--pink)" }}>
              Values &amp; the <span className="hl">rules</span>
            </h2>
            <div className="about-v2-values__grid">
              {VALUES.map(item => (
                <div key={item.title} className="about-v2-values__item">
                  <span className="mark" aria-hidden="true">✓</span>
                  <span>
                    <strong>{item.title}</strong> {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FAQ */}
      <section className="about-v2-faq">
        <ScrollReveal>
          <div className="about-v2__inner">
            <div className="about-v2__kicker about-v2__kicker--cyan">FAQ</div>
            <h2 className="about-v2__title" style={{ ["--_c" as string]: "var(--cyan)" }}>
              Good questions
            </h2>
            <div className="about-v2-faq__list">
              {FAQ.map(item => (
                <details key={item.q} className="about-v2-faq__item">
                  <summary>
                    {item.q}
                    <span className="ico" aria-hidden="true">+</span>
                  </summary>
                  <div className="answer">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CLOSE */}
      <hr className="pdx-rainbow-rule about-v2-seam" aria-hidden="true" />
      <section className="about-v2-close">
        <div className="about-v2-close__row">
          <span>Pride is a protest. Take care of each other.</span>
          <span>zaylist.com</span>
        </div>
      </section>

      {contactModal && (
        <PortfolioContactModal
          variant={contactModal}
          onClose={() => setContactModal(null)}
        />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={updated => setSelectedEvent(updated)}
        />
      )}
    </div>
  );
}
