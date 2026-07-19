import BoardHero from "@/components/BoardHero";
import BoardExploreActions from "@/components/BoardExploreActions";
import BoardStatsBar from "@/components/BoardStatsBar";
import CountUpValue from "@/components/CountUpValue";

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
        kicker="Portland's queer events · all year"
        title={
          <>
            <CountUpValue
              key={eventCount > 0 ? "events-hero-ready" : "events-hero-pending"}
              value={eventCount}
            />{" "}
            <span className="board-hero__title-accent">events</span>
          </>
        }
        lede="Every queer party, parade, show, and gathering in Portland — Pride and all year round, all in one place."
        actions={<BoardExploreActions showSchedule scheduleLead />}
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}