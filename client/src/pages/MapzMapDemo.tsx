import {clearMapWorldFilters,scopeMapPlaceRows} from '@/lib/mapWorlds';
import { useSyncExternalStore } from "react";
import { isBoardMapPickerOpen, subscribeBoardMapPicker } from "@/lib/boardMapPickerActivity";
import MapBoardCards, {type MapBoardCardRow} from "@/components/board/MapBoardCards";
import { communityResourceMapEntries } from '@/lib/communityResourceMap';
import { Button } from "@/components/ds";
import "./AllBoards.css";
import { oneShotMapLocation } from "@/lib/oneShotMapLocation";
import { serviceIdentity, serviceWaypointLogo } from "@shared/serviceIdentity";
import { useMapzActive, useMapzCameraRecorder } from "@/components/RetainedMapzRoute";
import ResourceMapPanel from '@/components/ResourceMapPanel';
import { resourceMapKey, type ResourceMapEntry } from '@/lib/resourceMap';
import {eventNight} from '../../public/mapz-map/event-night.js';
import { DetailRoomLinkContext, type DetailRoomLinkValue } from "@/components/DetailRoomLink";
import { eventTimeLabel, eventDateLabel } from "@/lib/eventDisplay";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";


import { useLocation, useSearch } from "wouter";
import { MAPZ_PLACE_TYPE_OPTIONS, mapzTypeIcon, mapzTypeLabel } from "@/components/MapzSearchDrawer";
import MapzLayerSheet, { type MapzLayer, type MapzLayerId } from "@/components/MapzLayerSheet";
import MapWorldPanel from "@/components/MapWorldPanel";
import BoardFollowButton from "@/components/BoardFollowButton";
import { lazyWithReload } from "@/lib/lazyWithReload";
import {readMapCamera,filterWorldRows,locateWorldRow,roughDistanceMiles,WORLD_DETAIL_KEYS,type MapWorld,type WorldRow,type MapBounds} from "@/lib/mapWorlds";
import MapzUpcomingRsvps from "@/components/MapzUpcomingRsvps";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ROOMS, roomTitle } from "@/lib/rooms";
import MapzCanvas, { type MapSelectionRect, type MapzHandle } from "@/components/MapzCanvas";
import { ChevronRight, Layers, LocateFixed, Search } from "lucide-react";
import MapSwitch from "@/components/MapSwitch";
import { useAuth } from "@/context/AuthContext";


import type { CommunitySummary } from "@shared/community";
import type { Event } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { resolveBusinessLocations } from "@shared/businessLocations";
import type { EventModalOriginRect } from "@/components/EventModal";
import type { PlaceModalOriginRect } from "@/components/PlaceModal";
import { spottedKind, spottedPlace } from "@/components/SpottedCard";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import { HousingTagFilter } from "@/components/housing/HousingTagFilter";
import type { Business } from "@/pages/Directory";
import { directoryResourceName } from "@/lib/directoryResources";
import { directoryTypeColor, isPlacezType } from "@shared/directoryTheme";
import { directoryFallbackLogo, normalizeDirectoryName, resolveDirectoryLogo } from "@/lib/directoryLogos";
import { mapRecordId, clearMapOverlay } from "@/lib/mapDrawerNavigation";
import { mapCoordinates } from "@/lib/mapCoordinates";
import { stampHauzMapPoints } from "@/lib/hauzDemoPins";
import { mapListingKey, matchesMapEvent, type MapTimeFilter } from "@/lib/mapLayerFilters";
import { HOUSING_TYPE_LABEL, type HousingBoardResponse, type HousingPostView, type HousingType } from "@shared/housing";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import EventThumb from "@/components/events/EventThumb";
import { parsePacificDateTime } from "@shared/missedConnections";
import { AVATAR_EMOJI_OPTIONS, normalizeAvatarRing } from "@shared/avatarRings";
import "./LivingMap.css";
import "./MapzMapDemo.css";
import "@/components/MapzLayerSheet.css";
import "../../public/outzide-map/assets/map-continuity.css";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";

// Closed detail and composer overlays do not belong on the map boot path.
const AuthModal = lazyWithReload(() => import("@/components/AuthModal"));
const BoardPostOverlay = lazyWithReload(() => import("@/components/board/BoardPostOverlay"));
const SpottedDetailModal = lazyWithReload(() => import("@/components/SpottedDetailModal"));
const HousingPostOverlay = lazyWithReload(() => import("@/components/housing/HousingPostOverlay"));
const HousingComposerOverlay = lazyWithReload(() => import("@/components/housing/HousingComposerOverlay"));
const ResourceDetails = lazyWithReload(() => import("./Resources"));
const EventModal = lazyWithReload(() => import("@/components/EventModal"));
const PlaceModal = lazyWithReload(() => import("@/components/PlaceModal"));
const MapComposerOverlay = lazyWithReload(() => import("@/components/MapComposerOverlay"));

type Place = Business;
type BoardKind = "gig" | "gifting" | "sellz";
type Mark = { key: string; kind: "event" | "place" | "board" | "resource"; lat: number; lng: number; item: Event | Place | MapRow | ResourceMapEntry };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const EMPTY_EVENTS: Event[] = [];
const EMPTY_PLACES: Place[] = [];
const EMPTY_ROWS: MapRow[] = [];
const EMPTY_COMMUNITIES: CommunitySummary[] = [];
const FORMING_COVER = "/hausing/forming-no-place.svg";

// Preserve the adult locations already marked red in the Mapz studio snapshot.
const ADULT_VENUES = new Set(['Sanctuary Club','Hawks PDX','FANTASY','Steam Portland','Club Privata','The Velvet Rope'].map(normalizeDirectoryName));
function mapzPlaceType(place: Pick<Place,'name'|'type'>) { return ADULT_VENUES.has(normalizeDirectoryName(place.name)) ? 'adult' : place.type; }
function mapzPlaceColor(place: Pick<Place,'name'|'type'>) {
  return ADULT_VENUES.has(normalizeDirectoryName(place.name)) ? '#FF0000' : directoryTypeColor(place.type);
}
const WEEKDAY_TOKENS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
/** Day color for an event night, read from the --day-* tokens so calm mode applies. */
function nightDayColor(night: string | undefined): string | undefined {
  if (!night) return undefined;
  const weekday = new Date(`${night}T12:00:00Z`).getUTCDay();
  return getComputedStyle(document.documentElement).getPropertyValue(`--day-${WEEKDAY_TOKENS[weekday]}`).trim() || undefined;
}
function mapzEventColor(event: Event, places: Place[]) {
  const venueKey=normalizeDirectoryName(event.venueName || '');
  let tags: string[]=[];try { const parsed=JSON.parse(event.eventTypes || '[]'); if(Array.isArray(parsed))tags=parsed; } catch {}
  if(event.isSexPositive || event.nudityOk || tags.some(tag=>['SEX_POSITIVE','NUDITY_OK','KINK'].includes(tag)) || ADULT_VENUES.has(venueKey))return '#FF0000';
  const venue=places.find(place=>place.type!=='group' && normalizeDirectoryName(place.name)===venueKey);
  return venue?mapzPlaceColor(venue):directoryTypeColor('venue');
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
  const hostLogo = host ? serviceWaypointLogo(host, resolveDirectoryLogo(host.name, host.imageUrl)) : null;
  const venueKey = normalizeDirectoryName(event.venueName || "");
  const venue = places.find(place => place.type !== "group" && normalizeDirectoryName(place.name) === venueKey);
  const venueLogo = venue ? serviceWaypointLogo(venue, resolveDirectoryLogo(venue.name, venue.imageUrl)) : resolveDirectoryLogo(event.venueName || "");
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
  });
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
  const token=String(row._board)==="My Hoüz"?"--day-thu":row._board==="Mizzed"?"--day-fri":boardKind(row)==="gig"?"--day-mon":boardKind(row)==="gifting"?"--day-wed":"--day-sat";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
function boardWireColor(row: MapRow): string {
  if(String(row._board)!=="My Hoüz")return boardColor(row);
  const token=row.type==="MANAGED"?"--neon-coral":row.type==="OFFERING"?"--day-fri":row.type==="FORMING"?"--day-sat":"--day-thu";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function boardIcon(row: MapRow): string {
  if (String(row._board) === "My Hoüz") return `/mapz-map/icons/housing-${({LOOKING:"looking",FORMING:"forming",OFFERING:"offering",MANAGED:"managed"} as Record<string,string>)[String(row.type)]||"looking"}.svg`;
  if(row._board === "Mizzed")return "/mapz-map/icons/mizzed.svg";
  const kind = boardKind(row);
  if (kind === "gig") return "/mapz-map/icons/gigz.svg";
  return kind === "gifting" ? "/mapz-map/icons/giftz.svg" : "/mapz-map/icons/sellz.svg";
}

function boardTitle(row: MapRow): string {
  return String(row.displayName || row.headline || row.title || row.name || "Board listing");
}

function housingAreaLabel(row: MapRow): string {
  if (Array.isArray(row.areas)) return row.areas.filter((area): area is string => typeof area === "string").join(" · ").toUpperCase();
  return String(row.neighborhood || "PORTLAND").toUpperCase();
}

function housingDemo(row: MapRow): boolean {
  return row.isDemo === true;
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

const OVERLAY_KEYS = ["event", "place", "mizzed", "spotted", "gig", "gift", "sell", "sellz", "houz", "resource", "community"] as const;
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

export default function MapzMapDemo() {
  const routeActive = useMapzActive();
  const placementOpen = useSyncExternalStore(subscribeBoardMapPicker,isBoardMapPickerOpen,()=>false);
  const active = routeActive && !placementOpen;
  const recordCamera = useMapzCameraRecorder();
  const activity = useRef(active); activity.current=active;
  usePageSeo(roomTitle("mapz"), "Portland on one map: tonight's events, places, and posts from every room.", {skip:!routeActive});
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const updateParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    setLocation(mapHref(mutate), { replace: true, state: window.history.state });
  }, [setLocation]);
  const query = params.get("q") || "";
  const [dataReady,setDataReady]=useState(false);
  const initialCamera=useMemo(()=>readMapCamera(params),[]);
  const cameraState=useRef(initialCamera);
  const cameraWriteTimer=useRef<number>();
  useEffect(()=>()=>window.clearTimeout(cameraWriteTimer.current),[]);

  const timeFilter = readTimeFilter(params);
  const customStart = params.get("from") || "", customEnd = params.get("to") || "";
  const setTimeFilter = (value: TimeFilter) => updateParams(p => {
    if (value === "default") p.delete("when"); else p.set("when", value);
    if (value !== "custom") { p.delete("from"); p.delete("to"); }
  });
  const layerValue = params.get("layer");
  const activeLayer = layerValue === "boards" || layerValue === "stuff" ? "giftz" : ["events", "places", "rezources", "mizzed", "gigz", "giftz", "sellz", "houz"].includes(layerValue || "") ? layerValue as MapzLayerId : null;
  const changeLayer = useCallback((next: MapzLayerId | null) => {
    const current = mapSearchParams().get("layer");
    setLocation(mapHref(p => { if (next) p.set("layer", next); else p.delete("layer"); }), {
      replace: Boolean(current) || !next,
      state: window.history.state,
    });
  }, [setLocation]);
  const minePins = !!user && params.get("myPosts") === "1";
  const [pinCards,setPinCards]=useState<string[]>([]);
  const showEvents = params.get("hideEvents") !== "1", showPlaces = params.get("hidePlaces") !== "1", showResources = params.get("hideResources") !== "1";
  const showGigz = params.get("hideGigz") !== "1", showGiftz = params.get("hideGiftz") !== "1" && params.get("hideStuff") !== "1", showSellz = params.get("hideSellz") !== "1" && params.get("hideStuff") !== "1", showMizzed = params.get("hideMizzed") !== "1", showHouz = params.get("hideHouz") !== "1";
  const toggleLayer = (key: string) => updateParams(p => { if (p.get(key) === "1") p.delete(key); else p.set(key, "1"); });
  const resourceQuery = params.get('resources.q') || '';
  const resourceCategory = params.get('resources.category') || '';
  const selectedResourceKeys = (params.get('resources.ids') || '').split(',').filter(Boolean);
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
  const placeTypes = useMemo(() => placeTypesParam !== null ? placeTypesParam.split(",") : [...MAPZ_PLACE_TYPE_OPTIONS], [placeTypesParam]);
  const eventTag = params.get("tag");
  const setEventTag = (value: string | null) => updateParams(p => { if (value) p.set("tag", value); else p.delete("tag"); });
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [previewDateTime, setPreviewDateTime] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mapBounds,setMapBounds] = useState<MapBounds|null>(null);
  const composeWorldValue=params.get("compose");
  const composeWorld=(["places","mizzed","gigz","giftz","sellz"].includes(composeWorldValue||"")?composeWorldValue:null) as MapWorld|null;
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
  const [viewerPoint, setViewerPoint] = useState<{lat:number;lng:number} | null>(null);
  const [cardOriginRect, setCardOriginRect] = useState<EventModalOriginRect | PlaceModalOriginRect | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const requestedPrivateAction=["compose","houzCompose","gigz.view","giftz.view","sellz.view","mizzed.view"].map(key=>params.get(key)||"").join("|");
  useEffect(()=>{if(active && !authLoading && !user && requestedPrivateAction.replaceAll("|","").length)setShowAuth(true);},[active,authLoading,user,requestedPrivateAction]);
  const [locating, setLocating] = useState(false);
  const cancelLocation=useRef<(()=>void)|null>(null);
  useLayoutEffect(()=>{
    const stop=()=>{cancelLocation.current?.();cancelLocation.current=null;};
    if(!active){stop();setLocating(false);}
    return stop;
  },[active]);
  const [locateError, setLocateError] = useState("");
  const mapRef = useRef<MapzHandle | null>(null);
  const requestedCamera = [params.get("lat"),params.get("lng"),params.get("zoom"),params.get("pitch"),params.get("bearing")].join("|");
  useEffect(()=>{
    if(!routeActive)return;
    const restore=()=>{
      window.clearTimeout(cameraWriteTimer.current);
      const view=readMapCamera(new URLSearchParams(window.location.search));
      const current=cameraState.current;
      if(view && (!current || Math.abs(view.center[0]-current.center[0])>.00001 || Math.abs(view.center[1]-current.center[1])>.00001 || Math.abs(view.zoom-current.zoom)>.01 || Math.abs(view.pitch-current.pitch)>.01 || Math.abs(view.bearing-current.bearing)>.01)) {
        mapRef.current?.send("view",{center:view.center,zoom:view.zoom,pitch:view.pitch,bearing:view.bearing});
      }
    };
    restore();
    window.addEventListener("popstate",restore);
    return()=>window.removeEventListener("popstate",restore);
  },[routeActive,requestedCamera]);
  const pageRef = useRef<HTMLElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

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
    if(!active)return;
    const update = () => setClockNow(Date.now());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [active]);
  useLayoutEffect(() => {
    if(!active)return;
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
  }, [desktop,active]);
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocateError("Location is not available on this device."); return; }
    setLocating(true);
    setLocateError("");
    cancelLocation.current?.();
    cancelLocation.current=oneShotMapLocation(navigator.geolocation,position => {
      const point: [number, number] = [position.coords.latitude, position.coords.longitude];
      if(point[0]<45.2||point[0]>45.85||point[1]<-123.15||point[1]>-122.15){setLocateError("You’re outside this Portland metro demo.");setLocating(false);return;}
      setMapCenter(point);
      setViewerPoint({lat:point[0],lng:point[1]});
      mapRef.current?.send("locate", { coordinates: [point[1], point[0]], avatar: locationAvatar });
      setLocating(false);
    }, () => {
      setLocateError("We could not find your location.");
      setLocating(false);
    }, () => activity.current);
  }, [locationAvatar]);
  const { data: events = EMPTY_EVENTS, isPending: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], enabled:active, queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: communities = EMPTY_COMMUNITIES } = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"], enabled:active, queryFn: () => apiRequest("GET", "/api/communities").then(r => r.json()) });
  const { data: places = EMPTY_PLACES, isPending: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], enabled:active, queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const publicCommunityPlaceIds = useMemo(() => new Set(communities.filter(item => item.visibility !== "private").map(item => item.sourcePlaceId).filter(id => id != null)), [communities]);
  const resourceEntries = useMemo(() => communityResourceMapEntries(communities, places), [communities, places]);
  const visibleResources = useMemo(() => resourceEntries.filter(({ org, categories }) => {
    if (resourceCategory && !categories.some(item => item.id === resourceCategory || org.categoryIds?.includes(resourceCategory))) return false;
    return [org.name, org.desc, org.scope, org.addr, ...categories.map(item => item.name), ...(org.serviceTags || [])]
      .join(' ').toLowerCase().includes(resourceQuery.trim().toLowerCase());
  }), [resourceEntries, resourceQuery, resourceCategory]);
  const { data: housingRaw, isPending: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], enabled:active, queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: boardMapPoints = [] } = useQuery<Array<{board:string;postId:number;lat:number;lng:number;expiresAt:string;venueId:number|null}>>({queryKey:["/api/board-map-locations"],enabled:active,refetchInterval:active?30000:false,queryFn:()=>apiRequest("GET","/api/board-map-locations").then(r=>r.json())});
  const { data: mizzed = [], isPending: mizzedLoading, isError: mizzedError, refetch: retryMizzed } = useQuery<MissedConnectionPost[]>({ queryKey: ["/api/missed-connections"], enabled:active, queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: gigs = EMPTY_ROWS, isPending: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], enabled:active, queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = EMPTY_ROWS, isPending: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], enabled:active, queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = EMPTY_ROWS, isPending: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], enabled:active, queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const mineSpecs=useMemo(()=>[["gigz","/api/gigs?mine=1"],["giftz","/api/gifting/mine"],["sellz","/api/sellz/mine"],["mizzed","/api/missed-connections/mine"]] as const,[]);
  const mineQueries=useQueries({queries:mineSpecs.map(([world,url])=>({queryKey:["map-worlds-mine",world,user?.id],enabled:active&&!!user&&dataReady,queryFn:()=>apiRequest("GET",url).then(r=>r.json()) as Promise<MapRow[]>}))});
  const mineWorlds=Object.fromEntries(mineSpecs.map(([world],i)=>[world,mineQueries[i]]));
  const savedSellz=useQuery<number[]>({queryKey:["/api/sellz/saved/ids"],enabled:active&&!!user,queryFn:()=>apiRequest("GET","/api/sellz/saved/ids").then(r=>r.json())});
  const savedSellzSet=useMemo(()=>new Set(savedSellz.data||[]),[savedSellz.data]);
  useEffect(()=>{
    return queryClient.getQueryCache().subscribe(event=>{
      if(event.type==="updated" && event.action.type==="invalidate" && ["/api/gigs","/api/gifting","/api/sellz","/api/missed-connections","/api/housing"].includes(String(event.query.queryKey[0]))) {
        void queryClient.invalidateQueries({queryKey:["map-worlds-mine"]});
        void queryClient.invalidateQueries({queryKey:["/api/board-map-locations"]});
      }
    });
  },[]);
  const housing = useMemo(() => stampHauzMapPoints(Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : [])).map((row):MapRow => {
    const shared=boardMapPoints.find(point=>point.board==="houz"&&point.postId===Number(row.id));
    return shared ? {...row,lat:shared.lat,lng:shared.lng,mapPoint:shared} : {...row,lat:null,lng:null};
  }), [housingRaw,boardMapPoints]);
  const housingStats = !Array.isArray(housingRaw) && housingRaw && typeof housingRaw === "object" ? (housingRaw as HousingBoardResponse).stats : undefined;
  const goOverlay = useCallback((key: OverlayKey | null, id?: number) => {
    const hasOverlay = [...OVERLAY_KEYS,"compose","houzCompose"].some(key => mapSearchParams().has(key));
    const href=overlayHref(key,id);
    const url=new URL(href,window.location.origin);
    const world=Object.entries(WORLD_DETAIL_KEYS).find(([,detail])=>detail===key)?.[0];
    if(world)url.searchParams.set("layer",world);
    setLocation(url.pathname+url.search, { replace: hasOverlay, state: { ...window.history.state,
      mapOverlayReturn: hasOverlay ? window.history.state?.mapOverlayReturn : window.location.pathname + window.location.search,
    } });
  }, [setLocation]);
  const resourceOpener = useRef<HTMLElement | null>(null);
  const openResourceDetail = useCallback((entry: ResourceMapEntry, opener?: HTMLElement) => {
    resourceOpener.current = opener || (document.activeElement instanceof HTMLElement && document.activeElement.tagName !== "IFRAME" ? document.activeElement : null);
    const hasOverlay = [...OVERLAY_KEYS, "compose", "houzCompose"].some(key => mapSearchParams().has(key));
    setLocation(mapHref(p => {
      clearMapOverlay(p); p.set("resource", entry.org.name);
      if (entry.communitySlug) p.set("community", entry.communitySlug);
      p.set("layer", "rezources");
    }), {replace: hasOverlay, state: {...window.history.state,
      mapOverlayReturn: hasOverlay ? window.history.state?.mapOverlayReturn : window.location.pathname + window.location.search,
    }});
  }, [setLocation]);
  const resourceName = params.get("resource");
  const communitySlug = params.get("community");
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
  const closeResourceDetail = useCallback(() => {
    closeOverlays();
    requestAnimationFrame(() => {
      const target = resourceOpener.current;
      if (target?.isConnected) target.focus();
      else document.querySelector<HTMLButtonElement>('[aria-label="Search the map"]')?.focus();
      resourceOpener.current = null;
    });
  }, [closeOverlays]);
  const eventId = mapRecordId(params.get("event"), true);
  const placeId = mapRecordId(params.get("place"));
  const feedEvent = events.find(event => event.id === eventId);
  const eventDetail = useQuery<Event>({
    queryKey: ["/api/events", eventId], enabled: active && eventId !== null && !feedEvent && !eventsLoading,
    queryFn: () => apiRequest("GET", `/api/events/${eventId}`).then(r => r.json()),
  });
  const selectedEvent = eventId ? feedEvent || eventDetail.data : null;
  const selectedPlace = placeId ? places.find(place => place.id === placeId) : null;
  const houzId = mapRecordId(params.get("houz"));
  const feedHouz = houzId ? housing.find(post => Number(post.id) === houzId) as HousingPostView | undefined : undefined;
  const houzDetail = useQuery<HousingPostView>({
    queryKey: ["/api/housing", houzId], enabled: active && houzId !== null && !feedHouz,
    queryFn: async () => { const response = await fetch(`/api/housing/${houzId}`, { credentials: "include" }); if (!response.ok) throw new Error("Not found"); return response.json(); },
  });
  const selectedHouz = feedHouz || houzDetail.data;
  const mizzedId = mapRecordId(params.get("mizzed") || params.get("spotted"));
  const mizzedDetail=useQuery<MissedConnectionPost>({queryKey:["/api/missed-connections",mizzedId,user?.id],enabled:active&&mizzedId!==null,queryFn:()=>apiRequest("GET",`/api/missed-connections/${mizzedId}`).then(r=>r.json())});
  const selectedMizzed = mizzedId ? mizzedDetail.data || mizzed.find(post => post.id === mizzedId) : null;
  const boardKey = (["gig", "gift", "sell", "sellz"] as const).find(key => mapRecordId(params.get(key)) !== null);
  const boardOverlay = boardKey ? { kind: boardFromParam(boardKey)!, postId: mapRecordId(params.get(boardKey))! } : null;
  // Board 36: a sheet opened on the map links back to its own room.
  const boardRoom = boardOverlay ? ROOMS[boardOverlay.kind === "gig" ? "gigz" : boardOverlay.kind === "gifting" ? "giftz" : "sellz"] : null;
  const detailRoomLink: DetailRoomLinkValue =
    selectedEvent ? { room: ROOMS.eventz.name, href: `/events/${selectedEvent.id}` }
    : selectedPlace ? { room: ROOMS.placez.name, href: `/directory/${selectedPlace.id}` }
    : boardOverlay && boardRoom ? { room: boardRoom.name, href: `${boardRoom.route}?post=${boardOverlay.postId}` }
    : selectedMizzed ? { room: "MIZZED", href: `${ROOMS.mizzed.route}?post=${selectedMizzed.id}` }
    : selectedHouz ? { room: ROOMS.hauz.name, href: `${ROOMS.hauz.route}?post=${selectedHouz.id}` }
    : null;
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
  // The local seed can be months old. Keep two real, unmodified listings as
  // explicit demo examples without changing the live map's time filters.
  const demoEventIds = useMemo(() => {
    if (window.location.pathname !== "/map-demo" || timeFilter !== "default" || eventTag || previewDateTime) return new Set<number>();
    return new Set(["badlands", "sanctuary"].flatMap(venue => {
      const example = events.find(event => event.venueName?.toLowerCase().includes(venue) && mapCoordinates(event.lat,event.lng));
      return example ? [example.id] : [];
    }));
  }, [events,timeFilter,eventTag,previewDateTime]);
  const visibleEvents = useMemo(() => events.filter(e => {
    if (!mapCoordinates(e.lat, e.lng)) return false;
    if (q && !`${e.title} ${e.venueName} ${e.neighborhood || ""}`.toLowerCase().includes(q)) return false;
    return demoEventIds.has(e.id) || matchesMapEvent(e, timeFilter, eventTag, customStart, customEnd, viewTimestamp);
  }).sort((a, b) => (parsePacificDateTime(a.dateStart) || 0) - (parsePacificDateTime(b.dateStart) || 0)), [events, q, eventTag, timeFilter, customStart, customEnd, viewTimestamp, demoEventIds]);
  const locatedWorlds = useMemo(()=>{
    const source:Record<MapWorld,MapRow[]>={places:places.filter(p=>isPlacezType(p.type)&&!directoryResourceName(p)) as MapRow[],mizzed:mizzed as unknown as MapRow[],gigz:gigs,giftz:gifts,sellz:sells};
    const board:Record<MapWorld,string>={places:"",mizzed:"Mizzed",gigz:"Gigz",giftz:"Giftz",sellz:"Sellz"};
    return Object.fromEntries((Object.keys(source) as MapWorld[]).map(world=>{
      const rows=params.get(`${world}.view`)==="mine" ? mineWorlds[world]?.data||[] : source[world];
      return [world,rows.map(row=>{
        if(world==="places") {
          const points=placeMarks([row as Place]);
          return {...row,lat:points[0]?.lat,lng:points[0]?.lng,_mapPoints:points,locationLabel:row.neighborhood||"Confirmed address"};
        }
        const mapPoint=boardMapPoints.find(point=>point.board===world && point.postId===Number(row.id));
        const located:MapRow=mapPoint?{...row,mapPoint,lat:mapPoint.lat,lng:mapPoint.lng,locationLabel:"Placed by poster"}:{...row,lat:null,lng:null,locationLabel:"Not on the map"};
        const distance=located.lat!=null&&located.lng!=null
          ? `${roughDistanceMiles(viewerPoint || {lat:mapCenter[0],lng:mapCenter[1]},{lat:Number(located.lat),lng:Number(located.lng)})}${viewerPoint ? "" : " from map center"}` : "";
        return {...located,locationLabel:distance ? `${located.locationLabel} · ${distance}` : located.locationLabel,_board:board[world]};
      })];
    })) as unknown as Record<MapWorld,WorldRow[]>;
  },[places,mizzed,gigs,gifts,sells,mineQueries[0].data,mineQueries[1].data,mineQueries[2].data,mineQueries[3].data,params,boardMapPoints,viewerPoint,mapCenter]);
  const filteredWorlds=useMemo(()=>Object.fromEntries((Object.keys(locatedWorlds) as MapWorld[]).map(world=>[world,filterWorldRows(locatedWorlds[world],world,params,savedSellzSet)])) as Record<MapWorld,WorldRow[]>,[locatedWorlds,params,savedSellzSet]);
  const mapPlaces=useMemo(()=>scopeMapPlaceRows(filteredWorlds.places,placeTypes,publicCommunityPlaceIds,place=>mapzPlaceType(place as Place)) as unknown as Place[],[filteredWorlds,placeTypes,publicCommunityPlaceIds]);
  const visibleHousing = useMemo(() => housing
    .filter(row => (!housingType || row.type === housingType || (housingType === "FORMING" && row.type === "LOOKING" && row.openToHaus === true)) && (!housingSaved || Boolean(row.saved)) && (!housingTags.length || housingTags.every(tag => Array.isArray(row.tags) && row.tags.includes(tag))) && rowMatchesQuery(row, q))
    .map(row => ({ ...row, _board: "My Hoüz", locationLabel: row.lat != null && row.lng != null
      ? `${row.mapPoint ? "Shared map point" : "Approximate area"} · ${roughDistanceMiles(viewerPoint || {lat:mapCenter[0],lng:mapCenter[1]},{lat:Number(row.lat),lng:Number(row.lng)})}${viewerPoint ? "" : " from map center"}` : row.mapPoint ? "Shared map point" : "Approximate area" })), [housing, housingType, housingSaved, housingTags, q, viewerPoint, mapCenter]);
  const marks = useMemo<Mark[]>(() => [
    ...(!minePins && showEvents ? visibleEvents.map(e => ({ key: `e-${e.id}-${e.dateStart}`, kind: "event" as const, lat: e.lat!, lng: e.lng!, item: e })) : []),
    ...(!minePins && showPlaces ? placeMarks(mapPlaces) : []),
    ...(!minePins && showResources ? visibleResources.flatMap(entry => entry.locations.flatMap((location, index) => {
      const key = resourceMapKey(entry.org.name, index, entry.communitySlug);
      return selectedResourceKeys.length && !selectedResourceKeys.includes(key) && !selectedResourceKeys.includes(resourceMapKey(entry.org.name, index)) ? [] : [{ key, kind: 'resource' as const, lat: location.lat, lng: location.lng, item: entry }];
    })) : []),
    ...((minePins || showGigz) ? rowMarks(filteredWorlds.gigz, "board") : []),
    ...((minePins || showMizzed) ? rowMarks(filteredWorlds.mizzed, "board") : []),
    ...((minePins || showGiftz) ? rowMarks(filteredWorlds.giftz, "board") : []),
    ...((minePins || showSellz) ? rowMarks(filteredWorlds.sellz, "board") : []),
    ...((minePins || showHouz) ? rowMarks(visibleHousing, "board") : []),
  ].filter(mark=>!minePins || (mark.kind==="board" && Boolean((mark.item as MapRow).isMine || (mark.item as MapRow).userId===user?.id || (mark.item as any).author?.userId===user?.id))), [minePins,user?.id,showEvents, showPlaces, showResources, showGigz, showGiftz, showSellz, showMizzed, showHouz, visibleEvents, mapPlaces, visibleResources, selectedResourceKeys.join(","), filteredWorlds, visibleHousing]);

  const openMark = useCallback((mark: Mark, target?: Element | null) => {
    setSelected(mark.key);
    setCardOriginRect(originRect(target || null));
    if (mark.kind === "resource") { openResourceDetail(mark.item as ResourceMapEntry); }
    else if (mark.kind === "event") { goOverlay("event", (mark.item as Event).id); }
    else if (mark.kind === "place") { goOverlay("place", (mark.item as Place).id); }
    else {
      const row = mark.item as MapRow;
      if (String(row._board) === "My Hoüz") {
        const postId = Number(row.id);
        if (Number.isFinite(postId)) goOverlay("houz", postId);
      }
      else if (row._board === "Mizzed") { goOverlay("mizzed", Number(row.id)); }
      else {
        const kind = boardKind(row);
        const postId = Number(row.id);
        if (kind && Number.isFinite(postId)) { goOverlay(boardParam(kind), postId); }
      }
    }
  }, [goOverlay, openResourceDetail]);
  const openBoardRow = (row: MapRow, target?: Element | null) => openMark({ key: mapListingKey(row._board,row.id), kind: "board", lat: Number(row.lat), lng: Number(row.lng), item: row }, target);
  const panelRows = (rows: MapRow[], kind: "places" | "boards" | "houz") => (
    <div className="mapz-layer-list">
      {rows.slice(0, kind === "houz" ? 50 : 5).map((row, index) => {
        const isPlace = kind === "places";
        const title = isPlace ? String(row.name || "Place") : boardTitle(row);
        const meta = isPlace ? `${mapzTypeLabel(String(row.type || "venue"))} · ${String(row.neighborhood || "Portland")}` : kind === "houz" ? `${(HOUSING_TYPE_LABEL[row.type as HousingType] || "Housing")} · ${row.locationLabel}` : `${String(row._board || "Boards")} · ${String(row.locationLabel || "Approximate area")}`;
        const fallback = isPlace ? serviceIdentity(row as Place)?.icon || directoryFallbackLogo(String(row.type)) : boardIcon(row);
        const photo = isPlace ? serviceWaypointLogo(row as Place, resolveDirectoryLogo(String(row.name), typeof row.imageUrl === "string" ? row.imageUrl : undefined)) : firstImage(kind === "houz" ? row.photos : row.photoUrls) || firstImage(row.imageUrl);
        return <button type="button" className="mapz-layer-row" key={`${kind}-${row._board || ""}-${row.id ?? index}`} onClick={event => isPlace ? openMark(placeMarks([row as Place])[0] || { key: `p-${row.id}`, kind: "place", lat: Number(row.lat), lng: Number(row.lng), item: row as Place }, event.currentTarget) : openBoardRow(row, event.currentTarget)}>
          <img className={isPlace ? "mapz-layer-row__company-mark" : undefined} src={photo || fallback} alt="" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; }} />
          <span className="mapz-layer-row__copy"><strong>{title}</strong><small>{meta}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>;
      })}
      {!rows.length && <p className="mapz-layer-empty" role="status">No {kind === "houz" ? "housing listings" : kind === "places" ? "nearby places" : "listings"} match these filters.</p>}
    </div>
  );
  const eventPanel = <section className="mapz-layer-panel" aria-labelledby="map-eventz-title">
    <div className="mapz-layer-panel__heading"><small>Map layer</small><h2 id="map-eventz-title">Eventz</h2></div>
    <div className="mapz-layer-rail" role="group" aria-label="Event filters">
      <button type="button" aria-pressed={timeFilter === "tonight"} onClick={() => setTimeFilter(timeFilter === "tonight" ? "default" : "tonight")}>Tonight</button>
      <button type="button" aria-pressed={timeFilter === "soon"} onClick={() => setTimeFilter(timeFilter === "soon" ? "default" : "soon")}>Soon</button>
      {eventTags.map(tag => <button type="button" key={tag} aria-pressed={eventTag === tag} onClick={() => setEventTag(eventTag === tag ? null : tag)}>{tag.replaceAll("_", " ")}</button>)}
      <button type="button" aria-pressed={timeFilter === "default" && !eventTag} onClick={() => { setTimeFilter("default"); setEventTag(null); }}>All upcoming</button>
    </div>
    {(timeFilter!=="default"||eventTag) && <div className="map-applied-filters" aria-label="Applied event filters">{timeFilter!=="default"&&<button onClick={()=>setTimeFilter("default")} aria-label="Remove date filter">{timeFilter} ×</button>}{eventTag&&<button onClick={()=>setEventTag(null)} aria-label="Remove event type filter">{eventTag.replaceAll("_"," ")} ×</button>}<button onClick={()=>{setTimeFilter("default");setEventTag(null);}}>Clear all</button></div>}
    {demoEventIds.size>0 && <p className="mapz-layer-location-note">Demo examples use saved event listings and their original dates.</p>}
    {eventsError && <p role="status">Eventz could not refresh.{events.length > 0 ? " Showing the last loaded events." : ""} <button type="button" onClick={() => void retryEvents()}>Try again</button></p>}
    {eventsLoading && !events.length ? <p role="status">Loading Eventz…</p> : eventsError && !events.length ? null : <div className="mapz-layer-list">
      {visibleEvents.slice(0, 5).map(event => {
        const starts = parsePacificDateTime(event.dateStart) || Date.now();
        const isToday = portlandCalendarDay(starts) === portlandCalendarDay(Date.now());
        return <button type="button" className="mapz-layer-row" key={`${event.id}-${event.dateStart}`} onClick={click => openMark({ key: `e-${event.id}-${event.dateStart}`, kind: "event", lat: event.lat!, lng: event.lng!, item: event }, click.currentTarget)}>
          <EventThumb src={resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek)} day={event.dayOfWeek} />
          <span className="mapz-layer-row__copy"><strong>{event.title}</strong><small>{event.venueName}</small></span>
          <time dateTime={event.dateStart}>{!isToday && <small>{eventDateLabel(event.dateStart)}</small>}{eventTimeLabel(event.dateStart)}</time>
          <ChevronRight size={17} aria-hidden="true" />
        </button>;
      })}
      {!visibleEvents.length && <p className="mapz-layer-empty" role="status">No events match these filters. <button type="button" onClick={() => { setTimeFilter("default"); setEventTag(null); }}>Show upcoming events</button></p>}
    </div>}
    <details className="mapz-layer-rsvps"><summary>Your RSVPs</summary><MapzUpcomingRsvps events={events} loading={eventsLoading} onSignIn={() => setShowAuth(true)} onOpen={(event,target) => openMark({key:`e-${event.id}-${event.dateStart}`,kind:"event",lat:event.lat??NaN,lng:event.lng??NaN,item:event},target)} /></details>
  </section>;
  const openComposer=(world:MapWorld)=>{
    if(!user){setShowAuth(true);return;}
    setLocation(mapHref(p=>{clearMapOverlay(p);p.delete("houzCompose");p.set("compose",world);p.set("layer",world);}),{state:{...window.history.state,mapOverlayReturn:window.location.pathname+window.location.search}});
  };
  const worldPanels=Object.fromEntries((["places","mizzed","gigz","giftz","sellz"] as MapWorld[]).map(world=>{
    const isMine=params.get(`${world}.view`)==="mine";
    const state={places:[placesLoading,placesError,retryPlaces],mizzed:[mizzedLoading,mizzedError,retryMizzed],gigz:[gigsLoading,gigsError,retryGigs],giftz:[giftsLoading,giftsError,retryGifts],sellz:[sellsLoading,sellsError,retrySells]}[world];
    const rows=world==="places"?mapPlaces as unknown as WorldRow[]:filteredWorlds[world];
    return [world,<MapWorldPanel key={world} world={world} rows={rows} allRows={locatedWorlds[world]} bounds={mapBounds} params={params} setParam={(key,value)=>updateParams(p=>{if(value)p.set(key,value);else p.delete(key);})} onClearFilters={()=>updateParams(p=>{clearMapWorldFilters(p,world);})} onCreate={()=>openComposer(world)} selectedId={mapRecordId(params.get(WORLD_DETAIL_KEYS[world]))} loading={isMine?mineWorlds[world]?.isLoading:Boolean(state[0])} error={isMine?mineWorlds[world]?.isError:Boolean(state[1])} retry={()=>{if(isMine)void mineWorlds[world]?.refetch();else void (state[2] as ()=>unknown)();}} onOpen={(row,target)=>world==="places"?openMark(placeMarks([row as Place])[0]||{key:`p-${row.id}`,kind:"place",lat:NaN,lng:NaN,item:row as Place},target):openBoardRow(row,target)}>
      {world==="places" && <div className="mapz-layer-rail" role="group" aria-label="Place categories">{MAPZ_PLACE_TYPE_OPTIONS.map(type=><button key={type} aria-pressed={placeTypes.includes(type)} onClick={()=>updateParams(p=>p.set("placeTypes",(placeTypes.includes(type)?placeTypes.filter(item=>item!==type):[...placeTypes,type]).join(",")))}>{mapzTypeLabel(type)}</button>)}</div>}
    </MapWorldPanel>];
  })) as Record<MapWorld,React.ReactNode>;
  const houzPanel = <section className="mapz-layer-panel" aria-labelledby="map-houz-title">
    <div className="mapz-layer-panel__heading"><small>Map layer</small><h2 id="map-houz-title">My Hoüz</h2></div>
    <BoardFollowButton board="houz" />
    {housingStats && <div className="mapz-houz-stats" aria-label="My Hoüz board activity"><span><strong>{housingStats.activePosts}</strong> active</span><span><strong>{housingStats.roomsOpen}</strong> rooms</span><span><strong>{housingStats.formingHouses}</strong> forming</span></div>}
    <button type="button" className="mapz-houz-post" onClick={() => user ? updateParams(p => p.set("houzCompose", "LOOKING")) : setShowAuth(true)}>Post to My Hoüz</button>
    <div className="mapz-layer-rail mapz-houz-actions" role="group" aria-label="Start a My Hoüz post">
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "OFFERING")) : setShowAuth(true)}>Offer a room</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "LOOKING")) : setShowAuth(true)}>Find housing</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "FORMING")) : setShowAuth(true)}>Build a Hoüz</button>
      <button type="button" onClick={() => user ? updateParams(p => p.set("houzCompose", "PM")) : setShowAuth(true)}>List a rental</button>
    </div>
    <div className="mapz-layer-rail" role="group" aria-label="Housing types">
      {([null, "OFFERING", "LOOKING", "FORMING", "MANAGED"] as const).map(type => <button type="button" key={type || "all"} aria-pressed={housingType === type} onClick={() => setHousingType(type)}>{type === null ? "All My Hoüz" : type === "OFFERING" ? "Rooms" : type === "LOOKING" ? "Looking" : type === "FORMING" ? "Forming" : "Rentals"}</button>)}
      <button type="button" aria-pressed={housingSaved} onClick={() => user ? setHousingSaved(!housingSaved) : setShowAuth(true)}>Saved</button>
    </div>
    <HousingTagFilter applied={housingTags} onApply={setHousingTags} />
    {housingError && <p role="status">My Hoüz could not refresh.{housing.length > 0 ? " Showing the last loaded listings." : ""} <button type="button" onClick={() => void retryHousing()}>Try again</button></p>}
    {housingLoading && !housing.length ? <p role="status">Loading My Hoüz…</p> : housingError && !housing.length ? null : panelRows(visibleHousing, "houz")}
    <p className="mapz-layer-location-note">Only listings with a saved map location have pins. Listings without coordinates still appear here.</p>
    <details className="mapz-houz-about"><summary>How My Hoüz works</summary><p>Offer a room, look for housing, form a household, or list a managed rental. You choose who to contact and nothing opens until the other person accepts.</p><ol><li>Post what you need or have.</li><li>Ask to chat, join, or waitlist.</li><li>Plan together after both sides agree.</li></ol><strong>Zaylist never handles rent, deposits, or fees.</strong></details>
  </section>;
  const layers: MapzLayer[] = [
    { id: "events", label: ROOMS.eventz.nav, color: ROOMS.eventz.accent, enabled: showEvents, onToggle: () => toggleLayer("hideEvents"), panel: eventPanel, viewMore: [{ label: "View more Eventz", href: "/events" }] },
    { id:"places",label:ROOMS.placez.nav,color:ROOMS.placez.accent,enabled:showPlaces,onToggle:()=>toggleLayer("hidePlaces"),panel:worldPanels.places,viewMore:[{label:"Browse all Placez",href:"/directory"}] },
    { id:'rezources',label:'NEEDZ',color:'var(--neon-yellow)',enabled:showResources,onToggle:()=>toggleLayer('hideResources'),
      panel:<ResourceMapPanel entries={resourceEntries} onOpenEntry={openResourceDetail} bounds={mapBounds} query={resourceQuery} category={resourceCategory}
        selectedKeys={selectedResourceKeys} onClearSelection={()=>updateParams(p=>p.delete('resources.ids'))}
        onQuery={value=>updateParams(p=>{if(value)p.set('resources.q',value);else p.delete('resources.q');p.delete('resources.ids');})}
        onCategory={value=>updateParams(p=>{if(value)p.set('resources.category',value);else p.delete('resources.category');p.delete('resources.ids');})} />,
      viewMore:[{label:'Browse all NEEDZ',href:'/needz'}] },
    { id:"mizzed",label:ROOMS.mizzed.nav,color:ROOMS.mizzed.accent,enabled:showMizzed,onToggle:()=>toggleLayer("hideMizzed"),panel:worldPanels.mizzed,viewMore:[{label:"Browse all Mizzed",href:"/mizzed"}] },
    { id:"gigz",label:ROOMS.gigz.nav,color:"var(--room-gigz-ink)",enabled:showGigz,onToggle:()=>toggleLayer("hideGigz"),panel:worldPanels.gigz,viewMore:[{label:"Browse all Gigz",href:"/gigz"}] },
    { id:"giftz",label:ROOMS.giftz.nav,color:ROOMS.giftz.accent,enabled:showGiftz,onToggle:()=>toggleLayer("hideGiftz"),panel:worldPanels.giftz,viewMore:[{label:"Browse all Giftz",href:"/giftz"}] },
    { id:"sellz",label:ROOMS.sellz.nav,color:ROOMS.sellz.accent,enabled:showSellz,onToggle:()=>toggleLayer("hideSellz"),panel:worldPanels.sellz,viewMore:[{label:"Browse all Sellz",href:"/sellz"}] },
    { id: "houz", label: ROOMS.hauz.nav, color: ROOMS.hauz.accent, enabled: showHouz, onToggle: () => toggleLayer("hideHouz"), panel: houzPanel, viewMore: [{ label: "Browse My Hoüz", href: "/boardz?board=housing" }] },
  ];

  useAttendanceSummariesLive(active&&dataReady);
  const {data:attendance={}}=useQuery<Record<number,{count:number;preview:Array<{initials:string;photoUrl?:string|null}>}>>({queryKey:["/api/events/attendance-summaries"],enabled:active&&dataReady,queryFn:()=>apiRequest("GET","/api/events/attendance-summaries").then(r=>r.json()),refetchInterval:active?60000:false});
  // Day colors are tokens; re-read them after calm mode flips the class on <html>.
  const [tokenEpoch, setTokenEpoch] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setTokenEpoch(n => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const sceneRows = useMemo(() => {
    const pinCyan=getComputedStyle(document.documentElement).getPropertyValue("--day-thu").trim();
    return marks.map(mark => {
    if (mark.kind === 'resource') {
      const entry = mark.item as ResourceMapEntry;
      const category = entry.categories[0];
      const token = category.color.match(/var\((--[^)]+)\)/)?.[1];
      const color = token ? getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#CCFF00' : '#CCFF00';
      return { key:mark.key, kind:'resource', waypointFamily:'rezources', type:'service', typeIcon:serviceIdentity(entry.org)?.icon || mapzTypeIcon('service'),
        coordinates:[mark.lng,mark.lat], name:entry.org.name, color,
        waypointLogo:serviceWaypointLogo(entry.org, entry.org.logo) || '/mapz-map/icons/types/service.svg',
        logo:serviceWaypointLogo(entry.org, entry.org.logo) || '/mapz-map/icons/types/service.svg', locationLabel:entry.org.scope };
    }
    const event=mark.kind==='event'?mark.item as Event:null;
    const place=mark.kind==='place'?mark.item as Place:null;
    const row=mark.item as MapRow;
    const isHouz=String(row._board)==='My Hoüz';
    const brands=event?eventBrandLogos(event,places):null;
    const color=event?mapzEventColor(event,places):place?mapzPlaceColor(place):boardColor(row);
    const connectionEvent=row._board==='Mizzed'?events.find(e=>e.id===Number(row.eventId)):undefined;
    const linkedBoard=Boolean((row.mapPoint as any)?.venueId);
    const venueName=event?.venueName||connectionEvent?.venueName||String(row.eventVenue||row.venueHint||row.placeName||(row._board==='Gigz'?row.location:'')||'');
    const linkedId=Number((row.mapPoint as any)?.venueId);
    const venue=event||linkedBoard?places.find(p=>
      (linkedBoard&&Number.isFinite(linkedId)&&linkedId===p.id)||
      (venueName&&normalizeDirectoryName(p.name)===normalizeDirectoryName(venueName))):undefined;
    const venuePoint=venue?placeMarks([venue]).sort((a,b)=>Math.hypot(a.lat-mark.lat,a.lng-mark.lng)-Math.hypot(b.lat-mark.lat,b.lng-mark.lng))[0]:undefined;
    const venueAnchor=venue&&venuePoint?{key:`directory-${venue.id}`,coordinates:[venuePoint.lng,venuePoint.lat],name:venue.name,
      color:mapzPlaceColor(venue),type:mapzPlaceType(venue),typeIcon:serviceIdentity(venue)?.icon || mapzTypeIcon(mapzPlaceType(venue)),
      waypointLogo:serviceWaypointLogo(venue, resolveDirectoryLogo(venue.name,venue.imageUrl)),logo:''}:undefined;
    const type=place?mapzPlaceType(place):event?(color==='#FF0000'?'adult':venue?.type||'venue'):String(row._board||'board');
    const name=event?.title||place?.name||boardTitle(row);
    const boardLogo=isHouz?firstImage(row.photos)||FORMING_COVER:firstImage(row.photoUrls)||firstImage(row.imageUrl);
    return {pinCyan,wireColor:boardWireColor(row),boardPin:mark.kind==='board',expiresAt:(row.mapPoint as any)?.expiresAt,venueAnchor,createdAt:row.createdAt,closesAt:row.closesAt,status:row.status,waypointLogo:place?serviceWaypointLogo(place, resolveDirectoryLogo(place.name,place.imageUrl)):undefined,waypointFamily:isHouz?"houz":place?"places":row._board==="Mizzed"?"mizzed":row._board==="Gigz"?"gigz":row._board==="Giftz"?"giftz":row._board==="Sellz"?"sellz":undefined,locationLabel:row.locationLabel,kind:mark.kind,typeIcon:place?serviceIdentity(place)?.icon || mapzTypeIcon(type):event?serviceIdentity(venue || {name:venueName})?.icon || mapzTypeIcon(type):boardIcon(row),type,key:mark.key,coordinates:[mark.lng,mark.lat],name,color,
      logo:isHouz?'':brands?.primary||(place?serviceWaypointLogo(place, resolveDirectoryLogo(place.name,place.imageUrl))||directoryFallbackLogo(place.type):mark.kind==='event'?'/mapz-map/icons/event.svg':boardLogo||boardIcon(row)),
      alternateLogo:brands?.alternate,
      housingModel:undefined,
      neighborhoodLabel:isHouz?housingAreaLabel(row):undefined,
      avatars:isHouz?housingFaceStack(row):event?attendance[event.id]?.preview.map(person=>({url:person.photoUrl||"",initial:person.initials,background:color,ring:""})):undefined,
      avatarTotal:event?attendance[event.id]?.count:undefined,
      demoOpen:event?demoEventIds.has(event.id):isHouz&&housingDemo(row),
      logoKey:brands?.directoryId?`directory-${brands.directoryId}`:place?`directory-${place.id}`:undefined,
      alternateLogoKey:brands?.alternateDirectoryId?`directory-${brands.alternateDirectoryId}`:undefined,
      eventDay:event?portlandCalendarDay(event.dateStart):undefined,
      eventNight:event?eventNight(parsePacificDateTime(event.dateStart)??NaN):undefined,
      dayColor:event?nightDayColor(eventNight(parsePacificDateTime(event.dateStart)??NaN)):undefined,
      startsAt:event?.dateStart,venueKey:event?normalizeDirectoryName(event.venueName || ""):undefined,
      time:event?eventTimeLabel(event.dateStart):undefined};
  }); }, [marks, places, events, demoEventIds, attendance, tokenEpoch]);
  // Board 49: the status line says how many holograms are up tonight. No badge on the pin.
  const tonightCount = useMemo(() => { const night = eventNight(viewTimestamp); return sceneRows.filter(row => row.kind === "event" && row.eventNight === night).length; }, [sceneRows, viewTimestamp]);
  const onSceneSelect=(key:string,rect?:MapSelectionRect)=>{if(key.startsWith('r-')){const mark=marks.find(item=>item.key===key);if(mark?.kind==='resource')openResourceDetail(mark.item as ResourceMapEntry);return;}if(key.startsWith('directory-')){const place=places.find(p=>p.id===Number(key.slice(10)));if(place){const community=place.type==='group'?communities.find(group=>group.sourcePlaceId===place.id):undefined;if(community){const entry=resourceEntries.find(item=>item.communitySlug===community.slug);if(entry){openResourceDetail(entry);return;}}goOverlay('place',place.id);}return;}const mark=marks.find(m=>m.key===key);if(mark){openMark(mark);if(rect&&String((mark.item as MapRow)._board)==='My Hoüz')setCardOriginRect(rect);}};
  useEffect(()=>{
    const key=marks.find(mark=>{
      if(mark.kind==="resource"){const entry=mark.item as ResourceMapEntry;return communitySlug ? entry.communitySlug===communitySlug : entry.org.name===resourceName;}
      if(mark.kind==="place")return Number((mark.item as Place).id)===placeId;
      if(mark.kind==="event")return Number((mark.item as Event).id)===eventId;
      const row=mark.item as MapRow;
      const key=row._board==="Mizzed"?"mizzed":row._board==="My Hoüz"?"houz":boardKind(row)?boardParam(boardKind(row)!):"";
      return key && Number(row.id)===mapRecordId(params.get(key));
    })?.key||null;
    setSelected(key);
  },[marks,params,placeId,eventId,resourceName,communitySlug]);
  const openMapSearch = () => {
    // Events have no search box; Placez does. A layer that has one keeps it.
    if (!activeLayer || activeLayer === "events" || activeLayer === "houz") changeLayer("places");
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".mapz-layer-sheet input[type=search]")?.focus());
  };
  return <section ref={pageRef} className="living-map-page mapz-map-demo" data-map="mapz" style={mapHeight===undefined?undefined:{height:mapHeight}} aria-label="Zaylist interactive map">
    <MapzCanvas active={active} onBrowse={()=>changeLayer(activeLayer || "places")} onBoot={()=>setDataReady(true)} initialCamera={initialCamera} ref={mapRef} rows={sceneRows} onBoardPins={setPinCards} selected={selected} labelsEnabled={labels} viewTime={viewTimestamp} onSelect={onSceneSelect} onCluster={(world,keys,bounds,zoom)=>{
      if(!["places","rezources","mizzed","gigz","giftz","sellz"].includes(world))return;
      if(zoom<16.8){mapRef.current?.send("fit",{bounds});return;}
      const ids=world==='rezources' ? keys.join(',') : marks.filter(mark=>keys.includes(mark.key)).map(mark=>(mark.item as MapRow).id).join(',');
      updateParams(p=>{p.set("layer",world);p.set(`${world}.ids`,ids);});
    }} onView={view=>{
      if(!activity.current)return;
      recordCamera(view);
      cameraState.current=view;
      try { sessionStorage.setItem("mapz.lastCamera", JSON.stringify({lat:view.center[0],lng:view.center[1],zoom:view.zoom,pitch:view.pitch,bearing:view.bearing})); } catch { /* Browsing still works without storage. */ }
      setMapBounds(view.bounds);setMapCenter(current => current[0] === view.center[0] && current[1] === view.center[1] ? current : view.center);
      window.clearTimeout(cameraWriteTimer.current);
      cameraWriteTimer.current=window.setTimeout(()=>{if(activity.current)updateParams(p=>{p.set("lat",view.center[0].toFixed(5));p.set("lng",view.center[1].toFixed(5));p.set("zoom",view.zoom.toFixed(2));p.set("pitch",view.pitch.toFixed(2));p.set("bearing",view.bearing.toFixed(2));});},500);
    }} />
    <div className="mapz-map-lockup pdx-glass-rebind" aria-label={`${regionLabel}, ${mapTimeLabel}${tonightCount ? `, ${tonightCount} tonight` : ""}`}>
      <strong>{regionLabel}</strong>
      <button type="button" className="mapz-map-time" onClick={() => { const input=timeInputRef.current;if(!input)return;if(input.showPicker)input.showPicker();else input.click(); }} aria-label="Choose a future map date and time">{mapTimeLabel}</button>
      <input ref={timeInputRef} className="mapz-map-time-input" type="datetime-local" min={dateTimeLocalValue(clockNow)} value={previewDateTime} onChange={event => setPreviewDateTime(event.target.value)} aria-label="Future map date and time" />
      {tonightCount > 0 && <span className="mapz-map-tonight">{tonightCount} TONIGHT</span>}
      {previewDateTime && <button type="button" className="mapz-map-live" onClick={() => setPreviewDateTime("")}>Live</button>}
    </div>
    <MapSwitch current="mapz" />
    {/* Board 42: one rack on both maps. Search, layers, locate; then zoom; then the map's own slot. */}
    <div className="mapz-demo-navigation pdx-glass-rebind" aria-label="Map controls">
      <button type="button" className="mapz-control-icon" onClick={openMapSearch} aria-label="Search the map" title="Search"><Search size={20} aria-hidden="true"/></button>
      <button type="button" className="mapz-control-icon" onClick={()=>changeLayer(activeLayer?null:"events")} aria-label={activeLayer?"Close map drawer":"Open map drawer"} title="Layers" aria-expanded={activeLayer!==null}><Layers size={20} aria-hidden="true"/></button>
      <button className="mapz-control-location" onClick={locateMe} aria-label="Locate me" title="Locate me" aria-busy={locating} disabled={locating}><LocateFixed size={22} aria-hidden="true"/></button>
      <span className="mapz-control-gap" aria-hidden="true" />
      <button className="mapz-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:1})} aria-label="Zoom in" title="Zoom in">+</button>
      <button className="mapz-control-zoom" onClick={()=>mapRef.current?.send('zoom',{delta:-1})} aria-label="Zoom out" title="Zoom out">−</button>
      <span className="mapz-control-gap" aria-hidden="true" />
      <button type="button" className="mapz-control-tonight" aria-pressed={timeFilter === "tonight"} onClick={() => setTimeFilter(timeFilter === "tonight" ? "default" : "tonight")} title="Tonight only">Tonight</button>
      <button className="mapz-control-labels" title="Show map labels" aria-label="Show map labels" aria-pressed={labels} onClick={()=>{setLabels(v=>!v);mapRef.current?.send('labels',{enabled:!labels});}}>Labels</button>
    </div>
    {locateError&&<p className="mapz-demo-notice" role="status">{locateError}</p>}
    <MapzLayerSheet minePanel={<><p>{marks.length?`${marks.length} active ${marks.length===1?"pin":"pins"}`:"No active pins. Open your posts to place one."}</p>{marks.map(mark=><button className="mapz-my-postings-row" type="button" key={mark.key} onClick={()=>setPinCards([mark.key])}>{boardTitle(mark.item as MapRow)}<ChevronRight size={16}/></button>)}</>} minePins={minePins} onMinePins={()=>user?updateParams(p=>{if(minePins)p.delete("myPosts");else p.set("myPosts","1");}):setShowAuth(true)} layers={layers} active={activeLayer} onActiveChange={changeLayer} />
    {pinCards.length>0 && <MapBoardCards rows={marks.filter(mark=>pinCards.includes(mark.key)).map(mark=>({key:mark.key,row:mark.item as MapRow,category:({"My Hoüz":"housing",Mizzed:"mizzed",Gigz:"gigz",Giftz:"giftz",Sellz:"sellz"} as const)[(mark.item as MapRow)._board as "Gigz"]} as MapBoardCardRow))} onClose={()=>setPinCards([])} onRequireAuth={()=>{setPinCards([]);setShowAuth(true);}} onOpen={(key,target)=>{setPinCards([]);const mark=marks.find(m=>m.key===key);if(mark)openMark(mark,target);}}/>}
    {(missingPlace || (eventId && !feedEvent && eventDetail.isError)) && <p className="mapz-demo-notice" role="alert">{placesError || eventDetail.isError && !String(eventDetail.error).includes("404:") ? "This listing could not load." : "This listing is no longer available."} <button type="button" onClick={() => { if (placeId) void retryPlaces(); else void eventDetail.refetch(); }}>Retry</button> <button type="button" onClick={closeOverlays}>Back to map</button></p>}
    {eventId && !selectedEvent && (eventsLoading || eventDetail.isLoading) && <p className="mapz-demo-notice" role="status">Loading event… <button type="button" onClick={closeOverlays}>Back to map</button></p>}
    {routeActive && <Suspense fallback={<p className="ab-detail-status" role="status">Opening card… <Button variant="outline" accent="cyan" type="button" onClick={closeOverlays}>Back to map</Button></p>}>
    <DetailRoomLinkContext.Provider value={detailRoomLink}>
    {(resourceName || communitySlug) && <ResourceDetails embeddedDetail={{name:resourceName || "", communitySlug:communitySlug || undefined}} onEmbeddedClose={closeResourceDetail} />}
    {selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={closeOverlays} onEventUpdated={updateEvent} />}
    {selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} />}
    {boardOverlay && <BoardPostOverlay presentation="eventz" kind={boardOverlay.kind} postId={boardOverlay.postId} onClose={closeOverlays} />}
    {mizzedId && !selectedMizzed && <p className="mapz-demo-notice" role={mizzedDetail.isError?"alert":"status"}>{mizzedDetail.isError?"This connection is unavailable or could not load.":"Loading connection…"} <button onClick={()=>void mizzedDetail.refetch()}>Retry</button> <button onClick={closeOverlays}>Back to map</button></p>}
    {selectedMizzed && <SpottedDetailModal presentation="eventz" isDemo={selectedMizzed.isDemo} key={selectedMizzed.id} isMine={selectedMizzed.isMine} status={selectedMizzed.status} postId={selectedMizzed.id} title={selectedMizzed.title} body={selectedMizzed.body} place={spottedPlace(selectedMizzed)} kindLabel={spottedKind(selectedMizzed).label} kindColor={spottedKind(selectedMizzed).color} onClose={closeOverlays} />}
    {selectedHouz && <HousingPostOverlay presentation="eventz" key={selectedHouz.id} post={selectedHouz} userId={user?.id} originRect={cardOriginRect} onClose={closeOverlays} onRequireAuth={() => setShowAuth(true)} onSelectPost={postId => {setCardOriginRect(null);goOverlay("houz", postId);}} />}
    </DetailRoomLinkContext.Provider>
    {user && houzCompose && <HousingComposerOverlay initialType={houzCompose} viewerDisplayName={user.displayName} onClose={() => updateParams(p => p.delete("houzCompose"))} onPosted={postId => { updateParams(p => { p.delete("houzCompose"); clearMapOverlay(p); p.set("houz", String(postId)); }); }} />}
    {user && composeWorld && <MapComposerOverlay key={composeWorld} world={composeWorld} onClose={closeOverlays} onPosted={id=>{void queryClient.invalidateQueries({queryKey:["map-worlds-mine"]});setLocation(mapHref(p=>{p.delete("compose");clearMapOverlay(p);p.set(WORLD_DETAIL_KEYS[composeWorld],String(id));p.set("layer",composeWorld);}),{replace:true,state:window.history.state});}}/>}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
    </Suspense>}
  </section>;
}
