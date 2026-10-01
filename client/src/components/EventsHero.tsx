import type { CSSProperties } from "react";
import "./EventsHero.css";
import BoardHero from "@/components/BoardHero";

type Props = {
  eventCount: number;
};

export default function EventsHero({ eventCount }: Props) {
  return (
      <BoardHero
        className="board-hero--room"
        accent="cyan"
        kicker="Eventz / Portland, all year"
        title={
          <span className="eventz-neon-logo">
            <img
              key={eventCount > 0 ? "eventz-hero-ready" : "eventz-hero-pending"}
              className="board-hero__brand-logo board-hero__brand-logo--eventz"
              src="/brand/family/eventz.png"
              alt="EVENTZ"
            />
            {[ [0, 18, 6.7, -2.1], [18, 33, 8.3, -5.4], [33, 46, 7.1, -1.2], [46, 60, 9.7, -6.8], [60, 74, 5.9, -3.5], [74, 100, 10.9, -8.2] ].map(([start, end, duration, delay], index) => (
              <span key={index} aria-hidden="true" className={`eventz-neon-logo__bloom eventz-neon-logo__bloom--${index}`} style={{
                "--letter-start": `${start}%`, "--letter-end": `${end}%`,
                "--breath-duration": `${duration}s`, "--breath-delay": `${delay}s`,
              } as CSSProperties} />
            ))}
          </span>
        }
        lede="Find your next night out, daytime hang, or community gathering. Browse the flyers, check the details, and make a plan."
      />
  );
}
