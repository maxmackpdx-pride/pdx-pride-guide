import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";


import { useLocation, useSearch } from "wouter";
import { ZAYDAR_PLACE_TYPE_OPTIONS, zaydarTypeIcon, zaydarTypeLabel } from "@/components/ZaydarSearchDrawer";
import ZaydarLayerSheet, { type ZaydarLayer, type ZaydarLayerId } from "@/components/ZaydarLayerSheet";
import ZaydarUpcomingRsvps from "@/components/ZaydarUpcomingRsvps";
import ZaydarCanvas, { type MapSelectionRect, type ZaydarHandle } from "@/components/ZaydarCanvas";
import { ChevronRight, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";


import type { CommunitySummary } from "@shared/community";
import type { Event } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { resolveBusinessLocations } from "@shared/businessLocations";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import PlaceModal, { type PlaceModalOriginRect } from "@/components/PlaceModal";
import AuthModal from "@/components/AuthModal";
import BoardPostOverlay from "@/components/board/BoardPostOverlay";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import { spottedKind, spottedPlace } from "@/components/SpottedCard";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import HousingPostOverlay from "@/components/housing/HousingPostOverlay";
import HousingComposerOverlay from "@/components/housing/HousingComposerOverlay";
import { HousingTagFilter } from "@/components/housing/HousingTagFilter";
import type { Business } from "@/pages/Directory";
import { directoryTypeColor } from "@shared/directoryTheme";
import { directoryFallbackLogo, normalizeDirectoryName, resolveDirectoryLogo } from "@/lib/directoryLogos";
import { mapRecordId, clearMapOverlay } from "@/lib/mapDrawerNavigation";
import { mapCoordinates } from "@/lib/mapCoordinates";
import { stampHauzMapPoints } from "@/lib/hauzDemoPins";
import { mapListingKey, matchesMapEvent, type MapTimeFilter } from "@/lib/mapLayerFilters";
import { HOUSING_TYPE_LABEL, type HousingBoardResponse, type HousingPostView, type HousingType } from "@shared/housing";
import { EVENT_PLACEHOLDER_PENDING, resolveEventPosterUrl } from "@shared/eventPoster";
import { parsePacificDateTime } from "@shared/missedConnections";
import { AVATAR_EMOJI_OPTIONS, normalizeAvatarRing } from "@shared/avatarRings";
import { isLocalDemo } from "@/lib/localDemo";
import "./LivingMap.css";
import "./ZaydarMapDemo.css";
import "@/components/ZaydarLayerSheet.css";

type Place = Business;
type BoardKind = "gig" | "gifting" | "sellz";
type Mark = { key: string; kind: "event" | "place" | "board"; lat: number; lng: number; item: Event | Place | MapRow };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const EMPTY_EVENTS: Event[] = [];
const EMPTY_PLACES: Place[] = [];
const EMPTY_ROWS: MapRow[] = [];
const EMPTY_COMMUNITIES: CommunitySummary[] = [];
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

function housingFaceStack(row: MapRow) {
  const household = Array.isArray(row.household) ? row.household : [];
  const author = row.author && typeof row.author === "object" ? row.author : null;
  const people = [...(author ? [author] : []), ...household].filter((person): person is Record<string, unknown> => Boolean(person && typeof person === "object"));
  const seen = new Set<string>();
  return people.flatMap((person) => {
    const key = String(person.userId || person.id || person.username || person.name || "");
    if (!key || seen.has(key)) return [];
    seen.add(key);
    const avatarChoice = Number(person.avatarChoice) || 1;
    const option = AVATAR_EMOJI_OPTIONS.find(item => item.id === avatarChoice) || AVATAR_EMOJI_OPTIONS[0];
    const name = String(person.displayName || person.name || person.username || "Zaylist member");
    return [{
      url: firstImage(person.photoUrl) || option.img || "",
      initial: name.trim().slice(0, 1).toUpperCase() || "Z",
      background: option.bg || "#00FFFF",
      ring: normalizeAvatarRing(typeof person.avatarRing === "string" ? person.avatarRing : null),
    }];
  }).slice(0, 5);
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
function dateTimeLocalValue(value: number) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
function pointInPolygon(lat: number, lng: number, polygon: [number, number][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [aLng, aLat] = polygon[i], [bLng, bLat] = polygon[j];
    if ((aLat > lat) !== (bLat > lat) && lng < (bLng - aLng) * (lat - aLat) / (bLat - aLat) + aLng) inside = !inside;
  }
  return inside;
}
const DOWNTOWN_BOUNDARY: [number, number][] = [[-122.707,45.507],[-122.697,45.537],[-122.67,45.538],[-122.657,45.512],[-122.676,45.497]];
const NORTH_PORTLAND_BOUNDARY: [number, number][] = [[-122.81,45.61],[-122.76,45.67],[-122.65,45.67],[-122.64,45.602],[-122.665,45.568],[-122.69,45.55],[-122.735,45.56],[-122.79,45.58]];
function riverLongitude(lat: number) {
  const points: [number, number][] = [[45.45,-122.66],[45.5,-122.665],[45.53,-122.675],[45.56,-122.7],[45.6,-122.75]];
  for (let i = 1; i < points.length; i++) if (lat <= points[i][0]) {
    const [aLat,aLng]=points[i-1],[bLat,bLng]=points[i],mix=(lat-aLat)/(bLat-aLat);
    return aLng+(bLng-aLng)*mix;
  }
  return points.at(-1)![1];
}
function portlandRegion([lat,lng]: [number, number]) {
  if (pointInPolygon(lat,lng,DOWNTOWN_BOUNDARY)) return "Downtown";
  if (pointInPolygon(lat,lng,NORTH_PORTLAND_BOUNDARY)) return "North Portland";
  const west = lng < riverLongitude(lat), north = lat >= 45.523;
  if (west) return north ? "Northwest" : "Southwest";
  return north ? "Northeast" : "Southeast";
}
function placeMarks(places: Place[]): Mark[] {
  return places.flatMap((place) => {
    const locations = place.locations?.length ? place.locations : resolveBusinessLocations(place);
    const valid = locations.filter((loc) => mapCoordinates(loc.lat, loc.lng));
    if (valid.length) return valid.map((loc, i) => ({ key: `p-${place.id}-${i}`, kind: "place" as const, lat: loc.lat!, lng: loc.lng!, item: place }));
    const point = mapCoordinates(place.lat, place.lng);
    return point ? [{ key: `p-${place.id}`, kind: "place" as const, ...point, item: place }] : [];
  });
}

function rowMarks(rows: MapRow[], kind: Extract<Mark["kind"], "board">): Mark[] {
  return rows.flatMap((row, index) => {
    const point = mapCoordinates(row.lat, row.lng);
    if (!point) return [];
    const {lat, lng} = point;
    return [{ key: mapListingKey(row._board, row.id ?? index), kind, lat, lng, item: row }];
  });
}

function boardColor(row: MapRow): string {
  if (String(row._board) === "The HOÜS") return row.type === "OFFERING" ? "#FF6600" : row.type === "FORMING" ? "#39FF14" : row.type === "MANAGED" ? "#8800FF" : "#00FFFF";
  const kind = boardKind(row);
  if (kind === "gig") return "#8800FF";
  if (kind === "gifting") return "#CCFF00";
  return "#39FF14";
}

function boardIcon(row: MapRow): string {
  if (String(row._board) === "The HOÜS") return "/zaydar-map/icons/housing.svg";
  const kind = boardKind(row);
  if (kind === "gig") return zaydarTypeIcon("service");
  return zaydarTypeIcon("shop");
}

function boardTitle(row: MapRow): string {
  return String(row.displayName || row.headline || row.title || row.name || "Board listing");
}

function housingAreaLabel(row: MapRow): string {
  if (Array.isArray(row.areas)) return row.areas.filter((area): area is string => typeof area === "string").join(" · ").toUpperCase();
  return String(row.neighborhood || "PORTLAND").toUpperCase();
}

function housingDemo(row: MapRow): boolean {
  const author = row.author;
  return Boolean(author && typeof author === "object" && (author as { username?: unknown }).username === "hausing_demo");
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

const OVERLAY_KEYS = ["event", "place", "mizzed", "spotted", "gig", "gift", "sell", "sellz", "houz"] as const;
type OverlayKey = typeof OVERLAY_KEYS[number];
type TimeFilter = MapTimeFilter;

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
    clearMapOverlay(params);
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
  if (when === "tonight" || when === "soon" || when === "weekend" || when === "custom") return when;
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
  const { user } = useAuth();
  const canOpenMapObjects = Boolean(user) || isLocalDemo();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const updateParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    setLocation(mapHref(mutate), { replace: true, state: window.history.state });
  }, [setLocation]);
  const query = params.get("q") || "";
  const timeFilter = readTimeFilter(params);
  const customStart = params.get("from") || "", customEnd = params.get("to") || "";
  const setTimeFilter = (value: TimeFilter) => updateParams(p => {
    if (value === "default") p.delete("when"); else p.set("when", value);
    if (value !== "custom") { p.delete("from"); p.delete("to"); }
  });
  const layerValue = params.get("layer");
  const activeLayer = layerValue === "boards" ? "stuff" : ["events", "places", "mizzed", "gigz", "stuff", "houz"].includes(layerValue || "") ? layerValue as ZaydarLayerId : null;
  const changeLayer = useCallback((next: ZaydarLayerId | null) => {
    const current = mapSearchParams().get("layer");
    setLocation(mapHref(p => { if (next) p.set("layer", next); else p.delete("layer"); }), {
      replace: Boolean(current) || !next,
      state: window.history.state,
    });
  }, [setLocation]);
  const showEvents = params.get("hideEvents") !== "1", showPlaces = params.get("hidePlaces") !== "1";
  const showGigz = params.get("hideGigz") !== "1", showStuff = params.get("hideStuff") !== "1", showHouz = params.get("hideHouz") !== "1";
  const toggleLayer = (key: string) => updateParams(p => { if (p.get(key) === "1") p.delete(key); else p.set(key, "1"); });
  const housingValue = params.get("housingType");
  const housingType = ["OFFERING", "LOOKING", "FORMING", "MANAGED"].includes(housingValue || "") ? housingValue as HousingType : null;
  const setHousingType = (value: HousingType | null) => updateParams(p => { if (value) p.set("housingType", value); else p.delete("housingType"); });
  const housingSaved = params.get("housingSaved") === "1";
  const setHousingSaved = (value: boolean) => updateParams(p => { if (value) p.set("housingSaved", "1"); else p.delete("housingSaved"); });
  const housingTags = useMemo(() => (params.get("housingTags") || "").split(",").filter(Boolean), [params]);
  const setHousingTags = (tags: string[]) => updateParams(p => { if (tags.length) p.set("housingTags", tags.join(",")); else p.delete("housingTags"); });
  const composeValue = params.get("houzCompose");
  const houzCompose = composeValue === "PM" || ["OFFERING", "LOOKING", "FORMING", "MANAGED"].includes(composeValue || "") ? composeValue as HousingType | "PM" : null;
  const placeTypesParam = params.get("placeTypes");
  const placeTypes = useMemo(() => placeTypesParam !== null ? placeTypesParam.split(",") : [...ZAYDAR_PLACE_TYPE_OPTIONS], [placeTypesParam]);
  const eventTag = params.get("tag");
  const setEventTag = (value: string | null) => updateParams(p => { if (value) p.set("tag", value); else p.delete("tag"); });
  const boardKindsParam = params.get("boards");
  const boardKinds = useMemo(() => new Set(boardKindsParam !== null ? boardKindsParam.split(",") : ["Giftz", "Sellz"]), [boardKindsParam]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [previewDateTime, setPreviewDateTime] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
  const [cardOriginRect, setCardOriginRect] = useState<EventModalOriginRect | PlaceModalOriginRect | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const mapRef = useRef<ZaydarHandle | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  const gateSignedOutControls = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (canOpenMapObjects) return;
    const target = event.target as HTMLElement;
    if (target.closest(".zaydar-control-zoom")) return;
    if (!target.closest("button,a,input,summary,label")) return;
    event.preventDefault();
    event.stopPropagation();
    setShowAuth(true);
  }, [canOpenMapObjects]);

  const [mapHeight, setMapHeight] = useState<number>();
  const desktop = useDesktop();
  const [labels,setLabels]=useState(false);
  const viewTimestamp = useMemo(() => {
    const selected = previewDateTime ? new Date(previewDateTime).getTime() : NaN;
    return Number.isFinite(selected) ? selected : clockNow;
  }, [previewDateTime, clockNow]);
  const regionLabel = useMemo(() => portlandRegion(mapCenter), [mapCenter]);
  const mapTimeLabel = useMemo(() => new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", month: previewDateTime ? "short" : undefined, day: previewDateTime ? "numeric" : undefined,
    hour: "numeric", minute: "2-digit",
  }).format(viewTimestamp), [viewTimestamp, previewDateTime]);
  const locationAvatar = useMemo(() => {
    const option = AVATAR_EMOJI_OPTIONS.find(item => item.id === (user?.avatarChoice || 1)) || AVATAR_EMOJI_OPTIONS[0];
    return {
      url: user ? (user.photoUrl || option.img || "") : "/brand/zaylist-avatar.jpg",
      initial: (user?.displayName || user?.username || "Z").trim().slice(0, 1).toUpperCase(),
      background: option.bg || "#00FFFF",
      ring: normalizeAvatarRing(user?.avatarRing),
    };
  }, [user]);


  useEffect(() => {
    const update = () => setClockNow(Date.now());
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
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocateError("Location is not available on this device."); return; }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(position => {
      const point: [number, number] = [position.coords.latitude, position.coords.longitude];
      if(point[0]<45.2||point[0]>45.85||point[1]<-123.15||point[1]>-122.15){setLocateError("You’re outside this Portland metro demo.");setLocating(false);return;}
      setMapCenter(point);
      mapRef.current?.send("locate", { coordinates: [point[1], point[0]], avatar: locationAvatar });
      setLocating(false);
    }, () => {
      setLocateError("We could not find your location.");
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000 });
  }, [locationAvatar]);
  const { data: events = EMPTY_EVENTS, isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: communities = EMPTY_COMMUNITIES } = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"], queryFn: () => apiRequest("GET", "/api/communities").then(r => r.json()) });
  const { data: places = EMPTY_PLACES, isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: mizzed = [], isLoading: mizzedLoading, isError: mizzedError, refetch: retryMizzed } = useQuery<MissedConnectionPost[]>({ queryKey: ["/api/missed-connections"], queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: gigs = EMPTY_ROWS, isLoading: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = EMPTY_ROWS, isLoading: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = EMPTY_ROWS, isLoading: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const housing = useMemo(() => stampHauzMapPoints(Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : [])), [housingRaw]);
  const housingStats = !Array.isArray(housingRaw) && housingRaw && typeof housingRaw === "object" ? (housingRaw as HousingBoardResponse).stats : undefined;
  const goOverlay = useCallback((key: OverlayKey | null, id?: number) => {
    const hasOverlay = OVERLAY_KEYS.some(key => mapSearchParams().has(key));
    setLocation(overlayHref(key, id), { replace: hasOverlay, state: { ...window.history.state,
      mapOverlayReturn: hasOverlay ? window.history.state?.mapOverlayReturn : window.location.pathname + window.location.search,
    } });
  }, [setLocation]);
  const closingOverlay = useRef(false);
  useEffect(() => { closingOverlay.current = false; }, [search]);
  const closeOverlays = useCallback(() => {
    setSelected(null);
    setCardOriginRect(null);
    if (closingOverlay.current) return;
    closingOverlay.current = true;
    const closingHref = window.location.pathname + window.location.search;
    // Detail links call onClose before navigating. Let their destination win.
    queueMicrotask(() => {
      if (closingHref !== window.location.pathname + window.location.search) { closingOverlay.current = false; return; }
      if (window.history.state?.mapOverlayReturn) window.history.back();
      else setLocation(overlayHref(null), { replace: true, state: window.history.state });
    });
  }, [setLocation]);
  const eventId = mapRecordId(params.get("event"), true);
  const placeId = mapRecordId(params.get("place"));
  const feedEvent = events.find(event => event.id === eventId);
  const eventDetail = useQuery<Event>({
    queryKey: ["/api/events", eventId], enabled: eventId !== null && !feedEvent && !eventsLoading,
    queryFn: () => apiRequest("GET", `/api/events/${eventId}`).then(r => r.json()),
  });
  const selectedEvent = eventId ? feedEvent || eventDetail.data : null;
  const selectedPlace = placeId ? places.find(place => place.id === placeId) : null;
  const houzId = mapRecordId(params.get("houz"));
  const feedHouz = houzId ? housing.find(post => Number(post.id) === houzId) as HousingPostView | undefined : undefined;
  const houzDetail = useQuery<HousingPostView>({
    queryKey: ["/api/housing", houzId], enabled: houzId !== null && !feedHouz,
    queryFn: async () => { const response = await fetch(`/api/housing/${houzId}`, { credentials: "include" }); if (!response.ok) throw new Error("Not found"); return response.json(); },
  });
  const selectedHouz = feedHouz || houzDetail.data;
  const mizzedId = mapRecordId(params.get("mizzed") || params.get("spotted"));
  const selectedMizzed = mizzedId ? mizzed.find(post => post.id === mizzedId) : null;
  const boardKey = (["gig", "gift", "sell", "sellz"] as const).find(key => mapRecordId(params.get(key)) !== null);
  const boardOverlay = boardKey ? { kind: boardFromParam(boardKey)!, postId: mapRecordId(params.get(boardKey))! } : null;
  const missingPlace = placeId !== null && !placesLoading && !selectedPlace;
  const updateEvent = (event: Event) => {
    queryClient.setQueryData<Event[]>(["/api/events"], rows => rows?.map(row => row.id === event.id ? event : row));
    queryClient.setQueryData(["/api/events", event.id], event);
  };
  const q = query.trim().toLowerCase();
  const eventTags = useMemo(() => Array.from(new Set(events.flatMap(event => {
    try {
      const parsed = JSON.parse(event.eventTypes || "[]");
      return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
    } catch { return []; }
  }))).slice(0, 8), [events]);
  const visibleEvents = useMemo(() => events.filter(e => {
    if (!mapCoordinates(e.lat, e.lng)) return false;
    if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
    return matchesMapEvent(e, timeFilter, eventTag, customStart, customEnd, viewTimestamp);
  }).sort((a, b) => (parsePacificDateTime(a.dateStart) || 0) - (parsePacificDateTime(b.dateStart) || 0)), [events, q, eventTag, timeFilter, customStart, customEnd, viewTimestamp]);
  const visiblePlaces = useMemo(() => places.filter(p => p.type !== "group" && (!q || `${p.name} ${p.type} ${p.neighborhood || ""}`.toLowerCase().includes(q))), [places, q]);
  const mapPlaces = useMemo(() => visiblePlaces.filter(place => placeTypes.includes(zaydarPlaceType(place))), [visiblePlaces, placeTypes]);
  const nearbyPlaces = useMemo(() => mapPlaces
    .map(place => ({ place, point: placePoint(place) }))
    .filter((entry): entry is { place: Place; point: [number, number] } => Boolean(entry.point))
    .map(entry => ({ ...entry, distance: milesBetween(mapCenter, entry.point) }))
    .filter(entry => entry.distance <= 10)
    .sort((a, b) => a.distance - b.distance)
    .map(entry => entry.place), [mapPlaces, mapCenter]);
  const gigRows = useMemo(() => gigs.map(row => ({ ...row, _board: "Gigz", _href: row.id ? `/pride-work?post=${row.id}` : "/pride-work" })), [gigs]);
  const stuffRows = useMemo(() => ([
    ...gifts.map(row => ({ ...row, _board: "Giftz", _href: row.id ? `/gifting?post=${row.id}` : "/gifting" })),
    ...sells.map(row => ({ ...row, _board: "Sellz", _href: row.id ? `/sellz?post=${row.id}` : "/sellz" })),
  ]), [gifts, sells]);
  const visibleGigz = useMemo(() => gigRows.filter(row => rowMatchesQuery(row, q)), [gigRows, q]);
  const visibleStuff = useMemo(() => stuffRows.filter(row => boardKinds.has(String(row._board)) && rowMatchesQuery(row, q)), [stuffRows, boardKinds, q]);
  const visibleMizzed = useMemo(() => mizzed.filter(post => !q || `${post.title} ${post.body} ${spottedPlace(post)}`.toLowerCase().includes(q)), [mizzed, q]);
  const visibleHousing = useMemo(() => housing
    .filter(row => (!housingType || row.type === housingType) && (!housingSaved || Boolean(row.saved)) && (!housingTags.length || housingTags.every(tag => Array.isArray(row.tags) && row.tags.includes(tag))) && rowMatchesQuery(row, q))
    .map(row => ({ ...row, _board: "The HOÜS" })), [housing, housingType, housingSaved, housingTags, q]);
  const marks = useMemo<Mark[]>(() => [
    ...(showEvents ? visibleEvents.map(e => ({ key: `e-${e.id}-${e.dateStart}`, kind: "event" as const, lat: e.lat!, lng: e.lng!, item: e })) : []),
    ...(showPlaces ? placeMarks(mapPlaces) : []),
    ...(showGigz ? rowMarks(visibleGigz, "board") : []),
    ...(showStuff ? rowMarks(visibleStuff, "board") : []),
    ...(showHouz ? rowMarks(visibleHousing, "board") : []),
  ], [showEvents, showPlaces, showGigz, showStuff, showHouz, visibleEvents, mapPlaces, visibleGigz, visibleStuff, visibleHousing]);

  const openMark = useCallback((mark: Mark, target?: Element | null) => {
    if (!canOpenMapObjects) { setShowAuth(true); return; }
    setSelected(mark.key);
    setCardOriginRect(originRect(target || null));
    if (mark.kind === "event") { goOverlay("event", (mark.item as Event).id); }
    else if (mark.kind === "place") { goOverlay("place", (mark.item as Place).id); }
    else {
      const row = mark.item as MapRow;
      if (String(row._board) === "The HOÜS") {
        const postId = Number(row.id);
        if (Number.isFinite(postId)) goOverlay("houz", postId);
      }
      else {
        const kind = boardKind(row);
        const postId = Number(row.id);
        if (kind && Number.isFinite(postId)) { goOverlay(boardParam(kind), postId); }
      }
    }
  }, [canOpenMapObjects, goOverlay]);
  const openBoardRow = (row: MapRow, target?: Element | null) => openMark({ key: `board-${row._board}-${row.id}`, kind: "board", lat: Number(row.lat), lng: Number(row.lng), item: row }, target);
  const toggleStuffKind = (kind: string) => updateParams(p => {
    const next = new Set(boardKinds);
    if (next.has(kind)) next.delete(kind); else next.add(kind);
    p.set("boards", [...next].join(","));
  });
  const panelRows = (rows: MapRow[], kind: "places" | "boards" | "houz") => (
    <div className="zaydar-layer-list">
      {rows.slice(0, kind === "houz" ? 50 : 5).map((row, index) => {
        const isPlace = kind === "places";
        const title = isPlace ? String(row.name || "Place") : boardTitle(row);
        const meta = isPlace ? `${zaydarTypeLabel(String(row.type || "venue"))} · ${String(row.neighborhood || "Portland")}` : kind === "houz" ? `${(HOUSING_TYPE_LABEL[row.type as HousingType] || "Housing").replace("HAÜS", "HOÜS")} · ${Array.isArray(row.areas) && row.areas.length ? row.areas.join(", ") : "Portland"}` : `${String(row._board || "Boards")} · ${String(row.neighborhood || "Portland")}`;
        const fallback = isPlace ? directoryFallbackLogo(String(row.type)) : boardIcon(row);
        const photo = isPlace ? resolveDirectoryLogo(String(row.name), typeof row.imageUrl === "string" ? row.imageUrl : undefined) : firstImage(kind === "houz" ? row.photos : row.photoUrls) || firstImage(row.imageUrl);
        return <button type="button" className="zaydar-layer-row" key={`${kind}-${row._board || ""}-${row.id ?? index}`} onClick={event => isPlace ? openMark(placeMarks([row as Place])[0] || { key: `p-${row.id}`, kind: "place", lat: Number(row.lat), lng: Number(row.lng), item: row as Place }, event.currentTarget) : openBoardRow(row, event.currentTarget)}>
          <img src={photo || fallback} alt="" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; }} />
          <span className="zaydar-layer-row__copy"><strong>{title}</strong><small>{meta}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>;
      })}
      {!rows.length && <p className="zaydar-layer-empty" role="status">No {kind === "houz" ? "housing listings" : kind === "places" ? "nearby places" : "listings"} match these filters.</p>}
    </div>
  );
  const eventPanel = <section className="zaydar-layer-panel" aria-labelledby="map-eventz-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-eventz-title">Eventz</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Event filters">
      <button type="button" aria-pressed={timeFilter === "tonight"} onClick={() => setTimeFilter(timeFilter === "tonight" ? "default" : "tonight")}>Tonight</button>
      <button type="button" aria-pressed={timeFilter === "soon"} onClick={() => setTimeFilter(timeFilter === "soon" ? "default" : "soon")}>Soon</button>
      {eventTags.map(tag => <button type="button" key={tag} aria-pressed={eventTag === tag} onClick={() => setEventTag(eventTag === tag ? null : tag)}>{tag.replaceAll("_", " ")}</button>)}
      <button type="button" aria-pressed={timeFilter === "default" && !eventTag} onClick={() => { setTimeFilter("default"); setEventTag(null); }}>All upcoming</button>
    </div>
    {eventsLoading ? <p role="status">Loading Eventz…</p> : eventsError ? <p role="alert">Eventz could not load. <button type="button" onClick={() => void retryEvents()}>Try again</button></p> : <div className="zaydar-layer-list">
      {visibleEvents.slice(0, 5).map(event => {
        const starts = parsePacificDateTime(event.dateStart) || Date.now();
        const isToday = portlandCalendarDay(starts) === portlandCalendarDay(Date.now());
        return <button type="button" className="zaydar-layer-row" key={`${event.id}-${event.dateStart}`} onClick={click => openMark({ key: `e-${event.id}-${event.dateStart}`, kind: "event", lat: event.lat!, lng: event.lng!, item: event }, click.currentTarget)}>
          <img src={resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek)} alt="" loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = EVENT_PLACEHOLDER_PENDING; }} />
          <span className="zaydar-layer-row__copy"><strong>{event.title}</strong><small>{event.venueName}</small></span>
          <time dateTime={event.dateStart}>{!isToday && <small>{new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" }).format(starts)}</small>}{new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(starts)}</time>
          <ChevronRight size={17} aria-hidden="true" />
        </button>;
      })}
      {!visibleEvents.length && <p className="zaydar-layer-empty" role="status">No events match these filters. <button type="button" onClick={() => { setTimeFilter("default"); setEventTag(null); }}>Show upcoming events</button></p>}
    </div>}
    <details className="zaydar-layer-rsvps"><summary>Your RSVPs</summary><ZaydarUpcomingRsvps events={events} loading={eventsLoading} onSignIn={() => setShowAuth(true)} onOpen={(event,target) => openMark({key:`e-${event.id}-${event.dateStart}`,kind:"event",lat:event.lat??NaN,lng:event.lng??NaN,item:event},target)} /></details>
  </section>;
  const placesPanel = <section className="zaydar-layer-panel" aria-labelledby="map-placez-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-placez-title">Placez</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Place categories">
      {ZAYDAR_PLACE_TYPE_OPTIONS.map(type => <button type="button" key={type} aria-pressed={placeTypes.includes(type)} onClick={() => updateParams(p => p.set("placeTypes", (placeTypes.includes(type) ? placeTypes.filter(item => item !== type) : [...placeTypes, type]).join(",")))}>{zaydarTypeLabel(type)}</button>)}
    </div>
    {placesLoading ? <p>Loading Placez…</p> : placesError ? <p role="alert">Placez could not load. <button type="button" onClick={() => void retryPlaces()}>Try again</button></p> : panelRows(nearbyPlaces as MapRow[], "places")}
  </section>;
  const mizzedPanel = <section className="zaydar-layer-panel" aria-labelledby="map-mizzed-title">
    <div className="zaydar-layer-panel__heading"><small>Map drawer</small><h2 id="map-mizzed-title">Mizzed Connections</h2></div>
    {mizzedLoading ? <p role="status">Loading Mizzed Connections…</p> : mizzedError ? <p role="alert">Mizzed Connections could not load. <button type="button" onClick={() => void retryMizzed()}>Try again</button></p> : <div className="zaydar-layer-list">
      {visibleMizzed.slice(0, 5).map(post => <button type="button" className="zaydar-layer-row" key={post.id} onClick={() => canOpenMapObjects ? goOverlay("mizzed", post.id) : setShowAuth(true)}>
        <img src="/brand/family/mizzed-connection.svg" alt="" loading="lazy" />
        <span className="zaydar-layer-row__copy"><strong>{post.title || post.body.slice(0, 80)}</strong><small>{spottedPlace(post)}</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </button>)}
      {!visibleMizzed.length && <p className="zaydar-layer-empty" role="status">No Mizzed Connections match this search.</p>}
    </div>}
    <p className="zaydar-layer-location-note">Mizzed posts have no exact map location, so they appear in the drawer without pins.</p>
  </section>;
  const gigzPanel = <section className="zaydar-layer-panel" aria-labelledby="map-gigz-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-gigz-title">Gigz</h2></div>
    {gigsLoading ? <p role="status">Loading Gigz…</p> : gigsError ? <p role="alert">Gigz could not load. <button type="button" onClick={() => void retryGigs()}>Try again</button></p> : panelRows(visibleGigz, "boards")}
  </section>;
  const stuffPanel = <section className="zaydar-layer-panel" aria-labelledby="map-stuff-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-stuff-title">Stuff</h2></div>
    <div className="zaydar-layer-rail" role="group" aria-label="Stuff categories">
      {["Giftz", "Sellz"].map(kind => <button type="button" key={kind} aria-pressed={boardKinds.has(kind)} onClick={() => toggleStuffKind(kind)}>{kind}</button>)}
    </div>
    {giftsLoading || sellsLoading ? <p role="status">Loading Stuff…</p> : giftsError || sellsError ? <p role="alert">Stuff could not load. <button type="button" onClick={() => { void retryGifts(); void retrySells(); }}>Try again</button></p> : panelRows(visibleStuff, "boards")}
  </section>;
  const houzPanel = <section className="zaydar-layer-panel" aria-labelledby="map-houz-title">
    <div className="zaydar-layer-panel__heading"><small>Map layer</small><h2 id="map-houz-title">HOÜS</h2></div>
    {housingStats && <div className="zaydar-houz-stats" aria-label="HOÜS board activity"><span><strong>{housingStats.activePosts}</strong> active</span><span><strong>{housingStats.roomsOpen}</strong> rooms</span><span><strong>{housingStats.formingHouses}</strong> forming</span></div>}
    <button type="button" className="zaydar-houz-post" onClick={() => user ? updateParams(p => p.set("houzCompose", "LOOKING")) : setShowAuth(true)}>Post to HOÜS</button>
    <div className="zaydar-layer-rail zaydar-houz-actions" role="group" aria-label="Start a HOÜS post">
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "OFFERING")) : setShowAuth(true)}>Offer a room</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "LOOKING")) : setShowAuth(true)}>Find housing</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "FORMING")) : setShowAuth(true)}>Build a HOÜS</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "PM")) : setShowAuth(true)}>List a rental</button>
    </div>
    <div className="zaydar-layer-rail" role="group" aria-label="Housing types">
      {([null, "OFFERING", "LOOKING", "FORMING", "MANAGED"] as const).map(type => <button type="button" key={type || "all"} aria-pressed={housingType === type} onClick={() => setHousingType(type)}>{type === null ? "All HOÜS" : type === "OFFERING" ? "Rooms" : type === "LOOKING" ? "Looking" : type === "FORMING" ? "Forming" : "Rentals"}</button>)}
      <button type="button" aria-pressed={housingSaved} onClick={() => user ? setHousingSaved(!housingSaved) : setShowAuth(true)}>Saved</button>
    </div>
    <HousingTagFilter applied={housingTags} onApply={setHousingTags} />
    {housingLoading ? <p role="status">Loading HOÜS…</p> : housingError ? <p role="alert">HOÜS could not load. <button type="button" onClick={() => void retryHousing()}>Try again</button></p> : panelRows(visibleHousing, "houz")}
    <p className="zaydar-layer-location-note">Only listings with a saved map location have pins. Listings without coordinates still appear here.</p>
    <details className="zaydar-houz-about"><summary>How HOÜS works</summary><p>Offer a room, look for housing, form a household, or list a managed rental. You choose who to contact and nothing opens until the other person accepts.</p><ol><li>Post what you need or have.</li><li>Ask to chat, join, or waitlist.</li><li>Plan together after both sides agree.</li></ol><strong>Zaylist never handles rent, deposits, or fees.</strong></details>
  </section>;
  const layers: ZaydarLayer[] = [
    { id: "events", label: "Eventz", color: "#FF00CC", enabled: showEvents, onToggle: () => toggleLayer("hideEvents"), panel: eventPanel, viewMore: [{ label: "View more Eventz", href: "/events" }] },
    { id: "places", label: "Placez", color: "#00FFFF", enabled: showPlaces, onToggle: () => toggleLayer("hidePlaces"), panel: placesPanel, viewMore: [{ label: "View more Placez", href: "/directory" }] },
    { id: "mizzed", label: "Mizzed", color: "#FF00CC", enabled: true, panel: mizzedPanel, viewMore: [{ label: "More Mizzed", href: "/spotted" }] },
    { id: "gigz", label: "Gigz", color: "#8800FF", enabled: showGigz, onToggle: () => toggleLayer("hideGigz"), panel: gigzPanel, viewMore: [{ label: "More Gigz", href: "/pride-work" }] },
    { id: "stuff", label: "Stuff", color: "#CCFF00", enabled: showStuff, onToggle: () => toggleLayer("hideStuff"), panel: stuffPanel, viewMore: [{ label: "Giftz", href: "/gifting" }, { label: "Sellz", href: "/sellz" }] },
    { id: "houz", label: "HOÜS", color: "#00FFFF", enabled: showHouz, onToggle: () => toggleLayer("hideHouz"), panel: houzPanel, viewMore: [] },
  ];

  const sceneRows = useMemo(() => marks.map(mark => {
    const event=mark.kind==='event'?mark.item as Event:null;
    const place=mark.kind==='place'?mark.item as Place:null;
    const row=mark.item as MapRow;
    const isHouz=String(row._board)==='The HOÜS';
    const brands=event?eventBrandLogos(event,places):null;
    const color=event?zaydarEventColor(event,places):place?zaydarPlaceColor(place):boardColor(row);
    const venue=event?places.find(p=>normalizeDirectoryName(p.name)===normalizeDirectoryName(event.venueName||'')):null;
    const type=place?zaydarPlaceType(place):event?(color==='#FF0000'?'adult':venue?.type||'venue'):String(row._board||'board');
    const name=event?.title||place?.name||boardTitle(row);
    const boardLogo=isHouz?firstImage(row.photos)||FORMING_COVER:firstImage(row.photoUrls)||firstImage(row.imageUrl);
    return {kind:mark.kind,typeIcon:place||event?zaydarTypeIcon(type):boardIcon(row),type,key:mark.key,coordinates:[mark.lng,mark.lat],name,color,
      logo:isHouz?'':brands?.primary||(place?resolveDirectoryLogo(place.name,place.imageUrl)||directoryFallbackLogo(place.type):mark.kind==='event'?'/zaydar-map/icons/event.svg':boardLogo||boardIcon(row)),
      alternateLogo:brands?.alternate,
      housingModel:isHouz?String(row.type||'LOOKING'):undefined,
      neighborhoodLabel:isHouz?housingAreaLabel(row):undefined,
      avatars:isHouz?housingFaceStack(row):undefined,
      demoOpen:isHouz&&housingDemo(row),
      logoKey:brands?.directoryId?`directory-${brands.directoryId}`:place?`directory-${place.id}`:undefined,
      alternateLogoKey:brands?.alternateDirectoryId?`directory-${brands.alternateDirectoryId}`:undefined,
      eventDay:event?portlandCalendarDay(event.dateStart):undefined,
      startsAt:event?.dateStart,venueKey:event?normalizeDirectoryName(event.venueName || ""):undefined,
      time:event?new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(event.dateStart)):undefined};
  }), [marks, places]);
  const onSceneSelect=(key:string,rect?:MapSelectionRect)=>{if(!canOpenMapObjects){mapRef.current?.send('select',{key:null});setShowAuth(true);return;}if(key.startsWith('directory-')){const place=places.find(p=>p.id===Number(key.slice(10)));if(place){const community=place.type==='group'?communities.find(group=>group.sourcePlaceId===place.id):undefined;if(community){setLocation(`/z/${encodeURIComponent(community.slug)}`);return;}goOverlay('place',place.id);}return;}const mark=marks.find(m=>m.key===key);if(mark){openMark(mark);if(rect&&String((mark.item as MapRow)._board)==='The HOÜS')setCardOriginRect(rect);}};
  return <section ref={pageRef} className="living-map-page zaydar-map-demo" style={mapHeight===undefined?undefined:{height:mapHeight}} aria-label="Zaylist interactive map" onClickCapture={gateSignedOutControls}>
    <ZaydarCanvas ref={mapRef} rows={sceneRows} selected={selected} labelsEnabled={labels} viewTime={viewTimestamp} onSelect={onSceneSelect} onView={view=>setMapCenter(current => current[0] === view.center[0] && current[1] === view.center[1] ? current : view.center)} />
    <div className="zaydar-map-lockup pdx-glass-rebind" aria-label={`${regionLabel}, ${mapTimeLabel}`}>
      <strong>{regionLabel}</strong>
      <button type="button" className="zaydar-map-time" onClick={() => { const input=timeInputRef.current;if(!input)return;if(input.showPicker)input.showPicker();else input.click(); }} aria-label="Choose a future map date and time">{mapTimeLabel}</button>
      <input ref={timeInputRef} className="zaydar-map-time-input" type="datetime-local" min={dateTimeLocalValue(clockNow)} value={previewDateTime} onChange={event => setPreviewDateTime(event.target.value)} aria-label="Future map date and time" />
      {previewDateTime && <button type="button" className="zaydar-map-live" onClick={() => setPreviewDateTime("")}>Live</button>}
    </div>
    <div className="zaydar-demo-navigation pdx-glass-rebind" aria-label="Map controls">
      <button className="zaydar-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:1})} aria-label="Zoom in">+</button>
      <button className="zaydar-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:-1})} aria-label="Zoom out">−</button>
      <button className="zaydar-control-location" onClick={locateMe} aria-label="Locate me" disabled={locating}><Navigation size={18}/></button>
      <button className="zaydar-control-labels" aria-pressed={labels} onClick={()=>{setLabels(v=>!v);mapRef.current?.send('labels',{enabled:!labels});}}>Labels</button>
    </div>
    {locateError&&<p className="zaydar-demo-notice" role="status">{locateError}</p>}
    <ZaydarLayerSheet layers={layers} active={activeLayer} onActiveChange={changeLayer} />
    {(missingPlace || (eventId && !feedEvent && eventDetail.isError)) && <p className="zaydar-demo-notice" role="alert">{placesError || eventDetail.isError && !String(eventDetail.error).includes("404:") ? "This listing could not load." : "This listing is no longer available."} <button type="button" onClick={() => { if (placeId) void retryPlaces(); else void eventDetail.refetch(); }}>Retry</button> <button type="button" onClick={closeOverlays}>Back to map</button></p>}
    {eventId && !selectedEvent && (eventsLoading || eventDetail.isLoading) && <p className="zaydar-demo-notice" role="status">Loading event… <button type="button" onClick={closeOverlays}>Back to map</button></p>}
    {canOpenMapObjects && selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={closeOverlays} onEventUpdated={updateEvent} />}
    {canOpenMapObjects && selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} />}
    {canOpenMapObjects && boardOverlay && <BoardPostOverlay kind={boardOverlay.kind} postId={boardOverlay.postId} onClose={closeOverlays} />}
    {canOpenMapObjects && selectedMizzed && <SpottedDetailModal postId={selectedMizzed.id} title={selectedMizzed.title} body={selectedMizzed.body} place={spottedPlace(selectedMizzed)} kindLabel={spottedKind(selectedMizzed).label} kindColor={spottedKind(selectedMizzed).color} onClose={closeOverlays} />}
    {canOpenMapObjects && selectedHouz && <HousingPostOverlay key={selectedHouz.id} post={selectedHouz} userId={user?.id} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} onSelectPost={postId => {setCardOriginRect(null);goOverlay("houz", postId);}} />}
    {user && houzCompose && <HousingComposerOverlay initialType={houzCompose} viewerDisplayName={user.displayName} onClose={() => updateParams(p => p.delete("houzCompose"))} onPosted={postId => { updateParams(p => { p.delete("houzCompose"); clearMapOverlay(p); p.set("houz", String(postId)); }); }} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
  </section>;
}
