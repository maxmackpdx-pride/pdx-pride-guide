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
        kicker="Portland nights · all year"
        title={
          <>
            <CountUpValue
              key={eventCount > 0 ? "events-hero-ready" : "events-hero-pending"}
              value={eventCount}
            />{" "}
            <span className="board-hero__title-accent">events</span>
          </>
        }
        lede="Every party, show, afterparty, and gathering worth knowing - Pride week and every weekend after, all in one place."
        actions={<BoardExploreActions showSchedule scheduleLead />}
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}