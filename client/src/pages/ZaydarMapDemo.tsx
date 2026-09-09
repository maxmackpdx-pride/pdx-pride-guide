import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useQuery } from "@tanstack/react-query";


import { Link, useLocation } from "wouter";
import ZaydarCanvas, { type ZaydarHandle } from "@/components/ZaydarCanvas";
import { Navigation, SlidersHorizontal, X } from "lucide-react";


import type { Event } from "@shared/schema";
import { placePath } from "@shared/placeSlug";
import { apiRequest } from "@/lib/queryClient";
import { cartoDarkTileUrl, CARTO_ATTRIBUTION } from "@/lib/mapTiles";
import { resolveBusinessLocations } from "@shared/businessLocations";
import { placeOrbIcon, waypointHtml, waypointIcon, waypointSize, type WaypointId } from "@/lib/livingMapWaypoints";
import { useModalA11y } from "@/hooks/useModalA11y";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import PlaceModal, { type PlaceModalOriginRect } from "@/components/PlaceModal";
import AuthModal from "@/components/AuthModal";
import BoardPostOverlay from "@/components/board/BoardPostOverlay";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import { spottedKind, spottedPlace } from "@/components/SpottedCard";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import type { Business } from "@/pages/Directory";
import { DIRECTORY_TYPE_LABELS, directoryTypeColor } from "@shared/directoryTheme";
import { directoryFallbackLogo, normalizeDirectoryName, resolveDirectoryLogo } from "@/lib/directoryLogos";
import { EVENT_WEEK_DAY_OPTIONS, RSVP_COLOR } from "@shared/eventWeek";
import { HOUSING_ACCENT_VAR, HOUSING_TYPE_KICKER, type HousingType } from "@shared/housing";
import { carpoolDirectionLabel, formatRiverBratsHour } from "@shared/riverBrats";
import { BEACH_VERIFY_POINTS } from "@shared/nudeBeaches";
import { outzPlaceHref, type OutzSnapshot } from "@shared/outz";
import "./LivingMap.css";
import "./ZaydarMapDemo.css";

type Place = Business;
type BoardKind = "gig" | "gifting" | "sellz";
type Mark = { key: string; kind: "event" | "place" | "housing" | "mizzed" | "carpool"; lat: number; lng: number; item: Event | Place | MapRow };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const DEFAULT_RAIL_ORDER = ["placez", "mizzed", "outz", "housing", "carpool", "boards"] as const;
type RailId = typeof DEFAULT_RAIL_ORDER[number];
const DAY: Record<string, string> = Object.fromEntries(EVENT_WEEK_DAY_OPTIONS.map(day => [day.value, day.color]));
const PLACE_ICON: Record<string, WaypointId> = { bar: "bar", restaurant: "venue", cafe: "cafe", venue: "venue", shop: "shop", hotel: "hauz", campground: "park" };
/* Snaps are relative to the drawer track inside the map, above the actual dock. */

const FORMING_COVER = "/hausing/forming-no-place.svg";
const MAP_CREATE_LINKS = [
  { label: "Eventz", href: "/submit", color: "#ccff00" },
  { label: "Placez", href: "/directory?add=1", color: "#19e3ff" },
  { label: "Mizzed", href: "/spotted", color: "#ff00cc" },
  { label: "HAÜZ", href: "/the-hauz/new", color: "#00ffff" },
  { label: "Gigz", href: "/pride-work", color: "#6e3dff" },
  { label: "Giftz", href: "/gifting", color: "#ccff00" },
  { label: "Sellz", href: "/sellz", color: "#39ff14" },
] as const;
const MAP_KEY_ITEMS: ReadonlyArray<{ label: string; id: WaypointId; color: string; note: string; badgeId?: WaypointId; scoop?: string; avatarUrl?: string }> = [
  { label: "Eventz", id: "eventz", color: "#ff00cc", scoop: "10P", note: "Ticket shell · day color · host and venue logos · white start time" },
  { label: "Placez", id: "venue", badgeId: "cafe", color: "#00ffff", note: "Venue logo in the Placez shell; corner icon identifies the place type" },
  { label: "Zenegades", id: "zenegade", color: "#ff2400", scoop: "42M", note: "Red long-form waypoint with countdown to start" },
  { label: "AfterZ", id: "afterz", color: "#ffee00", note: "Yellow long-form after-hours waypoint" },
  { label: "Mizzed", id: "mizzed", color: "#ff00cc", note: "Connections nearby" },
  { label: "HAÜZ", id: "hauz", color: "#00ffff", note: "Housing and stays" },
  { label: "OutZide", id: "outz", color: "#ff6600", note: "Outdoor recommendations" },
  { label: "Carpool", id: "carpool", color: "#00ffff", note: "Rides offered or needed" },
  { label: "Gigz", id: "gigz", color: "#8800ff", note: "Work and paid opportunities" },
  { label: "Giftz", id: "giftz", color: "#ccff00", note: "Items offered freely" },
  { label: "Sellz", id: "sells", color: "#39ff14", note: "Items for sale" },
  { label: "ZayDark user", id: "host-home", badgeId: "host-home", avatarUrl: "/hausing/demo/person-looking.jpg", color: "#ff2400", note: "Avatar fills the red shell; corner icon shows context or check-in" },
  { label: "Adult Placez", id: "venue", badgeId: "adult", color: "#ff2400", note: "Placez anatomy with venue logo and adult-place category badge" },
];

function dayAccent(day: string | null | undefined): string {
  const code = String(day || "").slice(0, 3).toUpperCase();
  return DAY[code] || RSVP_COLOR;
}

function dayText(day: string | null | undefined): string {
  const code = String(day || "").slice(0, 3).toUpperCase();
  return EVENT_WEEK_DAY_OPTIONS.find(option => option.value === code)?.textColor || RSVP_COLOR;
}

function phraseIncludes(haystack: string, needle: string): boolean {
  const words = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const phrase = words(needle);
  return phrase.length >= 3 && ` ${words(haystack)} `.includes(` ${phrase} `);
}

function eventBrandLogos(event: Event, places: Place[]): { primary?: string; alternate?: string } {
  const eventCopy = `${event.title} ${event.description || ""}`;
  const host = places
    .filter(place => place.type === "group" && phraseIncludes(eventCopy, place.name))
    .sort((a, b) => b.name.length - a.name.length)[0];
  const hostLogo = host ? resolveDirectoryLogo(host.name, host.imageUrl) : null;
  const venueKey = normalizeDirectoryName(event.venueName || "");
  const venue = places.find(place => place.type !== "group" && normalizeDirectoryName(place.name) === venueKey);
  const venueLogo = resolveDirectoryLogo(event.venueName || "", venue?.imageUrl);
  if (hostLogo) return { primary: hostLogo, alternate: venueLogo && venueLogo !== hostLogo ? venueLogo : undefined };
  return { primary: venueLogo || undefined };
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

function railImage(id: RailId, row: MapRow, events: Event[]): string | null {
  if (id === "placez") {
    const name = String(row.name || "");
    const imageUrl = typeof row.imageUrl === "string" ? row.imageUrl : null;
    return resolveDirectoryLogo(name, imageUrl) || directoryFallbackLogo(String(row.type || "venue"));
  }
  if (id === "housing") {
    return firstImage(row.photos) || (String(row.type) === "FORMING" ? FORMING_COVER : null);
  }
  if (id === "boards") return firstImage(row.photoUrls) || firstImage(row.imageUrl);
  if (id === "mizzed") {
    const eventId = typeof row.eventId === "number" ? row.eventId : Number(row.eventId);
    if (!Number.isFinite(eventId)) return null;
    return events.find(event => event.id === eventId)?.posterImageUrl || null;
  }
  return null;
}

function railAccent(id: RailId, row: MapRow): string {
  if (id === "placez") return directoryTypeColor(String(row.type || ""));
  if (id === "mizzed") return "#FF00CC";
  if (id === "housing") return HOUSING_ACCENT_VAR[String(row.type || "") as HousingType] || "var(--panel-cyan)";
  if (id === "outz" || id === "carpool") return "#FF6600";
  if (id === "boards") {
    const kind = boardKind(row);
    if (kind === "gig") return "var(--board-gigs)";
    if (kind === "gifting") return "var(--board-gifting, #CCFF00)";
    if (kind === "sellz") return "#39FF14";
  }
  return RSVP_COLOR;
}

function railCopy(id: RailId, row: MapRow, fallbackLabel: string): { kicker: string; title: string; meta: string } {
  if (id === "placez") {
    const type = String(row.type || "");
    return {
      kicker: DIRECTORY_TYPE_LABELS[type] || type || fallbackLabel,
      title: String(row.name || "Open listing"),
      meta: `${String(row.neighborhood || "Portland")} →`,
    };
  }
  if (id === "mizzed") {
    const post = row as unknown as MissedConnectionPost;
    return {
      kicker: "Mizzed Connection",
      title: String(post.title?.trim() || post.body?.trim().split(/\n/)[0] || "Mizzed connection").slice(0, 80),
      meta: spottedPlace(post),
    };
  }
  if (id === "housing") {
    const type = String(row.type || "") as HousingType;
    const area = Array.isArray(row.areas) ? row.areas.find(item => typeof item === "string") : null;
    return {
      kicker: HOUSING_TYPE_KICKER[type] || fallbackLabel,
      title: String(row.displayName || row.name || row.headline || "Open listing"),
      meta: `${String(area || row.neighborhood || "View details")} →`,
    };
  }
  if (id === "carpool") {
    const offering = String(row.post_type) === "OFFERING_RIDE";
    const beach = String(row._beach || "the beach");
    const departure = String(row.departure_area || "Portland");
    const leaveHour = Number(row.leave_hour);
    return {
      kicker: offering ? "Offering a ride" : "Ride needed",
      title: `${carpoolDirectionLabel(String(row.direction || "TO_BEACH"))} · ${beach}`,
      meta: `${departure} · ${Number.isFinite(leaveHour) ? formatRiverBratsHour(leaveHour) : "Time TBD"}`,
    };
  }
  return {
    kicker: String(row._board || row.type || fallbackLabel),
    title: String(row.title || row.name || "Open listing"),
    meta: `${String(row.neighborhood || row.destination || row.time || "View details")} →`,
  };
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

function rowMarks(rows: MapRow[], kind: Extract<Mark["kind"], "housing" | "mizzed" | "carpool">): Mark[] {
  return rows.flatMap((row, index) => {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [{ key: `${kind}-${row.id ?? index}`, kind, lat, lng, item: row }]
      : [];
  });
}

type MapBounds = { south: number; west: number; north: number; east: number };

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
  return qs ? `/map-demo?${qs}` : "/map-demo";
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
  const [query, setQuery] = useState(() => mapSearchParams().get("q") || "");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => readTimeFilter(mapSearchParams()));
  const [customStart, setCustomStart] = useState(() => mapSearchParams().get("from") || "");
  const [customEnd, setCustomEnd] = useState(() => mapSearchParams().get("to") || "");
  const [showEvents, setShowEvents] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showHousing, setShowHousing] = useState(true);
  const [showMizzed, setShowMizzed] = useState(true);
  const [showCarpool, setShowCarpool] = useState(true);
  const [barsOnly, setBarsOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedMizzed, setSelectedMizzed] = useState<MissedConnectionPost | null>(null);
  const [boardOverlay, setBoardOverlay] = useState<{ kind: BoardKind; postId: number } | null>(null);
  const [cardOriginRect, setCardOriginRect] = useState<EventModalOriginRect | PlaceModalOriginRect | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const mapRef = useRef<ZaydarHandle | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);

  const [mapHeight, setMapHeight] = useState<number>();
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const keyTriggerRef = useRef<HTMLButtonElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const createTriggerRef = useRef<HTMLButtonElement | null>(null);
  const desktop = useDesktop();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [resultsOpen,setResultsOpen]=useState(false);
  const [flight,setFlight]=useState(false);
  const [flat,setFlat]=useState(false);
  const [labels,setLabels]=useState(false);


  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const cardGesture = useRef({ x: 0, y: 0, scrollTop: 0, moved: false });
  const [railOrder, setRailOrder] = useState<RailId[]>(() => { try { const saved = JSON.parse(localStorage.getItem("zaylist.map.rail-order") || "null"); return Array.isArray(saved) && DEFAULT_RAIL_ORDER.every(id => saved.includes(id)) ? saved : [...DEFAULT_RAIL_ORDER]; } catch { return [...DEFAULT_RAIL_ORDER]; } });
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const dock = document.querySelector(".site-hub-mobile-bar");
    const header = document.querySelector(".site-header");
    const measure = () => {
      const viewportBottom = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight;
      const dockTop = dock && dock.getBoundingClientRect().height > 0 ? dock.getBoundingClientRect().top : viewportBottom;
      setMapHeight(Math.max(0, Math.min(viewportBottom, dockTop) - page.getBoundingClientRect().top));
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
  const cardPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    cardGesture.current = { x: event.clientX, y: event.clientY, scrollTop: drawerScrollRef.current?.scrollTop || 0, moved: false };
  };
  const cardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = cardGesture.current;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.moved = true;
  };
  const consumeCardScroll = (event: ReactMouseEvent<HTMLElement>) => {
    const gesture = cardGesture.current;
    const consumed = gesture.moved || Math.abs((drawerScrollRef.current?.scrollTop || 0) - gesture.scrollTop) > 4;
    cardGesture.current.moved = false;
    if (consumed) { event.preventDefault(); event.stopPropagation(); }
    return consumed;
  };
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: places = [], isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: mizzed = [], isLoading: mizzedLoading, isError: mizzedError, refetch: retryMizzed } = useQuery<MapRow[]>({ queryKey: ["/api/missed-connections"], queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: gigs = [], isLoading: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = [], isLoading: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = [], isLoading: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const { data: outzPayload, isLoading: outzLoading, isError: outzError, refetch: retryOutz } = useQuery<{ data: OutzSnapshot }>({ queryKey: ["/api/outz"], queryFn: () => apiRequest("GET", "/api/outz").then(r => r.json()) });
  const { data: carpools = [], isLoading: carpoolsLoading, isError: carpoolsError, refetch: retryCarpools } = useQuery<MapRow[]>({
    queryKey: ["/api/river-brats/carpool", "living-map"],
    queryFn: async () => {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const beaches = [["rooster-rock", "Rooster Rock"], ["sauvie-island", "Sauvie Island"]] as const;
      const rows = await Promise.all(beaches.map(async ([key, label]) => {
        const response = await apiRequest("GET", `/api/river-brats/carpool?beach=${key}&date=${today}`);
        const body = await response.json();
        const point = BEACH_VERIFY_POINTS[key];
        return Array.isArray(body) ? body.map(row => ({ ...row, _beach: label, _beachKey: key, lat: point.lat, lng: point.lng })) : [];
      }));
      return rows.flat();
    },
  });
  const housing = Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : []);
  const reorder = (id: RailId, delta: number) => setRailOrder(current => { const from = current.indexOf(id); const to = Math.max(0, Math.min(current.length - 1, from + delta)); const next = [...current]; next.splice(from, 1); next.splice(to, 0, id); localStorage.setItem("zaylist.map.rail-order", JSON.stringify(next)); return next; });
  const goOverlay = useCallback((key: OverlayKey | null, id?: number) => setLocation(overlayHref(key, id)), [setLocation]);
  const closeOverlays = useCallback(() => {
    setSelected(null);
    setSelectedEvent(null);
    setSelectedPlace(null);
    setSelectedMizzed(null);
    setBoardOverlay(null);
    setCardOriginRect(null);
    setLocation(overlayHref(null));
  }, [setLocation]);
  const q = query.trim().toLowerCase();
  const visibleEvents = useMemo(() => events.filter(e => {
    if (!finite(e.lat) || !finite(e.lng)) return false;
    if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
    const at = new Date(e.dateStart).getTime();
    const ends = new Date(e.dateEnd).getTime();
    const now = Date.now();
    if (timeFilter === "default") return at <= now + 21 * 86400000 && ends >= now;
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
  }), [events, q, timeFilter, customStart, customEnd]);
  const visiblePlaces = useMemo(() => places.filter(p => p.type !== "group" && (!q || `${p.name} ${p.type} ${p.neighborhood || ""}`.toLowerCase().includes(q))), [places, q]);
  const mapPlaces = useMemo(() => barsOnly ? visiblePlaces.filter(place => place.type === "bar") : visiblePlaces, [visiblePlaces, barsOnly]);
  const nearbyPlaces = useMemo(() => visiblePlaces
    .map(place => ({ place, point: placePoint(place) }))
    .filter((entry): entry is { place: Place; point: [number, number] } => Boolean(entry.point))
    .map(entry => ({ ...entry, distance: milesBetween(mapCenter, entry.point) }))
    .filter(entry => entry.distance <= 10)
    .sort((a, b) => a.distance - b.distance)
    .map(entry => entry.place), [visiblePlaces, mapCenter]);
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
  const visibleMizzed = useMemo(() => mizzed.filter(row => rowMatchesQuery(row, q)), [mizzed, q]);
  const visibleHousing = useMemo(() => housing.filter(row => rowMatchesQuery(row, q)), [housing, q]);
  const marks = useMemo<Mark[]>(() => [
    ...(showEvents ? visibleEvents.map(e => ({ key: `e-${e.id}-${e.dateStart}`, kind: "event" as const, lat: e.lat!, lng: e.lng!, item: e })) : []),
    ...(showPlaces ? placeMarks(mapPlaces) : []),
    ...(showHousing ? rowMarks(visibleHousing, "housing") : []),
    ...(showMizzed ? rowMarks(visibleMizzed, "mizzed") : []),
    ...(showCarpool ? rowMarks(carpools.filter(row => rowMatchesQuery(row, q)), "carpool") : []),
  ], [showEvents, showPlaces, showHousing, showMizzed, showCarpool, visibleEvents, mapPlaces, visibleHousing, visibleMizzed, carpools, q]);
  const screenMarks = useMemo(() => mapBounds ? marks.filter(mark => (
    mark.lat >= mapBounds.south && mark.lat <= mapBounds.north && mark.lng >= mapBounds.west && mark.lng <= mapBounds.east
  )).slice(0, 12) : [], [mapBounds, marks]);
  const loading = eventsLoading || placesLoading;
  const failed = eventsError || placesError;
  const boardRows = [
    ...gigs.map(row => ({ ...row, _board: "Gigz", _href: row.id ? `/pride-work?post=${row.id}` : "/pride-work" })),
    ...gifts.map(row => ({ ...row, _board: "Giftz", _href: row.id ? `/gifting?post=${row.id}` : "/gifting" })),
    ...sells.map(row => ({ ...row, _board: "Sellz", _href: row.id ? `/sellz?post=${row.id}` : "/sellz" })),
  ];
  const visibleBoards = useMemo(() => boardRows.filter(row => rowMatchesQuery(row, q)), [boardRows, q]);
  const nearbyOutz = useMemo<MapRow[]>(() => {
    const snapshot = outzPayload?.data;
    if (!snapshot) return [];
    const rows = [
      ...snapshot.destinations.map(place => ({ ...place, detail: place.subtitle })),
      ...snapshot.catalog,
      ...snapshot.communityStays,
    ];
    return rows
      .filter(row => finite(row.lat) && finite(row.lng))
      .map(row => ({ ...row, _distance: milesBetween(mapCenter, [Number(row.lat), Number(row.lng)]) }))
      .filter(row => Number(row._distance) <= 10)
      .filter(row => rowMatchesQuery(row, q))
      .sort((a, b) => Number(a._distance) - Number(b._distance));
  }, [outzPayload, mapCenter, q]);

  useEffect(() => {
    const href = mapHref(params => {
      const next = query.trim();
      if (next) params.set("q", next); else params.delete("q");
      if (timeFilter === "default") params.delete("when"); else params.set("when", timeFilter);
      if (timeFilter === "custom" && customStart) params.set("from", customStart); else params.delete("from");
      if (timeFilter === "custom" && customEnd) params.set("to", customEnd); else params.delete("to");
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) window.history.replaceState(null, "", href);
  }, [query, timeFilter, customStart, customEnd]);

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

      const mizzedId = Number(params.get("mizzed") || params.get("spotted"));
      if (Number.isFinite(mizzedId)) {
        const match = mizzed.find(row => Number(row.id) === mizzedId) as MissedConnectionPost | undefined;
        setSelectedMizzed(current => match && current?.id === match.id ? current : match || null);
      } else setSelectedMizzed(current => current ? null : current);

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
  }, [location, events, places, mizzed]);
  const genericRail = (id: RailId) => {
    const config: Record<RailId, { label: string; rows: MapRow[]; loading: boolean; error?: boolean; retry?: () => void; href: (row: MapRow) => string }> = {
      placez: { label: "Nearby Placez", rows: nearbyPlaces as MapRow[], loading: placesLoading, error: placesError, retry: () => { void retryPlaces(); }, href: row => placePath(Number(row.id), String(row.name || "place")) },
      mizzed: { label: "Mizzed Connections", rows: visibleMizzed, loading: mizzedLoading, error: mizzedError, retry: () => { void retryMizzed(); }, href: row => row.id ? `/spotted?post=${row.id}` : "/spotted" },
      outz: { label: "OutZide Nearby", rows: nearbyOutz, loading: outzLoading, error: outzError, retry: () => { void retryOutz(); }, href: row => outzPlaceHref({ id: String(row.id), name: String(row.name || "OutZide") }) },
      housing: { label: "Housing", rows: visibleHousing, loading: housingLoading, error: housingError, retry: () => { void retryHousing(); }, href: row => row.id ? `/the-hauz/${row.id}` : "/the-hauz" },
      carpool: { label: "Carpool", rows: carpools.filter(row => rowMatchesQuery(row, q)), loading: carpoolsLoading, error: carpoolsError, retry: () => { void retryCarpools(); }, href: () => "/outz" },
      boards: { label: "Gigz · Giftz · Sellz", rows: visibleBoards, loading: gigsLoading || giftsLoading || sellsLoading, error: gigsError || giftsError || sellsError, retry: () => { void retryGigs(); void retryGifts(); void retrySells(); }, href: row => String(row._href || "/pride-work") },
    };
    const item = config[id];
    const railIndex = railOrder.indexOf(id);
    return <section className="living-map-feed-section" key={id}>
      <div className="living-map-section-head"><b>{item.label}</b><span>{item.rows.length}</span><span className="living-map-reorder"><button type="button" disabled={railIndex === 0} aria-label={`Move ${item.label} up`} onClick={() => reorder(id, -1)}>↑</button><button type="button" disabled={railIndex === railOrder.length - 1} aria-label={`Move ${item.label} down`} onClick={() => reorder(id, 1)}>↓</button></span></div>
      {item.loading ? <p className="living-map-rail-empty">Loading…</p> : item.error ? <p className="living-map-rail-empty" role="alert">This rail could not load. <button type="button" onClick={item.retry}>Try again</button></p> : item.rows.length === 0 ? <p className="living-map-rail-empty">Nothing live nearby right now.</p> : <div className="living-map-rail" data-vaul-no-drag>{item.rows.slice(0, 10).map((row, i) => {
        const copy = railCopy(id, row, item.label);
        const image = railImage(id, row, events);
        const contents = <>{image && <img src={image} alt="" />}<span className="shade" /><small>{copy.kicker}</small><strong>{copy.title}</strong><em>{copy.meta}</em></>;
        const className = `living-map-card pdx-glass-rebind${id === "placez" ? " place" : ""}`;
        const style = { "--c": railAccent(id, row) } as CSSProperties;
        const key = `${id}-${row.id ?? i}`;
        if (id === "placez") return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onPointerDown={cardPointerDown} onPointerMove={cardPointerMove} onClick={event => { if (consumeCardScroll(event)) return; setCardOriginRect(originRect(event.currentTarget)); setSelectedPlace(row as unknown as Place); goOverlay("place", Number(row.id)); }}>{contents}</button>;
        if (id === "mizzed") return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onPointerDown={cardPointerDown} onPointerMove={cardPointerMove} onClick={event => { if (consumeCardScroll(event)) return; setSelectedMizzed(row as unknown as MissedConnectionPost); goOverlay("mizzed", Number(row.id)); }}>{contents}</button>;
        if (id === "boards") {
          const kind = boardKind(row);
          const postId = Number(row.id);
          if (kind && Number.isFinite(postId)) return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onPointerDown={cardPointerDown} onPointerMove={cardPointerMove} onClick={event => { if (consumeCardScroll(event)) return; setBoardOverlay({ kind, postId }); goOverlay(boardParam(kind), postId); }}>{contents}</button>;
        }
        return <Link className={className} key={key} href={item.href(row)} style={style} onPointerDown={cardPointerDown} onPointerMove={cardPointerMove} onClick={event => { consumeCardScroll(event); }}>{contents}</Link>;
      })}</div>}
    </section>;
  };

  const closeSoon = useCallback(() => setSoon(null), []);
  const comingDialogRef = useModalA11y({ open: Boolean(soon), enabled: Boolean(soon), onClose: closeSoon });
  const customPending = timeFilter === "custom" && (!customStart || !customEnd);
  const mobileDrawerPeek = true;
  useEffect(() => {
    setCreateOpen(false);
    setKeyOpen(false);
    setFiltersOpen(false);
  }, [desktop, mobileDrawerPeek]);
  const openMark = useCallback((mark: Mark, target?: Element | null) => {
    setSelected(mark.key);
    setCardOriginRect(originRect(target || null));
    if (mark.kind === "event") { setSelectedEvent(mark.item as Event); goOverlay("event", (mark.item as Event).id); }
    else if (mark.kind === "place") { setSelectedPlace(mark.item as Place); goOverlay("place", (mark.item as Place).id); }
    else if (mark.kind === "mizzed") { setSelectedMizzed(mark.item as MissedConnectionPost); goOverlay("mizzed", Number((mark.item as MapRow).id)); }
    else if (mark.kind === "housing") setLocation(`/the-hauz/${(mark.item as MapRow).id}`);
    else setLocation(`/outz/${String((mark.item as MapRow)._beachKey || "rooster-rock")}?shore=carpool`);
  }, [goOverlay, setLocation]);
  useEffect(() => {
    if (!createOpen && !keyOpen && !filtersOpen) return;
    const trigger = keyOpen ? keyTriggerRef.current : filtersOpen ? filterTriggerRef.current : createTriggerRef.current;
    const panelId = keyOpen ? "living-map-key-panel" : filtersOpen ? "living-map-filter-panel" : "living-map-create-menu";
    const frame = requestAnimationFrame(() => document.getElementById(panelId)?.querySelector<HTMLElement>("button, a[href], input")?.focus({ preventScroll: true }));
    const close = () => { setCreateOpen(false); setKeyOpen(false); setFiltersOpen(false); trigger?.focus({ preventScroll: true }); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !soon) { event.preventDefault(); close(); } };
    const onPointer = (event: PointerEvent) => { if (event.target instanceof Node && !pageRef.current?.contains(event.target) && !soon) close(); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [createOpen, keyOpen, filtersOpen, soon]);
  const filterControls = (mobile = false, hideZayDark = false) => <div className="living-map-filter-block" data-vaul-no-drag>
    <h2>Map Filters</h2>
    <div className="living-map-filter-summary"><span>{timeFilter === "default" ? "Next 3 weeks" : timeFilter === "soon" ? "Starting soon or on now" : timeFilter === "weekend" ? "This weekend" : "Choose your dates"}</span><button type="button" onClick={() => { setTimeFilter("default"); setCustomStart(""); setCustomEnd(""); setShowEvents(true); setShowPlaces(true); setShowHousing(true); setShowMizzed(true); setShowCarpool(true); setBarsOnly(false); }}>Reset filters</button></div>
    <div className="living-map-time" data-vaul-no-drag role="group" aria-label="Event date filters"><button type="button" aria-pressed={timeFilter === "soon"} className={timeFilter === "soon" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "soon" ? "default" : "soon")}>Soon</button><button type="button" aria-pressed={timeFilter === "weekend"} className={timeFilter === "weekend" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "weekend" ? "default" : "weekend")}>This weekend</button><button type="button" aria-pressed={timeFilter === "custom"} className={timeFilter === "custom" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "custom" ? "default" : "custom")}>Custom date range</button>{timeFilter === "custom" && <span className="living-map-date-range"><label>From<input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label><label>To<input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label></span>}</div>
    <div className="living-map-chips" data-vaul-no-drag role="group" aria-label="Map layer filters">
      <button type="button" aria-pressed={showEvents} className={`pdx-glass-rebind${showEvents ? " is-on" : ""}`} style={{ "--c": "#ccff00" } as CSSProperties} onClick={() => setShowEvents(v => !v)}>Eventz</button>
      <button type="button" aria-pressed={showPlaces} className={`pdx-glass-rebind cyan${showPlaces ? " is-on" : ""}`} style={{ "--c": "#19e3ff" } as CSSProperties} onClick={() => setShowPlaces(v => !v)}>Placez</button>
      {!hideZayDark && (mobile ? <button type="button" className="living-map-zaydark-toggle pdx-glass-rebind" role="switch" aria-checked="false" aria-label="Turn on ZayDark" onClick={() => setSoon("ZayDark")}><img src="/brand/family/zaydark.svg" alt="ZayDark" /><span aria-hidden="true"><i /></span></button> : <button type="button" className="pdx-glass-rebind" style={{ "--c": "#ff2400" } as CSSProperties} onClick={() => setSoon("ZayDark")}>ZayDark</button>)}
      <button type="button" aria-pressed={showHousing} className={`pdx-glass-rebind${showHousing ? " is-on" : ""}`} style={{ "--c": "#00ffff" } as CSSProperties} onClick={() => setShowHousing(v => !v)}>Haüz</button>
      <button type="button" aria-pressed={showMizzed} className={`pdx-glass-rebind${showMizzed ? " is-on" : ""}`} style={{ "--c": "#ff00cc" } as CSSProperties} onClick={() => setShowMizzed(v => !v)}>Mizzed</button>
      <button type="button" aria-pressed={showCarpool} className={`pdx-glass-rebind${showCarpool ? " is-on" : ""}`} style={{ "--c": "#00ffff" } as CSSProperties} onClick={() => setShowCarpool(v => !v)}>Carpool</button>
      <button type="button" aria-pressed={barsOnly} className={`pdx-glass-rebind${barsOnly ? " is-on" : ""}`} style={{ "--c": "#ff00cc" } as CSSProperties} onClick={() => { setShowPlaces(true); setBarsOnly(v => !v); }}>Bars</button>


    </div>
  </div>;
  const eventCard = (e: Event) => (
    <button type="button" className="living-map-card event pdx-glass-rebind" key={`${e.id}-${e.dateStart}`} aria-label={e.title} onPointerDown={cardPointerDown} onPointerMove={cardPointerMove} onClick={event => { if (consumeCardScroll(event)) return; setCardOriginRect(originRect(event.currentTarget)); setSelectedEvent(e); goOverlay("event", e.id); }} style={{ "--c": dayAccent(e.dayOfWeek), "--c-text": dayText(e.dayOfWeek) } as CSSProperties}>
      {e.posterImageUrl && <img src={e.posterImageUrl} alt="" />}<span className="shade"/><small>{String(e.dayOfWeek || "").slice(0,3)} {hour(e.dateStart)} · {e.neighborhood || "Portland"}</small><strong>{e.title}</strong><em>{e.venueName}</em>
    </button>
  );

  const sceneRows = marks.map(mark => {
    const event=mark.kind==='event'?mark.item as Event:null;
    const place=mark.kind==='place'?mark.item as Place:null;
    const row=mark.item as MapRow;
    const brands=event?eventBrandLogos(event,places):null;
    const color=event?dayAccent(event.dayOfWeek):place?directoryTypeColor(place.type):mark.kind==='mizzed'?'#FF00CC':mark.kind==='housing'?'#00FFFF':'#FF6600';
    return {key:mark.key,coordinates:[mark.lng,mark.lat],name:event?.title||place?.name||String(row.title||row.name||'Listing'),color,
      logo:brands?.primary||(place?resolveDirectoryLogo(place.name,place.imageUrl)||directoryFallbackLogo(place.type):mark.kind==='event'?'/zaydar-map/icons/event.svg':mark.kind==='housing'?'/zaydar-map/icons/housing.svg':mark.kind==='mizzed'?'/zaydar-map/icons/mizzed.svg':'/zaydar-map/icons/carpool.svg'),
      alternateLogo:brands?.alternate,
      time:event?hour(event.dateStart):undefined};
  });
  const onSceneSelect=(key:string)=>{const mark=marks.find(m=>m.key===key);if(mark)openMark(mark);};
  return <section ref={pageRef} className="living-map-page zaydar-map-demo" style={mapHeight===undefined?undefined:{height:mapHeight}} aria-label="Zaydar interactive map demo">
    <ZaydarCanvas ref={mapRef} rows={sceneRows} selected={selected} onSelect={onSceneSelect} onMode={mode=>setFlight(mode==='flight')} onView={view=>{setMapCenter(view.center);setMapBounds(view.bounds);setZoom(view.zoom);}} />
    <div className="zaydar-demo-toolbar pdx-glass-rebind">
      <strong>ZAYDAR <small>MAP DEMO</small></strong>
      <label><span className="sr-only">Search the map</span><input aria-label="Search the map" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places, events…" /></label>
      <button aria-pressed={filtersOpen} onClick={()=>{setFiltersOpen(v=>!v);setKeyOpen(false);setCreateOpen(false);}}>Filters</button>
      <button aria-pressed={resultsOpen} onClick={()=>setResultsOpen(v=>!v)}>Results <span>{marks.length}</span></button>
    </div>
    <div className="zaydar-demo-navigation pdx-glass-rebind" aria-label="Map controls">
      <button onClick={()=>mapRef.current?.send('zoom',{delta:1})} aria-label="Zoom in">+</button>
      <button onClick={()=>mapRef.current?.send('zoom',{delta:-1})} aria-label="Zoom out">−</button>
      <button onClick={locateMe} aria-label="Locate me" disabled={locating}><Navigation size={18}/></button>
      <button aria-pressed={flat} onClick={()=>{setFlat(v=>!v);mapRef.current?.send('pitch',{flat:!flat});}}>{flat?'3D':'2D'}</button>
      <button aria-pressed={labels} onClick={()=>{setLabels(v=>!v);mapRef.current?.send('labels',{enabled:!labels});}}>Labels</button>
      <button aria-pressed={flight} onClick={()=>{setFlight(v=>!v);mapRef.current?.send('mode',{mode:flight?'browse':'flight'});}}>{flight?'Browse':'Flyover'}</button>
      <button aria-expanded={keyOpen} onClick={()=>{setKeyOpen(v=>!v);setFiltersOpen(false);setCreateOpen(false);}}>Key</button>
      <button aria-expanded={createOpen} onClick={()=>{setCreateOpen(v=>!v);setFiltersOpen(false);setKeyOpen(false);}}>Post +</button>
    </div>
    {locateError&&<p className="zaydar-demo-notice" role="status">{locateError}</p>}
    <div ref={toolsRef}>
    {filtersOpen&&<section id="living-map-filter-panel" className="zaydar-demo-panel pdx-glass-rebind" aria-label="Map filters"><button className="zaydar-close" onClick={()=>setFiltersOpen(false)} aria-label="Close filters">×</button>{filterControls(false,true)}</section>}
    {keyOpen&&<section id="living-map-key-panel" className="zaydar-demo-panel pdx-glass-rebind" aria-label="Map key"><button className="zaydar-close" onClick={()=>setKeyOpen(false)} aria-label="Close map key">×</button><h2>Map key</h2><p>Zoom in or select a light to reveal its hologram.</p>{EVENT_WEEK_DAY_OPTIONS.map(day=><p key={day.value}><i className="zaydar-key-orb" style={{background:day.color,boxShadow:`0 0 14px ${day.color}`}}/>{day.label} events</p>)}<p>Placez use their category colors and existing logos.</p><p>Housing · cyan / Mizzed · magenta / Carpool · orange</p></section>}
    {createOpen&&<nav id="living-map-create-menu" className="zaydar-demo-panel pdx-glass-rebind" aria-label="Post to Zaylist"><button className="zaydar-close" onClick={()=>setCreateOpen(false)} aria-label="Close post menu">×</button><h2>Post to Zaylist</h2>{MAP_CREATE_LINKS.map(item=><Link key={item.href} href={item.href}>{item.label} ↗</Link>)}</nav>}
    </div>
    {resultsOpen&&<section className="zaydar-demo-results pdx-glass-rebind" aria-label="Map results">
      <button className="zaydar-close" onClick={()=>setResultsOpen(false)} aria-label="Close results">×</button>
      <h2>On this map</h2>
      {loading&&<p role="status">Loading live listings…</p>}
      {failed&&<p role="alert">Some listings could not load. <button onClick={()=>{void retryEvents();void retryPlaces();}}>Retry</button></p>}
      {!loading&&!marks.length&&<p>No listings match. Try another search or reset filters.</p>}
      <h3>What’s on my screen</h3><div className="living-map-rail">{screenMarks.map(mark=><button key={mark.key} onClick={()=>{mapRef.current?.send('select',{key:mark.key});openMark(mark);}}>{String((mark.item as MapRow).title||(mark.item as MapRow).name||'Listing')}</button>)}</div>
      <h3>Happening today</h3><div className="living-map-rail">{todayEvents.map(eventCard)}</div>
      {railOrder.map(genericRail)}
    </section>}
    <p className="zaydar-demo-caption">{marks.length} listings · {flight?'Automatic flyover':'Drag to explore · Zoom in for holograms'}</p>
    {selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={closeOverlays} onEventUpdated={setSelectedEvent} />}
    {selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} />}
    {selectedMizzed && <SpottedDetailModal postId={selectedMizzed.id} title={selectedMizzed.title || String(selectedMizzed.body || "").slice(0, 80)} body={String(selectedMizzed.body || "")} place={spottedPlace(selectedMizzed)} kindLabel={spottedKind(selectedMizzed).label} kindColor={spottedKind(selectedMizzed).color} onClose={closeOverlays} />}
    {boardOverlay && <BoardPostOverlay kind={boardOverlay.kind} postId={boardOverlay.postId} onClose={closeOverlays} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    {soon && <div className="living-map-coming-backdrop" role="presentation" onClick={closeSoon}><div ref={comingDialogRef} tabIndex={-1} className="living-map-coming" role="dialog" aria-modal="true" aria-labelledby="living-map-coming-title" onClick={e => e.stopPropagation()}><small>Zaylist living map</small><h2 id="living-map-coming-title">{soon} is coming soon</h2><p>This layer is staying visible while we finish it. It is not active yet.</p><button type="button" onClick={closeSoon}>Got it</button></div></div>}
  </section>;
}
