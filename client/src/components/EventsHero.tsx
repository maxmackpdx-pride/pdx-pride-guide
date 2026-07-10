import { Link } from "wouter";
import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import CountUpValue from "@/components/CountUpValue";
import { Button } from "@/components/ds";

type Stat = { num: number; label: string; color: string };

type Props = {
  eventCount: number;
  stats: Stat[];
};

export default function EventsHero({ eventCount, stats }: Props) {
  return (
    <>
      <BoardHero
        accent="cyan"
        kicker="Portland Pride Week 2026 · July 13–19"
        title={
          <>
            <CountUpValue
              key={eventCount > 0 ? "events-hero-ready" : "events-hero-pending"}
              value={eventCount}
            />{" "}
            <span className="board-hero__title-accent">events</span>
          </>
        }
        lede="Every queer party, parade, show, and gathering for Pride Week 2026 and beyond — all in one place."
        actions={
          <Link href="/schedule">
            <Button as="span" variant="neon" accent="cyan" size="lg">
              View schedule
            </Button>
          </Link>
        }
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}