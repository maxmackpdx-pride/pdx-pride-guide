import { eventsTonightWindow } from "@shared/eventsTonight";
import BoardShader from "@/components/board/BoardShader";
import { createEventSearch } from "@shared/eventSearch";
import BrowseToolbar from "@/components/BrowseToolbar";
import EventsDrawer from "@/components/events/EventsDrawer";
import BrowseStatus from "@/components/BrowseStatus";
import PageRecovery from "@/components/PageRecovery";
import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

import type { Event } from "@shared/schema";
import { listingKey, type EventListing } from "@shared/multiDayEvents";
import { admissionFromFilterTag } from "@shared/admission";
import { EVENT_TYPE_FILTERS, isEventTypeFilterLabel } from "@shared/eventTypeTags";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import TonightEventCard, { type TonightCardLive } from "@/components/home/TonightEventCard";
import ZLineIcon from "@/components/ZLineIcon";
import { listingPosterUrl } from "@/lib/dsEvent";
import { eventTimeLabel, eventDateLabel } from "@/lib/eventDisplay";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import AuthModal from "@/components/AuthModal";
import AffiliatePosterCard from "@/components/AffiliatePosterCard";
import PosterAdCard from "@/components/ads/PosterAdCard";
import type { AdServePayload } from "@/lib/adTypes";
import { EventzNeonLogo } from "@/components/EventsHero";
import EventRailCard from "@/components/events/EventRailCard";
import EventsRail from "@/components/events/EventsRail";
import ThisWeekRail, { type WeekDay } from "@/components/events/ThisWeekRail";
import BoardShareButton from "@/components/BoardShareButton";
import BoardFollowButton from "@/components/BoardFollowButton";
import ScrollReveal from "@/components/ScrollReveal";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import EventTypeTag from "../components/EventTypeTag";
import EventModal from "../components/EventModal";
import type { EventModalOriginRect } from "../components/EventModal";
import Schedule from "@/pages/Schedule";
import ScheduleCard from "@/components/ScheduleCard";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import { eventPath, eventUrl } from "@shared/eventSlug";
import { scatterAffiliateCards } from "@/lib/affiliateCards";
import { List, Grid, ChevronDown, ChevronRight, CalendarDays, Map as MapIcon, MapPin, SlidersHorizontal } from "lucide-react";
import { Button, FilterChip, SearchInput } from "@/components/ds";

import { DAY_SORT_ORDER } from "@shared/eventWeek";
import { isEventSchedulePast, pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import "./Events.css";
import { shareCardUrl } from "@shared/shareCards";
import { roomTitle } from "@/lib/rooms";
import EventThumb from "@/components/events/EventThumb";

const PACIFIC = "America/Los_Angeles";
const GRID_RENDER_BATCH = 40;
const LIST_RENDER_BATCH = 60;
const MOBILE_GRID_RENDER_BATCH = 12;
const MOBILE_LIST_RENDER_BATCH = 20;

function renderBatch(viewMode: "grid" | "list", isMobile: boolean): number {
  if (viewMode === "grid") return isMobile ? MOBILE_GRID_RENDER_BATCH : GRID_RENDER_BATCH;
  return isMobile ? MOBILE_LIST_RENDER_BATCH : LIST_RENDER_BATCH;
}

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
  today: string;
  tonightStart: number;
  tonightEnd: number;
  weekend: Set<string>;
  thisWeek: Set<string>;
  nextWeek: Set<string>;
};

function buildDateWindows(nowMs: number): DateWindows {
  const today = pacificTodayDate(nowMs);
  const tonight = eventsTonightWindow(nowMs);
  return {
    today,
    tonightStart: tonight.start,
    tonightEnd: tonight.end,
    weekend: weekendDates(nowMs),
    thisWeek: weekDates(nowMs, 0),
    nextWeek: weekDates(nowMs, 1),
  };
}

/** Date-window filter chips derived from the events in view (year-round). */
function buildDayChips(pool: EventListing[], pastView: boolean, nowMs: number): DayChip[] {
  const chips: DayChip[] = [{ key: "ALL", label: "All" }];
  if (!pastView) {
    chips.push({ key: "TODAY", label: "Today" }, { key: "TONIGHT", label: "Tonight" });
  }
  const { weekend, thisWeek, nextWeek } = buildDateWindows(nowMs);

  // Week windows first - quick “what’s on now / coming up”
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
  if (key === "TODAY") return "var(--neon-green)";
  if (key === "TONIGHT") return "var(--neon-violet)";
  if (key === "THIS_WEEK") return "var(--neon-green)";
  if (key === "NEXT_WEEK") return "var(--neon-cyan)";
  if (key === "WEEKEND") return "var(--neon-magenta)";
  return WINDOW_PALETTE[i % WINDOW_PALETTE.length];
}

/** True when event `e` falls inside the selected date window. */
function eventInWindow(e: EventListing, window: string, windows: DateWindows): boolean {
  if (window === "ALL") return true;
  if (window === "TONIGHT") {
    const start = parsePacificDateTime(e.dateStart);
    const end = parsePacificDateTime(e.dateEnd);
    return start != null && start < windows.tonightEnd && (end != null && end > start ? end > windows.tonightStart : start >= windows.tonightStart);
  }
  const d = pacificCalendarDate(e.dateStart);
  if (!d) return false;
  if (window.startsWith("D:")) return d === window.slice(2);
  if (window === "TODAY") return d === windows.today;
  if (window === "THIS_WEEK") return windows.thisWeek.has(d);
  if (window === "NEXT_WEEK") return windows.nextWeek.has(d);
  if (window === "WEEKEND") return windows.weekend.has(d);
  return d.startsWith(window); // month key YYYY-MM
}

const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const DEFAULT_WINDOW = "TONIGHT";
const SOON_MS = 3 * 3600000;

/** ON NOW / STARTS IN state for a card, from its scheduled start and end. */
function liveStateFor(e: EventListing, nowMs: number): TonightCardLive | null {
  const start = parsePacificDateTime(e.dateStart);
  if (start == null) return null;
  const end = parsePacificDateTime(e.dateEnd);
  if (start <= nowMs && end != null && end > nowMs) return { kind: "now" };
  if (start > nowMs && start - nowMs <= SOON_MS) return { kind: "soon", startMs: start };
  return null;
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
      return sorted.sort((a, b) => (parsePacificDateTime(a.dateEnd) ?? Infinity) - (parsePacificDateTime(b.dateEnd) ?? Infinity));
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
    ["TODAY", "TONIGHT", "WEEKEND", "THIS_WEEK", "NEXT_WEEK"].includes(activeDay)
      ? buildDateWindows(nowMs)
      : { today: "", tonightStart: 0, tonightEnd: 0, weekend: EMPTY_DATES, thisWeek: EMPTY_DATES, nextWeek: EMPTY_DATES };
  const matchesSearch = createEventSearch(searchQuery);
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
      if (!matchesSearch(e)) return false;
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

export default function Events() {
  const [leaving, setLeaving] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(navigationTimer.current), []);
  const goToEventAction = (path: string) => {
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('calm-mode') || document.documentElement.dataset.calm === 'true';
    setLeaving(true);
    clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => setLocation(path), quiet ? 0 : 220);
  };
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setTimeout(refresh, Math.max(1, eventsTonightWindow(now).nextReset - Date.now()));
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [now]);
  const { user } = useAuth();
  const { savedIds, toggleSave } = useSavedEvents();
  const [showSaveAuth, setShowSaveAuth] = useState(false);
  const isMobile = useIsMobile() || (typeof window !== "undefined" && window.innerWidth < 768);
  const [routeMatch, routeParams] = useRoute("/events/:id/:slug?");
  const [location, setLocation] = useLocation();
  const routeEventId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const routeDay = useMemo(() => readSearchParam("day").toUpperCase(), [location]);
  const [activeDay, setActiveDay] = useState(() => readSearchParam("window") || DEFAULT_WINDOW);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    const raw = readSearchParam("type");
    return raw
      .split("|")
      .map(value => value.trim().toUpperCase())
      .filter(isEventTypeFilterLabel);
  });
  /** Past events live in their own board view (chip next to day categories). */
  const [pastView, setPastView] = useState(() => readSearchParam("past") === "1");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q")?.trim() || "";
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventOriginRect, setEventOriginRect] = useState<EventModalOriginRect | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => readSearchParam("view") === "list" ? "list" : "grid");
  const [visibleItemCount, setVisibleItemCount] = useState(() => renderBatch(
    readSearchParam("view") === "list" ? "list" : "grid",
    typeof window !== "undefined" && window.innerWidth < 768,
  ));
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<SortMode>(() => SORT_OPTIONS.find(option => option.value === readSearchParam("sort"))?.value || "start_time");
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
  const browseQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (activeDay !== DEFAULT_WINDOW) params.set("window", activeDay);
    if (activeFilters.length) params.set("type", activeFilters.join("|"));
    if (pastView) params.set("past", "1");
    if (viewMode !== "grid") params.set("view", viewMode);
    if (sortMode !== "start_time") params.set("sort", sortMode);
    if (activeTab === "schedule") params.set("tab", activeTab);
    return params;
  }, [searchQuery, activeDay, activeFilters, pastView, viewMode, sortMode, activeTab]);
  const openEvent = useCallback((event: EventListing, originRect: EventModalOriginRect | null = null) => {
    setEventOriginRect(originRect);
    setSelectedEvent(event);
    const target = new URL(eventPath(event.id, event.title, event.dayOfWeek), window.location.origin);
    browseQuery().forEach((value, key) => target.searchParams.set(key, value));
    setLocation(target.pathname + target.search);
  }, [setLocation, browseQuery]);
  const closeEvent = useCallback(() => {
    setSelectedEvent(null);
    setEventOriginRect(null);
    const query = browseQuery().toString();
    setLocation(query ? `/events?${query}` : "/events");
  }, [setLocation, browseQuery]);
  useEffect(() => {
    if (routeMatch) return;
    const query = browseQuery().toString();
    const target = query ? `/events?${query}` : "/events";
    if (window.location.pathname + window.location.search !== target) {
      window.history.replaceState(window.history.state, "", target);
    }
  }, [browseQuery, routeMatch]);
  useEffect(() => {
    const restore = () => {
      setActiveDay(readSearchParam("window") || DEFAULT_WINDOW);
      setActiveFilters(readSearchParam("type").split("|").filter(isEventTypeFilterLabel));
      setPastView(readSearchParam("past") === "1");
      setSearchQuery(readSearchParam("q"));
      setViewMode(readSearchParam("view") === "list" ? "list" : "grid");
      setSortMode(SORT_OPTIONS.find(option => option.value === readSearchParam("sort"))?.value || "start_time");
      setActiveTabState(readSearchParam("tab") === "schedule" ? "schedule" : "board");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

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

  const { data: routeEvent, error: routeError, refetch: refetchRouteEvent } = useQuery<Event>({
    queryKey: ["/api/events", routeEventId, routeDay],
    queryFn: () => apiRequest("GET", `/api/events/${routeEventId}${routeDay ? `?day=${routeDay}` : ""}`).then(r => r.json()),
    enabled: routeEventId != null && Number.isFinite(routeEventId),
  });

  const shareEvent = selectedEvent || routeEvent || null;
  usePageSeo(
    roomTitle("eventz", shareEvent?.title),
    shareEvent
      ? truncateSeo(
          `${shareEvent.venueName || "Portland"}${shareEvent.neighborhood ? ` · ${shareEvent.neighborhood}` : ""}. ${shareEvent.description || ""}`,
        )
      : "Browse every live Portland night on EVENTZ. Filter by day, type, and neighborhood.",
    shareEvent
      ? {
          url: eventUrl(shareEvent.id, shareEvent.title),
          image: eventOgCardImage(shareEvent.id),
          imageAlt: shareEvent.title,
          type: "article",
        }
      : {
          image: shareCardUrl("events"),
          imageAlt: "Events on Zaylist — Portland queer nights",
        },
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

  const liveEvents = useMemo(() => events.filter(e => !isPastListing(e)), [events, now]);
  const pastEvents = useMemo(() => events.filter(isPastListing), [events, now]);
  const poolEvents = pastView ? pastEvents : liveEvents;

  // Date-window chips: All / Today / Tonight / week windows / months
  const dayChips = useMemo(() => buildDayChips(poolEvents, pastView, now), [poolEvents, pastView, now]);
  const activeChipLabel = dayChips.find(c => c.key === activeDay)?.label ?? null;
  // If the selected window no longer exists in the pool (e.g. after toggling Past), fall back to All.
  useEffect(() => {
    if (!isLoading && activeDay !== "ALL" && !activeDay.startsWith("D:") && !dayChips.some(c => c.key === activeDay)) setActiveDay("ALL");
  }, [dayChips, activeDay, isLoading]);

  const filtered = useMemo(
    () => sortEvents(filterBoardEvents(events, activeDay, activeFilters, searchQuery, pastView, now), sortMode),
    [events, activeDay, activeFilters, searchQuery, sortMode, pastView, now],
  );

  // One date rail: tonight plus the next six days, each with a live count.
  const dayRail = useMemo(() => {
    const today = pacificTodayDate(now);
    const noon = parsePacificDateTime(`${today}T12:00:00`) ?? now;
    return Array.from({ length: 7 }, (_, i) => {
      const ms = noon + i * 86400000;
      const date = pacDate(ms);
      const code = WEEKDAY_CODES[pacWeekday(ms)] ?? "SAT";
      const lower = code.toLowerCase();
      const key = i === 0 ? DEFAULT_WINDOW : `D:${date}`;
      const mon = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short" }).format(new Date(ms)).toUpperCase();
      const dom = Number(date.slice(8));
      return {
        key,
        top: i === 0 ? "Tonight" : code,
        sub: i === 0 ? `${code} ${dom}` : `${mon} ${dom}`,
        color: `var(--day-${lower})`,
        text: code === "MON" || code === "TUE" ? `var(--day-${lower}-text)` : `var(--day-${lower})`,
        ink: code === "MON" || code === "TUE" ? "var(--text-hi)" : "var(--z-black)",
        count: filterBoardEvents(events, key, activeFilters, searchQuery, false, now).length,
      };
    });
  }, [events, activeFilters, searchQuery, now]);
  const railKeys = useMemo(() => new Set(dayRail.map(d => d.key)), [dayRail]);
  const moreLabel = pastView ? "Past" : railKeys.has(activeDay) ? "All +" : (activeChipLabel ?? "All +");

  // A single day reads as a timeline. Tonight: on now, starting soon, tonight,
  // late. Any other day on the rail: daytime, evening, late.
  const tonightBands = useMemo(() => {
    const isTonight = activeDay === DEFAULT_WINDOW;
    if ((!isTonight && !activeDay.startsWith("D:")) || pastView || sortMode !== "start_time") return null;
    const date = isTonight ? pacificTodayDate(now) : activeDay.slice(2);
    const eveningCut = parsePacificDateTime(`${date}T17:00:00`) ?? now;
    const lateCut = parsePacificDateTime(`${date}T21:00:00`) ?? now;
    const bands = isTonight
      ? [
          { id: "now", label: "On now", color: "var(--neon-green)", items: [] as EventListing[] },
          { id: "soon", label: "Starting soon", color: "var(--neon-cyan)", items: [] as EventListing[] },
          { id: "tonight", label: "Tonight", color: "var(--neon-magenta)", items: [] as EventListing[] },
          { id: "late", label: "Late", color: "var(--neon-violet)", items: [] as EventListing[] },
        ]
      : [
          { id: "day", label: "Daytime", color: "var(--neon-cyan)", items: [] as EventListing[] },
          { id: "evening", label: "Evening", color: "var(--neon-magenta)", items: [] as EventListing[] },
          { id: "late", label: "Late", color: "var(--neon-violet)", items: [] as EventListing[] },
        ];
    for (const e of filtered) {
      const start = parsePacificDateTime(e.dateStart) ?? now;
      if (isTonight) {
        const live = liveStateFor(e, now);
        if (live?.kind === "now") bands[0].items.push(e);
        else if (live?.kind === "soon") bands[1].items.push(e);
        else if (start < lateCut) bands[2].items.push(e);
        else bands[3].items.push(e);
      } else if (start < eveningCut) bands[0].items.push(e);
      else if (start < lateCut) bands[1].items.push(e);
      else bands[2].items.push(e);
    }
    return bands.filter(b => b.items.length > 0);
  }, [activeDay, pastView, sortMode, filtered, now]);

  // Mobile rails: the first band (now + soon merged on tonight) keeps the full
  // Eventz card at rail width; later bands use compact rail cards.
  const railBands = useMemo(() => {
    if (!tonightBands || !tonightBands.length) return null;
    const merged = tonightBands.filter(b => b.id === "now" || b.id === "soon");
    const rest = tonightBands.filter(b => b.id !== "now" && b.id !== "soon");
    const first = merged.length
      ? [{ id: "happening", label: "Happening now", color: "var(--neon-green)", items: merged.flatMap(b => b.items) }]
      : [];
    const bands = [...first, ...rest];
    // Tonight also previews tomorrow as its own rail.
    if (activeDay === DEFAULT_WINDOW) {
      const today = pacificTodayDate(now);
      const tomorrowKey = `D:${pacDate((parsePacificDateTime(`${today}T12:00:00`) ?? now) + 86400000)}`;
      const items = sortEvents(filterBoardEvents(events, tomorrowKey, activeFilters, searchQuery, false, now), "start_time");
      if (items.length) bands.push({ id: "tomorrow", label: "Tomorrow", color: "var(--neon-orange)", items, dayKey: tomorrowKey } as typeof bands[number] & { dayKey: string });
    }
    return bands as Array<typeof bands[number] & { dayKey?: string }>;
  }, [tonightBands, activeDay, events, activeFilters, searchQuery, now]);
  // This week: one day card per weekday (today plus six), each holding that day's events.
  const weekDays = useMemo<WeekDay[] | null>(() => {
    if (activeDay !== DEFAULT_WINDOW || pastView) return null;
    const today = pacificTodayDate(now);
    const noon = parsePacificDateTime(`${today}T12:00:00`) ?? now;
    return Array.from({ length: 7 }, (_, i) => {
      const ms = noon + i * 86400000;
      const date = pacDate(ms);
      const code = WEEKDAY_CODES[pacWeekday(ms)] ?? "SAT";
      const mon = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short" }).format(new Date(ms)).toUpperCase();
      const key = `D:${date}`;
      return { key, code, mon, dom: Number(date.slice(8)), color: `var(--day-${code.toLowerCase()})`, items: sortEvents(filterBoardEvents(events, key, activeFilters, searchQuery, false, now), "start_time") };
    });
  }, [activeDay, pastView, events, activeFilters, searchQuery, now]);
  const weekLiveState = useCallback((e: EventListing) => liveStateFor(e, now), [now]);
  const weekToggleSave = useCallback((id: number) => (user ? toggleSave(id) : setShowSaveAuth(true)), [user, toggleSave]);
  const weekOpen = useCallback((listing: EventListing) => openEvent(listing), [openEvent]);
  const [openRails, setOpenRails] = useState<Set<string>>(() => new Set());
  useEffect(() => { setOpenRails(new Set()); }, [activeDay, activeFilters, searchQuery]);
  const useRails = isMobile && viewMode === "grid" && railBands != null;

  const mySavedUpcoming = useMemo(
    () => liveEvents.filter(e => savedIds.has(e.id)).length,
    [liveEvents, savedIds],
  );
  const drawerFilterCount = (railKeys.has(activeDay) ? 0 : 1) + Number(pastView) + Number(sortMode !== "start_time") + activeFilters.length;

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

  const visibleGridItems = useMemo(
    () => gridItems.slice(0, visibleItemCount),
    [gridItems, visibleItemCount],
  );
  const visibleListEvents = useMemo(
    () => filtered.slice(0, visibleItemCount),
    [filtered, visibleItemCount],
  );
  const hasMoreVisibleItems = viewMode === "grid"
    ? visibleGridItems.length < gridItems.length
    : visibleListEvents.length < filtered.length;

  useEffect(() => {
    setVisibleItemCount(renderBatch(viewMode, isMobile));
  }, [viewMode, isMobile, activeDay, activeFilters, searchQuery, sortMode, pastView]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMoreVisibleItems) return;
    const batch = renderBatch(viewMode, isMobile);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleItemCount(count => count + batch);
        }
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreVisibleItems, viewMode, isMobile, visibleItemCount]);

  // All upcoming (not-yet-ended) live events - the site is year-round now.
  const upcomingCount = liveEvents.length;


  const todayKicker = useMemo(() => {
    const label = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, weekday: "short", month: "short", day: "numeric" }).format(new Date(now)).replace(",", "").toUpperCase();
    return `${label} · Portland`;
  }, [now]);

  const hasActiveFilters =
    activeDay !== "ALL" || activeFilters.length > 0 || searchQuery.trim().length > 0 || pastView;

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => {
      const next = prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f];
      const params = new URLSearchParams(window.location.search);
      if (next.length) params.set("type", next.join("|"));
      else params.delete("type");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/events?${qs}` : "/events");
      return next;
    });

  if (routeMatch && (routeError || !Number.isFinite(routeEventId))) {
    const missing = !Number.isFinite(routeEventId) || /^404:/.test(routeError?.message || "");
    return <PageRecovery section="Eventz" title={missing ? "This event isn’t here anymore." : "We couldn’t load this event."}
      description={missing ? "The listing may have moved or been removed. There’s still plenty happening: find your next plan on Eventz." : "We couldn’t retrieve the event details. Try again before making your plans."}
      href="/events" label="Browse Eventz" missing={missing} retry={missing ? undefined : () => { void refetchRouteEvent(); }} />;
  }

  return (
    <div className="zine-page events-page board-page board-page--makeover board-shader-page" data-shader-room="eventz" data-leaving={leaving || undefined}>
      <BoardShader room="eventz" />
      <header className="events-top pdx-glass-rebind" style={{ "--c": "var(--room-eventz)" } as React.CSSProperties}>
        <div className="events-top__row">
          <div className="events-top__id">
            <p className="events-top__kicker">{todayKicker}</p>
            <h1 className="events-top__mark"><EventzNeonLogo ready={upcomingCount > 0} className="events-top__logo" /></h1>
          </div>
          <div className="events-top__actions">
            <BoardShareButton title="Eventz" path="/events" card={{ room: "Eventz", mark: "/brand/family/eventz.png" }} />
            <BoardFollowButton board="eventz" />
          </div>
        </div>
        <p className="events-top__lede">Portland queer nights, daytime hangs and community gatherings, all year. Save what you like and it lands in My Schedule.</p>
      </header>


      {activeTab === "schedule" ? (
        <ScrollReveal delay={50}>
          <div className="events-page__body events-page__body--schedule">
            <div className="events-schedule-switch">
              <button type="button" className="events-tool-btn" onClick={() => setActiveTab("board")}>
                <Grid size={18} aria-hidden="true" />Back to flyers
              </button>
            </div>
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
              {pastView && (
                <div className="board-active-feed__head">
                  <h2 className="display section-heading board-active-feed__title">Past events</h2>
                </div>
              )}
              <div className="events-browse">
                <div className="events-day-row">
                <nav className="events-day-rail" aria-label="Pick a day">
                  {dayRail.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      className={`events-day-tab pdx-glass-rebind${d.key === DEFAULT_WINDOW ? " events-day-tab--tonight" : ""}`}
                      aria-pressed={!pastView && activeDay === d.key}
                      onClick={() => { setPastView(false); setActiveDay(d.key); }}
                      style={{ "--c": d.color, "--day-text": d.text, "--day-ink": d.ink } as React.CSSProperties}
                      data-testid={`day-tab-${d.key}`}
                    >
                      <span className="events-day-tab__top">{d.top}</span>
                      <span className="events-day-tab__sub">{d.sub}</span>
                      <span className="events-day-tab__count" aria-label={`${d.count} events`}>{d.count}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="events-day-tab events-day-tab--more"
                    aria-pressed={pastView || !railKeys.has(activeDay)}
                    aria-haspopup="dialog"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <span className="events-day-tab__top">More</span>
                    <span className="events-day-tab__sub">{moreLabel}</span>
                  </button>
                </nav>
                  <div className="events-view-toggle">
                    <button
                      type="button"
                      data-testid="toggle-grid-view"
                      onClick={() => setViewMode("grid")}
                      className={`events-view-toggle__btn${viewMode === "grid" ? " active" : ""}`}
                      title="Grid view"
                      aria-label="Show events as a grid"
                      aria-pressed={viewMode === "grid"}
                    >
                      <Grid size={22} />
                    </button>
                    <button
                      type="button"
                      data-testid="toggle-list-view"
                      onClick={() => setViewMode("list")}
                      className={`events-view-toggle__btn${viewMode === "list" ? " active" : ""}`}
                      title="List view"
                      aria-label="Show events as a list"
                      aria-pressed={viewMode === "list"}
                    >
                      <List size={22} />
                    </button>
                    <button
                      type="button"
                      data-testid="toggle-calendar-view"
                      onClick={() => setActiveTab("schedule")}
                      className="events-view-toggle__btn"
                      title="Calendar view"
                      aria-label="Show the calendar"
                    >
                      <CalendarDays size={22} />
                    </button>
                  </div>
                </div>
              <BrowseToolbar label="Search and filter Eventz" className="board-active-feed__controls">
                <div className="board-filter-row events-filter-row">
                  <div className="events-filter-search">
                    <SearchInput
                      id="event-search"
                      aria-label={pastView ? "Search past events" : "Search events"}
                      placeholder={pastView ? "Search past events, venues, DJs, days…" : "Search events, venues, DJs, days…"}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      onClear={() => setSearchQuery("")}
                      data-testid="event-search"
                      size="sm"
                    />
                  </div>
                  <button type="button" className="events-tool-btn events-tool-btn--icon" aria-haspopup="dialog" aria-label={`Filters${drawerFilterCount ? `, ${drawerFilterCount} on` : ""}`} onClick={() => setDrawerOpen(true)} data-testid="events-filters-open">
                    <SlidersHorizontal size={19} aria-hidden="true" />{drawerFilterCount ? <span className="events-tool-btn__count" aria-hidden="true">{drawerFilterCount}</span> : null}
                  </button>
                  <button type="button" className="events-tool-btn events-tool-btn--icon" aria-haspopup="dialog" aria-label="Map" onClick={() => setMapOpen(true)} data-testid="events-map-open">
                    <MapIcon size={19} aria-hidden="true" />
                  </button>
                </div>
                {(activeFilters.length > 0 || searchQuery.trim() || pastView || activeDay !== DEFAULT_WINDOW) && (
                  <button
                    type="button"
                    className="events-clear-filters"
                    onClick={() => {
                      setActiveFilters([]);
                      setSearchQuery("");
                      setPastView(false);
                      setActiveDay(DEFAULT_WINDOW);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </BrowseToolbar>
              </div>
            </div>
          </ScrollReveal>

          <div className="board-active-feed__body">
        {isLoading ? (
          <BoardFeedSkeleton label="Loading events" shape="board" count={6} />
        ) : isError ? (
          <BrowseStatus error title="Events couldn’t load" description="Your filters are still here. Try loading the events again." onAction={() => void refetch()} />
        ) : filtered.length === 0 ? (
          <div className="browse-status" role="status">
            <p className="display section-heading">
              {poolEvents.length === 0
                ? pastView ? "No past events yet" : "No upcoming events listed yet"
                : pastView ? "No past events match" : "Nothing matches"}
            </p>
            <p className="board-copy-sm">
              {poolEvents.length === 0
                ? pastView
                  ? "Ended events will appear here. Browse live listings to see what is coming up."
                  : pastEvents.length > 0
                    ? "There are no upcoming listings right now. Explore past events in the archive, or submit an event you know about."
                    : "There are no upcoming listings right now. Submit an event to help fill the board."
                : "Try a broader date or filter. Search by venue, neighborhood, or title."}
            </p>
            <Button
              type="button"
              variant="neon"
              accent="cyan"
              onClick={() => {
                setActiveDay("ALL");
                setActiveFilters([]);
                setSearchQuery("");
                if (poolEvents.length === 0) {
                  if (!pastView && pastEvents.length === 0) {
                    setLocation("/submit");
                  } else {
                    setPastView(!pastView);
                  }
                }
              }}
              style={{ marginTop: 16 }}
            >
              {poolEvents.length === 0
                ? pastView ? "Back to live listings" : pastEvents.length > 0 ? "Explore the archive" : "Submit an event"
                : "Clear filters"}
            </Button>
          </div>
        ) : useRails && railBands ? (
          <div className="events-rails">
            {railBands.map((band, index) => {
              const expanded = openRails.has(band.id);
              // Happening now keeps the full Eventz card; every other rail uses one size.
              const size = band.id === "happening" ? "full" : "m";
              return (
                <section key={band.id} className={`events-rail-sec events-rail-sec--${size} pdx-glass-rebind`} style={{ "--c": band.color } as React.CSSProperties} aria-labelledby={`events-rail-${band.id}`}>
                  <div className="events-rail-sec__head">
                    <h3 id={`events-rail-${band.id}`}><span aria-hidden="true" />{band.label}<small>{band.items.length}</small></h3>
                    <div className="events-rail-sec__actions">
                      {index === 0 && (
                        <button type="button" className="events-rail-pill" onClick={() => setMapOpen(true)}><MapIcon size={14} aria-hidden="true" />Map</button>
                      )}
                      {band.dayKey ? (
                        <button type="button" className="events-rail-pill" onClick={() => { setPastView(false); setActiveDay(band.dayKey!); }}>
                          See the day
                        </button>
                      ) : band.items.length > 2 && (
                        <button
                          type="button"
                          className="events-rail-pill"
                          aria-expanded={expanded}
                          onClick={() => setOpenRails(prev => { const next = new Set(prev); if (next.has(band.id)) next.delete(band.id); else next.add(band.id); return next; })}
                        >
                          {expanded ? "Show less" : "View all"}
                        </button>
                      )}
                    </div>
                  </div>
                  <EventsRail open={expanded} label={band.label} nudge={index === 0}>
                    {band.items.map(e => (
                      <div role="listitem" key={listingKey(e)} className="events-rail__item">
                        {size === "full" ? (
                          <TonightEventCard
                            listing={e} rsvped={savedIds.has(e.id)}
                            liveState={liveStateFor(e, now)}
                            onToggleRsvp={id => user ? toggleSave(id) : setShowSaveAuth(true)}
                            onOpen={listing => openEvent(listing)}
                          />
                        ) : (
                          <EventRailCard
                            listing={e} size={size} saved={savedIds.has(e.id)}
                            liveState={liveStateFor(e, now)}
                            onToggleSave={id => user ? toggleSave(id) : setShowSaveAuth(true)}
                            onOpen={listing => openEvent(listing)}
                          />
                        )}
                      </div>
                    ))}
                  </EventsRail>
                </section>
              );
            })}
            {weekDays ? <ThisWeekRail days={weekDays} savedIds={savedIds} liveStateFor={weekLiveState} onToggleSave={weekToggleSave} onOpen={weekOpen} /> : null}
          </div>
        ) : tonightBands ? (
          <div className={`events-card-feed events-bands${viewMode === "list" ? " events-card-feed--list" : ""}`}>
            {tonightBands.map(band => (
              <section key={band.id} className="events-band pdx-glass-rebind" style={{ "--c": band.color } as React.CSSProperties} aria-labelledby={`events-band-${band.id}`}>
                <h3 className="events-band__head" id={`events-band-${band.id}`}>
                  <span aria-hidden="true" />{band.label}<small>{band.items.length}</small>
                </h3>
                <div className={viewMode === "list" ? "events-band__list" : "events-poster-grid"}>
                  {band.items.map(e => (
                    <TonightEventCard
                      key={listingKey(e)} listing={e} rsvped={savedIds.has(e.id)}
                      liveState={liveStateFor(e, now)}
                      onToggleRsvp={id => user ? toggleSave(id) : setShowSaveAuth(true)}
                      onOpen={listing => openEvent(listing)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {weekDays && viewMode === "grid" ? <div className="events-rails events-rails--week"><ThisWeekRail days={weekDays} savedIds={savedIds} liveStateFor={weekLiveState} onToggleSave={weekToggleSave} onOpen={weekOpen} /></div> : null}
          </div>
        ) : viewMode === "grid" ? (
          <div className="events-card-feed">
          <div className="events-poster-grid">
            {visibleGridItems.map((item, i) => {
              if (item.kind === "affiliate") {
                return (
                  <div
                    key={item.key}
                    className="ds-listing-card ds-listing-card--grid pdx-glass-rebind"
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
                <TonightEventCard
                  key={listingKey(e)} listing={e} rsvped={savedIds.has(e.id)}
                  liveState={pastView ? null : liveStateFor(e, now)}
                  onToggleRsvp={id => user ? toggleSave(id) : setShowSaveAuth(true)}
                  onOpen={listing => openEvent(listing)}
                />
              );
            })}
          </div>
          </div>
        ) : (
          <div className="events-card-feed events-card-feed--list">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleListEvents.map((e, i) => (
              <TonightEventCard
                  key={listingKey(e)} listing={e} rsvped={savedIds.has(e.id)}
                  liveState={pastView ? null : liveStateFor(e, now)}
                  onToggleRsvp={id => user ? toggleSave(id) : setShowSaveAuth(true)}
                  onOpen={listing => openEvent(listing)}
                />
            ))}
          </div>
          </div>
        )}

        {!tonightBands && hasMoreVisibleItems && (
          <div
            ref={loadMoreRef}
            className="events-progressive-loader"
            role="status"
            aria-label="Loading more events"
          />
        )}

        <ScrollReveal delay={60}>
          <div className="events-submit-panel board-path-card board-path-card--host pdx-glass-rebind">
            <div className="board-path-card__label">Promoters</div>
            <h3>Not seeing your event?</h3>
            <p>Submit a new listing or claim one that is already on Zaylist.</p>
            <Link href="/submit">
              <Button as="span" variant="solid" accent="lime" arrow>Get started</Button>
            </Link>
          </div>
        </ScrollReveal>
          </div>
        </div>
      </section>
      )}


      <EventsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Filters"
        meta={`${filtered.length} ${filtered.length === 1 ? "event" : "events"}`}
        footer={(
          <Button type="button" variant="solid" accent="cyan" onClick={closeDrawer} style={{ width: "100%" }} data-testid="events-filters-apply">
            Show {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </Button>
        )}
      >
        <div className="events-drawer__section">
          <span className="events-drawer__label">When</span>
          <div className="events-drawer__chips" role="group" aria-label="Filter by date">
            {dayChips.filter(chip => chip.key !== "TODAY").map((chip, i) => (
              <FilterChip key={chip.key} selected={activeDay === chip.key} fill={activeDay === chip.key}
                accent={windowAccent(chip.key, i)} onToggle={() => setActiveDay(chip.key)} data-testid={`filter-day-${chip.key}`}>
                {chip.label}
              </FilterChip>
            ))}
            <FilterChip
              selected={pastView}
              fill={pastView}
              accent="var(--text-meta, #8c8c8c)"
              onToggle={() => setPastView(v => !v)}
              data-testid="filter-past-events"
              className="events-filter-chip--past"
            >
              PAST{pastEvents.length > 0 ? ` · ${pastEvents.length}` : ""}
            </FilterChip>
          </div>
        </div>
        <div className="events-drawer__section">
          <span className="events-drawer__label">Type</span>
          <div className="events-drawer__chips" role="group" aria-label="Filter by type">
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
          </div>
        </div>
        <div className="events-drawer__section">
          <label className="events-drawer__label" htmlFor="events-sort-select">Sort</label>
          <div className="board-select-wrap">
            <select
              id="events-sort-select"
              className="board-select events-sort__select"
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              data-testid="events-sort"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="board-select-caret" aria-hidden="true"><ChevronDown size={14} /></span>
          </div>
        </div>
      </EventsDrawer>

      <EventsDrawer
        open={mapOpen}
        onClose={closeMap}
        title="Mapz"
        meta={`${filtered.length} ${filtered.length === 1 ? "event" : "events"} on this view`}
        footer={(
          <Link href="/map?layer=events" className="events-tool-btn events-tool-btn--block" onClick={closeMap} data-testid="events-map-full">
            <MapIcon size={18} aria-hidden="true" />Open the full map
          </Link>
        )}
      >
        <div className="events-map-list" role="list">
          {filtered.slice(0, 40).map(e => {
            const pinHref = e.lat != null && e.lng != null
              ? `/map?layer=events&lat=${e.lat}&lng=${e.lng}&zoom=15`
              : `/map?layer=events&q=${encodeURIComponent(e.title)}`;
            const isToday = pacificCalendarDate(e.dateStart) === pacificTodayDate(now);
            return (
              <div className="events-map-row pdx-glass-rebind" role="listitem" key={listingKey(e)} style={{ "--c": `var(--day-${(e.dayOfWeek || "sat").toLowerCase()})` } as React.CSSProperties}>
                <button type="button" className="events-map-row__open" onClick={() => { closeMap(); openEvent(e); }} aria-label={`Open ${e.title}`}>
                  <EventThumb src={listingPosterUrl(e)} day={e.dayOfWeek} />
                  <span className="events-map-row__copy"><strong>{e.title}</strong><small>{e.venueName}{e.neighborhood ? ` · ${e.neighborhood}` : ""}</small></span>
                  <time dateTime={e.dateStart}>{!isToday && <small>{eventDateLabel(e.dateStart)}</small>}{eventTimeLabel(e.dateStart)}</time>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
                <Link href={pinHref} className="events-map-row__pin" aria-label={`Show ${e.title} on the map`} onClick={closeMap}>
                  <MapPin size={18} aria-hidden="true" />
                </Link>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="board-copy-sm">Nothing on this view. Try another day.</p>}
          {filtered.length > 40 && <p className="board-copy-sm">Showing the first 40. Open the full map for everything.</p>}
        </div>
      </EventsDrawer>

      {user && mySavedUpcoming > 0 && activeTab === "board" && !selectedEvent && (
        <Link href="/schedule?view=mine" className="events-myschedule-pill" data-testid="events-my-schedule">
          <ZLineIcon name="favorite" size={18} filled />
          My Schedule · {mySavedUpcoming}
        </Link>
      )}

      {showSaveAuth && <AuthModal onClose={() => setShowSaveAuth(false)} />}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEvent}
          onEventUpdated={updated => setSelectedEvent(updated)}
          originRect={eventOriginRect}
        />
      )}

      <BoardCloseSeam
        line="Find the party. Show up for your people."
        url="zaylist.com/events"
      />
    </div>
  );
}
