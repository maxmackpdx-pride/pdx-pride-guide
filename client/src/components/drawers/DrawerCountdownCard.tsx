import { useEffect, useState, type CSSProperties } from "react";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { dayAccentToken } from "@/lib/dsColors";
import {
  formatDrawerCountdown,
  remainingToStart,
  type DrawerTopEvent,
} from "@shared/drawerTop";
import type { Event } from "@shared/schema";
import "./DrawerTop.css";

/**
 * Wide, short countdown card for DrawerTop. Visual language matches the
 * Placez / hologram NextEventCountdown: an accent label, the event name,
 * and tabular days / hrs / min. The next event's flyer fills the card.
 * Only the names (and countdowns) of the next three events are shown.
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
  const lead = events[0];
  if (!lead) {
    return (
      <div className="drawer-count pdx-glass-rebind" style={{ "--c": "var(--room-eventz)" } as CSSProperties} data-testid="drawer-top-countdown">
        <p className="drawer-count__empty">No upcoming events to count down to.</p>
      </div>
    );
  }
  const listing = lead as unknown as Event;
  const poster = listingPosterUrl(listing);
  const accent = lead.accentColor || dayAccentToken(listingDay(lead));
  return (
    <article
      className="drawer-count pdx-glass-rebind"
      style={{ "--c": accent } as CSSProperties}
      data-testid="drawer-top-countdown"
    >
      <div className="drawer-count__art" aria-hidden="true">
        <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={lead.title} venueName={lead.venueName || ""} />
      </div>
      <ol className="drawer-count__list">
        {events.map((event, index) => {
          const remaining = remainingToStart(event.dateStart, now);
          const label = remaining ? formatDrawerCountdown(remaining) : "";
          return (
            <li key={event.id} className={index === 0 ? "is-lead" : undefined}>
              <button
                type="button"
                className="drawer-count__open"
                onClick={() => onOpen?.(event)}
                aria-label={remaining ? `${event.title}, starts in ${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes` : event.title}
              >
                <span className="drawer-count__name">{event.title}</span>
                {remaining ? (
                  <span className="drawer-count__time pz-countdown-inline" role="timer">
                    {index === 0 ? (
                      <span className="drawer-count__digits pz-countdown-digits" aria-hidden="true">
                        {([[remaining.days, "days"], [remaining.hours, "hrs"], [remaining.minutes, "min"]] as const).map(([value, unit]) => (
                          <span key={unit}><strong>{String(value).padStart(2, "0")}</strong><small>{unit}</small></span>
                        ))}
                      </span>
                    ) : label}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
