import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { DAYS, DAY_SORT_ORDER } from "@shared/prideWeek";
import { buildScheduleEvents } from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import RailCard from "@/components/RailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./HomeSchedule.css";

/**
 * Home page "1B" — headliner rail + Night-by-Night day stacks.
 * Ported from the design mock's `1b` variant (The Schedule.dc.html).
 * Replaces the old `<Schedule embed />` grid on Home.tsx.
 */
export default function HomeSchedule() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();

  const { data: listings = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
  });

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(listings, attendanceSummaries),
    [listings, attendanceSummaries],
  );

  const listingById = useMemo(() => {
    const m = new Map<number, EventListing>();
    for (const l of listings) if (!m.has(l.id)) m.set(l.id, l);
    return m;
  }, [listings]);

  const headliners = useMemo(
    () =>
      scheduleEvents
        .filter(e => e.feat)
        .sort((a, b) => (DAY_SORT_ORDER[a.day] ?? 99) - (DAY_SORT_ORDER[b.day] ?? 99) || a.s - b.s),
    [scheduleEvents],
  );

  const byDay = useMemo(
    () =>
      DAYS.map(d => ({
        ...d,
        items: scheduleEvents.filter(e => e.day === d.key).sort((a, b) => a.s - b.s),
      })).filter(d => d.items.length > 0),
    [scheduleEvents],
  );

  const openEvent = (listing: EventListing) => setSelectedEvent(listing);
  const closeEvent = () => setSelectedEvent(null);

  return (
    <div className="hsch-card">
      <div className="hsch-seam" />

      {headliners.length > 0 && (
        <div className="hsch-section">
          <div className="hsch-section-label" style={{ color: "var(--neon-yellow)" }}>
            The Headliners
          </div>
          <div className="hsch-rail">
            {headliners.map(e => {
              const listing = listingById.get(e.id);
              if (!listing) return null;
              return (
                <RailCard
                  key={e.scheduleKey}
                  event={e}
                  listing={listing}
                  rsvped={myEventIds.has(e.id)}
                  onToggleRsvp={toggleRsvp}
                  onOpen={openEvent}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="hsch-seam hsch-seam--thin" />

      <div className="hsch-section">
        <div className="hsch-section-label" style={{ color: "var(--neon-cyan)" }}>
          Night by Night
        </div>
        <div className="hsch-byday-grid">
          {byDay.map(d => (
            <div key={d.key}>
              <div className="hsch-day-hdr" style={{ borderBottomColor: `${d.color}80` }}>
                <span className="hsch-day-name" style={{ color: d.text }}>{d.short}</span>
                <span className="hsch-day-date">{d.date}</span>
                <span className="hsch-day-count" style={{ color: d.text }}>{d.items.length}</span>
              </div>
              <div className="hsch-day-list">
                {d.items.map(e => {
                  const listing = listingById.get(e.id);
                  if (!listing) return null;
                  return (
                    <RailCard
                      key={e.scheduleKey}
                      event={e}
                      listing={listing}
                      rsvped={myEventIds.has(e.id)}
                      onToggleRsvp={toggleRsvp}
                      onOpen={openEvent}
                      variant="compact"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEvent}
          onEventUpdated={updated => setSelectedEvent(updated)}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
