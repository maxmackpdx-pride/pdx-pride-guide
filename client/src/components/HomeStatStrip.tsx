import type { ReactNode } from "react";
import CountUpValue from "@/components/CountUpValue";

type Props = {
  eventCount: number;
  placesCount: number;
  newUsers90Days: number;
  /** Per stat: true until the real number has arrived from the API. */
  pending?: { events?: boolean; places?: boolean; users?: boolean };
  error?: boolean;
};

/**
 * Holds the number's space while the API answers. Showing a stand-in value
 * here reads as real, then silently corrects itself a few seconds later,
 * which looks like the page loading a second time.
 */
function StatValue({
  pending,
  error,
  label,
  gradClass,
  children,
  testId,
}: {
  pending: boolean;
  error: boolean;
  label: string;
  gradClass: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className={`home-stat-strip__value home-stat-strip__grad ${gradClass}`}
      data-testid={testId}
      aria-label={pending ? `Loading ${label}` : error ? `${label} unavailable` : label}
      aria-busy={pending || undefined}
    >
      {pending ? <span className="home-stat-strip__pending" aria-hidden="true" /> : error ? <span aria-hidden="true">—</span> : children}
    </div>
  );
}

/**
 * Three-column stat band under the home hero:
 * events in the next 7 days · directory places · new users within 90 days.
 */
export default function HomeStatStrip({ eventCount, placesCount, newUsers90Days, pending, error = false }: Props) {
  return (
    <div className="home-stat-strip" aria-label="Live site stats">
      <div className="home-stat-strip__cell home-stat-strip__cell--events">
        <StatValue
          pending={!!pending?.events}
          error={error}
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
          error={error}
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
          pending={!!pending?.users}
          error={error}
          label={`${newUsers90Days} new users within 90 days`}
          gradClass="home-stat-strip__grad--going"
        >
          {newUsers90Days}
        </StatValue>
        <div className="home-stat-strip__label home-stat-strip__grad home-stat-strip__grad--going">
          New users within 90 days
        </div>
      </div>
    </div>
  );
}
