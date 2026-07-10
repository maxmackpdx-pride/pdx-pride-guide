import { useMemo, useState } from "react";
import { EventCard, PosterCard } from "@/components/ds";
import { eventPath } from "@shared/eventSlug";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import type { ProfileEvent, PublicProfile } from "./types";

function fmtWhen(dateStart?: string | null): string {
  if (!dateStart) return "";
  const d = new Date(dateStart);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventRows({
  events,
  myEventIds,
  toggleRsvp,
  showRsvp,
}: {
  events: ProfileEvent[];
  myEventIds: Set<number>;
  toggleRsvp: (id: number) => void;
  showRsvp?: boolean;
}) {
  if (!events.length) return <p className="profile-empty">Nothing here yet.</p>;
  return (
    <div className="profile-event-list">
      {events.map(ev => (
        <EventCard
          key={ev.id}
          title={ev.title}
          venue={ev.venueName || undefined}
          when={fmtWhen(ev.dateStart)}
          day={ev.dayOfWeek || "FRI"}
          image={ev.posterImageUrl || undefined}
          types={ev.eventTypes || []}
          admission={ev.admission || undefined}
          going={ev.goingCount ?? undefined}
          href={eventPath(ev.id, ev.title, ev.dayOfWeek || undefined)}
          ticketHref={ev.ticketUrl || undefined}
          onSave={
            showRsvp
              ? () => toggleRsvp(ev.id)
              : undefined
          }
          saved={showRsvp ? myEventIds.has(ev.id) : undefined}
        />
      ))}
    </div>
  );
}

export default function EventsTab({ profile }: { profile: PublicProfile }) {
  const isPromoter = !!(profile.isPromoter || profile.verifiedHost);
  const [hostFilter, setHostFilter] = useState<"upcoming" | "past">("upcoming");
  const [memFilter, setMemFilter] = useState<"upcoming" | "past">("upcoming");
  const [showAllPast, setShowAllPast] = useState(false);
  const { myEventIds, toggleRsvp } = useEventRsvp();

  const hostingUpcoming = profile.activity?.hostingUpcoming || profile.activity?.hostedEvents || [];
  const hostingPast = profile.activity?.hostingPast || [];
  const goingTo = profile.activity?.goingTo || [];
  const attendedPast = profile.activity?.attendedPast || [];

  const pastShown = useMemo(() => {
    if (showAllPast) return hostingPast;
    return hostingPast.slice(0, 4);
  }, [hostingPast, showAllPast]);

  if (isPromoter) {
    const list = hostFilter === "upcoming" ? hostingUpcoming : pastShown;
    return (
      <div>
        <h2 className="profile-section-title">Hosting</h2>
        <div className="profile-toggle" role="group" aria-label="Hosting filter">
          <button type="button" className={hostFilter === "upcoming" ? "is-on" : ""} onClick={() => setHostFilter("upcoming")}>
            Upcoming
          </button>
          <button type="button" className={hostFilter === "past" ? "is-on" : ""} onClick={() => setHostFilter("past")}>
            Past
          </button>
        </div>

        {hostFilter === "upcoming" ? (
          list.length === 0 ? (
            <p className="profile-empty">No upcoming hosted shows.</p>
          ) : (
            <div className="profile-poster-grid">
              {list.map(ev => (
                <PosterCard
                  key={ev.id}
                  title={ev.title}
                  venue={ev.venueName || undefined}
                  when={fmtWhen(ev.dateStart)}
                  day={ev.dayOfWeek || "FRI"}
                  image={ev.posterImageUrl || undefined}
                  types={ev.eventTypes || []}
                  admission={ev.admission || undefined}
                  going={ev.goingCount ?? 0}
                  href={eventPath(ev.id, ev.title, ev.dayOfWeek || undefined)}
                  ticketHref={ev.ticketUrl || undefined}
                  onRsvp={() => toggleRsvp(ev.id)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            <EventRows events={list} myEventIds={myEventIds} toggleRsvp={toggleRsvp} />
            {!showAllPast && hostingPast.length > 4 && (
              <button type="button" className="profile-link-btn" onClick={() => setShowAllPast(true)}>
                Show all {hostingPast.length} past shows
              </button>
            )}
          </>
        )}

        <h2 className="profile-section-title" style={{ marginTop: 28 }}>
          Going to
        </h2>
        <EventRows events={goingTo} myEventIds={myEventIds} toggleRsvp={toggleRsvp} showRsvp />
      </div>
    );
  }

  const memList = memFilter === "upcoming" ? goingTo : attendedPast;
  return (
    <div>
      <h2 className="profile-section-title">Events</h2>
      <div className="profile-toggle" role="group" aria-label="Events filter">
        <button type="button" className={memFilter === "upcoming" ? "is-on" : ""} onClick={() => setMemFilter("upcoming")}>
          Upcoming
        </button>
        <button type="button" className={memFilter === "past" ? "is-on" : ""} onClick={() => setMemFilter("past")}>
          Past
        </button>
      </div>
      <EventRows events={memList} myEventIds={myEventIds} toggleRsvp={toggleRsvp} showRsvp />
    </div>
  );
}
