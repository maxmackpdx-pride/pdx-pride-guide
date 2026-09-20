import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";


import { useLocation } from "wouter";
import { ZAYDAR_PLACE_TYPE_OPTIONS, zaydarTypeIcon, zaydarTypeLabel } from "@/components/ZaydarSearchDrawer";
import ZaydarLayerSheet, { type ZaydarLayer } from "@/components/ZaydarLayerSheet";
import ZaydarUpcomingEvents from "@/components/ZaydarUpcomingEvents";
import ZaydarUpcomingRsvps from "@/components/ZaydarUpcomingRsvps";
import ZaydarCanvas, { type ZaydarHandle } from "@/components/ZaydarCanvas";
import { Navigation } from "lucide-react";


import type { CommunitySummary } from "@shared/community";
import type { Event } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { resolveBusinessLocations } from "@shared/businessLocations";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import PlaceModal, { type PlaceModalOriginRect } from "@/components/PlaceModal";
import AuthModal from "@/components/AuthModal";
import BoardPostOverlay from "@/components/board/BoardPostOverlay";
import type { Business } from "@/pages/Directory";
import { directoryTypeColor } from "@shared/directoryTheme";
import { directoryFallbackLogo, normalizeDirectoryName, resolveDirectoryLogo } from "@/lib/directoryLogos";
import { stampHauzMapPoints } from "@/lib/hauzDemoPins";
import "./LivingMap.css";
import "./ZaydarMapDemo.css";

type Place = Business;
type BoardKind = "gig" | "gifting" | "sellz";
type Mark = { key: string; kind: "event" | "place" | "board"; lat: number; lng: number; item: Event | Place | MapRow };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const FORMING_COVER = "/hausing/forming-no-place.svg";

// Preserve the adult locations already marked red in the Zaydar studio snapshot.
const ADULT_VENUES = new Set(['Sanctuary Club','Hawks PDX','FANTASY','Steam Portland','Club Privata','The Velvet Rope'].map(normalizeDirectoryName));
function zaydarPlaceType(place: Pick<Place,'name'|'type'>) { return ADULT_VENUES.has(normalizeDirectoryName(place.name)) ? 'adult' : place.type; }
function zaydarPlaceColor(place: Pick<Place,'name'|'type'>) {
  return ADULT_VENUES.has(normalizeDirectoryName(place.name)) ? '#FF0000' : directoryTypeColor(place.type);
}
function zaydarEventColor(event: Event, places: Place[]) {
  const venueKey=normalizeDirectoryName(event.venueName || '');
  let tags: string[]=[];try { const parsed=JSON.parse(event.eventTypes || '[]'); if(Array.isArray(parsed))tags=parsed; } catch {}
  if(event.isSexPositive || event.nudityOk || tags.some(tag=>['SEX_POSITIVE','NUDITY_OK','KINK'].includes(tag)) || ADULT_VENUES.has(venueKey))return '#FF0000';
  const venue=places.find(place=>place.type!=='group' && normalizeDirectoryName(place.name)===venueKey);
  return venue?zaydarPlaceColor(venue):directoryTypeColor('venue');
}

function phraseIncludes(haystack: string, needle: string): boolean {
  const words = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const phrase = words(needle);
  return phrase.length >= 3 && ` ${words(haystack)} `.includes(` ${phrase} `);
}

function eventBrandLogos(event: Event, places: Place[]): { primary?: string; alternate?: string; directoryId?: number; alternateDirectoryId?: number } {
  const eventCopy = `${event.title} ${event.description || ""}`;
  const host = places
    .filter(place => place.type === "group" && phraseIncludes(eventCopy, place.name))
    .sort((a, b) => b.name.length - a.name.length)[0];
  const hostLogo = host ? resolveDirectoryLogo(host.name, host.imageUrl) : null;
  const venueKey = normalizeDirectoryName(event.venueName || "");
  const venue = places.find(place => place.type !== "group" && normalizeDirectoryName(place.name) === venueKey);
  const venueLogo = resolveDirectoryLogo(event.venueName || "", venue?.imageUrl);
  if (hostLogo && venueLogo && hostLogo !== venueLogo) return { primary: venueLogo, alternate: hostLogo, directoryId: venue?.id, alternateDirectoryId: host?.id };
  return { primary: venueLogo || hostLogo || undefined, directoryId: venue?.id || host?.id };
}

function firstImage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const hit = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
    return hit || null;
  }
  return null;
}

function boardKind(row: MapRow): BoardKind | null {
  const board = String(row._board || "");
  if (board === "Gigz") return "gig";
  if (board === "Giftz") return "gifting";
  if (board === "Sellz") return "sellz";
  return null;
}

function finite(n: unknown): n is number { return typeof n === "number" && Number.isFinite(n); }
function hour(iso: string) {
  try { return new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true, timeZone: "America/Los_Angeles" }).format(new Date(iso)).replace(" ", "").replace("M", ""); }
  catch { return ""; }
}
function portlandCalendarDay(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
function placeMarks(places: Place[]): Mark[] {
  return places.flatMap((place) => {
    const locations = place.locations?.length ? place.locations : resolveBusinessLocations(place);
    const valid = locations.filter((loc) => finite(loc.lat) && finite(loc.lng));
    if (valid.length) return valid.map((loc, i) => ({ key: `p-${place.id}-${i}`, kind: "place" as const, lat: loc.lat!, lng: loc.lng!, item: place }));
    return finite(place.lat) && finite(place.lng) ? [{ key: `p-${place.id}`, kind: "place" as const, lat: place.lat, lng: place.lng, item: place }] : [];
  });
}

function rowMarks(rows: MapRow[], kind: Extract<Mark["kind"], "board">): Mark[] {
  return rows.flatMap((row, index) => {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [{ key: `${kind}-${row.id ?? index}`, kind, lat, lng, item: row }]
      : [];
  });
}

const BOARD_FALLBACK_POINTS: ReadonlyArray<[number, number]> = [
  [45.5234, -122.6762], [45.5298, -122.6815], [45.5177, -122.6658],
  [45.5352, -122.6498], [45.5125, -122.6581], [45.5441, -122.6751],
  [45.5068, -122.6892], [45.5324, -122.7044], [45.4977, -122.6378],
];

function stampBoardMapPoints(rows: MapRow[]): MapRow[] {
  return rows.map((row, index) => {
    if (Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng))) return row;
    const seed = `${row._board || "board"}-${row.id ?? index}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const [lat, lng] = BOARD_FALLBACK_POINTS[seed % BOARD_FALLBACK_POINTS.length];
    return { ...row, lat, lng };
  });
}

function boardColor(row: MapRow): string {
  if (String(row._board) === "The Haüz") return "#00FFFF";
  const kind = boardKind(row);
  if (kind === "gig") return "#8800FF";
  if (kind === "gifting") return "#CCFF00";
  return "#39FF14";
}

function boardIcon(row: MapRow): string {
  if (String(row._board) === "The Haüz") return "/zaydar-map/icons/housing.svg";
  const kind = boardKind(row);
  if (kind === "gig") return zaydarTypeIcon("service");
  return zaydarTypeIcon("shop");
}

function boardTitle(row: MapRow): string {
  return String(row.displayName || row.headline || row.title || row.name || "Board listing");
}

function milesBetween(a: [number, number], b: [number, number]) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b[0] - a[0]);
  const dLng = radians(b[1] - a[1]);
  const lat1 = radians(a[0]);
  const lat2 = radians(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function placePoint(place: Place): [number, number] | null {
  const resolved = place.locations?.length ? place.locations : resolveBusinessLocations(place);
  const location = resolved.find(loc => finite(loc.lat) && finite(loc.lng));
  if (location) return [location.lat!, location.lng!];
  return finite(place.lat) && finite(place.lng) ? [place.lat, place.lng] : null;
}

function originRect(element: Element | null): EventModalOriginRect | PlaceModalOriginRect | null {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return null;
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

const OVERLAY_KEYS = ["event", "place", "mizzed", "spotted", "gig", "gift", "sell", "sellz"] as const;
type OverlayKey = typeof OVERLAY_KEYS[number];
type TimeFilter = "default" | "soon" | "weekend" | "custom";

function mapSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function mapHref(mutate: (params: URLSearchParams) => void): string {
  const params = mapSearchParams();
  mutate(params);
  const qs = params.toString();
  const path = typeof window !== "undefined" && window.location.pathname === "/map-demo" ? "/map-demo" : "/map";
  return qs ? `${path}?${qs}` : path;
}

function overlayHref(key: OverlayKey | null, id?: number): string {
  return mapHref(params => {
    for (const overlay of OVERLAY_KEYS) params.delete(overlay);
    if (key && id != null && Number.isFinite(id)) params.set(key, String(id));
  });
}

function boardParam(kind: BoardKind): OverlayKey {
  if (kind === "gifting") return "gift";
  if (kind === "sellz") return "sell";
  return "gig";
}

function boardFromParam(key: string): BoardKind | null {
  if (key === "gig") return "gig";
  if (key === "gift") return "gifting";
  if (key === "sell" || key === "sellz") return "sellz";
  return null;
}

function readTimeFilter(params: URLSearchParams): TimeFilter {
  const when = params.get("when");
  if (when === "soon" || when === "weekend" || when === "custom") return when;
  return "default";
}

function rowMatchesQuery(row: MapRow, q: string): boolean {
  if (!q) return true;
  return `${row.title || ""} ${row.name || ""} ${row.headline || ""} ${row.body || ""} ${row.neighborhood || ""} ${row.displayName || ""} ${row._board || ""}`.toLowerCase().includes(q);
}

function inertWhen(condition: boolean) {
  return condition ? ({ inert: "" } as Record<string, string>) : {};
}

function useDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && matchMedia("(min-width:768px)").matches);
  useEffect(() => { const media = matchMedia("(min-width:768px)"); const sync = () => setDesktop(media.matches); media.addEventListener("change", sync); return () => media.removeEventListener("change", sync); }, []);
  return desktop;
}

export default function ZaydarMapDemo() {
  const [location, setLocation] = useLocation();
  const [query] = useState(() => mapSearchParams().get("q") || "");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => readTimeFilter(mapSearchParams()));
  const [customStart, setCustomStart] = useState(() => mapSearchParams().get("from") || "");
  const [customEnd, setCustomEnd] = useState(() => mapSearchParams().get("to") || "");
  const [showEvents, setShowEvents] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showBoards, setShowBoards] = useState(true);
  const [placeTypes, setPlaceTypes] = useState<string[]>(() => [...ZAYDAR_PLACE_TYPE_OPTIONS]);
  const [eventTag, setEventTag] = useState<string | null>(null);
  const [boardKinds, setBoardKinds] = useState(() => new Set(["Gigz", "Giftz", "Sellz", "The Haüz"]));
  const [clock, setClock] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [boardOverlay, setBoardOverlay] = useState<{ kind: BoardKind; postId: number } | null>(null);
  const [cardOriginRect, setCardOriginRect] = useState<EventModalOriginRect | PlaceModalOriginRect | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const mapRef = useRef<ZaydarHandle | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);

  const [mapHeight, setMapHeight] = useState<number>();
  const desktop = useDesktop();
  const [labels,setLabels]=useState(false);


  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const dock = document.querySelector(".site-hub-mobile-bar");
    const header = document.querySelector(".site-header");
    const measure = () => {
      const viewportBottom = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight;
      setMapHeight(Math.max(0, viewportBottom - page.getBoundingClientRect().top));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (dock) observer.observe(dock);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.visualViewport?.removeEventListener("resize", measure); };
  }, [desktop]);
  useEffect(() => {  }, [mapHeight, desktop]);
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocateError("Location is not available on this device."); return; }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(position => {
      const point: [number, number] = [position.coords.latitude, position.coords.longitude];
      if(point[0]<45.2||point[0]>45.85||point[1]<-123.15||point[1]>-122.15){setLocateError("You’re outside this Portland metro demo.");setLocating(false);return;}
      setMapCenter(point);
      mapRef.current?.send("locate", { coordinates: [point[1], point[0]] });
      setLocating(false);
    }, () => {
      setLocateError("We could not find your location.");
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000 });
  }, []);
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: communities = [] } = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"], queryFn: () => apiRequest("GET", "/api/communities").then(r => r.json()) });
  const { data: places = [], isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: gigs = [], isLoading: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = [], isLoading: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = [], isLoading: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const housing = stampHauzMapPoints(Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : []));
  const goOverlay = useCallback((key: OverlayKey | null, id?: number) => setLocation(overlayHref(key, id)), [setLocation]);
  const closeOverlays = useCallback(() => {
    setSelected(null);
    setSelectedEvent(null);
    setSelectedPlace(null);
    setBoardOverlay(null);
    setCardOriginRect(null);
    setLocation(overlayHref(null));
  }, [setLocation]);
  const q = query.trim().toLowerCase();
  const eventTags = useMemo(() => Array.from(new Set(events.flatMap(event => {
    try {
      const parsed = JSON.parse(event.eventTypes || "[]");
      return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
    } catch { return []; }
  }))).slice(0, 8), [events]);
  const visibleEvents = useMemo(() => events.filter(e => {
    if (!finite(e.lat) || !finite(e.lng)) return false;
    if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
    if (eventTag) {
      try {
        const parsed = JSON.parse(e.eventTypes || "[]");
        if (!Array.isArray(parsed) || !parsed.includes(eventTag)) return false;
      } catch { return false; }
    }
    const at = new Date(e.dateStart).getTime();
    const ends = new Date(e.dateEnd).getTime();
    const now = Date.now();
    if (timeFilter === "default") return at <= now + 21 * 86400000 && (ends >= now || portlandCalendarDay(e.dateStart) === portlandCalendarDay(now));
    if (timeFilter === "soon") return (at <= now && ends > now) || (at > now && at <= now + 90 * 60000);
    if (timeFilter === "custom") {
      if (!customStart || !customEnd) return false;
      const startDay = e.dateStart.slice(0, 10);
      const endDay = e.dateEnd.slice(0, 10);
      const low = customStart <= customEnd ? customStart : customEnd;
      const high = customStart <= customEnd ? customEnd : customStart;
      return startDay <= high && endDay >= low;
    }
    const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Los_Angeles" }).format(new Date(at));
    return at >= now && at <= now + 7 * 86400000 && ["Fri", "Sat", "Sun"].includes(day);
  }), [events, q, eventTag, timeFilter, customStart, customEnd]);
  const visiblePlaces = useMemo(() => places.filter(p => p.type !== "group" && (!q || `${p.name} ${p.type} ${p.neighborhood || ""}`.toLowerCase().includes(q))), [places, q]);
  const placeTypesAll = placeTypes.length === ZAYDAR_PLACE_TYPE_OPTIONS.length;
  const mapPlaces = useMemo(() => visiblePlaces.filter(place => placeTypes.includes(zaydarPlaceType(place))), [visiblePlaces, placeTypes]);
  const nearbyPlaces = useMemo(() => mapPlaces
    .map(place => ({ place, point: placePoint(place) }))
    .filter((entry): entry is { place: Place; point: [number, number] } => Boolean(entry.point))
    .map(entry => ({ ...entry, distance: milesBetween(mapCenter, entry.point) }))
    .filter(entry => entry.distance <= 10)
    .sort((a, b) => a.distance - b.distance)
    .map(entry => entry.place), [mapPlaces, mapCenter]);
  const todayEvents = useMemo(() => {
    const today = portlandCalendarDay(Date.now());
    return events.filter(e => {
      if (!finite(e.lat) || !finite(e.lng)) return false;
      if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
      const startDay = portlandCalendarDay(e.dateStart);
      const endDay = portlandCalendarDay(e.dateEnd) || startDay;
      return Boolean(startDay && startDay <= today && endDay >= today);
    }).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }, [events, q]);
  const boardRows = useMemo(() => stampBoardMapPoints([
    ...gigs.map(row => ({ ...row, _board: "Gigz", _href: row.id ? `/pride-work?post=${row.id}` : "/pride-work" })),
    ...gifts.map(row => ({ ...row, _board: "Giftz", _href: row.id ? `/gifting?post=${row.id}` : "/gifting" })),
    ...sells.map(row => ({ ...row, _board: "Sellz", _href: row.id ? `/sellz?post=${row.id}` : "/sellz" })),
    ...housing.map(row => ({ ...row, _board: "The Haüz", _href: row.id ? `/the-hauz/${row.id}` : "/the-hauz" })),
  ]), [gigs, gifts, sells, housing]);
  const visibleBoards = useMemo(() => boardRows.filter(row => boardKinds.has(String(row._board)) && rowMatchesQuery(row, q)), [boardRows, boardKinds, q]);
  const marks = useMemo<Mark[]>(() => [
    ...(showEvents ? visibleEvents.map(e => ({ key: `e-${e.id}-${e.dateStart}`, kind: "event" as const, lat: e.lat!, lng: e.lng!, item: e })) : []),
    ...(showPlaces ? placeMarks(mapPlaces) : []),
    ...(showBoards ? rowMarks(visibleBoards, "board") : []),
  ].filter(mark => {
    if(placeTypesAll || mark.kind !== 'event') return true;
    if(mark.kind !== 'event') return false;
    const event=mark.item as Event;
    if(zaydarEventColor(event,places)==='#FF0000')return placeTypes.includes('adult');
    const venue=places.find(place=>normalizeDirectoryName(place.name)===normalizeDirectoryName(event.venueName||''));
    return placeTypes.includes(venue?.type||'venue');
  }), [showEvents, showPlaces, showBoards, visibleEvents, mapPlaces, visibleBoards, placeTypes, placeTypesAll, places]);

  useEffect(() => {
    const href = mapHref(params => {
      if (timeFilter === "default") params.delete("when"); else params.set("when", timeFilter);
      if (timeFilter === "custom" && customStart) params.set("from", customStart); else params.delete("from");
      if (timeFilter === "custom" && customEnd) params.set("to", customEnd); else params.delete("to");
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) window.history.replaceState(null, "", href);
  }, [timeFilter, customStart, customEnd]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = mapSearchParams();
      const eventId = Number(params.get("event"));
      if (Number.isFinite(eventId)) {
        const match = events.find(event => event.id === eventId);
        setSelectedEvent(current => match && current?.id === match.id ? current : match || null);
      } else setSelectedEvent(current => current ? null : current);

      const placeId = Number(params.get("place"));
      if (Number.isFinite(placeId)) {
        const match = places.find(place => place.id === placeId);
        setSelectedPlace(current => match && current?.id === match.id ? current : match || null);
      } else setSelectedPlace(current => current ? null : current);

      const boardHit = (["gig", "gift", "sell", "sellz"] as const).find(key => params.get(key));
      if (boardHit) {
        const postId = Number(params.get(boardHit));
        const kind = boardFromParam(boardHit);
        if (kind && Number.isFinite(postId)) {
          setBoardOverlay(current => current?.kind === kind && current.postId === postId ? current : { kind, postId });
        }
      } else setBoardOverlay(current => current ? null : current);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [location, events, places]);
  const openMark = useCallback((mark: Mark, target?: Element | null) => {
    setSelected(mark.key);
    setCardOriginRect(originRect(target || null));
    if (mark.kind === "event") { setSelectedEvent(mark.item as Event); goOverlay("event", (mark.item as Event).id); }
    else if (mark.kind === "place") { setSelectedPlace(mark.item as Place); goOverlay("place", (mark.item as Place).id); }
    else {
      const row = mark.item as MapRow;
      if (String(row._board) === "The Haüz") setLocation(`/the-hauz/${row.id}`);
      else {
        const kind = boardKind(row);
        const postId = Number(row.id);
        if (kind && Number.isFinite(postId)) { setBoardOverlay({ kind, postId }); goOverlay(boardParam(kind), postId); }
      }
    }
  }, [goOverlay, setLocation]);
  const openBoardRow = (row: MapRow, target?: Element | null) => openMark({ key: `board-${row._board}-${row.id}`, kind: "board", lat: Number(row.lat), lng: Number(row.lng), item: row }, target);
  const toggleBoardKind = (kind: string) => setBoardKinds(current => {
    const next = new Set(current);
    if (next.has(kind)) next.delete(kind); else next.add(kind);
    return next;
  });
  const panelRows = (rows: MapRow[], kind: "places" | "boards") => (
    <div className="zaydar-layer-list">
      {rows.slice(0, 5).map((row, index) => {
        const isPlace = kind === "places";
        const title = isPlace ? String(row.name || "Place") : boardTitle(row);
        const meta = isPlace ? `${zaydarTypeLabel(String(row.type || "venue"))} · ${String(row.neighborhood || "Portland")}` : `${String(row._board || "Boards")} · ${String(row.neighborhood || "Portland")}`;
        return <button type="button" key={`${kind}-${row.id ?? index}`} onClick={event => isPlace ? openMark({ key: `p-${row.id}`, kind: "place", lat: Number(row.lat), lng: Number(row.lng), item: row as Place }, event.currentTarget) : openBoardRow(row, event.currentTarget)}><strong>{title}</strong><small>{meta}</small></button>;
      })}
      {rows.length > 5 && <button type="button" className="zaydar-layer-list__more" onClick={() => setLocation(kind === "places" ? "/directory" : "/z")}>View more</button>}
    </div>
  );
  const eventPanel = <section className="zaydar-layer-panel" aria-labelledby="map-eventz-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-eventz-title">Eventz</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Event filters">
      <button type="button" aria-pressed={timeFilter === "default" && !eventTag} onClick={() => { setTimeFilter("default"); setEventTag(null); }}>Tonight</button>
      <button type="button" aria-pressed={timeFilter === "soon"} onClick={() => setTimeFilter(timeFilter === "soon" ? "default" : "soon")}>Soon</button>
      {eventTags.map(tag => <button type="button" key={tag} aria-pressed={eventTag === tag} onClick={() => setEventTag(current => current === tag ? null : tag)}>{tag.replaceAll("_", " ")}</button>)}
    </div>
    <ZaydarUpcomingRsvps events={events} loading={eventsLoading} onSignIn={() => setShowAuth(true)} onOpen={(event,target) => openMark({key:`e-${event.id}-${event.dateStart}`,kind:"event",lat:event.lat??NaN,lng:event.lng??NaN,item:event},target)} />
    <ZaydarUpcomingEvents events={events} loading={eventsLoading} onOpen={(event,target) => openMark({key:`e-${event.id}-${event.dateStart}`,kind:"event",lat:event.lat??NaN,lng:event.lng??NaN,item:event},target)} />
  </section>;
  const placesPanel = <section className="zaydar-layer-panel" aria-labelledby="map-placez-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-placez-title">Placez</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Place categories">
      {ZAYDAR_PLACE_TYPE_OPTIONS.map(type => <button type="button" key={type} aria-pressed={placeTypes.includes(type)} onClick={() => setPlaceTypes(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type])}>{zaydarTypeLabel(type)}</button>)}
    </div>
    {placesLoading ? <p>Loading Placez…</p> : placesError ? <p role="alert">Placez could not load. <button type="button" onClick={() => void retryPlaces()}>Try again</button></p> : panelRows(nearbyPlaces as MapRow[], "places")}
  </section>;
  const boardsPanel = <section className="zaydar-layer-panel" aria-labelledby="map-boards-title">
    <div className="zaydar-layer-panel__heading"><small>One listings layer</small><h2 id="map-boards-title">Boards</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Board kinds">
      {["Gigz", "Giftz", "Sellz", "The Haüz"].map(kind => <button type="button" key={kind} aria-pressed={boardKinds.has(kind)} onClick={() => toggleBoardKind(kind)}>{kind}</button>)}
    </div>
    {gigsLoading || giftsLoading || sellsLoading || housingLoading ? <p>Loading Boards…</p> : gigsError || giftsError || sellsError || housingError ? <p role="alert">Boards could not load. <button type="button" onClick={() => { void retryGigs(); void retryGifts(); void retrySells(); void retryHousing(); }}>Try again</button></p> : panelRows(visibleBoards, "boards")}
  </section>;
  const zayDarkPanel = <section className="zaydar-layer-panel zaydar-layer-panel--soon" aria-labelledby="map-zaydark-title"><div className="zaydar-layer-panel__heading"><small>Coming soon</small><h2 id="map-zaydark-title">ZayDark</h2></div><p>Adult Placez can stay on the map. This panel is still being built, so it has no inventory yet.</p></section>;
  const layers: ZaydarLayer[] = [
    { id: "events", label: "Eventz", color: "#FF00CC", enabled: showEvents, onToggle: () => setShowEvents(value => !value), panel: eventPanel },
    { id: "places", label: "Placez", color: "#00FFFF", enabled: showPlaces, onToggle: () => setShowPlaces(value => !value), panel: placesPanel },
    { id: "boards", label: "Boards", color: "#8800FF", enabled: showBoards, onToggle: () => setShowBoards(value => !value), panel: boardsPanel },
    { id: "zaydark", label: "ZayDark", color: "#FF2400", enabled: false, onToggle: () => {}, panel: zayDarkPanel },
  ];

  const sceneRows = marks.map(mark => {
    const event=mark.kind==='event'?mark.item as Event:null;
    const place=mark.kind==='place'?mark.item as Place:null;
    const row=mark.item as MapRow;
    const brands=event?eventBrandLogos(event,places):null;
    const color=event?zaydarEventColor(event,places):place?zaydarPlaceColor(place):boardColor(row);
    const venue=event?places.find(p=>normalizeDirectoryName(p.name)===normalizeDirectoryName(event.venueName||'')):null;
    const type=place?zaydarPlaceType(place):event?(color==='#FF0000'?'adult':venue?.type||'venue'):String(row._board||'board');
    const name=event?.title||place?.name||boardTitle(row);
    const boardLogo=String(row._board)==='The Haüz'?firstImage(row.photos)||FORMING_COVER:firstImage(row.photoUrls)||firstImage(row.imageUrl);
    return {kind:mark.kind,typeIcon:place||event?zaydarTypeIcon(type):boardIcon(row),type,key:mark.key,coordinates:[mark.lng,mark.lat],name,color,
      logo:brands?.primary||(place?resolveDirectoryLogo(place.name,place.imageUrl)||directoryFallbackLogo(place.type):mark.kind==='event'?'/zaydar-map/icons/event.svg':boardLogo||boardIcon(row)),
      alternateLogo:brands?.alternate,
      logoKey:brands?.directoryId?`directory-${brands.directoryId}`:place?`directory-${place.id}`:undefined,
      alternateLogoKey:brands?.alternateDirectoryId?`directory-${brands.alternateDirectoryId}`:undefined,
      eventDay:event?portlandCalendarDay(event.dateStart):undefined,
      startsAt:event?.dateStart,venueKey:event?normalizeDirectoryName(event.venueName || ""):undefined,
      time:event?new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(event.dateStart)):undefined};
  });
  const onSceneSelect=(key:string)=>{if(key.startsWith('directory-')){const place=places.find(p=>p.id===Number(key.slice(10)));if(place){const community=place.type==='group'?communities.find(group=>group.sourcePlaceId===place.id):undefined;if(community){window.location.assign(`/z/${encodeURIComponent(community.slug)}`);return;}setSelectedPlace(place);goOverlay('place',place.id);}return;}const mark=marks.find(m=>m.key===key);if(mark)openMark(mark);};
  return <section ref={pageRef} className="living-map-page zaydar-map-demo" style={mapHeight===undefined?undefined:{height:mapHeight}} aria-label="Zaylist interactive map">
    <ZaydarCanvas ref={mapRef} rows={sceneRows} selected={selected} labelsEnabled={labels} onSelect={onSceneSelect} onView={view=>setMapCenter(view.center)} />
    <div className="zaydar-map-lockup pdx-glass-rebind" aria-label={`Downtown Portland, ${clock}`}><strong>Downtown</strong><span>{clock}</span></div>
    <div className="zaydar-demo-navigation pdx-glass-rebind" aria-label="Map controls">
      <button className="zaydar-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:1})} aria-label="Zoom in">+</button>
      <button className="zaydar-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:-1})} aria-label="Zoom out">−</button>
      <button className="zaydar-control-location" onClick={locateMe} aria-label="Locate me" disabled={locating}><Navigation size={18}/></button>
      <button className="zaydar-control-labels" aria-pressed={labels} onClick={()=>{setLabels(v=>!v);mapRef.current?.send('labels',{enabled:!labels});}}>Labels</button>
    </div>
    {locateError&&<p className="zaydar-demo-notice" role="status">{locateError}</p>}
    <ZaydarLayerSheet layers={layers} />
    {selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={closeOverlays} onEventUpdated={setSelectedEvent} />}
    {selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} />}
    {boardOverlay && <BoardPostOverlay kind={boardOverlay.kind} postId={boardOverlay.postId} onClose={closeOverlays} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
  </section>;
}
