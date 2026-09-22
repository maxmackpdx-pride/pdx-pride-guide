import { Link } from "wouter";
import BoardHero, { RainbowHeroWord } from "@/components/BoardHero";
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
        className="board-hero--room"
        accent="cyan"
        kicker="Zaylist / Eventz · Your week"
        title={
          <>
            My <RainbowHeroWord>schedule</RainbowHeroWord>
          </>
        }
        lede="Your week, all in view. Browse what’s on, switch to your RSVPs, and leave room for something unexpected."
        actions={
          <Link href="/events">
            <Button as="span" variant="neon" accent="cyan" size="lg">
              Browse Eventz
            </Button>
          </Link>
        }
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}
