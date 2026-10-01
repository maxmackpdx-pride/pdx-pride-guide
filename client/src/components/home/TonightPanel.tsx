import { WebGLShader } from "@/components/ui/web-gl-shader";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { ResourceRail } from "@/components/resources/ResourceRail";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import { pacificTodayDate, pacificCalendarDate, parsePacificDateTime } from "@shared/missedConnections";
import { apiRequest } from "@/lib/queryClient";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import TonightEventCard from "./TonightEventCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import outzCatalog from "@shared/outzMapCatalog";
import { outzSharePath } from "@shared/outzShare";
import { placePath } from "@shared/placeSlug";
import type { Business } from "@/pages/Directory";
import TodayLocationCard, { type TodayLocation } from "./TodayLocationCard";
import "./TonightPanel.css";

// A date-seeded shuffle keeps picks steady during query refreshes and changes them daily.
function dailyScore(value: string) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
function dailyPicks<T>(rows: T[], date: string, key: (row: T) => string) {
  return [...rows].sort((a, b) => dailyScore(`${date}:${key(a)}`) - dailyScore(`${date}:${key(b)}`)).slice(0, 3);
}

export default function TonightPanel() {
  const [today, setToday] = useState(() => pacificTodayDate(Date.now()));
  useEffect(() => {
    const refreshDate = () => setToday(pacificTodayDate(Date.now()));
    const interval = window.setInterval(refreshDate, 30_000);
    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshDate);
      document.removeEventListener("visibilitychange", refreshDate);
    };
  }, []);
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
  const { data: places = [] } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then((r) => r.json()),
    staleTime: 60_000,
  });
  const dayEvents = useMemo(() => listings
    .filter((event) => pacificCalendarDate(event.dateStart) === today)
    .sort((a, b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0)), [listings, today]);
  const locations = useMemo(() => {
    const outside: TodayLocation[] = dailyPicks(outzCatalog, today, row => row.id).map(row => ({
      key: `outz:${row.id}`, name: row.name, room: "OutZide", detail: "Outdoor destination", href: outzSharePath(row.id),
    }));
    const indoors: TodayLocation[] = dailyPicks(places.filter(row => row.status !== "CLOSED"), today, row => String(row.id)).map(row => ({
      key: `place:${row.id}`, name: row.name, room: "Placez", detail: row.neighborhood || row.address || "Portland metro", href: placePath(row.id, row.name),
    }));
    return Array.from({ length: Math.max(outside.length, indoors.length) }, (_, index) => [outside[index], indoors[index]]).flat().filter((row): row is TodayLocation => Boolean(row));
  }, [places, today]);
  const railItems = useMemo(() => {
    type Item = { event: typeof dayEvents[number]; location?: never } | { location: TodayLocation; event?: never };
    const items: Item[] = [];
    // Spread location cards across all event gaps without repeating or dropping events.
    const gaps = new Map<number, TodayLocation[]>();
    locations.forEach((location, index) => {
      const gap = locations.length === 1 ? Math.floor(dayEvents.length / 2) : Math.round(index * dayEvents.length / (locations.length - 1));
      gaps.set(gap, [...(gaps.get(gap) || []), location]);
    });
    for (let index = 0; index <= dayEvents.length; index++) {
      for (const location of gaps.get(index) || []) items.push({ location });
      if (index < dayEvents.length) items.push({ event: dayEvents[index] });
    }
    return items;
  }, [dayEvents, locations]);

  return (
    <section className="home-tonight" aria-labelledby="home-tonight-title">
      <div className="home-tonight__atmosphere" aria-hidden="true"><WebGLShader /></div>
      <div className="home-tonight__inner">
        <header className="home-tonight__head">
          <p className="home-tonight__eyebrow">Today · Portland</p>
          <h2 id="home-tonight-title">
            <span>You&apos;re <b>no</b>t</span>
            <span>looking for <b>content</b>.</span>
          </h2>
          <div className="home-tonight__subhead">
            <p>{dayEvents.length ? `Today · Portland · ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}` : "Today · Portland"}</p>
            <Link href="/events" className="home-tonight__all">All EVENTZ <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </header>

        {railItems.length ? (
          <ResourceRail id="home-tonight-rail" title="Explore today" color="var(--room-eventz)" count={railItems.length} quiet={Boolean(calmMode || reducedMotion)} room="Zaylist" itemName="card">
            {railItems.map((item) => {
              if (item.location) return <div className="home-tonight__item" dir="ltr" key={item.location.key}><TodayLocationCard location={item.location} /></div>;
              const event = item.event;
              return <div className="home-tonight__item" dir="ltr" key={event.listingInstanceKey || `${event.id}:${event.dateStart}`}>
                <TonightEventCard listing={event} rsvped={savedIds.has(event.id)} onToggleRsvp={id => user ? toggleSave(id) : setShowAuth(true)} onOpen={setSelectedEvent} />
              </div>;
            })}
          </ResourceRail>
        ) : (
          <p className="home-tonight__empty">Nothing listed for today yet. Check EVENTZ for what&apos;s coming up.</p>
        )}
      </div>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onEventUpdated={setSelectedEvent} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </section>
  );
}
