import CountUpValue from "@/components/CountUpValue";

type Props = {
  eventCount: number;
  placesCount: number;
  goingCount: number;
};

/**
 * Three-column stat band under the home hero:
 * live event total (was hero counter) · directory places · RSVPs going.
 */
export default function HomeStatStrip({ eventCount, placesCount, goingCount }: Props) {
  return (
    <div className="home-stat-strip" aria-label="Live site stats">
      <div className="home-stat-strip__cell">
        <div
          className="home-stat-strip__value home-stat-strip__value--countdown"
          data-testid="home-events-count"
        >
          <CountUpValue value={eventCount} duration={1400} />
        </div>
        <div className="home-stat-strip__label home-stat-strip__label--stack">
          <span>and counting</span>
          <span>all across Portland</span>
        </div>
      </div>
      <div className="home-stat-strip__cell">
        <div className="home-stat-strip__value home-stat-strip__value--lime">{placesCount}</div>
        <div className="home-stat-strip__label">Places to back</div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--last">
        <div className="home-stat-strip__value home-stat-strip__value--orange">{goingCount}</div>
        <div className="home-stat-strip__label">Going to events</div>
      </div>
    </div>
  );
}
