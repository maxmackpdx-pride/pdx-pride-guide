import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import ScrollReveal from "@/components/ScrollReveal";
import "./About.css";

const VENMO_URL = "https://venmo.com/tucker_pdmax";
const IG_URL = "https://www.instagram.com/tucker_pdmax";
const DIGGN_URL = "https://open.spotify.com/search/Digg%27n%20For%20Bones";
const STANK_EVENT_ID = 13;
const STANK_EVENT_TITLE = "Stank Yes Coach — PDX PRIDE";
const STANK_EVENT_HREF = eventPath(STANK_EVENT_ID, STANK_EVENT_TITLE, "SAT");

const VALUES = [
  { title: "Free to browse.", text: "No paywall, no popup begging for your email." },
  { title: "Sponsors can buy in.", text: "Featured feed posts and ads are on the table — only for businesses that are part of this community or already show up for us." },
  { title: "Post with a free account.", text: "That is how spam stays out and names stay on." },
  { title: "Your data is not for sale.", text: "Not now, not later, not for a nice offer." },
  { title: "We moderate the clearly over the line stuff.", text: "The rest of the community runs free." },
  { title: "One person builds this.", text: "Good people help. It is still not a committee." },
] as const;

const SPONSOR_CHECKS = [
  "Queer owned or genuinely queer loving.",
  "Treats its people right. Pays them right.",
  "Does not need us to scrub anything clean first.",
] as const;

const FAQ = [
  {
    q: "When is Portland Pride 2026?",
    a: "July 13 to 19, Monday to Sunday. Festivals, parties, marches, and the quiet stuff too. All seven days are in here.",
  },
  {
    q: "Where do I find events?",
    a: "The Events page. Every live listing on a map and a board. Filter by day, type, or neighborhood, then open anything for times, venue, and tickets.",
  },
  {
    q: "How is this different from other Pride apps?",
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
    "About PDX Pride Guide | Portland Pride 2026",
    "Built by one person in Portland. Free Pride week directory with zero interest in being a sanitized corporate pamphlet.",
  );

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const eventCount = events.length;
  const [contactModal, setContactModal] = useState<"message" | "sponsor" | "order" | null>(null);

  return (
    <div className="about-v2">
      {/* HERO */}
      <section className="about-v2-hero">
        <div className="about-v2-hero__scrim" aria-hidden="true" />
        <div className="about-v2-hero__inner">
          <div>
            <div className="about-v2-hero__kicker">
              <span className="about-v2-hero__dot" aria-hidden="true" />
              About · Portland Pride 2026
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

      {/* STAT BAND */}
      <section className="about-v2-stats" aria-label="Guide stats">
        <div className="about-v2-stats__grid">
          <div className="about-v2-stats__cell">
            <div className="about-v2-stats__num about-v2-stats__num--lime about-v2-stats__num--pop">
              <CountUpValue
                key={eventCount > 0 ? "stats-ready" : "stats-pending"}
                value={eventCount}
              />
            </div>
            <div className="about-v2-stats__label">Events, and counting</div>
          </div>
          <div className="about-v2-stats__cell">
            <div className="about-v2-stats__num about-v2-stats__num--cyan about-v2-stats__num--pop">
              <CountUpValue value={7} />
            </div>
            <div className="about-v2-stats__label">Days, one guide</div>
          </div>
          <div className="about-v2-stats__cell">
            <div className="about-v2-stats__num about-v2-stats__num--pink about-v2-stats__num--pop">
              $<CountUpValue value={0} />
            </div>
            <div className="about-v2-stats__label">To browse. Always.</div>
          </div>
          <div className="about-v2-stats__cell">
            <div className="about-v2-stats__num about-v2-stats__num--amber about-v2-stats__num--pop">
              <CountUpValue value={1} />
            </div>
            <div className="about-v2-stats__label">Guide with all our events — and room for more</div>
          </div>
        </div>
      </section>

      {/* Animated rainbow seam under stat band */}
      <hr className="pdx-rainbow-rule about-v2-seam" aria-hidden="true" />

      {/* MANIFESTO */}
      <section className="about-v2-manifesto">
        <ScrollReveal>
          <div className="about-v2__inner">
            <h2 className="about-v2-manifesto__h2">
              What this <span className="about-v2-manifesto__h2-accent">actually is</span>
            </h2>
            <div className="about-v2-manifesto__copy">
              <p>
                Pride starts now, it ends never, and this thing is already loaded: parties, community events,
                weird little gems, places to eat, spots to shop, gigs, gifting, missed connections, and all the
                real homosexual infrastructure that keeps the scene alive.
              </p>
              <p>
                The family-friendly newspaper roundups are cute. The local moms&apos; Pride lists have their place.
                But this is for the people who want the whole city, not the sanitized version corporations can
                sell back to us.
              </p>
            </div>
            <div className="about-v2-manifesto__shout">
              <p>
                <span className="about-v2-manifesto__shout-pink">Fuck Meta.</span>
                <br /><br />
                Fuck censoring our community.
                <br />
                Fuck pretending queer culture only matters once it&apos;s been scrubbed clean.
                <br /><br />
                This is raw. This is{" "}
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
                  <span className="about-v2-creator__hire">Looking for full time employment</span>
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
                  ago I was Oregon State Pet. Today, like many of you, I&apos;m unemployed and looking for work while
                  still dumping everything I have into the projects I care about.
                </p>
                <p>
                  I&apos;ve watched so many of you grow, figure out what you like, discover what you don&apos;t,
                  and find your place. I&apos;ve loved every minute of it.
                </p>
                <blockquote className="about-v2-creator__pull">
                  <p>
                    This year got rough. A lot of you showed up for me when I needed it most, donated, and checked
                    in. That&apos;s the only reason year three exists. From the bottom of my heart, thank you. You
                    showed up for me, and I hope this is me showing up for you.
                  </p>
                </blockquote>
                <p>
                  I built this because I&apos;m done being tied down to their platforms. Built by a slutty puppy
                  with a cocky attitude, but run by heart and hopefully the community if it takes off.
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

      {/* OPEN TO WORK */}
      <section className="about-v2-work">
        <ScrollReveal>
          <div className="about-v2__inner about-v2__inner--work">
            <div className="about-v2-work__card">
              <div className="about-v2-work__top">
                <span className="about-v2-work__badge">
                  <span className="dot" aria-hidden="true" />
                  Open to work
                </span>
                <span className="about-v2-work__loc">Portland, OR · Full time</span>
              </div>
              <h3 className="about-v2-work__headline">
                Brand builder,{" "}
                <span className="about-v2-work__headline-cyan">sales leader</span>
                , and{" "}
                <span className="about-v2-work__headline-lime">momentum-maker</span>
                .
              </h3>
              <p className="about-v2-work__support">
                I love people, big ideas, and turning good energy into real results. Still looking for my next
                thing. If someone comes to mind, send them my way.
              </p>
              <div className="about-v2-work__chips" aria-label="Role focus areas">
                <span className="about-v2-work__chip">Brand &amp; marketing</span>
                <span className="about-v2-work__chip">Sales leadership</span>
                <span className="about-v2-work__chip">Events &amp; community</span>
              </div>
              <div className="about-v2-work__footer">
                <span className="about-v2-work__foot-note">
                  Resume, references, and a good handshake on request.
                </span>
                <div className="about-v2-work__ctas">
                  <Link href="/resume">
                    <Button as="span" variant="solid" accent="cyan" size="md" arrow>
                      View resume
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="neon"
                    accent="cyan"
                    size="md"
                    onClick={() => setContactModal("message")}
                  >
                    Message me
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
              <Link href={STANK_EVENT_HREF} className="about-v2-project">
                <img src="/posters/stank-yes-coach.jpg" alt="" width={120} height={120} />
                <div>
                  <div className="about-v2-project__meta">Yes Coach · Stank</div>
                  <h3 className="about-v2-project__title">Stank: Yes Coach!</h3>
                  <p className="about-v2-project__desc">Hosted by Tucker Max · Sat, Sanctuary Club · Pride Week 2026</p>
                </div>
                <span className="about-v2-project__go">See event →</span>
              </Link>

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
                  alt="Constrained and Sparkling Bro — shibari disco body sculptures"
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
            <div className="about-v2__kicker about-v2__kicker--lime">Keep it free</div>
            <h2 className="about-v2__title" style={{ ["--_c" as string]: "var(--lime)" }}>
              Help keep it free for <span className="hl">everyone else</span>
            </h2>

            <div className="about-v2-donate about-v2-donate--panel">
              <div className="about-v2-donate__copy">
                <h3 className="about-v2-donate__h3">Keep this guide alive</h3>
                <p>
                  Servers and domains cost money. Time costs the most. If this pointed you toward one good night,
                  chip in and it stays free for the next person.
                </p>
              </div>
              <div className="about-v2-donate__cta">
                <a href={VENMO_URL} target="_blank" rel="noopener noreferrer" data-testid="link-donate">
                  <Button as="span" variant="solid" accent="lime" size="lg">
                    Buy me a coffee
                  </Button>
                </a>
                <span className="about-v2-donate__note">@tucker_pdmax on Venmo · P.S. still looking for work.</span>
              </div>
            </div>

            <div className="about-v2-sponsors__grid">
              <div className="about-v2-sponsors__copy">
                <div className="about-v2__kicker about-v2__kicker--lime">Sponsors</div>
                <p>
                  Sponsors can buy featured posts in the scene feed and/or ads on the site. That is how this
                  stays free to browse. The bar is simple: you need to be part of the community or already
                  support what we are building. No scrubbing your brand first. No random corporate Pride
                  cosplay.
                </p>
                <p>
                  And it does not stop on July 19. After Pride week this becomes a{" "}
                  <strong className="about-v2-sponsors__strong">year round resource</strong> for the scene, so your
                  support keeps working long after the parade.
                </p>
                <Button
                  type="button"
                  variant="solid"
                  accent="lime"
                  size="md"
                  onClick={() => setContactModal("sponsor")}
                >
                  Pitch a sponsorship
                </Button>
              </div>
              <div className="about-v2-sponsors__checks">
                {SPONSOR_CHECKS.map(item => (
                  <div key={item} className="about-v2-sponsors__check">
                    <span className="mark" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="about-v2-infra__grid">
              <Link href="/pride-work" className="about-v2-infra__card about-v2-infra__card--cyan">
                <h3>Gigs</h3>
                <p>Do you offer a trade, need work, or want to put your talents out there? Check gigs.</p>
              </Link>
              <Link href="/gifting" className="about-v2-infra__card about-v2-infra__card--amber">
                <h3>Gifting</h3>
                <p>Need something for Pride week or have old Pride gear collecting dust? Hit gifting.</p>
              </Link>
              <Link href="/spotted" className="about-v2-infra__card about-v2-infra__card--pink">
                <h3>Missed connections</h3>
                <p>Trying to find someone after a Pride event? That&apos;s why missed connections exists.</p>
              </Link>
              <Link href="/nude-beaches" className="about-v2-infra__card about-v2-infra__card--lime">
                <h3>Nude beaches</h3>
                <p>Want to make new friends at the river or catch a ride there or back? Check out the nude beach section.</p>
              </Link>
            </div>
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
          <span>prideguidepdx.com</span>
        </div>
      </section>

      {contactModal && (
        <PortfolioContactModal
          variant={contactModal}
          onClose={() => setContactModal(null)}
        />
      )}
    </div>
  );
}
