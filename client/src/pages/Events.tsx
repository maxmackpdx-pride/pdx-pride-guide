import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { shareEventLink } from "@/lib/shareEvent";
import type { Event } from "@shared/schema";
import { listingKey, type EventListing } from "@shared/multiDayEvents";
import { EVENT_TYPE_FILTERS } from "@shared/eventTypeTags";
import EventTagsRow from "../components/EventTagsRow";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import EventTypeTag from "../components/EventTypeTag";
import EventModal from "../components/EventModal";
import EventAttendancePreview from "@/components/EventAttendancePreview";
import EventWorkHereTag from "@/components/EventWorkHereTag";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import { eventPath, eventUrl } from "@shared/eventSlug";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { List, Grid, MapPin, Link2 } from "lucide-react";
import { MapViewFallback } from "@/components/EventsMapFallback";

const MapView = lazy(() => import("@/components/EventsMap").then(m => ({ default: m.MapView })));

const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};
const DAYS = ["ALL", "THU", "FRI", "SAT", "SUN"];

function filterLiveEvents(
  events: EventListing[],
  activeDay: string,
  activeFilters: string[],
  searchQuery: string,
) {
  return events
    .filter(e => {
      if (activeDay !== "ALL" && e.dayOfWeek !== activeDay) return false;
      if (activeFilters.length > 0) {
        const admissionFilters = activeFilters.filter(f => f === "FREE" || f === "TICKETED");
        if (admissionFilters.length > 0 && !admissionFilters.some(f => f === e.admission)) return false;
        if (activeFilters.includes("21+") && e.ageRequirement !== "21_PLUS") return false;
        if (activeFilters.includes("ALL AGES") && e.ageRequirement !== "ALL_AGES") return false;
        if (activeFilters.includes("PUBLIC") && !e.isPublic) return false;
        if (activeFilters.includes("HOUSE PARTY") && !e.isHouseParty) return false;
        if (activeFilters.includes("SEX POSITIVE") && !e.isSexPositive) return false;
        if (activeFilters.includes("NUDITY OK") && !e.nudityOk) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${e.title} ${e.venueName} ${e.neighborhood} ${e.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}

function EventShareLink({ href, title }: { href: string; title: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      title={`Share ${title}`}
      aria-label={`Share ${title}`}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const result = await shareEventLink(href, title);
          toast({ title: result === "shared" ? "Shared" : "Link copied to clipboard" });
        } catch (err) {
          if ((err as DOMException)?.name !== "AbortError") {
            toast({ title: "Could not share link", variant: "destructive" });
          }
        }
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.72)",
        border: "1px solid #333",
        color: "#aaa",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <Link2 size={14} />
    </button>
  );
}

function EventCard({ event, onClick, viewMode, revealDelay = 0, attendanceSummary, myTalent, selfUserId, shareHref }: {
  event: Event;
  onClick: () => void;
  viewMode: "grid" | "list";
  revealDelay?: number;
  attendanceSummary?: AttendanceSummary | null;
  myTalent?: UserEventTalentCard | null;
  selfUserId?: number;
  shareHref: string;
}) {
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";
  const time = event.dateStart
    ? new Date(event.dateStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  if (viewMode === "list") {
    return (
      <ScrollReveal delay={revealDelay}>
      <div
        className="poster-card"
        onClick={onClick}
        data-testid={`event-card-${event.id}`}
        style={{
          display: "flex", gap: 0, alignItems: "stretch",
          borderLeft: `4px solid ${dayColor}`,
          cursor: "pointer",
        }}
      >
        {/* Flyer thumbnail */}
        {event.posterImageUrl ? (
          <div style={{
            width: 108, minWidth: 108, flexShrink: 0,
            background: "#111", overflow: "hidden",
          }}>
            <img
              src={event.posterImageUrl}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ) : (
          <div style={{
            width: 108, minWidth: 108, flexShrink: 0,
            background: "#111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: dayColor + "22", border: `1px solid ${dayColor}44` }} />
          </div>
        )}
        {/* Info */}
        <div style={{ flex: 1, padding: "15px 21px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, position: "relative" }}>
          <EventShareLink href={shareHref} title={event.title} />
          <EventTagsRow event={event} size="sm" className="event-card-tags--list" />
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "clamp(1.35rem, 3vw, 1.575rem)",
            color: "#fff", lineHeight: 1.1, marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{event.title}</div>
          <div style={{ fontSize: "1.08rem", color: "#888" }}>{event.venueName}</div>
          <div style={{ fontSize: "0.975rem", color: "var(--text-meta)", marginTop: 3 }}>{time} · {event.neighborhood}</div>
          <EventWorkHereTag talent={myTalent} compact />
          <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
        </div>
      </div>
      </ScrollReveal>
    );
  }

  // Grid view
  return (
    <ScrollReveal delay={revealDelay}>
    <div
      className="poster-card"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
      style={{ aspectRatio: "2/3", display: "flex", flexDirection: "column" }}
    >
      {/* Flyer image if available, else halftone bg */}
      {event.posterImageUrl ? (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <EventShareLink href={shareHref} title={event.title} />
          <img
            src={event.posterImageUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Overlay gradient for readability */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.1) 100%)",
          }} />
          {/* Day stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: dayColor }} />
          <EventTagsRow event={event} size="sm" max={4} className="event-card-tags--overlay" />
          {/* Info overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 21 }}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(1.5rem, 2.1vw, 1.83rem)",
              color: "#fff", lineHeight: 1.05, marginBottom: 6,
            }}>{event.title}</div>
            <div style={{ fontSize: "1.11rem", color: "#aaa" }}>{event.venueName}</div>
            <div style={{ fontSize: "1.02rem", color: "var(--text-meta)", marginTop: 3 }}>{time}</div>
            <EventWorkHereTag talent={myTalent} compact />
            <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 5, background: dayColor, position: "relative" }}>
            <EventShareLink href={shareHref} title={event.title} />
          </div>
          <EventTagsRow event={event} size="sm" max={4} className="event-card-tags--top" />
          <div
            className="halftone"
            style={{
              flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: 21, background: "#0d0d0d", minHeight: 210, position: "relative",
            }}
          >
            <div style={{
              position: "absolute", top: 0, right: 0, width: 60, height: 60,
              background: `radial-gradient(circle at top right, ${dayColor}22, transparent 70%)`,
              pointerEvents: "none",
            }} />
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(1.53rem, 2.1vw, 1.92rem)",
              color: "#fff", lineHeight: 1.05, marginBottom: 9,
            }}>
              {event.title}
            </div>
            <div style={{ fontSize: "1.17rem", color: "#888" }}>{event.venueName}</div>
            <div style={{ fontSize: "1.08rem", color: "var(--text-meta)", marginTop: 3 }}>{time} · {event.neighborhood}</div>
            <EventWorkHereTag talent={myTalent} compact />
            <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
          </div>
        </>
      )}
    </div>
    </ScrollReveal>
  );
}

function absoluteShareImage(path?: string | null) {
  if (!path) return "https://www.prideguidepdx.com/og-preview.jpg";
  if (path.startsWith("http")) return path;
  return `https://www.prideguidepdx.com${path.startsWith("/") ? path : `/${path}`}`;
}

function truncateSeo(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function readSearchParam(key: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key)?.trim() || "";
}

export default function Events() {
  const { user } = useAuth();
  const [routeMatch, routeParams] = useRoute("/events/:id/:slug?");
  const [location, setLocation] = useLocation();
  const routeEventId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const routeDay = useMemo(() => readSearchParam("day").toUpperCase(), [location]);
  const [activeDay, setActiveDay] = useState("ALL");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q")?.trim() || "";
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mapExpanded, setMapExpanded] = useState(false);
  const openEvent = useCallback((event: EventListing) => {
    setSelectedEvent(event);
    setLocation(eventPath(event.id, event.title, event.dayOfWeek));
  }, [setLocation]);
  const closeEvent = useCallback(() => {
    setSelectedEvent(null);
    const q = searchQuery.trim();
    setLocation(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
  }, [setLocation, searchQuery]);

  useEffect(() => {
    if (routeMatch) return;
    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get("q") || "";
    const nextQ = searchQuery.trim();
    if (currentQ === nextQ) return;
    if (nextQ) params.set("q", nextQ);
    else params.delete("q");
    const qs = params.toString();
    setLocation(qs ? `/events?${qs}` : "/events");
  }, [searchQuery, routeMatch, setLocation]);

  const { data: events = [], isLoading, isError, error, refetch } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  useAttendanceSummariesLive();

  const { data: attendanceSummaries = {} } = useQuery<Record<string, AttendanceSummary>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
  });

  const { data: myTalentByEvent = {} } = useQuery<Record<string, UserEventTalentCard>>({
    queryKey: ["/api/events/mine/talent"],
    queryFn: () => apiRequest("GET", "/api/events/mine/talent").then(r => r.json()),
    enabled: !!user,
  });

  const { data: routeEvent } = useQuery<Event>({
    queryKey: ["/api/events", routeEventId, routeDay],
    queryFn: () => apiRequest("GET", `/api/events/${routeEventId}${routeDay ? `?day=${routeDay}` : ""}`).then(r => r.json()),
    enabled: routeEventId != null && Number.isFinite(routeEventId),
  });

  const shareEvent = selectedEvent || routeEvent || null;
  usePageSeo(
    shareEvent
      ? `${shareEvent.title} — Portland Pride 2026 | PDX Pride Guide`
      : "Portland Pride 2026 Events — PDX Pride Guide",
    shareEvent
      ? truncateSeo(
          `${shareEvent.venueName || "Portland"}${shareEvent.neighborhood ? ` · ${shareEvent.neighborhood}` : ""}. ${shareEvent.description || ""}`,
        )
      : "Browse every live Portland Pride 2026 event on the map and board. Filter PDX Pride events by day, type, and neighborhood.",
    shareEvent
      ? {
          url: eventUrl(shareEvent.id, shareEvent.title),
          image: absoluteShareImage(resolveEventPosterUrl(shareEvent.id, shareEvent.posterImageUrl)),
          imageAlt: shareEvent.title,
          type: "article",
        }
      : undefined,
  );

  useEffect(() => {
    if (!routeEventId || !Number.isFinite(routeEventId)) {
      if (!routeMatch) setSelectedEvent(null);
      return;
    }
    const matches = events.filter(e => e.id === routeEventId);
    const fromList = routeDay
      ? matches.find(e => e.dayOfWeek === routeDay)
      : matches.length === 1
        ? matches[0]
        : undefined;
    if (fromList) {
      setSelectedEvent(fromList);
      return;
    }
    if (routeEvent) setSelectedEvent(routeEvent);
  }, [routeEventId, routeDay, routeMatch, events, routeEvent]);

  const filtered = useMemo(
    () => filterLiveEvents(events, activeDay, activeFilters, searchQuery),
    [events, activeDay, activeFilters, searchQuery],
  );

  const hasActiveFilters =
    activeDay !== "ALL" || activeFilters.length > 0 || searchQuery.trim().length > 0;

  const eventsCountLabel = useMemo(() => {
    const total = events.length;
    const visible = filtered.length;
    if (hasActiveFilters && visible !== total) {
      return `${visible} of ${total} events`;
    }
    return `${total} event${total === 1 ? "" : "s"}`;
  }, [events.length, filtered.length, hasActiveFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div className="zine-page events-page board-page">
      <PageHero
        flipLightLeaks
        titleLine1="EVENTS"
        titleLine2="GUIDE"
        accent="cyan"
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 42%"
      />

      <Suspense fallback={<MapViewFallback variant="events" />}>
        <MapView
          events={filtered}
          expanded={mapExpanded}
          onExpand={() => setMapExpanded(true)}
          onCollapse={() => setMapExpanded(false)}
          onSelect={openEvent}
        />
      </Suspense>

      {/* Filters + View Toggle */}
      <div className="zine-filter-bar" style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: "var(--site-header-height)", zIndex: 50,
      }}>
        <div className="events-filter-row">
          {DAYS.map(d => (
            <button
              key={d}
              className={`filter-tag ${activeDay === d ? "active" : ""}`}
              onClick={() => setActiveDay(d)}
              data-testid={`filter-day-${d}`}
              style={activeDay === d && d !== "ALL" ? {
                color: "#000", borderColor: DAY_COLORS[d],
                background: DAY_COLORS[d], boxShadow: `0 0 14px ${DAY_COLORS[d]}aa, 2px 2px 0 rgba(0,0,0,0.7)`, fontWeight: 900,
              } : {}}
            >
              {d}
            </button>
          ))}
          <div className="events-filter-divider" />
          {EVENT_TYPE_FILTERS.map(f => (
            <EventTypeTag
              key={f}
              label={f}
              interactive
              active={activeFilters.includes(f)}
              onClick={() => toggleFilter(f)}
              testId={`filter-type-${f.replace(/[+ ]/g, "-")}`}
            />
          ))}
          {/* Search bar */}
          <div className="events-filter-search">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="event-search"
              className="events-filter-search__input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="events-filter-search__clear"
                title="Clear search"
              >×</button>
            )}
          </div>
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* View toggle — grid / list only (map is always shown above) */}
          <div className="events-view-toggle">
            <button
              data-testid="toggle-grid-view"
              onClick={() => setViewMode("grid")}
              className={`events-view-toggle__btn${viewMode === "grid" ? " active" : ""}`}
              title="Grid view"
            >
              <Grid size={26} />
            </button>
            <button
              data-testid="toggle-list-view"
              onClick={() => setViewMode("list")}
              className={`events-view-toggle__btn${viewMode === "list" ? " active" : ""}`}
              title="List view"
            >
              <List size={26} />
            </button>
          </div>
        </div>
      </div>

      {/* Events listing */}
      <div className="zine-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <ScrollReveal>
          <div className="events-count-row">
            <div className="events-count-banner">
              <MapPin size={13} />
              <span data-testid="events-count">
                {isLoading ? "Loading events…" : eventsCountLabel}
              </span>
              {activeDay !== "ALL" && <span className="events-count-meta">· {activeDay}</span>}
            </div>
            {(activeFilters.length > 0 || searchQuery.trim()) && (
              <button
                onClick={() => { setActiveFilters([]); setSearchQuery(""); }}
                style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)" }}
              >
                CLEAR FILTERS ×
              </button>
            )}
          </div>
        </ScrollReveal>

        {isLoading ? (
          <BoardLoadingState label="Loading events" />
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed #FF6600", background: "rgba(8,8,8,0.72)" }}>
            <p className="display" style={{ fontSize: "1.4rem", color: "#fff" }}>COULD NOT LOAD EVENTS</p>
            <p style={{ color: "#9d9a92", fontSize: "0.9rem", marginTop: 10, maxWidth: 420, marginInline: "auto" }}>
              {error instanceof Error ? error.message : "The events API is unavailable right now."}
            </p>
            <button
              onClick={() => refetch()}
              className="btn-neon"
              style={{ marginTop: 20 }}
            >
              TRY AGAIN
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9d9a92" }}>
            <p className="display" style={{ fontSize: "1.4rem" }}>NO EVENTS MATCH</p>
            <button
              onClick={() => { setActiveDay("ALL"); setActiveFilters([]); setSearchQuery(""); }}
              style={{ marginTop: 12, background: "none", border: "1px solid #333", color: "#888", padding: "8px 18px", cursor: "pointer", fontSize: "0.8rem" }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="events-poster-grid">
            {filtered.map((e, i) => (
              <EventCard
                key={listingKey(e)}
                event={e}
                onClick={() => openEvent(e)}
                viewMode="grid"
                revealDelay={(i % 6) * 70}
                attendanceSummary={attendanceSummaries[e.id] ?? attendanceSummaries[String(e.id)]}
                myTalent={myTalentByEvent[e.id] ?? myTalentByEvent[String(e.id)]}
                selfUserId={user?.id}
                shareHref={eventPath(e.id, e.title, e.dayOfWeek)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((e, i) => (
              <EventCard
                key={listingKey(e)}
                event={e}
                onClick={() => openEvent(e)}
                viewMode="list"
                revealDelay={(i % 8) * 55}
                attendanceSummary={attendanceSummaries[e.id] ?? attendanceSummaries[String(e.id)]}
                myTalent={myTalentByEvent[e.id] ?? myTalentByEvent[String(e.id)]}
                selfUserId={user?.id}
                shareHref={eventPath(e.id, e.title, e.dayOfWeek)}
              />
            ))}
          </div>
        )}

        <ScrollReveal delay={60}>
          <div className="zine-callout events-submit-callout" style={{ marginTop: 60, textAlign: "center", padding: "36px 20px" }}>
            <div className="display" style={{ fontSize: "1.3rem", marginBottom: 6 }}>NOT SEEING YOUR EVENT?</div>
            <div style={{ color: "var(--text-meta)", marginBottom: 20, fontSize: "0.85rem" }}>
              Submit it or claim an existing listing.
            </div>
            <Link href="/submit" className="btn-neon solid">Get Started →</Link>
          </div>
        </ScrollReveal>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={closeEvent} />}
    </div>
  );
}
