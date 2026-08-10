import type { ReactNode } from "react";
import CountUpValue from "@/components/CountUpValue";

type Props = {
  eventCount: number;
  placesCount: number;
  goingCount: number;
  /** Per stat: true until the real number has arrived from the API. */
  pending?: { events?: boolean; places?: boolean; going?: boolean };
};

/**
 * Holds the number's space while the API answers. Showing a stand-in value
 * here reads as real, then silently corrects itself a few seconds later,
 * which looks like the page loading a second time.
 */
function StatValue({
  pending,
  label,
  gradClass,
  children,
  testId,
}: {
  pending: boolean;
  label: string;
  gradClass: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className={`home-stat-strip__value home-stat-strip__grad ${gradClass}`}
      data-testid={testId}
      aria-label={pending ? `Loading ${label}` : label}
      aria-busy={pending || undefined}
    >
      {pending ? <span className="home-stat-strip__pending" aria-hidden="true" /> : children}
    </div>
  );
}

/**
 * Three-column stat band under the home hero:
 * events in the next 7 days · directory places · RSVPs going.
 */
export default function HomeStatStrip({ eventCount, placesCount, goingCount, pending }: Props) {
  return (
    <div className="home-stat-strip" aria-label="Live site stats">
      <div className="home-stat-strip__cell home-stat-strip__cell--events">
        <StatValue
          pending={!!pending?.events}
          label={`${eventCount} events in the next 7 days`}
          gradClass="home-stat-strip__grad--events"
          testId="home-events-count"
        >
          <CountUpValue value={eventCount} duration={1400} />
        </StatValue>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--events">
          events next 7 days
        </div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--places">
        <StatValue
          pending={!!pending?.places}
          label={`${placesCount} places to back`}
          gradClass="home-stat-strip__grad--places"
        >
          {placesCount}
        </StatValue>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--places">
          Places to back
        </div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--last home-stat-strip__cell--going">
        <StatValue
          pending={!!pending?.going}
          label={`${goingCount} going to events`}
          gradClass="home-stat-strip__grad--going"
        >
          {goingCount}
        </StatValue>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--going">
          Going to events
        </div>
      </div>
    </div>
  );
}
