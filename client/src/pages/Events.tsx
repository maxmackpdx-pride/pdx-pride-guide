import type React from "react";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

import type { Event } from "@shared/schema";
import { listingKey, type EventListing } from "@shared/multiDayEvents";
import { admissionFromFilterTag } from "@shared/admission";
import { EVENT_TYPE_FILTERS } from "@shared/eventTypeTags";
import BoardLoadingState from "@/components/BoardLoadingState";
import ListingCard from "@/components/ds/adapters/ListingCard";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import EventTypeTag from "../components/EventTypeTag";
import EventModal from "../components/EventModal";
import Schedule from "@/pages/Schedule";
import ScheduleCard from "@/components/ScheduleCard";
import EventsNowPanel from "@/components/EventsNowPanel";

import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import { eventPath, eventUrl } from "@shared/eventSlug";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { List, Grid, MapPin } from "lucide-react";
import { lazyWithReload } from "@/lib/lazyWithReload";
import { MapViewFallback } from "@/components/EventsMapFallback";
import { Button, FilterChip, SearchInput } from "@/components/ds";
import { dayAccentToken } from "@/lib/dsColors";

const MapView = lazyWithReload(() => import("@/components/EventsMap").then(m => ({ default: m.MapView })));

import { DAY_COLORS, DAY_SORT_ORDER, PRIDE_WEEK_DAYS } from "@shared/prideWeek";

const DAYS = ["ALL", ...PRIDE_WEEK_DAYS];
/** MON/TUE fills are too dark for black pill text — flip to white. */
const DARK_FILL_DAYS = new Set(["MON", "TUE"]);

type SortMode =
  | "start_time"
  | "end_time"
  | "day_start"
  | "title_az"
  | "title_za"
  | "venue_az";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "start_time", label: "Start time" },
  { value: "end_time", label: "End time" },
  { value: "day_start", label: "Day, then start time" },
  { value: "title_az", label: "Title A–Z" },
  { value: "title_za", label: "Title Z–A" },
  { value: "venue_az", label: "Venue A–Z" },
];

function compareTitles(a: EventListing, b: EventListing) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

function sortEvents(events: EventListing[], sortMode: SortMode): EventListing[] {
  const sorted = [...events];
  switch (sortMode) {
    case "start_time":
      return sorted.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
    case "end_time":
      return sorted.sort((a, b) => new Date(a.dateEnd).getTime() - new Date(b.dateEnd).getTime());
    case "day_start":
      return sorted.sort((a, b) => {
        const dayA = DAY_SORT_ORDER[a.dayOfWeek ?? ""] ?? 99;
        const dayB = DAY_SORT_ORDER[b.dayOfWeek ?? ""] ?? 99;
        if (dayA !== dayB) return dayA - dayB;
        return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime();
      });
    case "title_az":
      return sorted.sort(compareTitles);
    case "title_za":
      return sorted.sort((a, b) => compareTitles(b, a));
    case "venue_az":
      return sorted.sort((a, b) =>
        (a.venueName || "").localeCompare(b.venueName || "", undefined, { sensitivity: "base" }),
      );
    default:
      return sorted;
  }
}

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
        const admissionFilters = activeFilters
          .map(admissionFromFilterTag)
          .filter((v): v is NonNullable<typeof v> => v != null);
        if (admissionFilters.length > 0 && !admissionFilters.some(a => e.admission === a)) return false;
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
    });
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
  const [sortMode, setSortMode] = useState<SortMode>("start_time");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeTab, setActiveTabState] = useState<"board" | "schedule">(() =>
    readSearchParam("tab").toLowerCase() === "schedule" ? "schedule" : "board",
  );
  const setActiveTab = useCallback((tab: "board" | "schedule") => {
    setActiveTabState(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "schedule") params.set("tab", "schedule");
    else params.delete("tab");
    const qs = params.toString();
    setLocation(qs ? `/events?${qs}` : "/events");
  }, [setLocation]);
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
    // Keep an already-open modal for this id (set optimistically on click)
    // rather than clearing or replacing it while routeEvent settles.
    setSelectedEvent(prev => {
      if (prev && prev.id === routeEventId) return prev;
      return routeEvent ?? prev;
    });
  }, [routeEventId, routeDay, routeMatch, events, routeEvent]);

  const filtered = useMemo(
    () => sortEvents(filterLiveEvents(events, activeDay, activeFilters, searchQuery), sortMode),
    [events, activeDay, activeFilters, searchQuery, sortMode],
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
      <PageHeader
        section="Events"
        title="Events"
        titlePrefix={events.length > 0 ? events.length : undefined}
        titleAccent="cyan"
        kicker="Portland Pride Week 2026 · July 13–19"
        lede="Every queer party, parade, show, and gathering for Pride Week 2026 and beyond — all in one place."
        actions={
          <Link href="/schedule" className="btn-neon" style={{ fontSize: "0.85rem", letterSpacing: "0.12em" }}>
            View schedule →
          </Link>
        }
      />

      <div className="events-map-row">
        <div className="events-map-row__panel">
          <EventsNowPanel />
        </div>
        <div className="events-map-row__map">
          <Suspense fallback={<MapViewFallback variant="events" />}>
            <MapView
              events={filtered}
              expanded={mapExpanded}
              onExpand={() => setMapExpanded(true)}
              onCollapse={() => setMapExpanded(false)}
              onSelect={openEvent}
            />
          </Suspense>
        </div>
      </div>

      {/* Board | Schedule tabs */}
      <div className="events-tab-bar">
        <button
          type="button"
          className={`events-tab${activeTab === "board" ? " active" : ""}`}
          onClick={() => setActiveTab("board")}
          data-testid="events-tab-board"
        >
          The Board
        </button>
        <button
          type="button"
          className={`events-tab${activeTab === "schedule" ? " active" : ""}`}
          onClick={() => setActiveTab("schedule")}
          data-testid="events-tab-schedule"
        >
          The Schedule
        </button>
      </div>

      {activeTab === "schedule" ? (
        <div className="zine-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px" }}>
          <ScheduleCard>
            <Schedule embed />
          </ScheduleCard>
        </div>
      ) : (
      <>
      {/* Filters + View Toggle */}
      <div className="zine-filter-bar" style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: "var(--site-header-height)", zIndex: 50,
      }}>
        <div className="events-filter-row">
          {DAYS.map(d => {
            const selected = activeDay === d;
            return (
              <FilterChip
                key={d}
                selected={selected}
                fill={selected}
                accent={dayAccentToken(d)}
                onToggle={() => setActiveDay(d)}
                data-testid={`filter-day-${d}`}
                style={selected && DARK_FILL_DAYS.has(d) ? { color: "#fff" } : undefined}
              >
                {d}
              </FilterChip>
            );
          })}
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
            <SearchInput
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              data-testid="event-search"
              size="sm"
            />
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
            <div className="events-count-actions">
              {!isLoading && filtered.length > 0 && (
                <label className="events-sort">
                  <span className="events-sort__label">Sort</span>
                  <div className="board-select-wrap">
                    <select
                      className="board-select events-sort__select"
                      value={sortMode}
                      onChange={e => setSortMode(e.target.value as SortMode)}
                      data-testid="events-sort"
                      aria-label="Sort events"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <span className="board-select-caret">▼</span>
                  </div>
                </label>
              )}
              {(activeFilters.length > 0 || searchQuery.trim()) && (
                <button
                  onClick={() => { setActiveFilters([]); setSearchQuery(""); }}
                  style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)" }}
                >
                  CLEAR FILTERS ×
                </button>
              )}
            </div>
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
            <Button type="button" accent="lime" onClick={() => refetch()} style={{ marginTop: 20 }}>
              TRY AGAIN
            </Button>
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
              <ListingCard
                key={listingKey(e)}
                event={e}
                onClick={() => openEvent(e)}
                viewMode="grid"
                revealDelay={(i % 8) * 70}
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
              <ListingCard
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
            <Link href="/submit">
              <Button as="span" variant="solid" accent="lime" arrow>Get Started</Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
      </>
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEvent}
          onEventUpdated={updated => setSelectedEvent(updated)}
        />
      )}
    </div>
  );
}
