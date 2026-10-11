import type { CSSProperties } from "react";
import { dayAccentToken } from "@/lib/dsColors";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { eventTimeLabel } from "@/lib/eventDisplay";
import ZLineIcon from "@/components/ZLineIcon";
import DayMotif from "./DayMotif";
import EventFlyerArt from "./EventFlyerArt";
import { LiveBadge, type TonightCardLive } from "@/components/home/TonightEventCard";
import type { EventListing } from "@shared/multiDayEvents";

/**
 * Compact rail card for the mobile Eventz rails: flyer, save on the flyer,
 * then title and "time · venue" underneath. Opens the same event card.
 * Day motif: faint behind the title and time on flyer cards; the art itself
 * (with the weekday) when the event has no flyer.
 */
export default function EventRailCard({
  listing,
  size,
  saved,
  liveState,
  onToggleSave,
  onOpen,
}: {
  listing: EventListing;
  size: "m" | "s";
  saved: boolean;
  liveState?: TonightCardLive | null;
  onToggleSave: (id: number) => void;
  onOpen: (listing: EventListing) => void;
}) {
  const poster = listingPosterUrl(listing);
  return (
    <article className={`event-rail-card event-rail-card--${size} pdx-glass-rebind`} style={{ "--c": dayAccentToken(listingDay(listing)) } as CSSProperties}>
      <button type="button" className="event-rail-card__open" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
        <span className="event-rail-card__art">
          <EventFlyerArt src={poster} day={listingDay(listing)} showDay={size === "m"} />
          {liveState && size === "m" ? <LiveBadge live={liveState} /> : null}
        </span>
        {poster ? <DayMotif day={listingDay(listing)} placement="low" /> : null}
        <span className="event-rail-card__title">{listing.title}</span>
        <span className="event-rail-card__meta">{eventTimeLabel(listing.dateStart)} · {listing.venueName}</span>
      </button>
      <button
        type="button"
        className="event-rail-card__save"
        aria-pressed={saved}
        aria-label={`${saved ? "Remove" : "Add"} ${listing.title} ${saved ? "from" : "to"} my schedule`}
        onClick={() => onToggleSave(listing.id)}
      >
        <ZLineIcon name="favorite" size={17} filled={saved} />
      </button>
    </article>
  );
}
