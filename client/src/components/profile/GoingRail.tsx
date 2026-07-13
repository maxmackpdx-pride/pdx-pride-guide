import {
  GoingEventCard,
  ProfileEventRailShell,
  ProfileRailHead,
} from "./ProfileEventRail";
import type { ProfileEvent } from "./types";

type Props = {
  events: ProfileEvent[];
  onEventClick?: (event: ProfileEvent) => void;
  /** Optional override for the count segment (defaults to "{n} UPCOMING"). */
  countLabel?: string;
};

/**
 * GOING rail: upcoming RSVPs the member is attending.
 * Mobile: horizontal day-bordered cards. Desktop (≥900px): stacked list rows.
 */
export default function GoingRail({ events, onEventClick, countLabel }: Props) {
  if (!events.length) return null;

  const count = countLabel || `${events.length} UPCOMING`;

  return (
    <section className="pp-event-rail pp-event-rail--going" aria-label="Going">
      <ProfileRailHead label="GOING" countLabel={count} accent="yellow" />
      <ProfileEventRailShell ariaLabel="Upcoming events this member is going to">
        {events.map(event => (
          <GoingEventCard key={event.id} event={event} onClick={onEventClick} />
        ))}
      </ProfileEventRailShell>
    </section>
  );
}
