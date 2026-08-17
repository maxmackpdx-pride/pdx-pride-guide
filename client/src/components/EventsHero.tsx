import BoardHero from "@/components/BoardHero";
import BoardExploreActions from "@/components/BoardExploreActions";
import BoardStatsBar from "@/components/BoardStatsBar";

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
          <img
            key={eventCount > 0 ? "eventz-hero-ready" : "eventz-hero-pending"}
            className="board-hero__brand-logo board-hero__brand-logo--eventz"
            src="/brand/family/eventz.svg"
            alt="EVENTZ"
          />
        }
        lede="Every party, show, afterparty, and gathering worth knowing - Pride week and every weekend after, all in one place."
        actions={<BoardExploreActions showSchedule scheduleLead />}
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}
