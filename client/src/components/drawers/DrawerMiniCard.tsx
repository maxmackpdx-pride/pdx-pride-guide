import { useEffect, useState, type CSSProperties } from "react";
import { CardHeartButton } from "@/components/CardHeartButton";
import RailShareButton from "@/components/home/RailShareButton";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { dayAccentToken } from "@/lib/dsColors";
import { eventPath } from "@shared/eventSlug";
import { formatDrawerCountdown, remainingToStart, type DrawerTopEvent } from "@shared/drawerTop";
import type { Event } from "@shared/schema";
import "./DrawerTop.css";

/**
 * Full-bleed mini event card for Placez drawer rails. Same share and heart
 * placement as other small cards: share top-right, heart bottom-right.
 */
export default function DrawerMiniCard({
  event,
  saved = false,
  onToggleSave,
  onOpen,
}: {
  event: DrawerTopEvent;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onOpen?: (event: DrawerTopEvent) => void;
}) {
  "use memo";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const listing = event as unknown as Event;
  const poster = listingPosterUrl(listing);
  const accent = event.accentColor || dayAccentToken(listingDay(listing));
  const remaining = remainingToStart(event.dateStart, now);
  return (
    <article
      data-card-size="small"
      data-card-category="eventz"
      data-testid="drawer-mini-card"
      className="drawer-mini pdx-glass-rebind"
      style={{ "--c": accent } as CSSProperties}
    >
      <div className="drawer-mini__art" aria-hidden="true">
        <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={event.title} venueName={event.venueName || ""} />
      </div>
      <button type="button" className="drawer-mini__open" onClick={() => onOpen?.(event)} aria-label={`Open ${event.title}`}>
        <span className="drawer-mini__meta">
          <span className="drawer-mini__title">{event.title}</span>
          {remaining ? <span className="drawer-mini__count">{formatDrawerCountdown(remaining)}</span> : null}
        </span>
      </button>
      <RailShareButton href={eventPath(event.id, event.title, event.dayOfWeek)} title={event.title} />
      {onToggleSave ? (
        <CardHeartButton
          active={saved}
          aria-label={`${saved ? "Remove" : "Add"} ${event.title} ${saved ? "from" : "to"} my schedule`}
          onClick={click => { click.stopPropagation(); onToggleSave(event.id); }}
        />
      ) : null}
    </article>
  );
}
