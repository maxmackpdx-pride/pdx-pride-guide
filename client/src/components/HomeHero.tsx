import { useState } from "react";
import { Link } from "wouter";
import { Button, Countdown } from "@/components/ds";
import AuthModal from "@/components/AuthModal";
import CountUpValue from "@/components/CountUpValue";
import { useAuth } from "@/context/AuthContext";
import heroCollageImg from "@/assets/hero-collage.png";

/** Week opener: Monday July 13 2026, 6pm PDT (matches design panel target). */
export const HERO_COUNTDOWN_TARGET = "2026-07-13T18:00:00-07:00";

type Props = {
  eventCount: number;
};

/**
 * Full-bleed editorial masthead from Homepage Panel (standalone) / design zip.
 * Isolated: only used on the home page top section.
 */
export default function HomeHero({ eventCount }: Props) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <section className="home-hero" aria-label="Portland Pride Guide hero">
      {/* full-bleed collage */}
      <img
        className="home-hero__bg"
        src={heroCollageImg}
        alt="Neon Portland skyline over the river with Mt. Hood and glowing roses"
      />
      <div className="home-hero__scrim home-hero__scrim--angle" aria-hidden="true" />
      <div className="home-hero__scrim home-hero__scrim--bottom" aria-hidden="true" />
      <div className="home-hero__scrim home-hero__scrim--top" aria-hidden="true" />
      <div className="home-hero__halftone" aria-hidden="true" />
      <div className="home-hero__film-grain" aria-hidden="true" />
      <div className="home-hero__seam pdx-rainbow-rule" aria-hidden="true" />

      <div className="home-hero__inner">
        {/* running head */}
        <header className="home-hero__running">
          <div className="home-hero__kicker">
            <span className="home-hero__dot" aria-hidden="true" />
            Portland Pride Week 2026
          </div>
          <div className="home-hero__date">July 13 to 19 / Portland, OR</div>
        </header>

        {/* left content column */}
        <div className="home-hero__col">
          <h1 className="home-hero__title">
            <span className="home-hero__word">Portland</span>
            <span className="home-hero__word home-hero__word--pride">Pride</span>
            <span className="home-hero__word">Guide</span>
          </h1>

          <p className="home-hero__tagline">
            Seven days, one city, every color. Find the parties, the parade, and your people.
          </p>

          <div
            className="home-hero__stat"
            aria-label={`${eventCount} events across seven days`}
          >
            <span className="home-hero__stat-num" data-testid="home-events-count">
              <CountUpValue
                key={eventCount > 0 ? "events-ready" : "events-pending"}
                value={eventCount}
              />
            </span>
            <div className="home-hero__stat-meta">
              <span className="home-hero__stat-label">Events</span>
              <span className="home-hero__stat-sub">Across seven days</span>
            </div>
          </div>

          <div className="home-hero__rule" aria-hidden="true" />

          <div className="home-hero__countdown">
            <div className="home-hero__cd-label">Pride Week kicks off in</div>
            <Countdown
              target={HERO_COUNTDOWN_TARGET}
              accent="lime"
              aria-label="Countdown to Pride Week start Monday July 13 2026"
              doneLabel="Pride Week is on!"
            />
          </div>

          <div className="home-hero__cta">
            <Link href="/events" data-testid="hero-cta-events">
              <Button as="span" variant="solid" accent="lime" size="lg" arrow>
                View All Events
              </Button>
            </Link>

            {user ? (
              <Link href="/dashboard" data-testid="hero-cta-account">
                <Button as="span" variant="neon" accent="cyan" size="lg">
                  Your Hub
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                variant="neon"
                accent="cyan"
                size="lg"
                data-testid="hero-cta-auth"
                onClick={() => setShowAuth(true)}
              >
                Sign Up / Log In
              </Button>
            )}
          </div>
        </div>
      </div>

      {showAuth && !user && (
        <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />
      )}
    </section>
  );
}
