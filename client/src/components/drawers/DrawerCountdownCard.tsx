import { useEffect, useState, type CSSProperties } from "react";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { dayAccentToken } from "@/lib/dsColors";
import { remainingToStart, type DrawerTopEvent } from "@shared/drawerTop";
import type { Event } from "@shared/schema";
import "./DrawerTop.css";

/**
 * Narrow (short) countdown card: one full-bleed flyer, a dark scrim, a big
 * hologram countdown, and the event name. No list of extra events.
 * `events` is unchanged so existing callers can still pass an array; only
 * the first (next) event is shown.
 */
export default function DrawerCountdownCard({
  events,
  onOpen,
}: {
  events: DrawerTopEvent[];
  onOpen?: (event: DrawerTopEvent) => void;
}) {
  "use memo";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const event = events[0];
  if (!event) {
    return (
      <div className="drawer-count pdx-glass-rebind" style={{ "--c": "var(--room-eventz)" } as CSSProperties} data-testid="drawer-top-countdown">
        <p className="drawer-count__empty">No upcoming events to count down to.</p>
      </div>
    );
  }
  const listing = event as unknown as Event;
  const poster = listingPosterUrl(listing);
  const accent = event.accentColor || dayAccentToken(listingDay(listing));
  const remaining = remainingToStart(event.dateStart, now);
  return (
    <article
      className="drawer-count pdx-glass-rebind"
      style={{ "--c": accent } as CSSProperties}
      data-testid="drawer-top-countdown"
    >
      <div className="drawer-count__art" aria-hidden="true">
        <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={event.title} venueName={event.venueName || ""} />
      </div>
      <div className="drawer-count__scrim" aria-hidden="true" />
      <button
        type="button"
        className="drawer-count__open"
        onClick={() => onOpen?.(event)}
        aria-label={remaining ? `${event.title}, starts in ${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes` : event.title}
      >
        {remaining ? (
          <span className="drawer-count__time pz-countdown-inline" role="timer">
            <span className="drawer-count__digits pz-countdown-digits" aria-hidden="true">
              {([[remaining.days, "days"], [remaining.hours, "hrs"], [remaining.minutes, "min"]] as const).map(([value, unit]) => (
                <span key={unit}><strong>{String(value).padStart(2, "0")}</strong><small>{unit}</small></span>
              ))}
            </span>
          </span>
        ) : null}
        <span className="drawer-count__name">{event.title}</span>
      </button>
    </article>
  );
}
