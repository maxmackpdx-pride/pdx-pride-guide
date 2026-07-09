import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import {
  buildScheduleEvents,
  liveScheduleEvents,
  upcomingScheduleEvents,
  type ScheduleEvent,
} from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useTheme } from "@/context/ThemeContext";
import RailCard from "@/components/RailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./EventsNowPanel.css";

/**
 * Events page panel beside the map: two right-to-left marquees —
 * Happening Now (anything currently between start and end) and
 * Up Next (next 10 not-yet-started events).
 */
export default function EventsNowPanel() {
  const { calmMode } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
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

  const happeningNow = useMemo(
    () => liveScheduleEvents(scheduleEvents, nowMs),
    [scheduleEvents, nowMs],
  );

  const upNext = useMemo(
    () => upcomingScheduleEvents(scheduleEvents, nowMs, 10),
    [scheduleEvents, nowMs],
  );

  const openEvent = (listing: EventListing) => setSelectedEvent(listing);
  const closeEvent = () => setSelectedEvent(null);

  const cards = (events: ScheduleEvent[], live: boolean, keyPrefix: string) =>
    events.flatMap((e, i) => {
      const listing = listingById.get(e.id);
      if (!listing) return [];
      return [
        <RailCard
          key={`${keyPrefix}-${e.scheduleKey}-${i}`}
          event={e}
          listing={listing}
          rsvped={myEventIds.has(e.id)}
          live={live}
          size="sm"
          onToggleRsvp={toggleRsvp}
          onOpen={openEvent}
        />,
      ];
    });

  return (
    <div className="enp-panel">
      <div className="enp-body">
        <MarqueeRow
          title="Happening Now"
          live
          empty="Nothing live right now"
          count={happeningNow.length}
          animate={!calmMode && happeningNow.length >= 3}
          cardsA={cards(happeningNow, true, "now-a")}
          cardsB={cards(happeningNow, true, "now-b")}
        />

        <MarqueeRow
          title="Up Next"
          empty="No upcoming events"
          count={upNext.length}
          animate={!calmMode && upNext.length >= 3}
          cardsA={cards(upNext, false, "next-a")}
          cardsB={cards(upNext, false, "next-b")}
        />
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

function MarqueeRow({
  title,
  live,
  empty,
  count,
  animate,
  cardsA,
  cardsB,
}: {
  title: string;
  live?: boolean;
  empty: string;
  count: number;
  animate: boolean;
  cardsA: ReactNode[];
  cardsB: ReactNode[];
}) {
  return (
    <section className="enp-row">
      <div className="enp-row-hdr">
        {live && <span className="enp-livedot" aria-hidden />}
        <h3
          className="enp-row-title"
          style={live ? { color: "var(--neon-magenta, #ff00cc)" } : undefined}
        >
          {title}
        </h3>
        {count > 0 && <span className="enp-row-count">{count}</span>}
      </div>
      {count === 0 ? (
        <div className="enp-quiet">{empty}</div>
      ) : (
        <div
          className={`enp-marquee${animate ? " enp-marquee--auto" : ""}`}
          aria-label={`${title}: ${count} event${count === 1 ? "" : "s"}`}
        >
          <div className="enp-track">
            {cardsA}
            {animate ? cardsB : null}
          </div>
        </div>
      )}
    </section>
  );
}
