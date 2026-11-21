import { EventFrontSheen } from "@/components/events/EventFrontSheen";
import { formatCardCountdown } from '@/lib/countdown';
import { rememberCardOrigin } from "@/components/cards/CardAPI";
import { useEffect, useState, type CSSProperties } from "react";
import { parsePacificDateTime } from "@shared/missedConnections";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { eventTimeLabel } from "@/lib/eventDisplay";
import { EventFrontHeart } from "@/components/events/EventParticipation";
import EventFlyerArt from "./EventFlyerArt";
import { LiveBadge, type TonightCardLive } from "@/components/home/TonightEventCard";
import type { EventListing } from "@shared/multiDayEvents";
import "./EventSquareCard.css";

/** Time to the next start, from the event clock shared by all card sizes. */
function SquareStartsIn({ listing }: { listing: EventListing }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const startMs = parsePacificDateTime(listing.dateStart);
  if (startMs == null) return null;
  const remaining = startMs - now;
  if (remaining <= 0) return null;
  const countdown = formatCardCountdown(remaining);
  return (
    <span className="event-square-card__count" role="timer" aria-label={`Starts in ${countdown}`}>
      <span className="event-square-card__count-l">Starts in</span>
      <span className="event-square-card__count-v">{countdown}</span>
    </span>
  );
}

/** Fixed square flyer with a separate bottom-right interest action. */
export default function EventSquareCard({
  listing,
  liveState,
  onOpen,
}: {
  listing: EventListing;
  saved: boolean;
  liveState?: TonightCardLive | null;
  onToggleSave: (id: number) => void;
  onOpen: (listing: EventListing) => void;
}) {
  const poster = listingPosterUrl(listing);
  const flyerAccent = (listing as { accentColor?: string | null }).accentColor || null;
  return (
    <article data-card-size="square" data-card-category={"eventz"} onClickCapture={rememberCardOrigin} className="event-square-card pdx-glass-rebind" style={{ "--c": flyerAccent ?? dayAccentToken(listingDay(listing)), "--card-secondary-override": dayComplementToken(listingDay(listing)) } as CSSProperties}>
      <button type="button" className="event-square-card__open" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
        <span className="event-square-card__art">
          <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={listing.title} venueName={listing.venueName} parallax />
          <EventFrontSheen/>
          <span className="event-square-card__shade"><span className="event-square-card__title">{listing.title}</span><span className="event-square-card__meta">{eventTimeLabel(listing.dateStart)} · {listing.venueName}</span></span>
        </span>
      </button>
      {liveState ? null : <SquareStartsIn listing={listing} />}
      {liveState ? <span className="event-square-card__live"><LiveBadge live={liveState} /></span> : null}
      <EventFrontHeart listing={listing} className="event-square-card__save"/>
    </article>
  );
}
