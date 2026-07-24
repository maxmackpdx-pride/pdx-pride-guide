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
import AffiliatePosterCard from "@/components/AffiliatePosterCard";
import PosterAdCard from "@/components/ads/PosterAdCard";
import type { AdServePayload } from "@/lib/adTypes";
import EventsHero from "@/components/EventsHero";
import ScrollReveal from "@/components/ScrollReveal";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import EventTypeTag from "../components/EventTypeTag";
import EventModal from "../components/EventModal";
import Schedule from "@/pages/Schedule";
import ScheduleCard from "@/components/ScheduleCard";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import { eventPath, eventUrl } from "@shared/eventSlug";
import { scatterAffiliateCards } from "@/lib/affiliateCards";
import { List, Grid } from "lucide-react";
import { lazyWithReload } from "@/lib/lazyWithReload";
import { MapViewFallback } from "@/components/EventsMapFallback";
import { Button, FilterChip, SearchInput } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";

const MapView = lazyWithReload(() => import("@/components/EventsMap").then(m => ({ default: m.MapView })));

import { DAY_SORT_ORDER } from "@shared/eventWeek";
import { isEventSchedulePast, pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import "./Events.css";

const PACIFIC = "America/Los_Angeles";

/** Pacific YYYY-MM-DD for an epoch-ms. */
function pacDate(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PACIFIC, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}
/** Pacific weekday index 0=Sun … 6=Sat for an epoch-ms. */
function pacWeekday(ms: number): number {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, weekday: "short" }).format(new Date(ms));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(s);
}
/** The Fri/Sat/Sun (YYYY-MM-DD) of the weekend that contains or next follows `now`. */
function weekendDates(nowMs: number): Set<string> {
  const today = pacificTodayDate(nowMs);
  const noonMs = parsePacificDateTime(`${today}T12:00:00`) ?? nowMs;
  const dow = pacWeekday(noonMs);
  // Days back to this weekend's Friday; Mon–Thu → negative = forward to the coming Friday.
  const backToFri = dow === 5 ? 0 : dow === 6 ? 1 : dow === 0 ? 2 : -(5 - dow);
  const friMs = noonMs - backToFri * 86400000;
  return new Set([0, 1, 2].map(i => pacDate(friMs + i * 86400000)));
}

/**
 * Pacific Mon–Sun calendar week as YYYY-MM-DD set.
 * weekOffset 0 = week containing today, 1 = next week, -1 = previous, …
 */
function weekDates(nowMs: number, weekOffset = 0): Set<string> {
  const today = pacificTodayDate(nowMs);
  const noonMs = parsePacificDateTime(`${today}T12:00:00`) ?? nowMs;
  const dow = pacWeekday(noonMs); // 0=Sun … 6=Sat
  // Days since Monday (Mon=0 … Sun=6)
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const thisMonMs = noonMs - daysSinceMon * 86400000;
  const monMs = thisMonMs + weekOffset * 7 * 86400000;
  return new Set([0, 1, 2, 3, 4, 5, 6].map(i => pacDate(monMs + i * 86400000)));
}

/** True if any pool event falls on a date in `dates`. */
function poolHitsDates(pool: EventListing[], dates: Set<string>): boolean {
  return pool.some(e => {
    const d = pacificCalendarDate(e.dateStart);
    return d != null && dates.has(d);
  });
}

/** "AUG" (or "AUG '27" when not the current Pacific year) for a YYYY-MM key. */
function monthChipLabel(monthKey: string, nowMs: number): string {
  const ms = parsePacificDateTime(`${monthKey}-01T12:00:00`);
  if (ms == null) return monthKey;
  const mon = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short" }).format(new Date(ms)).toUpperCase();
  const curYear = pacificTodayDate(nowMs).slice(0, 4);
  const year = monthKey.slice(0, 4);
  return year === curYear ? mon : `${mon} '${year.slice(2)}`;
}

const EMPTY_DATES = new Set<string>();

type DayChip = { key: string; label: string };

type DateWindows = {
  weekend: Set<string>;
  thisWeek: Set<string>;
  nextWeek: Set<string>;
};

function buildDateWindows(nowMs: number): DateWindows {
  return {
    weekend: weekendDates(nowMs),
    thisWeek: weekDates(nowMs, 0),
    nextWeek: weekDates(nowMs, 1),
  };
}

/** Date-window filter chips derived from the events in view (year-round). */
function buildDayChips(pool: EventListing[], pastView: boolean, nowMs: number): DayChip[] {
  const chips: DayChip[] = [{ key: "ALL", label: "All" }];
  const { weekend, thisWeek, nextWeek } = buildDateWindows(nowMs);

  // Week windows first — quick “what’s on now / coming up”
  if (poolHitsDates(pool, thisWeek)) {
    chips.push({ key: "THIS_WEEK", label: "This week" });
  }
  if (poolHitsDates(pool, nextWeek)) {
    chips.push({ key: "NEXT_WEEK", label: "Next week" });
  }
  if (!pastView && poolHitsDates(pool, weekend)) {
    chips.push({ key: "WEEKEND", label: "This weekend" });
  }

  const months = new Set<string>();
  for (const e of pool) {
    const d = pacificCalendarDate(e.dateStart);
    if (d) months.add(d.slice(0, 7));
  }
  const sorted = Array.from(months).sort();
  if (pastView) sorted.reverse();
  for (const m of sorted) chips.push({ key: m, label: monthChipLabel(m, nowMs) });
  return chips;
}

const WINDOW_PALETTE = [
  "var(--neon-yellow)", "var(--neon-cyan)", "var(--neon-magenta)",
  "var(--neon-orange)", "var(--neon-green)", "var(--neon-violet)",
];
function windowAccent(key: string, i: number): string {
  if (key === "ALL") return "var(--neon-cyan)";
  if (key === "THIS_WEEK") return "var(--neon-green)";
  if (key === "NEXT_WEEK") return "var(--neon-cyan)";
  if (key === "WEEKEND") return "var(--neon-magenta)";
  return WINDOW_PALETTE[i % WINDOW_PALETTE.length];
}

/** True when event `e` falls inside the selected date window. */
function eventInWindow(e: EventListing, window: string, windows: DateWindows): boolean {
  if (window === "ALL") return true;
  const d = pacificCalendarDate(e.dateStart);
  if (!d) return false;
  if (window === "THIS_WEEK") return windows.thisWeek.has(d);
  if (window === "NEXT_WEEK") return windows.nextWeek.has(d);
  if (window === "WEEKEND") return windows.weekend.has(d);
  return d.startsWith(window); // month key YYYY-MM
}

/** Board PAST = scheduled end has passed (not the 7-day MC post window). */
function isPastListing(e: EventListing): boolean {
  return isEventSchedulePast(e.dateStart, e.dateEnd);
}

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

function filterBoardEvents(
  events: EventListing[],
  activeDay: string,
  activeFilters: string[],
  searchQuery: string,
  pastView: boolean,
  nowMs: number,
) {
  const windows =
    activeDay === "WEEKEND" || activeDay === "THIS_WEEK" || activeDay === "NEXT_WEEK"
      ? buildDateWindows(nowMs)
      : { weekend: EMPTY_DATES, thisWeek: EMPTY_DATES, nextWeek: EMPTY_DATES };
  return events
    .filter(e => {
      // Live board = upcoming + happening now. Past board = ended only.
      const past = isPastListing(e);
      if (pastView ? !past : past) return false;
      if (!eventInWindow(e, activeDay, windows)) return false;
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

/** Branded 1200×630 card (replaces raw flyer as social preview image). */
function eventOgCardImage(eventId: number) {
  return `https://www.zaylist.com/api/og/event/${eventId}`;
}

function truncateSeo(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function readSearchParam(key: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key)?.trim() || "";
}

function EventsTabBar({
  activeTab,
  onSelect,
}: {
  activeTab: "board" | "schedule";
  onSelect: (tab: "board" | "schedule") => void;
}) {
  return (
    <nav className="events-tab-bar events-page-tab-bar" aria-label="Events view">
      <button
        type="button"
        className={`events-tab${activeTab === "board" ? " active" : ""}`}
        onClick={() => onSelect("board")}
        data-testid="events-tab-board"
      >
        The Board
      </button>
      <button
        type="button"
        className={`events-tab${activeTab === "schedule" ? " active" : ""}`}
        onClick={() => onSelect("schedule")}
        data-testid="events-tab-schedule"
      >
        The Schedule
      </button>
    </nav>
  );
}

export default function Events() {
  const { user } = useAuth();
  const [routeMatch, routeParams] = useRoute("/events/:id/:slug?");
  const [location, setLocation] = useLocation();
  const routeEventId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const routeDay = useMemo(() => readSearchParam("day").toUpperCase(), [location]);
  const [activeDay, setActiveDay] = useState("ALL");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  /** Past events live in their own board view (chip next to day categories). */
  const [pastView, setPastView] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q")?.trim() || "";
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<SortMode>("start_time");
  const [mapExpanded, setMapExpanded] = useState(false);
  /** Map stays open by default; visitors can hide it to free vertical space. */
  const [mapVisible, setMapVisible] = useState(true);
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
      ? `${shareEvent.title} | Portland Pride 2026 | Zaylist`
      : "Portland Pride 2026 Events | Zaylist",
    shareEvent
      ? truncateSeo(
          `${shareEvent.venueName || "Portland"}${shareEvent.neighborhood ? ` · ${shareEvent.neighborhood}` : ""}. ${shareEvent.description || ""}`,
        )
      : "Browse every live Portland Pride 2026 event on the map and board. Filter PDX Pride events by day, type, and neighborhood.",
    shareEvent
      ? {
          url: eventUrl(shareEvent.id, shareEvent.title),
          image: eventOgCardImage(shareEvent.id),
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

  const liveEvents = useMemo(() => events.filter(e => !isPastListing(e)), [events]);
  const pastEvents = useMemo(() => events.filter(isPastListing), [events]);
  const poolEvents = pastView ? pastEvents : liveEvents;

  // Date-window chips: All / This week / Next week / This weekend / months
  const dayChips = useMemo(() => buildDayChips(poolEvents, pastView, Date.now()), [poolEvents, pastView]);
  const activeChipLabel = dayChips.find(c => c.key === activeDay)?.label ?? null;
  // If the selected window no longer exists in the pool (e.g. after toggling Past), fall back to All.
  useEffect(() => {
    if (activeDay !== "ALL" && !dayChips.some(c => c.key === activeDay)) setActiveDay("ALL");
  }, [dayChips, activeDay]);

  const filtered = useMemo(
    () => sortEvents(filterBoardEvents(events, activeDay, activeFilters, searchQuery, pastView, Date.now()), sortMode),
    [events, activeDay, activeFilters, searchQuery, sortMode, pastView],
  );

  const posterServeQuery = useQuery<{ ads: AdServePayload[] }>({
    queryKey: ["/api/ads/serve", "grid"],
    queryFn: async () => {
      const r = await fetch("/api/ads/serve?surface=grid", { credentials: "include" });
      if (!r.ok) return { ads: [] };
      return r.json();
    },
    staleTime: 60_000,
  });
  const posterServeReady = posterServeQuery.isFetched || posterServeQuery.isError;

  /** Grid-only: scatter affiliate poster cards among real events (not list view). */
  const gridItems = useMemo(() => {
    // While serve loads, show events only so we do not flash legacy brands then swap.
    if (!posterServeReady) {
      return filtered.map((event) => ({ kind: "event" as const, event }));
    }
    return scatterAffiliateCards(filtered, posterServeQuery.data?.ads ?? []);
  }, [filtered, posterServeReady, posterServeQuery.data?.ads]);

  // All upcoming (not-yet-ended) live events — the site is year-round now.
  const upcomingCount = liveEvents.length;

  const heroStats = useMemo(() => {
    const parseTags = (raw: string) => {
      try {
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed.map((t: unknown) => String(t)) : [];
      } catch {
        return [];
      }
    };
    const isDanceParty = (e: EventListing) =>
      parseTags(e.eventTypes).some(tag => tag.trim().toUpperCase().replace(/[\s-]+/g, "_").includes("DANCE"));
    // Hero counts track the live board (upcoming + now), not ended listings.
    const unclaimedIds = new Set(
      liveEvents.filter(e => e.isClaimable && !e.claimedBy).map(e => e.id),
    );
    return [
      { num: upcomingCount, label: "Upcoming events", color: "#19e3ff" },
      { num: unclaimedIds.size, label: "Total unclaimed", color: "#ccff00" },
      { num: liveEvents.filter(isDanceParty).length, label: "Total dance parties", color: "#ff8c00" },
    ];
  }, [liveEvents, upcomingCount]);

  const hasActiveFilters =
    activeDay !== "ALL" || activeFilters.length > 0 || searchQuery.trim().length > 0 || pastView;

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div className="zine-page events-page board-page board-page--makeover">
      <EventsHero eventCount={upcomingCount} stats={heroStats} />

      <EventsTabBar activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "schedule" ? (
        <ScrollReveal delay={50}>
          <div className="events-page__body events-page__body--schedule">
            <ScheduleCard>
              <Schedule embed />
            </ScheduleCard>
          </div>
        </ScrollReveal>
      ) : (
      <section className="events-board-feed board-active-feed diag">
        <div className="board-active-feed__inner">
          <ScrollReveal delay={40}>
            <div className="events-board-feed__sticky">
              <div className="board-active-feed__head">
                <div className="board-active-feed__kicker board-active-feed__kicker--cyan">The board</div>
                <div className="board-active-feed__head-row">
                  <h2 className="display section-heading board-active-feed__title">
                    {pastView ? "Past events" : "Live listings"}
                  </h2>
                  <span className="board-active-feed__count" data-testid="events-count">
                    {isLoading ? (
                      "Loading…"
                    ) : hasActiveFilters && filtered.length !== poolEvents.length ? (
                      <>
                        <CountUpValue value={filtered.length} /> of{" "}
                        <CountUpValue
                          key={`${pastView ? "past" : "live"}-${poolEvents.length}`}
                          value={poolEvents.length}
                        />{" "}
                        showing
                      </>
                    ) : (
                      <>
                        <CountUpValue
                          key={`${pastView ? "past" : "live"}-${poolEvents.length}`}
                          value={poolEvents.length}
                        />{" "}
                        event{poolEvents.length === 1 ? "" : "s"}
                        {pastView ? " past" : ""}
                      </>
                    )}
                    {activeChipLabel && activeDay !== "ALL" ? ` · ${activeChipLabel}` : ""}
                    {pastEvents.length > 0 && !pastView ? (
                      <span className="events-past-hint"> · {pastEvents.length} past</span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="board-active-feed__controls">
                <div className="board-filter-row events-filter-row">
                  {dayChips.map((chip, i) => {
                    const selected = activeDay === chip.key;
                    return (
                      <FilterChip
                        key={chip.key}
                        selected={selected}
                        fill={selected}
                        accent={windowAccent(chip.key, i)}
                        onToggle={() => setActiveDay(chip.key)}
                        data-testid={`filter-day-${chip.key}`}
                      >
                        {chip.label}
                      </FilterChip>
                    );
                  })}
                  <div className="events-filter-divider" aria-hidden="true" />
                  <FilterChip
                    selected={pastView}
                    fill={pastView}
                    accent="var(--text-meta, #8c8980)"
                    onToggle={() => setPastView(v => !v)}
                    data-testid="filter-past-events"
                    className="events-filter-chip--past"
                    style={pastView ? { color: "var(--text-hi)" } : undefined}
                  >
                    PAST{pastEvents.length > 0 ? ` · ${pastEvents.length}` : ""}
                  </FilterChip>
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
                  <div className="events-filter-search">
                    <SearchInput
                      placeholder={pastView ? "Search past events..." : "Search events..."}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      onClear={() => setSearchQuery("")}
                      data-testid="event-search"
                      size="sm"
                    />
                  </div>
                  <div className="events-filter-spacer" />
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
                  <div className="events-view-toggle">
                    <button
                      data-testid="toggle-grid-view"
                      onClick={() => setViewMode("grid")}
                      className={`events-view-toggle__btn${viewMode === "grid" ? " active" : ""}`}
                      title="Grid view"
                    >
                      <Grid size={22} />
                    </button>
                    <button
                      data-testid="toggle-list-view"
                      onClick={() => setViewMode("list")}
                      className={`events-view-toggle__btn${viewMode === "list" ? " active" : ""}`}
                      title="List view"
                    >
                      <List size={22} />
                    </button>
                  </div>
                </div>
                {(activeFilters.length > 0 || searchQuery.trim() || pastView || activeDay !== "ALL") && (
                  <button
                    type="button"
                    className="events-clear-filters"
                    onClick={() => {
                      setActiveFilters([]);
                      setSearchQuery("");
                      setPastView(false);
                      setActiveDay("ALL");
                    }}
                  >
                    Clear filters ×
                  </button>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Map under filter chips so pins track the same selection as the board. */}
          <div className="events-map-toolbar">
            <button
              type="button"
              className="events-map-toggle"
              data-testid="button-toggle-events-map"
              aria-expanded={mapVisible}
              aria-controls="events-map-panel"
              onClick={() => {
                setMapVisible(v => {
                  if (v) setMapExpanded(false);
                  return !v;
                });
              }}
            >
              {mapVisible ? "Hide map" : "Show map"}
            </button>
            {mapVisible && !isLoading && (
              <span className="events-map-toolbar__count" data-testid="events-map-filter-count">
                Map · {filtered.length} event{filtered.length === 1 ? "" : "s"}
                {activeChipLabel && activeDay !== "ALL" ? ` · ${activeChipLabel}` : ""}
                {activeFilters.length > 0 ? ` · ${activeFilters.join(" · ")}` : ""}
                {pastView ? " · past" : ""}
              </span>
            )}
          </div>

          {mapVisible && (
            <ScrollReveal>
              <div id="events-map-panel" className="events-map-row events-map-row--solo">
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
            </ScrollReveal>
          )}

          <div className="board-active-feed__body">
        {isLoading ? (
          <BoardLoadingState label="Loading events" />
        ) : isError ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">Could not load events</p>
            <p className="board-copy-sm">
              {error instanceof Error ? error.message : "The events API is unavailable right now."}
            </p>
            <Button type="button" variant="solid" accent="lime" onClick={() => refetch()} style={{ marginTop: 16 }}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">
              {pastView ? "No past events match" : "Nothing matches"}
            </p>
            <p className="board-copy-sm">
              {pastView
                ? "Try another day filter or search. Switch off PAST to return to live listings."
                : "Try a broader day or filter. Search by venue, neighborhood, or title. Past events live under PAST."}
            </p>
            <Button
              type="button"
              variant="neon"
              accent="cyan"
              onClick={() => {
                setActiveDay("ALL");
                setActiveFilters([]);
                setSearchQuery("");
                setPastView(false);
              }}
              style={{ marginTop: 16 }}
            >
              {pastView ? "Back to live listings" : "Clear filters"}
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <ScrollReveal delay={50}>
          <div className="events-poster-grid">
            {gridItems.map((item, i) => {
              if (item.kind === "affiliate") {
                return (
                  <div
                    key={item.key}
                    className="ds-listing-card ds-listing-card--grid"
                  >
                    {item.ad ? (
                      <PosterAdCard
                        ad={item.ad}
                        brand={item.brand}
                        style={{ height: "100%" }}
                      />
                    ) : (
                      <AffiliatePosterCard
                        brand={item.brand}
                        style={{ height: "100%" }}
                      />
                    )}
                  </div>
                );
              }
              const e = item.event;
              return (
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
              );
            })}
          </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal delay={50}>
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
          </ScrollReveal>
        )}

        <ScrollReveal delay={60}>
          <div className="events-submit-panel board-path-card board-path-card--host">
            <div className="board-path-card__label">Promoters</div>
            <h3>Not seeing your event?</h3>
            <p>Submit a new listing or claim one that is already in the guide.</p>
            <Link href="/submit">
              <Button as="span" variant="solid" accent="lime" arrow>Get started</Button>
            </Link>
          </div>
        </ScrollReveal>
          </div>
        </div>
      </section>
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEvent}
          onEventUpdated={updated => setSelectedEvent(updated)}
        />
      )}

      <BoardCloseSeam
        line="Find the party. Show up for your people."
        url="zaylist.com/events"
      />
    </div>
  );
}
