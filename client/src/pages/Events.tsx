import RoomBackground from "@/components/RoomBackground";
import { eventsTonightWindow } from "@shared/eventsTonight";
import { createEventSearch, extractAgeIntent } from "@shared/eventSearch";
import BrowseToolbar from "@/components/BrowseToolbar";
import BrowseStatus from "@/components/BrowseStatus";
import PageRecovery from "@/components/PageRecovery";
import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

import type { Event } from "@shared/schema";
import { listingKey, type EventListing } from "@shared/multiDayEvents";
import { matchesEventTypeFilters, readEventTypeFilters } from "@/lib/eventBrowseFilters";
import { EVENT_TYPE_FILTERS } from "@shared/eventTypeTags";
import EventsRailSkeleton from "@/components/events/EventsRailSkeleton";
import TonightEventCard, { type TonightCardLive } from "@/components/home/TonightEventCard";
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
import EventTypeTag from "../components/EventTypeTag";
import EventzExpanded from "../components/events/EventzExpanded";
import FlyerBoard from "../components/events/FlyerBoard";
import EventsFilterDrawer, { type EventsFilterDay } from "../components/events/EventsFilterDrawer";
import type { EventModalOriginRect } from "../components/EventModal";
import Schedule from "@/pages/Schedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageSeo } from "@/hooks/usePageSeo";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import { eventPath } from "@shared/eventSlug";
import { scatterAffiliateCards } from "@/lib/affiliateCards";
import { ChevronDown, ChevronRight, CalendarDays, Map as MapIcon, MapPin, SlidersHorizontal } from "lucide-react";
import { Button, FilterChip, SearchInput } from "@/components/ds";

import { DAY_SORT_ORDER } from "@shared/eventWeek";
import { isEventSchedulePast, pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import "./Events.css";
import { shareCardUrl } from "@shared/shareCards";
import { roomTitle } from "@/lib/rooms";
import EventThumb from "@/components/events/EventThumb";

const PACIFIC = "America/Los_Angeles";
const GRID_RENDER_BATCH = 40;
const MOBILE_GRID_RENDER_BATCH = 12;

function renderBatch(isMobile: boolean): number {
  return isMobile ? MOBILE_GRID_RENDER_BATCH : GRID_RENDER_BATCH;
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
    if (start != null && start < windows.tonightEnd && (end != null && end > start ? end > windows.tonightStart : start >= windows.tonightStart)) return true;
    // Daytime events that end before the 18:00 tonight window opens still
    // belong on today's board; the bands sort them into On now / Today.
    return pacificCalendarDate(e.dateStart) === windows.today;
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
function quietScroll() {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm-mode");
}
const SOON_MS = 45 * 60000;   // "Happening now" holds what is on plus anything starting within 45 minutes

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
function isPastListing(e: EventListing, nowMs = Date.now()): boolean {
  return isEventSchedulePast(e.dateStart, e.dateEnd, nowMs);
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
      const past = isPastListing(e,nowMs);
      if (pastView ? !past : past) return false;
      if (!eventInWindow(e, activeDay, windows)) return false;
      if (!matchesEventTypeFilters(e,activeFilters)) return false;
      if (!matchesSearch(e)) return false;
      return true;
    });
}

/** Branded 1200×630 card (replaces raw flyer as social preview image). */
function eventOgCardImage(eventId: number) {
  return `https://www.zaylist.com/api/og/event/${eventId}?v=2`;
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
  "use memo";
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
  const { savedIds, toggleSave, loading: savesLoading, pending: savesPending } = useSavedEvents();
  const [showSaveAuth, setShowSaveAuth] = useState(false);
  const isMobile = useIsMobile() || (typeof window !== "undefined" && window.innerWidth < 768);
  const [routeMatch, routeParams] = useRoute("/events/:id/:slug?");
  const [location, setLocation] = useLocation();
  const routeEventId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const routeSearch = new URLSearchParams(useSearch());
  const routeDay = routeSearch.get("day")?.toUpperCase() || "";
  const routeDate = routeSearch.get("date") || "";
  const [boardWindow, setBoardWindow] = useState(() => readSearchParam("period") || "all");
  const [boardTags, setBoardTags] = useState<Set<string>>(() => new Set(readSearchParam("tags").split(",").filter(Boolean)));
  const [activeDay, setActiveDay] = useState(() => readSearchParam("window") || (readSearchParam("type") ? "ALL" : DEFAULT_WINDOW));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapRowLimit, setMapRowLimit] = useState(40);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const [activeFilters, setActiveFilters] = useState<string[]>(() => readEventTypeFilters(readSearchParam("type")));
  /** Past events live in their own board view (chip next to day categories). */
  const [pastView, setPastView] = useState(() => readSearchParam("past") === "1");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q")?.trim() || "";
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventOriginRect, setEventOriginRect] = useState<EventModalOriginRect | null>(null);
  const [visibleItemCount, setVisibleItemCount] = useState(() => renderBatch(
    typeof window !== "undefined" && window.innerWidth < 768,
  ));
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<SortMode>(() => SORT_OPTIONS.find(option => option.value === readSearchParam("sort"))?.value || "start_time");
  const browseQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (boardWindow !== "all") params.set("period", boardWindow);
    if (boardTags.size) params.set("tags", [...boardTags].join(","));
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (activeDay !== DEFAULT_WINDOW) params.set("window", activeDay);
    if (activeFilters.length) params.set("type", activeFilters.join("|"));
    if (pastView) params.set("past", "1");
    if (sortMode !== "start_time") params.set("sort", sortMode);
    return params;
  }, [searchQuery, activeDay, activeFilters, pastView, sortMode, boardWindow, boardTags]);
  const openEvent = useCallback((event: EventListing, originRect: EventModalOriginRect | null = null) => {
    setEventOriginRect(originRect);
    setSelectedEvent(event);
    const target = new URL(eventPath(event.id, event.title, event.dayOfWeek, pacificCalendarDate(event.dateStart)), window.location.origin);
    browseQuery().forEach((value, key) => target.searchParams.set(key, value));
    setLocation(target.pathname + target.search, { state: { eventFromBrowse: true } });
  }, [setLocation, browseQuery]);
  const closeEvent = useCallback(() => {
    setSelectedEvent(null);
    setEventOriginRect(null);
    if (window.history.state?.eventFromBrowse) { window.history.back(); return; }
    const query = browseQuery().toString();
    setLocation(query ? `/events?${query}` : "/events", { replace:true });
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
      setBoardWindow(readSearchParam("period") || "all");
      setBoardTags(new Set(readSearchParam("tags").split(",").filter(Boolean)));
      setActiveDay(readSearchParam("window") || (readSearchParam("type") ? "ALL" : DEFAULT_WINDOW));
      setActiveFilters(readEventTypeFilters(readSearchParam("type")));
      setPastView(readSearchParam("past") === "1");
      setSearchQuery(readSearchParam("q"));
      setSortMode(SORT_OPTIONS.find(option => option.value === readSearchParam("sort"))?.value || "start_time");

    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  const { data: events = [], isLoading, isError, refetch } = useQuery<EventListing[]>({
    queryKey: ["/api/events", "public-browse"],
    queryFn: () => apiRequest("GET", "/api/events?visibility=public").then(r => r.json()),
    select: rows => rows.filter(hasPublicEventFlags),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  /* ---- bottom filter drawer (filters + day picker, locked to the dock) ---- */
  const [drawerH, setDrawerH] = useState(0);
  const [boardCount, setBoardCount] = useState(0);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const onBoardCount = useCallback((n: number) => setBoardCount(n), []);
  const onDrawerHeight = useCallback((h: number) => setDrawerH(h), []);
  const drawerPast = pastView;
  const drawerDays = useMemo<EventsFilterDay[]>(() => {
    const todayStr = pacificTodayDate(now);
    const todayNoon = parsePacificDateTime(`${todayStr}T12:00:00`) ?? now;
    const offsets = drawerPast ? [-6, -5, -4, -3, -2, -1, 0] : [0, 1, 2, 3, 4, 5, 6];
    return offsets.map(off => {
      const ms = todayNoon + off * 86400000;
      const date = pacDate(ms);
      return {
        date,
        dowCode: WEEKDAY_CODES[pacWeekday(ms)],
        dom: Number(date.slice(8, 10)),
        count: filterBoardEvents(events, `D:${date}`, activeFilters, searchQuery, drawerPast, now).length,
        isToday: date === todayStr,
        selected: pickedDay === date,
      };
    });
  }, [events, activeFilters, searchQuery, drawerPast, now, pickedDay]);
  const toggleDrawerTag = useCallback((token: string) => {
    setPickedDay(null);
    setBoardTags(prev => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });
  }, []);
  const pickDrawerDay = useCallback((date: string) => {
    setPickedDay(date);
    /* A day jump always lands on the full board: clear the other filters,
       then let the board scroll Plan Ahead to that date's cards. (The
       drawer's full-screen schedule layer hears the same day through the
       schedule's own listener and follows along.) */
    setActiveDay(DEFAULT_WINDOW);
    setActiveFilters([]);
    setBoardWindow("all");
    setBoardTags(new Set());
    setSearchQuery("");
    window.dispatchEvent(new CustomEvent("zaylist:schedule-day", { detail: { date } }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("zaylist:board-day", { detail: { date } }));
    }));
  }, []);

  const { data: routeEvent, error: routeError, refetch: refetchRouteEvent } = useQuery<Event>({
    queryKey: ["/api/events", routeEventId, routeDay, routeDate, user?.id ?? null],
    queryFn: () => apiRequest("GET", `/api/events/${routeEventId}${routeDate ? `?date=${encodeURIComponent(routeDate)}` : routeDay ? `?day=${encodeURIComponent(routeDay)}` : ""}`).then(r => r.json()),
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
          url: `https://www.zaylist.com${eventPath(shareEvent.id,shareEvent.title,shareEvent.dayOfWeek,pacificCalendarDate(shareEvent.dateStart))}`,
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
    const fromList = routeDate ? matches.find(e => pacificCalendarDate(e.dateStart) === routeDate) : routeDay
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
      if (prev && hasPublicEventFlags(prev) && prev.id === routeEventId && (!routeDate || pacificCalendarDate(prev.dateStart) === routeDate) && (!routeDay || prev.dayOfWeek === routeDay)) return prev;
      return routeEvent ?? null;
    });
  }, [routeEventId, routeDay, routeDate, routeMatch, events, routeEvent]);

  const liveEvents = useMemo(() => events.filter(e => !isPastListing(e,now)), [events, now]);
  const pastEvents = useMemo(() => events.filter(e => isPastListing(e,now)), [events, now]);
  const poolEvents = pastView ? pastEvents : liveEvents;

  // Date-window chips: All / Today / Tonight / week windows / months
  const dayChips = useMemo(() => buildDayChips(poolEvents, pastView, now), [poolEvents, pastView, now]);
  const activeChipLabel = dayChips.find(c => c.key === activeDay)?.label ?? null;
  // If the selected window no longer exists in the pool (e.g. after toggling Past), fall back to All.
  useEffect(() => {
    if (!isLoading && activeDay !== "ALL" && !activeDay.startsWith("D:") && !dayChips.some(c => c.key === activeDay)) setActiveDay("ALL");
  }, [dayChips, activeDay, isLoading]);

  const ageIntent = useMemo(() => extractAgeIntent(searchQuery).age, [searchQuery]);
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
        top: i === 0 ? "Today" : code,
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

  // Day dock: once the page's day tabs scroll up under the site header, a slim
  // copy pins there so you can switch days without scrolling back up.
  const dayRailRef = useRef<HTMLElement>(null);
  const [dockTop, setDockTop] = useState<number | null>(null);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rail = dayRailRef.current;
      if (!rail) { setDockTop(null); return; }
      const header = document.querySelector(".site-header");
      const hr = header?.getBoundingClientRect();
      const top = hr && hr.height > 0 && hr.bottom > 0 ? hr.bottom : 0;
      setDockTop(rail.getBoundingClientRect().bottom < top + 8 ? top : null);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // A single day reads as a timeline. Today: on now, starting soon, today,
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
          { id: "tonight", label: "Today", color: "var(--neon-magenta)", items: [] as EventListing[] },
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

  // Rails: the first band (now + soon merged on tonight) keeps the full
  // Eventz card at rail width; later bands use compact rail cards.
  const railBands = useMemo(() => {
    if (!tonightBands || !tonightBands.length) return null;
    const merged = tonightBands.filter(b => b.id === "now" || b.id === "soon");
    let rest = tonightBands.filter(b => b.id !== "now" && b.id !== "soon");
    let first: Array<{ id: string; label: string; color: string; items: EventListing[] }> = merged.length
      ? [{ id: "happening", label: "Happening now", color: "var(--neon-green)", items: merged.flatMap(b => b.items) }]
      : [];
    // Nothing on now: the lead rail becomes Next up. It holds the next event to start
    // plus any others starting within an hour and 15 minutes of it, pulled out of their later rails.
    if (!first.length && activeDay === DEFAULT_WINDOW) {
      const startOf = (e: EventListing) => parsePacificDateTime(e.dateStart) ?? Number.MAX_SAFE_INTEGER;
      const upcoming = rest.flatMap(b => b.items).filter(e => startOf(e) >= now).sort((a, b) => startOf(a) - startOf(b));
      if (upcoming.length) {
        const cutoff = startOf(upcoming[0]) + 75 * 60000;   // an hour and 15 minutes
        const next = upcoming.filter(e => startOf(e) < cutoff);
        const taken = new Set(next);
        rest = rest.map(b => ({ ...b, items: b.items.filter(e => !taken.has(e)) })).filter(b => b.items.length > 0);
        first = [{ id: "next", label: "Next up", color: "var(--neon-green)", items: next }];
      }
    }
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

  const drawerFilterCount = (activeDay === "ALL" || railKeys.has(activeDay) ? 0 : 1) + Number(pastView) + Number(sortMode !== "start_time") + activeFilters.length;

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

  /** Scatter affiliate poster cards among real events in the full grid. */
  const gridItems = useMemo(() => {
    // While serve loads, show events only so we do not flash legacy brands then swap.
    if (!posterServeReady) {
      return filtered.map((event) => ({ kind: "event" as const, event }));
    }
    return scatterAffiliateCards(filtered, posterServeQuery.data?.ads ?? []);
  }, [filtered, posterServeReady, posterServeQuery.data?.ads]);

  /* The board sections itself (Now / Later / Weekend / Plan Ahead), so in the
     default view it receives the whole upcoming pool — the day window is the
     sorter's job, applied when a specific day or window is picked. Search is
     global over the board, as designed. Past view keeps the filtered pool. */
  /* The Flyer Board owns filtering now (its own filter row, search and
     sections), so it receives the upcoming pool in the selected order,
     with ended listings excluded. Past view keeps the page's past pool; the
     board cuts it to the last 7 days itself. */
  const boardEvents = useMemo(() => {
    const boardEnded = (e: EventListing) => {
      const en = parsePacificDateTime(e.dateEnd) ?? parsePacificDateTime(e.dateStart);
      if (en == null || en > now) return false;
      // No recorded end + started today: the site treats it as still on.
      if (!e.dateEnd && pacificCalendarDate(e.dateStart) === pacificCalendarDate(new Date(now).toISOString())) return false;
      return true;
    };
    const pool = pastView
      ? filtered
      : sortEvents(filterBoardEvents(events, activeDay === DEFAULT_WINDOW ? "ALL" : activeDay, activeFilters, searchQuery.trim(), false, now), sortMode)
          .filter(e => !boardEnded(e));
    /* Series poster fill: a recurring series often carries its real flyer
       on some instances only. A bare instance of a series that has a flyer
       shows that flyer; a series with no flyer anywhere stays bare. */
    const seriesPoster = new Map<string, string>();
    for (const e of events) {
      const url = listingPosterUrl(e);
      if (!url) continue;
      const k = `${(e.title || "").trim().toLowerCase()}|${(e.venueName || "").trim().toLowerCase()}`;
      if (!seriesPoster.has(k)) seriesPoster.set(k, url);
    }
    if (seriesPoster.size === 0) return pool;
    return pool.map(e => {
      if (listingPosterUrl(e)) return e;
      const fill = seriesPoster.get(
        `${(e.title || "").trim().toLowerCase()}|${(e.venueName || "").trim().toLowerCase()}`,
      );
      return fill ? { ...e, posterImageUrl: fill } : e;
    });
  }, [pastView, filtered, events, now, activeDay, activeFilters, searchQuery, sortMode]);

  /* Agent helpers: the board's current scope as schema.org structured data.
     The complete data set stays at /api/events (linked below); this block
     describes what the page is showing, in the order it shows it. */
  const boardJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: boardEvents.slice(0, 100).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: e.title,
        startDate: e.dateStart,
        ...(e.dateEnd ? { endDate: e.dateEnd } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: e.venueName, ...(e.address ? { address: e.address } : {}) },
        ...(e.posterImageUrl ? { image: e.posterImageUrl.startsWith("http") ? e.posterImageUrl : `https://www.zaylist.com${e.posterImageUrl}` } : {}),
        ...(e.admission === "FREE" ? { isAccessibleForFree: true } : {}),
        url: `https://www.zaylist.com${eventPath(e.id, e.title, e.dayOfWeek, pacificCalendarDate(e.dateStart))}`,
      },
    })),
  }), [boardEvents]);

  const visibleGridItems = useMemo(
    () => gridItems.slice(0, visibleItemCount),
    [gridItems, visibleItemCount],
  );
  const hasMoreVisibleItems = visibleGridItems.length < gridItems.length;

  useEffect(() => {
    setVisibleItemCount(renderBatch(isMobile));
    setMapRowLimit(40);
  }, [isMobile, activeDay, activeFilters, searchQuery, sortMode, pastView]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMoreVisibleItems) return;
    const batch = renderBatch(isMobile);
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
  }, [hasMoreVisibleItems, isMobile, visibleItemCount, activeDay, sortMode]);

  // All upcoming (not-yet-ended) live events - the site is year-round now.
  const upcomingCount = liveEvents.length;


  const todayKicker = useMemo(() => {
    const label = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, weekday: "short", month: "short", day: "numeric" }).format(new Date(now)).replace(",", "").toUpperCase();
    return `${label} · Portland`;
  }, [now]);

  const toggleFilter = (f: string) => {
    setActiveDay("ALL");
    setActiveFilters(prev => {
      const next = prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f];
      const params = new URLSearchParams(window.location.search);
      if (next.length) params.set("type", next.join("|"));
      else params.delete("type");
      params.set("window", "ALL");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/events?${qs}` : "/events");
      return next;
    });
  };

  if (routeMatch && (routeError || !Number.isFinite(routeEventId))) {
    const missing = !Number.isFinite(routeEventId) || /^404:/.test(routeError?.message || "");
    return <PageRecovery section="Eventz" title={missing ? "This event isn’t here anymore." : "We couldn’t load this event."}
      description={missing ? "The listing may have moved or been removed. There’s still plenty happening: find your next plan on Eventz." : "We couldn’t retrieve the event details. Try again before making your plans."}
      href="/events" label="Browse Eventz" missing={missing} retry={missing ? undefined : () => { void refetchRouteEvent(); }} />;
  }

  return (
    <div
      className="zine-page events-page board-page board-page--makeover room-shader-page"
      style={{ "--edrawer-h": `${drawerH}px` } as React.CSSProperties}
    >
      <RoomBackground room="eventz" />

      <section className="events-board-feed board-active-feed diag">
        <div className="board-active-feed__inner">
          <link rel="alternate" type="application/json" href="/api/events" title="Zaylist events — full JSON feed" />
          <link rel="alternate" type="text/plain" href="/llms.txt" title="Zaylist for agents — llms.txt" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(boardJsonLd) }} />
          <div className="board-active-feed__body">

        {isLoading ? (
          <EventsRailSkeleton />
        ) : isError ? (
          <BrowseStatus error title="Events couldn’t load" description="Your filters are still here. Try loading the events again." onAction={() => void refetch()} />
        ) : poolEvents.length === 0 ? (
          <div className="browse-status" role="status">
            <p className="display section-heading">
              {poolEvents.length === 0
                ? pastView ? "No past events yet" : "No upcoming events listed yet"
                : pastView ? "No past events match" : searchQuery.trim() ? `Nothing matches “${searchQuery.trim()}”` : activeFilters.length ? "Nothing matches those filters" : "Nothing listed that day"}
            </p>
            <p className="board-copy-sm">
              {poolEvents.length === 0
                ? pastView
                  ? "Ended events will appear here. Browse live listings to see what is coming up."
                  : pastEvents.length > 0
                    ? "There are no upcoming listings right now. Explore past events in the archive, or submit an event you know about."
                    : "There are no upcoming listings right now. Submit an event to help fill the board."
                : ageIntent ? `No listing in this view is confirmed ${ageIntent === "ALL_AGES" ? "all ages" : ageIntent === "18_PLUS" ? "18+" : "21+"} right now. Many venues have not confirmed an age policy yet, so we do not guess. Try another day or a different age, or clear the search.`
                : searchQuery.trim() ? "Check the spelling, or search a venue, neighborhood or DJ." : "Try another day, or clear the filters to see everything."}
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
        ) : (
          <FlyerBoard
            events={boardEvents}
            query={searchQuery} setQuery={setSearchQuery}
            fday={boardWindow} setFday={setBoardWindow} tags={boardTags} setTags={setBoardTags}
            onClear={() => { setActiveDay(DEFAULT_WINDOW); setActiveFilters([]); }}
            pastEvents={pastView ? boardEvents : pastEvents}
            pastView={pastView}
            onEnterPast={() => setPastView(true)}
            onExitPast={() => setPastView(false)}
            onOpen={(listing, rect) => openEvent(listing, rect)}
            saveDisabled={savesLoading || savesPending}
            savedIds={savedIds}
            onToggleSave={(id) => (user ? toggleSave(id) : setShowSaveAuth(true))}
            now={now}
            onVisibleCount={onBoardCount}
          />
        )}

        
          </div>
        </div>
      </section>

      {/* My Schedule no longer lives on this page: it is the drawer's
          full-screen second layer (Your Schedule). */}
      <EventsFilterDrawer
        window={boardWindow}
        onWindow={(value) => { setPickedDay(null); setBoardWindow(value); }}
        tags={boardTags}
        onToggleTag={toggleDrawerTag}
        query={searchQuery}
        onQuery={(value) => { setPickedDay(null); setSearchQuery(value); }}
        count={boardCount > 0 ? boardCount : boardEvents.length}
        days={drawerDays}
        pastView={drawerPast}
        onPickDay={pickDrawerDay}
        onHeightChange={onDrawerHeight}
        scheduleContent={<Schedule embed />}
      />

      {showSaveAuth && <AuthModal onClose={() => setShowSaveAuth(false)} />}
      {selectedEvent && (
        <EventzExpanded
          event={selectedEvent}
          onClose={closeEvent}
          onEventUpdated={updated => setSelectedEvent(updated)}
          originRect={eventOriginRect}
          onOpenEvent={listing => openEvent(listing)}
        />
      )}

    </div>
  );
}
