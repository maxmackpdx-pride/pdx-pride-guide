import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventCard, PosterCard } from "@/components/ds";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { eventPath } from "@shared/eventSlug";
import { formatListingWhen, listingDay, listingTypeTags } from "@/lib/dsEvent";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { Event } from "@shared/schema";
import { fmtEventWhen, promoterSectionKicker } from "./profileHelpers";
import type { ProfileEvent, PublicProfileData } from "./types";

type Filter = "upcoming" | "past";

function toDsEvent(e: ProfileEvent): Event {
  return {
    id: e.id,
    title: e.title,
    venueName: e.venueName || "",
    neighborhood: e.neighborhood || null,
    dayOfWeek: e.dayOfWeek || null,
    dateStart: e.dateStart || "",
    dateEnd: e.dateEnd || "",
    admission: e.admission || "FREE",
    posterImageUrl: e.posterImageUrl || null,
    eventTypes: JSON.stringify(e.eventTypes || []),
    description: "",
    address: e.address || null,
    lat: null,
    lng: null,
    ageRequirement: "ALL_AGES",
    ticketUrl: e.ticketUrl || null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: false,
    claimedBy: null,
    submittedBy: null,
    adminNotes: null,
    createdAt: "",
  };
}

type Props = { data: PublicProfileData };

export default function EventsTab({ data }: Props) {
  const isPromoter = !!data.isPromoter;
  const [hostFilter, setHostFilter] = useState<Filter>("upcoming");
  const [memFilter, setMemFilter] = useState<Filter>("upcoming");
  const [pastExpanded, setPastExpanded] = useState(false);
  const { user } = useAuth();
  const { myEventIds, toggleRsvp } = useEventRsvp();

  const { data: summaries = {} } = useQuery<Record<number, { count: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    enabled: !!user,
  });

  const hosting = data.events?.hosting || { upcoming: [], past: [] };
  const going = data.events?.going || { upcoming: [], past: [] };

  const renderToggle = (filter: Filter, setFilter: (f: Filter) => void) => (
    <div className="pp-filter-seg">
      {(["upcoming", "past"] as const).map(key => (
        <button
          key={key}
          type="button"
          className={`pp-filter-seg__btn display${filter === key ? " is-on" : ""}`}
          onClick={() => setFilter(key)}
        >
          {key === "upcoming" ? "Upcoming" : "Past"}
        </button>
      ))}
    </div>
  );

  const pastSlice = (items: ProfileEvent[]) => (pastExpanded ? items : items.slice(0, 2));

  const mapPoster = (e: ProfileEvent, withRsvp = false) => {
    const evt = toDsEvent(e);
    const goingCount = summaries[e.id]?.count ?? e.goingCount ?? 0;
    const types = listingTypeTags(evt);
    if (withRsvp && myEventIds.has(e.id)) types.unshift("Going");
    return (
      <PosterCard
        key={e.id}
        title={e.title}
        venue={e.venueName || undefined}
        when={formatListingWhen(evt)}
        day={listingDay(evt)}
        image={resolveEventPosterUrl(e.id, e.posterImageUrl)}
        types={types}
        admission={e.admission || undefined}
        going={goingCount}
        onRsvp={withRsvp ? () => toggleRsvp(e.id) : undefined}
        href={eventPath(e.id, e.title)}
        showLink={false}
      />
    );
  };

  const mapRow = (e: ProfileEvent, note?: string) => {
    const evt = toDsEvent(e);
    const types = listingTypeTags(evt);
    if (note) types.unshift(note);
    return (
      <EventCard
        key={e.id}
        title={e.title}
        venue={e.venueName || undefined}
        when={fmtEventWhen(e.dateStart, e.neighborhood)}
        day={listingDay(evt)}
        image={resolveEventPosterUrl(e.id, e.posterImageUrl || undefined) || undefined}
        types={types}
        admission={e.admission || undefined}
        going={e.goingCount}
        href={eventPath(e.id, e.title)}
      />
    );
  };

  if (!isPromoter) {
    const list = memFilter === "upcoming" ? going.upcoming : going.past;
    return (
      <section className="pp-events">
        <ProfileSectionHeader
          kicker="On the calendar"
          title="Events"
          kickerColor="var(--neon-cyan)"
          action={renderToggle(memFilter, setMemFilter)}
        />
        <div className="pp-event-rows">
          {list.length > 0 ? list.map(e => mapRow(e)) : (
            <p className="pp-empty-copy">No {memFilter} events yet.</p>
          )}
        </div>
      </section>
    );
  }

  const hostList = hostFilter === "upcoming" ? hosting.upcoming : pastSlice(hosting.past);

  const sectionKicker = promoterSectionKicker(data);

  return (
    <div className="pp-events">
      <section>
        <ProfileSectionHeader
          kicker={sectionKicker}
          title="Hosting"
          kickerColor="var(--profile-acc-t)"
          action={renderToggle(hostFilter, setHostFilter)}
        />
        {hostFilter === "upcoming" ? (
          <div className="pp-poster-grid">
            {hostList.length > 0 ? hostList.map(e => mapPoster(e, true)) : (
              <p className="pp-empty-copy">No upcoming shows on the calendar.</p>
            )}
          </div>
        ) : (
          <>
            <div className="pp-event-rows">
              {hostList.map(e => mapRow(e, e.admission === "TICKETED" ? "Sold out" : undefined))}
            </div>
            {hosting.past.length > 2 && (
              <button type="button" className="pp-expand-btn display" onClick={() => setPastExpanded(v => !v)}>
                {pastExpanded ? "Show less" : `Show all ${hosting.past.length} past shows`}
              </button>
            )}
          </>
        )}
      </section>

      {going.upcoming.length > 0 && (
        <section className="pp-events__going">
          <ProfileSectionHeader
            kicker="Out on the town"
            title="Going to"
            kickerColor="var(--neon-cyan)"
          />
          <div className="pp-event-rows">
            {going.upcoming.map(e => mapRow(e))}
          </div>
        </section>
      )}
    </div>
  );
}