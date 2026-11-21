import { useEffect, useState, type CSSProperties } from "react";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import { EventFrontCountdown, eventFrontCountdownState } from "@/components/events/EventFlyerFront";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { dayAccentToken } from "@/lib/dsColors";
import type { DrawerTopEvent } from "@shared/drawerTop";
import type { Event } from "@shared/schema";
import "@/components/events/EventFlyerFront.css";
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
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (nowProp != null) return;
    const id = window.setInterval(() => setTick(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [nowProp]);
  const now = nowProp ?? tick;
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
  const countdown = eventFrontCountdownState(event, now);
  return (
    <article
      className="drawer-count pdx-glass-rebind"
      style={{ "--c": accent, "--a": accent } as CSSProperties}
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
        aria-label={countdown.parts ? `${event.title}, ${countdown.label.toLowerCase()} ${countdown.parts.d} days ${countdown.parts.h} hours ${countdown.parts.m} minutes` : `${event.title}, ${countdown.label}`}
      >
        <EventFrontCountdown label={countdown.label} parts={countdown.parts} />
        <span className="drawer-count__name">{event.title}</span>
      </button>
    </article>
  );
}
