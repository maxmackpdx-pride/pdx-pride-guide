import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer } from "vaul";
import { Link, useLocation } from "wouter";
import { MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import { Navigation } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
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
import "./LivingMap.css";

type Place = Business;
type BoardKind = "gig" | "gifting" | "sellz";
type Mark = { key: string; kind: "event" | "place"; lat: number; lng: number; item: Event | Place };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const DEFAULT_RAIL_ORDER = ["placez", "mizzed", "outz", "housing", "carpool", "boards"] as const;
type RailId = typeof DEFAULT_RAIL_ORDER[number];
const DAY: Record<string, string> = Object.fromEntries(EVENT_WEEK_DAY_OPTIONS.map(day => [day.value, day.color]));
const PLACE_ICON: Record<string, WaypointId> = { bar: "bar", restaurant: "venue", cafe: "cafe", venue: "venue", shop: "shop", hotel: "hauz", campground: "park" };
const PLACE_WAYPOINT_ZOOM = 19;
/* Vaul measures pixel snaps from the viewport bottom. Keep the lowest state compact
   above the fixed mobile dock while leaving the grip visible for reopening. */
const MOBILE_DRAWER_SNAPS = ["190px", 0.52, 1] as const;
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
const MAP_KEY_ITEMS: ReadonlyArray<{ label: string; id: WaypointId; color: string; note: string }> = [
  { label: "Eventz", id: "eventz", color: "#ff00cc", note: "Color matches the event day" },
  { label: "Placez", id: "venue", color: "#00ffff", note: "Glowing orbs reveal logo waypoints nearby or on tap" },
  { label: "Mizzed", id: "mizzed", color: "#ff00cc", note: "Connections nearby" },
  { label: "HAÜZ", id: "hauz", color: "#00ffff", note: "Housing and stays" },
  { label: "OutZide", id: "outz", color: "#ff6600", note: "Outdoor recommendations" },
  { label: "Carpool", id: "carpool", color: "#00ffff", note: "Rides offered or needed" },
  { label: "Gigz", id: "gigz", color: "#8800ff", note: "Work and paid opportunities" },
  { label: "Giftz", id: "giftz", color: "#ccff00", note: "Items offered freely" },
  { label: "Sellz", id: "sells", color: "#39ff14", note: "Items for sale" },
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
function placeMarks(places: Place[]): Mark[] {
  return places.flatMap((place) => {
    const locations = place.locations?.length ? place.locations : resolveBusinessLocations(place);
    const valid = locations.filter((loc) => finite(loc.lat) && finite(loc.lng));
    if (valid.length) return valid.map((loc, i) => ({ key: `p-${place.id}-${i}`, kind: "place" as const, lat: loc.lat!, lng: loc.lng!, item: place }));
    return finite(place.lat) && finite(place.lng) ? [{ key: `p-${place.id}`, kind: "place" as const, lat: place.lat, lng: place.lng, item: place }] : [];
  });
}

function MapReader({ onZoom, onCenter }: { onZoom: (zoom: number) => void; onCenter: (center: [number, number]) => void }) {
  useMapEvents({
    zoomend: event => onZoom(event.target.getZoom()),
    moveend: event => { const center = event.target.getCenter(); onCenter([center.lat, center.lng]); },
  });
  return null;
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

const OVERLAY_KEYS = ["event", "place", "mizzed", "gig", "gift", "sell"] as const;
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
  return qs ? `/?${qs}` : "/";
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

function useDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && matchMedia("(min-width:768px)").matches);
  useEffect(() => { const media = matchMedia("(min-width:768px)"); const sync = () => setDesktop(media.matches); media.addEventListener("change", sync); return () => media.removeEventListener("change", sync); }, []);
  return desktop;
}

export default function LivingMap() {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState(() => mapSearchParams().get("q") || "");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => readTimeFilter(mapSearchParams()));
  const [customStart, setCustomStart] = useState(() => mapSearchParams().get("from") || "");
  const [customEnd, setCustomEnd] = useState(() => mapSearchParams().get("to") || "");
  const [showEvents, setShowEvents] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
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
  const mapRef = useRef<LeafletMap | null>(null);
  const desktop = useDesktop();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileDrawerSnap, setMobileDrawerSnap] = useState<number | string | null>(MOBILE_DRAWER_SNAPS[0]);
  const drawerHandleDidDrag = useRef(false);
  const [railOrder, setRailOrder] = useState<RailId[]>(() => { try { const saved = JSON.parse(localStorage.getItem("zaylist.map.rail-order") || "null"); return Array.isArray(saved) && DEFAULT_RAIL_ORDER.every(id => saved.includes(id)) ? saved : [...DEFAULT_RAIL_ORDER]; } catch { return [...DEFAULT_RAIL_ORDER]; } });
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocateError("Location is not available on this device."); return; }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(position => {
      const point: [number, number] = [position.coords.latitude, position.coords.longitude];
      setMapCenter(point);
      mapRef.current?.flyTo(point, Math.max(mapRef.current.getZoom(), 16), { duration: 0.8 });
      setLocating(false);
    }, () => {
      setLocateError("We could not find your location.");
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000 });
  }, []);
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: places = [], isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: mizzed = [], isLoading: mizzedLoading, isError: mizzedError, refetch: retryMizzed } = useQuery<MapRow[]>({ queryKey: ["/api/missed-connections"], queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: gigs = [], isLoading: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = [], isLoading: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = [], isLoading: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const housing = Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : []);
  const reorder = (id: RailId, delta: number) => setRailOrder(current => { const from = current.indexOf(id); const to = Math.max(0, Math.min(current.length - 1, from + delta)); const next = [...current]; next.splice(from, 1); next.splice(to, 0, id); localStorage.setItem("zaylist.map.rail-order", JSON.stringify(next)); return next; });
  const goOverlay = useCallback((key: OverlayKey | null, id?: number) => setLocation(overlayHref(key, id)), [setLocation]);
  const closeOverlays = useCallback(() => {
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
  const nearbyPlaces = useMemo(() => visiblePlaces
    .map(place => ({ place, point: placePoint(place) }))
    .filter((entry): entry is { place: Place; point: [number, number] } => Boolean(entry.point))
    .map(entry => ({ ...entry, distance: milesBetween(mapCenter, entry.point) }))
    .filter(entry => entry.distance <= 10)
    .sort((a, b) => a.distance - b.distance)
    .map(entry => entry.place), [visiblePlaces, mapCenter]);
  const soonEvents = useMemo(() => events.filter(e => {
    if (!finite(e.lat) || !finite(e.lng)) return false;
    if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
    const starts = new Date(e.dateStart).getTime();
    const ends = new Date(e.dateEnd).getTime();
    const now = Date.now();
    return (starts <= now && ends > now) || (starts > now && starts <= now + 90 * 60000);
  }), [events, q]);
  const marks = useMemo<Mark[]>(() => [
    ...(showEvents ? visibleEvents.map(e => ({ key: `e-${e.id}-${e.dateStart}`, kind: "event" as const, lat: e.lat!, lng: e.lng!, item: e })) : []),
    ...(showPlaces ? placeMarks(visiblePlaces) : []),
  ], [showEvents, showPlaces, visibleEvents, visiblePlaces]);
  const loading = eventsLoading || placesLoading;
  const failed = eventsError || placesError;
  const boardRows = [
    ...gigs.map(row => ({ ...row, _board: "Gigz", _href: row.id ? `/pride-work?post=${row.id}` : "/pride-work" })),
    ...gifts.map(row => ({ ...row, _board: "Giftz", _href: row.id ? `/gifting?post=${row.id}` : "/gifting" })),
    ...sells.map(row => ({ ...row, _board: "Sellz", _href: row.id ? `/sellz?post=${row.id}` : "/sellz" })),
  ];
  const visibleMizzed = useMemo(() => mizzed.filter(row => rowMatchesQuery(row, q)), [mizzed, q]);
  const visibleHousing = useMemo(() => housing.filter(row => rowMatchesQuery(row, q)), [housing, q]);
  const visibleBoards = useMemo(() => boardRows.filter(row => rowMatchesQuery(row, q)), [boardRows, q]);

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
      outz: { label: "OutZide Nearby", rows: [], loading: false, href: () => "/outz" },
      housing: { label: "Housing", rows: visibleHousing, loading: housingLoading, error: housingError, retry: () => { void retryHousing(); }, href: row => row.id ? `/the-hauz/${row.id}` : "/the-hauz" },
      carpool: { label: "Carpool", rows: [], loading: false, href: () => "/outz" },
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
        const className = `living-map-card${id === "placez" ? " place" : ""}`;
        const style = { "--c": railAccent(id, row) } as CSSProperties;
        const key = `${id}-${row.id ?? i}`;
        if (id === "placez") return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onClick={event => { setCardOriginRect(originRect(event.currentTarget)); setSelectedPlace(row as unknown as Place); goOverlay("place", Number(row.id)); }}>{contents}</button>;
        if (id === "mizzed") return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onClick={() => { setSelectedMizzed(row as unknown as MissedConnectionPost); goOverlay("mizzed", Number(row.id)); }}>{contents}</button>;
        if (id === "boards") {
          const kind = boardKind(row);
          const postId = Number(row.id);
          if (kind && Number.isFinite(postId)) return <button type="button" className={className} key={key} style={style} aria-label={copy.title} onClick={() => { setBoardOverlay({ kind, postId }); goOverlay(boardParam(kind), postId); }}>{contents}</button>;
        }
        return <Link className={className} key={key} href={item.href(row)} style={style}>{contents}</Link>;
      })}</div>}
    </section>;
  };

  const closeSoon = useCallback(() => setSoon(null), []);
  const comingDialogRef = useModalA11y({ open: Boolean(soon), enabled: Boolean(soon), onClose: closeSoon });
  const customPending = timeFilter === "custom" && (!customStart || !customEnd);
  const mobileDrawerPeek = mobileDrawerSnap === MOBILE_DRAWER_SNAPS[0];
  useEffect(() => {
    if (!createOpen && !keyOpen && !filtersOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setCreateOpen(false); setKeyOpen(false); setFiltersOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createOpen, keyOpen, filtersOpen]);
  const filterControls = (mobile = false, hideZayDark = false) => <div className="living-map-filter-block" data-vaul-no-drag>
    <h2>Map Filters</h2>
    <div className="living-map-time" data-vaul-no-drag role="radiogroup" aria-label="Event date filters"><button type="button" role="radio" aria-checked={timeFilter === "soon"} className={timeFilter === "soon" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "soon" ? "default" : "soon")}>Soon</button><button type="button" role="radio" aria-checked={timeFilter === "weekend"} className={timeFilter === "weekend" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "weekend" ? "default" : "weekend")}>This weekend</button><button type="button" role="radio" aria-checked={timeFilter === "custom"} className={timeFilter === "custom" ? "is-on" : ""} onClick={() => setTimeFilter(current => current === "custom" ? "default" : "custom")}>Custom date range</button>{timeFilter === "custom" && <span className="living-map-date-range"><label>From<input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label><label>To<input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label></span>}</div>
    <div className="living-map-chips" data-vaul-no-drag role="group" aria-label="Map layer filters">
      <button type="button" aria-pressed={showEvents} className={showEvents ? "is-on" : ""} onClick={() => setShowEvents(v => !v)}>Eventz</button>
      <button type="button" aria-pressed={showPlaces} className={showPlaces ? "is-on cyan" : "cyan"} onClick={() => setShowPlaces(v => !v)}>Placez</button>
      {!hideZayDark && (mobile ? <button type="button" className="living-map-zaydark-toggle pdx-glass-rebind" role="switch" aria-checked="false" aria-label="Turn on ZayDark" onClick={() => setSoon("ZayDark")}><img src="/brand/family/zaydark.svg" alt="ZayDark" /><span aria-hidden="true"><i /></span></button> : <button type="button" onClick={() => setSoon("ZayDark")}>ZayDark</button>)}
      <button type="button" onClick={() => setSoon("Zenegades")}>Zenegades</button>
      <button type="button" onClick={() => setSoon("Afterz")}>Afterz</button>
    </div>
  </div>;
  const eventCard = (e: Event) => (
    <button type="button" className="living-map-card event" key={`${e.id}-${e.dateStart}`} aria-label={e.title} onClick={event => { setCardOriginRect(originRect(event.currentTarget)); setSelectedEvent(e); goOverlay("event", e.id); }} style={{ "--c": dayAccent(e.dayOfWeek), "--c-text": dayText(e.dayOfWeek) } as CSSProperties}>
      {e.posterImageUrl && <img src={e.posterImageUrl} alt="" />}<span className="shade"/><small>{String(e.dayOfWeek || "").slice(0,3)} {hour(e.dateStart)} · {e.neighborhood || "Portland"}</small><strong>{e.title}</strong><em>{e.venueName}</em>
    </button>
  );

  return <section className="living-map-page" aria-label="Zaylist living map">
    <div className="living-map-canvas">
      <MapContainer ref={mapRef} center={[45.523, -122.676]} zoom={13} minZoom={10} maxBounds={[[45.35, -122.92], [45.70, -122.42]]} className="living-map-leaflet" attributionControl>
        <TileLayer url={cartoDarkTileUrl()} attribution={CARTO_ATTRIBUTION} subdomains="abcd" maxZoom={20} />
        <MapReader onZoom={setZoom} onCenter={setMapCenter} />
        {marks.map(mark => {
          const chosen = selected === mark.key;
          const item = mark.item;
          const place = item as Place;
          const placeColor = mark.kind === "place" ? directoryTypeColor(place.type) : "";
          const eventLogos = mark.kind === "event" ? eventBrandLogos(item as Event, places) : {};
          const icon = mark.kind === "event"
            ? waypointIcon({ id: (item as Event).isSexPositive ? "plus" : "eventz", size: waypointSize(zoom, chosen), scoop: hour((item as Event).dateStart), color: dayAccent((item as Event).dayOfWeek), logoUrl: eventLogos.primary, alternateLogoUrl: eventLogos.alternate, selected: chosen })
            : chosen || zoom >= PLACE_WAYPOINT_ZOOM
              ? waypointIcon({
                id: PLACE_ICON[place.type] || "venue",
                size: waypointSize(zoom, chosen),
                color: placeColor,
                logoUrl: resolveDirectoryLogo(place.name, place.imageUrl) || directoryFallbackLogo(place.type),
                selected: chosen,
              })
              : placeOrbIcon(placeColor);
          return <Marker key={mark.key} position={[mark.lat, mark.lng]} icon={icon} eventHandlers={{ click: event => {
            setSelected(mark.key);
            setCardOriginRect(originRect(event.originalEvent?.target instanceof Element ? event.originalEvent.target.closest(".leaflet-marker-icon") : null));
            if (mark.kind === "event") { setSelectedEvent(item as Event); goOverlay("event", (item as Event).id); }
            else { setSelectedPlace(item as Place); goOverlay("place", (item as Place).id); }
          } }}><Tooltip direction="top">{mark.kind === "event" ? (item as Event).title : (item as Place).name}</Tooltip></Marker>;
        })}
      </MapContainer>
    </div>
    {desktop && <div className="living-map-locate">
      <button type="button" aria-label="Locate me" title="Locate me" onClick={locateMe}><Navigation aria-hidden="true" /></button>
      {locateError && <span role="status">{locateError}</span>}
      {locating && <span role="status">Locating…</span>}
    </div>}
    {createOpen && <button type="button" className="living-map-create-backdrop" aria-label="Close post menu" onClick={() => setCreateOpen(false)} />}
    <div className={`living-map-create${createOpen ? " is-open" : ""}${!desktop && !mobileDrawerPeek ? " is-tucked" : ""}`}>
      <div id="living-map-create-menu" className="living-map-create__fan" role="menu" aria-label="Post to Zaylist">
        {MAP_CREATE_LINKS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            className="living-map-create__option pdx-glass-rebind"
            style={{ "--c": item.color, "--fan-i": index } as CSSProperties}
            onClick={() => setCreateOpen(false)}
          >
            <span aria-hidden="true">+</span>{item.label}
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="living-map-create__trigger pdx-glass-rebind"
        aria-label={createOpen ? "Close post menu" : "Post to the map"}
        aria-expanded={createOpen}
        aria-haspopup="menu"
        aria-controls="living-map-create-menu"
        onClick={() => setCreateOpen(open => !open)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
    <div className={`living-map-key${keyOpen ? " is-open" : ""}${!desktop && !mobileDrawerPeek ? " is-tucked" : ""}`}>
      {keyOpen && <section className="living-map-key__panel pdx-liquid-overlay" aria-label="Map key">
        <div className="living-map-key__head"><strong>Map Key</strong><button type="button" onClick={() => setKeyOpen(false)} aria-label="Close map key">×</button></div>
        <ul>{MAP_KEY_ITEMS.map(item => <li key={item.label}>
          <span className="living-map-key__waypoint" dangerouslySetInnerHTML={{ __html: waypointHtml({ id: item.id, color: item.color, size: 31 }) }} />
          <span><b>{item.label}</b><small>{item.note}</small></span>
        </li>)}</ul>
      </section>}
      <button type="button" className="living-map-key__trigger pdx-glass-rebind" aria-expanded={keyOpen} onClick={() => { setKeyOpen(open => !open); setCreateOpen(false); }}>Key</button>
    </div>
    {!desktop && filtersOpen && <button type="button" className="living-map-filter-backdrop" aria-label="Close map filters" onClick={() => setFiltersOpen(false)} />}
    {!desktop && <div className={`living-map-mobile-filters${filtersOpen ? " is-open" : ""}${!mobileDrawerPeek ? " is-tucked" : ""}`}>
      <div className="living-map-mobile-filters__rail pdx-liquid-overlay" aria-hidden={!filtersOpen}>{filterControls(true)}</div>
      <button type="button" className="living-map-mobile-filters__trigger pdx-glass-rebind" aria-label={filtersOpen ? "Close map filters" : "Open map filters"} aria-expanded={filtersOpen} onClick={() => { setFiltersOpen(open => !open); setCreateOpen(false); setKeyOpen(false); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg></button>
    </div>}
    <Drawer.Root open modal={false} dismissible={false} handleOnly={!desktop} snapToSequentialPoint shouldScaleBackground={false} disablePreventScroll snapPoints={desktop ? undefined : [...MOBILE_DRAWER_SNAPS]} activeSnapPoint={desktop ? undefined : mobileDrawerSnap} setActiveSnapPoint={desktop ? undefined : next => { if (next != null) setMobileDrawerSnap(next); }} onDrag={() => { drawerHandleDidDrag.current = true; }}>
      <Drawer.Portal>
      <Drawer.Content className="living-map-drawer pdx-glass-rebind pdx-liquid-overlay" aria-label="Explore the map">
      <Drawer.Title className="sr-only">Explore the map</Drawer.Title>
      {!desktop && <Drawer.Handle preventCycle className="living-map-handle" aria-label={mobileDrawerPeek ? "Open map drawer" : "Close map drawer"} onClick={() => { if (drawerHandleDidDrag.current) { drawerHandleDidDrag.current = false; return; } setMobileDrawerSnap(mobileDrawerPeek ? MOBILE_DRAWER_SNAPS[2] : MOBILE_DRAWER_SNAPS[0]); }}><span /></Drawer.Handle>}
      <div className="living-map-drawer-controls">
      <label className="living-map-search" data-vaul-no-drag><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, places, listings…" aria-label="Search the living map" /></label>
      {desktop && filterControls()}
      </div>
      <div className="living-map-drawer-scroll" data-vaul-no-drag>
      {loading && <p className="living-map-state">Loading the city…</p>}
      {failed && <div className="living-map-state" role="alert">The map feed could not load. <button type="button" onClick={() => { void retryEvents(); void retryPlaces(); }}>Try again</button></div>}
      {customPending && <p className="living-map-state">Pick a start and end date.</p>}
      {!loading && !failed && !customPending && marks.length === 0 && <p className="living-map-state">Nothing on the map matches that search.</p>}
      <div className="living-map-section-head"><b>Soon</b><span>{soonEvents.length}</span><Link className="living-map-view-all" href="/events">View All</Link></div>
      {soonEvents.length === 0 ? <p className="living-map-rail-empty">Nothing happening in the next 90 minutes.</p> : <div className="living-map-rail" data-vaul-no-drag>{soonEvents.slice(0, 10).map(eventCard)}</div>}
      {railOrder.map(genericRail)}
      </div>
      </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    {selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={closeOverlays} onEventUpdated={setSelectedEvent} />}
    {selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} />}
    {selectedMizzed && <SpottedDetailModal postId={selectedMizzed.id} title={selectedMizzed.title || String(selectedMizzed.body || "").slice(0, 80)} body={String(selectedMizzed.body || "")} place={spottedPlace(selectedMizzed)} kindLabel={spottedKind(selectedMizzed).label} kindColor={spottedKind(selectedMizzed).color} onClose={closeOverlays} />}
    {boardOverlay && <BoardPostOverlay kind={boardOverlay.kind} postId={boardOverlay.postId} onClose={closeOverlays} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    {soon && <div className="living-map-coming-backdrop" role="presentation" onClick={closeSoon}><div ref={comingDialogRef} tabIndex={-1} className="living-map-coming" role="dialog" aria-modal="true" aria-labelledby="living-map-coming-title" onClick={e => e.stopPropagation()}><small>Zaylist living map</small><h2 id="living-map-coming-title">{soon} is coming soon</h2><p>This layer is staying visible while we finish it. It is not active yet.</p><button type="button" onClick={closeSoon}>Got it</button></div></div>}
  </section>;
}
