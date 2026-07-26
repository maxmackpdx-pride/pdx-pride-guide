import { Link } from "wouter";
import type { EventListing } from "@shared/multiDayEvents";
import { formatUpNextWhen } from "@/lib/homeEvents";
import { listingDay, listingPosterUrl, listingTypeTags } from "@/lib/dsEvent";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { spawnRsvpSparks } from "@/components/RsvpSparks";
import AuthModal from "@/components/AuthModal";

type Props = {
  events: EventListing[];
  posterBackdrop?: boolean;
};

function typePillClass(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("donat")) return "home-up-next__tag--donation";
  if (lower.includes("ticket")) return "home-up-next__tag--ticketed";
  return "home-up-next__tag--door";
}

export default function HomeUpNext({ events, posterBackdrop = true }: Props) {
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();

  if (events.length === 0) return null;

  return (
    <section className="home-up-next" aria-label="Up next">
      <div className="home-up-next__head">
        <div className="home-up-next__kicker">
          <span className="home-up-next__dot" aria-hidden />
          Up next
        </div>
        <span className="home-up-next__lede">Coming up next on Zaylist:</span>
      </div>
      <div className="home-up-next__grid">
        {events.map(event => {
          const tags = listingTypeTags(event, 1);
          const tag = tags[0] || "Event";
          const rsvped = myEventIds.has(event.id);
          const href = `/events/${event.id}`;
          const poster = listingPosterUrl(event);
          const day = listingDay(event).toLowerCase();
          const locationLine = [event.venueName, event.neighborhood].filter(Boolean).join(" · ") || "Portland";

          return (
            <Link
              key={event.id}
              href={href}
              className="home-up-next__card pdx-glass-rebind"
              style={{ ["--up-day" as string]: `var(--day-${day})` }}
            >
              {posterBackdrop && poster && (
                <>
                  <img className="home-up-next__backdrop" src={poster} alt="" decoding="async" loading="lazy" />
                  <div className="home-up-next__backdrop-scrim" aria-hidden />
                </>
              )}
              <div className="home-up-next__body">
                <div className="home-up-next__when">{formatUpNextWhen(event)}</div>
                <div className="home-up-next__title">{event.title}</div>
                <div className="home-up-next__venue">{locationLine}</div>
                <div className="home-up-next__foot">
                  <span className={`home-up-next__tag ${typePillClass(tag)}`}>{tag}</span>
                  <button
                    type="button"
                    className={`home-up-next__rsvp${rsvped ? " home-up-next__rsvp--going" : ""}`}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!rsvped) spawnRsvpSparks(e.currentTarget);
                      toggleRsvp(event.id);
                    }}
                  >
                    {rsvped ? "Going ✓" : "RSVP"}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </section>
  );
}
