import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { pacificTodayDate } from "@shared/missedConnections";
import { apiRequest } from "@/lib/queryClient";
import { buildScheduleEvents } from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import RailCard from "@/components/RailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./TonightPanel.css";

export default function TonightPanel() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();
  const { data: listings = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then((r) => r.json()),
    staleTime: 60_000,
  });
  const { data: attendance = {} } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then((r) => r.json()),
    staleTime: 60_000,
  });

  const tonight = useMemo(() => {
    const now = Date.now();
    const today = pacificTodayDate(now);
    return buildScheduleEvents(listings, attendance)
      .filter((event) => event.calendarDate === today && event.endMs >= now)
      .sort((a, b) => a.startMs - b.startMs)
      .slice(0, 8);
  }, [listings, attendance]);
  const listingById = useMemo(() => new Map(listings.map((event) => [event.id, event])), [listings]);

  return (
    <section className="home-tonight" aria-labelledby="home-tonight-title">
      <div className="home-tonight__fx" aria-hidden="true">
        <span className="home-tonight__glow" />
        <span className="home-tonight__grid" />
      </div>
      <div className="home-tonight__inner">
        <header className="home-tonight__head">
          <p className="home-tonight__eyebrow"><i />Tonight · Portland</p>
          <h2 id="home-tonight-title">
            <span><b>You&apos;re</b> not</span>
            <span>looking for content.</span>
          </h2>
          <div className="home-tonight__subhead">
            <p>{tonight.length ? `Tonight · Portland · ${tonight.length} ${tonight.length === 1 ? "event" : "events"}` : "Tonight · Portland"}</p>
            <Link href="/events" className="home-tonight__all">All Eventz <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </header>

        {tonight.length ? (
          <div className="home-tonight__rail" role="list" aria-label="Events happening tonight">
            {tonight.map((event) => {
              const listing = listingById.get(event.id);
              if (!listing) return null;
              return <div role="listitem" className="home-tonight__item" key={event.scheduleKey}>
                <RailCard event={event} listing={listing} rsvped={myEventIds.has(event.id)} onToggleRsvp={toggleRsvp} onOpen={setSelectedEvent} />
              </div>;
            })}
          </div>
        ) : (
          <p className="home-tonight__empty">Nothing listed for tonight yet. Check Eventz for what&apos;s coming up.</p>
        )}
      </div>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onEventUpdated={setSelectedEvent} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </section>
  );
}
