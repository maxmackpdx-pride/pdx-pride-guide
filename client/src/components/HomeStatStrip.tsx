import CountUpValue from "@/components/CountUpValue";

type Props = {
  eventCount: number;
  placesCount: number;
  goingCount: number;
};

/**
 * Three-column stat band under the home hero:
 * events in the next 7 days · directory places · RSVPs going.
 */
export default function HomeStatStrip({ eventCount, placesCount, goingCount }: Props) {
  return (
    <div className="home-stat-strip" aria-label="Live site stats">
      <div className="home-stat-strip__cell home-stat-strip__cell--events">
        <div
          className="home-stat-strip__value home-stat-strip__grad home-stat-strip__grad--events"
          data-testid="home-events-count"
          aria-label={`${eventCount} events in the next 7 days`}
        >
          <CountUpValue value={eventCount} duration={1400} />
        </div>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--events">
          events next 7 days
        </div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--places">
        <div className="home-stat-strip__value home-stat-strip__grad home-stat-strip__grad--places">
          {placesCount}
        </div>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--places">
          Places to back
        </div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--last home-stat-strip__cell--going">
        <div className="home-stat-strip__value home-stat-strip__grad home-stat-strip__grad--going">
          {goingCount}
        </div>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--going">
          Going to events
        </div>
      </div>
    </div>
  );
}
