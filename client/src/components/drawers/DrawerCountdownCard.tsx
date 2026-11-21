import { useDrawerClock } from "@/components/drawers/useDrawerClock";

import EventFlyerArt from "@/components/events/EventFlyerArt";
import { formatCardCountdown, parsePacificEventTime } from "@/lib/countdown";
import { eventPath } from "@shared/eventSlug";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";

import type { DrawerTopEvent } from "@shared/drawerTop";
import type { Event } from "@shared/schema";

import "./DrawerTop.css";

/**
 * Narrow (short) countdown card used by every room drawer: full-bleed flyer,
 * the existing card-front STARTS IN countdown (scaled up) in a
 * semi-transparent outlined plate, and the event name over a soft gradient.
 * No inset panel covering the flyer. `events` is unchanged; only the next
 * event is shown.
 */
export default function DrawerCountdownCard({
  events,
  onOpen,
  now: nowProp,
}: {
  events: DrawerTopEvent[];
  onOpen?: (event: DrawerTopEvent) => void;
  now?: number;
}) {
  "use memo";
  const clock = useDrawerClock(nowProp === undefined);
  const now = nowProp ?? clock;
  const event = events[0];
  if (!event) {
    return (
      <div className="drawer-count"  data-testid="drawer-top-countdown">
        <p className="drawer-count__empty">No upcoming events to count down to.</p>
      </div>
    );
  }
  const listing = event as unknown as Event;
  const poster = listingPosterUrl(listing);
  const start = parsePacificEventTime(event.dateStart);
  const countdown = start !== null && start > now ? formatCardCountdown(start - now) : null;
  return (
    <article
      className="drawer-count"

      data-testid="drawer-top-countdown"
    >
      <div className="drawer-count__art" aria-hidden="true">
        <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={event.title} venueName={event.venueName || ""} />
      </div>
      <div className="drawer-count__scrim" aria-hidden="true" />
      <button
        type="button"
        className="drawer-count__open"
        onClick={() => onOpen ? onOpen(event) : window.location.assign(eventPath(event.id, event.title, event.dayOfWeek))}
        aria-label={`Open ${event.title}${countdown ? `, starts in ${countdown}` : ""}`}
      >
        {countdown && <span className="pcdtop"><span className="ps-lab">Starts in</span><strong className="drawer-count__value">{countdown}</strong></span>}
        <span className="drawer-count__name">{event.title}</span>
      </button>
    </article>
  );
}
