import type { CSSProperties } from "react";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { eventTimeLabel } from "@/lib/eventDisplay";
import ZLineIcon from "@/components/ZLineIcon";
import EventFlyerArt from "./EventFlyerArt";
import { CardArtworkGlass } from '../CardArtworkGlass';
import { LiveBadge, type TonightCardLive } from "@/components/home/TonightEventCard";
import type { EventListing } from "@shared/multiDayEvents";

/**
 * Compact rail card for the mobile Eventz rails: the flyer with the title on a short dark fade at its bottom and save in
 * its top-right corner. "time · venue" sits on the flyer under the title; nothing sits under the card. Opens the same event card. With no flyer, the day motif
 * (with the weekday) is the art.
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
    <article className={`event-rail-card event-rail-card--${size} pdx-glass-rebind`} style={{ "--c": dayAccentToken(listingDay(listing)), "--card-secondary-override": dayComplementToken(listingDay(listing)) } as CSSProperties}>
      <button type="button" className="event-rail-card__open" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
        <span className="event-rail-card__art">
          <EventFlyerArt src={poster} day={listingDay(listing)} showDay={size === "m"} title={listing.title} venueName={listing.venueName} />
          <CardArtworkGlass />
          {liveState && size === "m" ? <LiveBadge live={liveState} /> : null}
          <span className="event-rail-card__shade"><span className="event-rail-card__title">{listing.title}</span><span className="event-rail-card__meta">{eventTimeLabel(listing.dateStart)} · {listing.venueName}</span></span>
        </span>
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
