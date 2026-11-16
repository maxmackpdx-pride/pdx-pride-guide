import { rememberCardOrigin } from "@/components/cards/CardAPI";
import type { CSSProperties } from "react";
import { Share2 } from "lucide-react";
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
 * Square event face (250x250 in the five-format setup): the flyer is the whole
 * face, SHARE top-left, save heart top-right, title and "time · venue" on the
 * ink at the bottom. Edge bloom follows the flyer accent when one is set.
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
          <EventFlyerArt src={poster} day={listingDay(listing)} showDay={false} title={listing.title} venueName={listing.venueName} />
          <CardArtworkGlass />
          <span className="event-square-card__shade"><span className="event-square-card__title">{listing.title}</span><span className="event-square-card__meta">{eventTimeLabel(listing.dateStart)} · {listing.venueName}</span></span>
        </span>
      </button>
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
