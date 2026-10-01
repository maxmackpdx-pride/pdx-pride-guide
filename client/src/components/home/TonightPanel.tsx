import { WebGLShader } from "@/components/ui/web-gl-shader";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { ResourceRail } from "@/components/resources/ResourceRail";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { pacificTodayDate } from "@shared/missedConnections";
import { apiRequest } from "@/lib/queryClient";
import { buildScheduleEvents } from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import TonightEventCard from "./TonightEventCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./TonightPanel.css";

export default function TonightPanel() {
  const { calmMode } = useTheme();
  const reducedMotion = useReducedMotion();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { showAuth, setShowAuth } = useEventRsvp();
  const { user } = useAuth();
  const { savedIds, toggleSave } = useSavedEvents();
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
      <div className="home-tonight__atmosphere" aria-hidden="true"><WebGLShader /></div>
      <div className="home-tonight__inner">
        <header className="home-tonight__head">
          <p className="home-tonight__eyebrow">Tonight · Portland</p>
          <h2 id="home-tonight-title">
            <span>You&apos;re <b>no</b>t</span>
            <span>looking for <b>content</b>.</span>
          </h2>
          <div className="home-tonight__subhead">
            <p>{tonight.length ? `Tonight · Portland · ${tonight.length} ${tonight.length === 1 ? "event" : "events"}` : "Tonight · Portland"}</p>
            <Link href="/events" className="home-tonight__all">All EVENTZ <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </header>

        {tonight.length ? (
          <ResourceRail id="home-tonight-rail" title="Events happening tonight" color="var(--room-eventz)" count={tonight.length} quiet={Boolean(calmMode || reducedMotion)} room="Eventz" itemName="event">
            {tonight.map((event) => {
              const listing = listingById.get(event.id);
              if (!listing) return null;
              return <div className="home-tonight__item" dir="ltr" key={event.scheduleKey}>
                <TonightEventCard event={event} listing={listing} rsvped={savedIds.has(event.id)} onToggleRsvp={id => user ? toggleSave(id) : setShowAuth(true)} onOpen={setSelectedEvent} />
              </div>;
            })}
          </ResourceRail>
        ) : (
          <p className="home-tonight__empty">Nothing listed for tonight yet. Check EVENTZ for what&apos;s coming up.</p>
        )}
      </div>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onEventUpdated={setSelectedEvent} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </section>
  );
}
