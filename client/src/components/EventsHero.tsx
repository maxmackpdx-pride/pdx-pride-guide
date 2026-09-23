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
        className="board-hero--room"
        accent="cyan"
        section="Eventz"
        kicker="Zaylist / Eventz · Portland, all year"
        title={
          <img
            key={eventCount > 0 ? "eventz-hero-ready" : "eventz-hero-pending"}
            className="board-hero__brand-logo board-hero__brand-logo--eventz"
            src="/brand/family/eventz.png"
            alt="EVENTZ"
          />
        }
        lede="Find your next night out, daytime hang, or community gathering. Browse the flyers, check the details, and make a plan."
        actions={<BoardExploreActions showSchedule scheduleLead />}
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}
