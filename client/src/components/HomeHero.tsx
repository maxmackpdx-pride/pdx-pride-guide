import { Link } from "wouter";
import CountUpValue from "@/components/CountUpValue";
import { useAuth } from "@/context/AuthContext";
import heroWallpaper from "@/assets/home/hero-wallpaper.jpg";

type Props = {
  eventCount: number;
};

/**
 * Full-bleed home hero (above the ticker): skyline wallpaper, aurora orbs,
 * left-weighted scrim, film grain, wordmark + count-up + CTAs.
 */
export default function HomeHero({ eventCount }: Props) {
  const { user } = useAuth();

  return (
    <section className="home-hero" aria-label="Portland Pride Guide hero">
      <img
        className="home-hero__bg"
        src={heroWallpaper}
        alt=""
        decoding="async"
      />

      {/* Aurora orbs — signature glow; silenced on reduced-motion / calm */}
      <div className="home-hero__aurora" aria-hidden>
        <span className="home-hero__orb home-hero__orb--magenta" />
        <span className="home-hero__orb home-hero__orb--cyan" />
        <span className="home-hero__orb home-hero__orb--violet" />
      </div>

      {/* Legibility scrims: left-weighted + bottom fade */}
      <div className="home-hero__scrim home-hero__scrim--title" aria-hidden />
      <div className="home-hero__scrim home-hero__scrim--bottom" aria-hidden />

      {/* Film grain (SVG fractal noise tile) */}
      <div className="home-hero__grain" aria-hidden />

      <div className="home-hero__inner">
        <div className="home-hero__kicker">
          <span className="home-hero__dot" aria-hidden />
          Portland Pride Week 2026 · July 13 to 19
        </div>

        <h1 className="home-hero__title">
          <span className="home-hero__word">PDX</span>
          <span className="home-hero__word home-hero__word--pride">PRIDE</span>
          <span className="home-hero__word">GUIDE</span>
        </h1>

        <p className="home-hero__tagline">
          Your welcoming map to Pride Week: discover events, find your people, back the queer venues that host it, and{" "}
          <strong>take care of each other.</strong>
        </p>

        <div className="home-hero__stat" aria-label={`${eventCount} total events`}>
          <div className="home-hero__stat-label">Total events</div>
          <div className="home-hero__stat-row">
            <span className="home-hero__stat-num" data-testid="home-events-count">
              <CountUpValue value={eventCount} duration={1400} />
            </span>
            <span className="home-hero__stat-meta">
              and counting
              <br />
              across 7 days · Jul 13 to 19
            </span>
          </div>
        </div>

        <div className="home-hero__cta">
          <Link href="/events" className="home-hero__btn home-hero__btn--primary" data-testid="hero-cta-events">
            View all events →
          </Link>
          <Link href="/schedule" className="home-hero__btn home-hero__btn--secondary" data-testid="hero-cta-schedule">
            Browse schedule →
          </Link>
          {user && (
            <Link href="/dashboard" className="home-hero__btn home-hero__btn--secondary" data-testid="hero-cta-account">
              Your Hub →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
