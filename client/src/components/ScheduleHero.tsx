import { Link } from "wouter";
import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import { Button } from "@/components/ds";

type Stat = { num: number; label: string; color: string };

type Props = {
  stats: Stat[];
};

export default function ScheduleHero({ stats }: Props) {
  return (
    <>
      <BoardHero
        accent="cyan"
        kicker="Portland Pride Week 2026 · July 13–19"
        title={
          <>
            The <span className="board-hero__title-accent">schedule</span>
          </>
        }
        lede="The whole week, laid out flat. Flip to just your RSVPs, filter by vibe, build your nights out of it. Pride is a protest. Take care of each other."
        actions={
          <Link href="/events">
            <Button as="span" variant="neon" accent="cyan" size="lg">
              Browse events
            </Button>
          </Link>
        }
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}