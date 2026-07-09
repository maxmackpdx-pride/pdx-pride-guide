import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { DAY_SORT_ORDER, PRIDE_WEEK_END_DATE, PRIDE_WEEK_START_DATE, type DayKey } from "@shared/prideWeek";
import { pacificDayOfWeek } from "@shared/missedConnections";
import { buildScheduleEvents, type ScheduleEvent } from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import RailCard from "@/components/RailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./EventsNowPanel.css";

const PACIFIC_TZ = "America/Los_Angeles";

/** Real "now" within Pride Week Pacific time, or null if today is outside the week. */
function nowInPrideWeek(): { day: DayKey; minutes: number } | null {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: PACIFIC_TZ }).format(now);
  if (dateStr < PRIDE_WEEK_START_DATE || dateStr > PRIDE_WEEK_END_DATE) return null;
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  const minute = Number(parts.minute);
  let minutes = hour * 60 + minute;
  if (hour < 4) minutes += 1440;
  return { day: pacificDayOfWeek(now.getTime()) as DayKey, minutes };
}

/**
 * Events page "1C" — On Now / Starting Soon / Big This Weekend rails,
 * placed left of the map at the map's height. Ported from the design
 * mock's `1c` variant (The Schedule.dc.html), with real current-time
 * "on now" logic instead of the mock's hardcoded demo clock.
 */
export default function EventsNowPanel() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();
  const [clock, setClock] = useState(() => nowInPrideWeek());

  useEffect(() => {
    const t = setInterval(() => setClock(nowInPrideWeek()), 60_000);
    return () => clearInterval(t);
  }, []);

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

  const onNow: ScheduleEvent[] = useMemo(() => {
    if (!clock) return [];
    return scheduleEvents
      .filter(e => e.day === clock.day && e.s <= clock.minutes && clock.minutes < e.e)
      .sort((a, b) => a.e - b.e);
  }, [scheduleEvents, clock]);

  const soon: ScheduleEvent[] = useMemo(() => {
    if (!clock) return [];
    return scheduleEvents
      .filter(e => e.day === clock.day && e.s > clock.minutes)
      .sort((a, b) => a.s - b.s)
      .slice(0, 8);
  }, [scheduleEvents, clock]);

  const weekend: ScheduleEvent[] = useMemo(
    () =>
      scheduleEvents
        .filter(e => e.feat)
        .sort((a, b) => (DAY_SORT_ORDER[a.day] ?? 99) - (DAY_SORT_ORDER[b.day] ?? 99) || a.s - b.s),
    [scheduleEvents],
  );

  const openEvent = (listing: EventListing) => setSelectedEvent(listing);
  const closeEvent = () => setSelectedEvent(null);

  const rail = (events: ScheduleEvent[], live: boolean) =>
    events.map(e => {
      const listing = listingById.get(e.id);
      if (!listing) return null;
      return (
        <RailCard
          key={e.scheduleKey}
          event={e}
          listing={listing}
          rsvped={myEventIds.has(e.id)}
          live={live}
          onToggleRsvp={toggleRsvp}
          onOpen={openEvent}
        />
      );
    });

  const nothingLiveToday = clock == null || (onNow.length === 0 && soon.length === 0);

  return (
    <div className="enp-panel">
      <div className="enp-head">
        <div className="enp-kicker">
          <span className="enp-kicker-bar" />
          Right Now
        </div>
        <h2 className="enp-title">The Schedule</h2>
      </div>
      <div className="enp-seam" />
      <div className="enp-body">
        {onNow.length > 0 && (
          <div className="enp-section">
            <div className="enp-section-hdr">
              <span className="enp-livedot" />
              <span className="enp-section-title">On Now</span>
            </div>
            <div className="enp-rail">{rail(onNow, true)}</div>
          </div>
        )}
        {soon.length > 0 && (
          <div className="enp-section">
            <div className="enp-section-hdr">
              <span className="enp-section-title" style={{ color: "var(--neon-cyan)" }}>Starting Soon</span>
            </div>
            <div className="enp-rail">{rail(soon, false)}</div>
          </div>
        )}
        {nothingLiveToday && (
          <div className="enp-quiet">
            {clock == null ? "Pride Week hasn't started yet — here's what's coming up." : "Nothing on right this minute — here's what's coming up."}
          </div>
        )}
        {weekend.length > 0 && (
          <div className="enp-section">
            <div className="enp-section-hdr">
              <span className="enp-section-title" style={{ color: "var(--neon-yellow)" }}>Big This Weekend</span>
            </div>
            <div className="enp-rail">{rail(weekend, false)}</div>
          </div>
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
