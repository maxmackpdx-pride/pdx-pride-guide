import { rememberCardOrigin } from "@/components/cards/CardAPI";
import { useEffect, useState, type CSSProperties } from "react";
import { Share2 } from "lucide-react";
import { parsePacificDateTime } from "@shared/missedConnections";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { eventTimeLabel } from "@/lib/eventDisplay";
import { sharePageLink } from "@/lib/shareEvent";
import { useToast } from "@/hooks/use-toast";
import { eventPath } from "@shared/eventSlug";
import { CardHeartButton } from "@/components/CardHeartButton";
import EventFlyerArt from "./EventFlyerArt";
import { CardArtworkGlass } from '../CardArtworkGlass';
import { LiveBadge, type TonightCardLive } from "@/components/home/TonightEventCard";
import type { EventListing } from "@shared/multiDayEvents";
import "./EventSquareCard.css";

/**
 * Compact countdown for the Square face (v12): "STARTS IN" over the single
 * largest unit (13 DAYS / 15 HRS / 45 MIN), bottom-right above the heart.
 * Renders nothing once the event has started (the live badge takes over).
 */
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
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const [value, unit] = days >= 1 ? [days, "days"] : hours >= 1 ? [hours, "hrs"] : [minutes, "min"];
  return (
    <span className="event-square-card__count" role="timer" aria-label={`Starts in ${days} days, ${hours} hours, ${minutes} minutes`}>
      <span className="event-square-card__count-l">Starts in</span>
      <span className="event-square-card__count-v">{value} {unit}</span>
    </span>
  );
}

/**
 * Square event face (250x250 in the five-format setup): the flyer is the whole
 * face, SHARE top-left, title and "time · venue" on the ink at the bottom,
 * the compact STARTS IN countdown and the save heart bottom-right. Edge bloom
 * follows the flyer accent when one is set.
 * Made-by: Muse
 */
export default function EventSquareCard({
  listing,
  saved,
  liveState,
  onToggleSave,
  onOpen,
}: {
  listing: EventListing;
  saved: boolean;
  liveState?: TonightCardLive | null;
  onToggleSave: (id: number) => void;
  onOpen: (listing: EventListing) => void;
}) {
  const { toast } = useToast();
  const poster = listingPosterUrl(listing);
  const flyerAccent = (listing as { accentColor?: string | null }).accentColor || null;
  return (
    <article data-card-size="square" data-card-category={"eventz"} onClickCapture={rememberCardOrigin} className="event-square-card pdx-glass-rebind" style={{ "--c": flyerAccent ?? dayAccentToken(listingDay(listing)), "--card-secondary-override": dayComplementToken(listingDay(listing)) } as CSSProperties}>
      <button type="button" className="event-square-card__open" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
        <span className="event-square-card__art">
          <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={listing.title} venueName={listing.venueName} parallax />
          <CardArtworkGlass />
          <span className="event-square-card__shade"><span className="event-square-card__title">{listing.title}</span><span className="event-square-card__meta">{eventTimeLabel(listing.dateStart)} · {listing.venueName}</span></span>
        </span>
      </button>
      {liveState ? null : <SquareStartsIn listing={listing} />}
      <button type="button" className="event-square-card__share" aria-label={`Share ${listing.title}`} onClick={async (e) => {
        e.stopPropagation();
        try {
          const result = await sharePageLink(eventPath(listing.id, listing.title, listing.dayOfWeek), listing.title);
          if (result === "copied") toast({ title: "Link copied" });
        } catch (error) {
          if ((error as Error)?.name !== "AbortError") toast({ title: "Could not share. Please try again.", variant: "destructive" });
        }
      }}><Share2 size={17} aria-hidden="true" /></button>
      {liveState ? <span className="event-square-card__live"><LiveBadge live={liveState} /></span> : null}
      <CardHeartButton active={saved}
        className="event-square-card__save"
        aria-pressed={saved}
        aria-label={`${saved ? "Remove" : "Add"} ${listing.title} ${saved ? "from" : "to"} my schedule`}
        onClick={event => { event.stopPropagation(); onToggleSave(listing.id); }}
      />
    </article>
  );
}
