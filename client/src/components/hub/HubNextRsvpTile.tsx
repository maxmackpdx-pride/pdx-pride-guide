import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { EventListing } from "@shared/multiDayEvents";
import { apiRequest } from "@/lib/queryClient";
import { formatUpNextWhen, nextRsvpEvent } from "@/lib/homeEvents";
import { listingDay, listingPosterUrl, listingTypeTags } from "@/lib/dsEvent";
import { useAuth } from "@/context/AuthContext";
import { useEventRsvp } from "@/hooks/useEventRsvp";

function typePillClass(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("donat")) return "hub-next-rsvp__tag--donation";
  if (lower.includes("ticket")) return "hub-next-rsvp__tag--ticketed";
  return "hub-next-rsvp__tag--door";
}

/**
 * Mobile-only poster tile at the top of member hub - the member's next RSVP'd event.
 */
export default function HubNextRsvpTile() {
  const { user } = useAuth();
  const { myEventIds } = useEventRsvp();

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    enabled: !!user,
    staleTime: 60_000,
  });

  const event = useMemo(
    () => (user ? nextRsvpEvent(events, myEventIds) : null),
    [user, events, myEventIds],
  );

  if (!event) return null;

  const tags = listingTypeTags(event, 1);
  const tag = tags[0] || "Event";
  const href = `/events/${event.id}`;
  const poster = listingPosterUrl(event);
  const day = listingDay(event).toLowerCase();
  const locationLine = [event.venueName, event.neighborhood].filter(Boolean).join(" · ") || "Portland";

  return (
    <section className="hub-next-rsvp" aria-label="Your next RSVP">
      <div className="hub-next-rsvp__head">
        <div className="hub-next-rsvp__kicker">
          <span className="hub-next-rsvp__dot" aria-hidden />
          Your next night out
        </div>
      </div>
      <Link
        href={href}
        className="hub-next-rsvp__card pdx-glass-rebind"
        style={{ ["--hub-rsvp-day" as string]: `var(--day-${day})` }}
      >
        {poster && (
          <>
            <img className="hub-next-rsvp__backdrop" src={poster} alt="" decoding="async" loading="lazy" />
            <div className="hub-next-rsvp__backdrop-scrim" aria-hidden />
          </>
        )}
        <div className="hub-next-rsvp__body">
          <div className="hub-next-rsvp__when">{formatUpNextWhen(event)}</div>
          <div className="hub-next-rsvp__title">{event.title}</div>
          <div className="hub-next-rsvp__venue">{locationLine}</div>
          <div className="hub-next-rsvp__foot">
            <span className={`hub-next-rsvp__tag ${typePillClass(tag)}`}>{tag}</span>
            <span className="hub-next-rsvp__going pdx-glass-rebind">Going ✓</span>
          </div>
        </div>
      </Link>
    </section>
  );
}