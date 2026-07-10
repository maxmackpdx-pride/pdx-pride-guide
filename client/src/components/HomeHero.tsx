import { Link } from "wouter";
import { Button } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
import { useAuth } from "@/context/AuthContext";
import heroWallpaper from "@/assets/home/hero-wallpaper.jpg";

type Props = {
  eventCount: number;
};

/** Full-bleed zine hero — wallpaper, aurora orbs, PDX / PRIDE / GUIDE wordmark (design 1a). */
export default function HomeHero({ eventCount }: Props) {
  const { user } = useAuth();

  return (
    <section className="home-hero" aria-label="Portland Pride Guide hero">
      <img
        className="home-hero__bg"
        src={heroWallpaper}
        alt=""
      />
      <div className="home-hero__aurora home-hero__aurora--magenta" aria-hidden />
      <div className="home-hero__aurora home-hero__aurora--cyan" aria-hidden />
      <div className="home-hero__aurora home-hero__aurora--violet" aria-hidden />
      <div className="home-hero__scrim home-hero__scrim--angle" aria-hidden />
      <div className="home-hero__scrim home-hero__scrim--bottom" aria-hidden />
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
              <CountUpValue
                key={eventCount > 0 ? "events-ready" : "events-pending"}
                value={eventCount}
              />
            </span>
            <span className="home-hero__stat-meta">
              and counting
              <br />
              across 7 days · Jul 13 to 19
            </span>
          </div>
        </div>

        <div className="home-hero__cta">
          <Link href="/events" data-testid="hero-cta-events">
            <Button as="span" variant="solid" accent="lime" size="lg" arrow>
              View all events
            </Button>
          </Link>
          <Link href="/schedule" data-testid="hero-cta-schedule">
            <Button as="span" variant="neon" accent="cyan" size="lg" arrow>
              Browse schedule
            </Button>
          </Link>
          {user && (
            <Link href="/dashboard" data-testid="hero-cta-account">
              <Button as="span" variant="neon" accent="cyan" size="lg">
                Your Hub
              </Button>
            </Link>
          )}
        </div>
      </div>

    </section>
  );
}