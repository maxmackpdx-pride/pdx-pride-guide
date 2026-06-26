import { Link } from "wouter";

const PRIDE_SLOGANS = [
  { text: "Keep Portland queer", color: "#19E3FF" },
  { text: "Trans joy is real", color: "#FF1FA0" },
  { text: "Your joy is a protest", color: "#fff" },
  { text: "Gay all day", color: "#C8FA3C" },
  { text: "Sun out buns out", color: "#FF8C00" },
  { text: "Go piss girl", color: "#FF1FA0" },
  { text: "Kiss who you want", color: "#19E3FF" },
  { text: "Portland as hell", color: "#C8FA3C" },
] as const;

function MarqueeTrack({
  children,
  reverse,
  durationSec,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  durationSec: number;
}) {
  return (
    <div className="neon-ticker-viewport">
      <div
        className={`neon-ticker-track${reverse ? " neon-ticker-track--reverse" : ""}`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

export default function NeonTicker({ events }: { events: Array<{ id: number; title: string }> }) {
  const titles = events.length > 0
    ? events.map(e => e.title)
    : ["Portland Pride Weekend", "View all events", "July 16–19"];

  return (
    <section className="neon-ticker-band" aria-label="Live event ticker">
      <Link href="/events" className="neon-ticker-label">
        LIVE<br />EVENTS
      </Link>
      <div className="neon-ticker-tracks">
        <div className="neon-ticker-row neon-ticker-row--lime">
          <MarqueeTrack durationSec={22}>
            {titles.map((title, i) => (
              <span key={`${title}-${i}`} className="neon-ticker-event">
                {title}
                <span className="neon-ticker-sep" aria-hidden="true">✦</span>
              </span>
            ))}
          </MarqueeTrack>
        </div>
        <div className="neon-ticker-row neon-ticker-row--dark">
          <MarqueeTrack durationSec={26} reverse>
            {PRIDE_SLOGANS.map((s, i) => (
              <span key={`${s.text}-${i}`} className="neon-ticker-slogan" style={{ color: s.color }}>
                {s.text}
                <span className="neon-ticker-sep neon-ticker-sep--lime" aria-hidden="true">✦</span>
              </span>
            ))}
          </MarqueeTrack>
        </div>
      </div>
    </section>
  );
}