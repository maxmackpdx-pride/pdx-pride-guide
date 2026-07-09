import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { DAYS, type DayKey } from "@shared/prideWeek";
import { buildScheduleEvents } from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import RailCard from "@/components/RailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./HomeSchedule.css";

/**
 * Home page "1D" — day-tabbed big-flyer grid. Ported from the design
 * mock's `1d` variant (The Schedule.dc.html): pick a day, see its flyers
 * full-size. Replaces the old `<Schedule embed />` grid on Home.tsx.
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

  const daysWithCounts = useMemo(
    () => DAYS.map(d => ({ ...d, count: scheduleEvents.filter(e => e.day === d.key).length })),
    [scheduleEvents],
  );

  const [activeDay, setActiveDay] = useState<DayKey>(() => {
    const firstWithEvents = daysWithCounts.find(d => d.count > 0);
    return firstWithEvents?.key ?? DAYS[0].key;
  });

  const activeDayDef = daysWithCounts.find(d => d.key === activeDay) ?? daysWithCounts[0];

  const dayEvents = useMemo(
    () => scheduleEvents.filter(e => e.day === activeDay).sort((a, b) => a.s - b.s),
    [scheduleEvents, activeDay],
  );

  const openEvent = (listing: EventListing) => setSelectedEvent(listing);
  const closeEvent = () => setSelectedEvent(null);

  return (
    <div className="hsch-card">
      <div className="hsch-seam" />

      <div className="hsch-section">
        <div className="hsch-tabs">
          {daysWithCounts.map(d => {
            const active = d.key === activeDay;
            return (
              <button
                key={d.key}
                type="button"
                className="hsch-tab"
                onClick={() => setActiveDay(d.key)}
                style={{
                  borderColor: active ? d.color : "#2b2b2b",
                  background: active ? d.color : "transparent",
                  color: active ? "#000" : "#c9c9c9",
                  boxShadow: active ? `0 0 16px -5px ${d.color}` : "none",
                }}
              >
                <span>{d.short}</span>
                <span className="hsch-tab-date" style={{ color: active ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.4)" }}>
                  {d.date}
                </span>
                <span className="hsch-tab-count" style={{ color: active ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.35)" }}>
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeDayDef && (
          <div className="hsch-day-head" style={{ color: activeDayDef.text }}>
            {activeDayDef.label} · {activeDayDef.date} · {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
          </div>
        )}

        {dayEvents.length > 0 ? (
          <div className="hsch-tab-grid">
            {dayEvents.map(e => {
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
                  fill
                />
              );
            })}
          </div>
        ) : (
          <div className="hsch-quiet">Nothing on this day yet — check back soon.</div>
        )}
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
