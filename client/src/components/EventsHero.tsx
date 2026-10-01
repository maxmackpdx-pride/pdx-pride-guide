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
          <img
            key={eventCount > 0 ? "eventz-hero-ready" : "eventz-hero-pending"}
            className="board-hero__brand-logo board-hero__brand-logo--eventz"
            src="/brand/family/eventz.png"
            alt="EVENTZ"
          />
        }
        lede="Find your next night out, daytime hang, or community gathering. Browse the flyers, check the details, and make a plan."
      />
  );
}
