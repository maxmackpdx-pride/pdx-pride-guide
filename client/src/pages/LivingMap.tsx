import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer } from "vaul";
import { Link } from "wouter";
import { MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Event } from "@shared/schema";
import { placePath } from "@shared/placeSlug";
import { apiRequest } from "@/lib/queryClient";
import { cartoDarkTileUrl, CARTO_ATTRIBUTION } from "@/lib/mapTiles";
import { resolveBusinessLocations } from "@shared/businessLocations";
import { waypointIcon, waypointSize, WAYPOINT_COLOR, type WaypointId } from "@/lib/livingMapWaypoints";
import { useModalA11y } from "@/hooks/useModalA11y";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import PlaceModal, { type PlaceModalOriginRect } from "@/components/PlaceModal";
import AuthModal from "@/components/AuthModal";
import type { Business } from "@/pages/Directory";
import { directoryTypeColor } from "@shared/directoryTheme";
import { directoryFallbackLogo, resolveDirectoryLogo } from "@/lib/directoryLogos";
import "./LivingMap.css";

type Place = Business;

type Mark = { key: string; kind: "event" | "place"; lat: number; lng: number; item: Event | Place };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const DEFAULT_RAIL_ORDER = ["placez", "mizzed", "outz", "housing", "carpool", "boards"] as const;
type RailId = typeof DEFAULT_RAIL_ORDER[number];
const DAY: Record<string, string> = { MON: "#8800ff", TUE: "#0044ff", WED: "#ffee00", THU: "#00ffff", FRI: "#ff00cc", SAT: "#39ff14", SUN: "#ff6600" };
const PLACE_ICON: Record<string, WaypointId> = { bar: "bar", restaurant: "venue", cafe: "cafe", venue: "venue", shop: "shop", hotel: "hauz", campground: "park" };
const MOBILE_SHEET_SNAPS = [116, 0.34, 0.52, 0.88] as const;

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

function useDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && matchMedia("(min-width:768px)").matches);
  useEffect(() => { const media = matchMedia("(min-width:768px)"); const sync = () => setDesktop(media.matches); media.addEventListener("change", sync); return () => media.removeEventListener("change", sync); }, []);
  return desktop;
}

export default function LivingMap() {
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"default" | "soon" | "weekend" | "custom">("default");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showEvents, setShowEvents] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.523, -122.676]);
  const [soon, setSoon] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [cardOriginRect, setCardOriginRect] = useState<EventModalOriginRect | PlaceModalOriginRect | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const desktop = useDesktop();
  const [mobileSnap, setMobileSnap] = useState<number | string | null>(MOBILE_SHEET_SNAPS[0]);
  const [railOrder, setRailOrder] = useState<RailId[]>(() => { try { const saved = JSON.parse(localStorage.getItem("zaylist.map.rail-order") || "null"); return Array.isArray(saved) && DEFAULT_RAIL_ORDER.every(id => saved.includes(id)) ? saved : [...DEFAULT_RAIL_ORDER]; } catch { return [...DEFAULT_RAIL_ORDER]; } });
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: places = [], isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: mizzed = [], isLoading: mizzedLoading, isError: mizzedError, refetch: retryMizzed } = useQuery<MapRow[]>({ queryKey: ["/api/missed-connections"], queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading, isError: housingError, refetch: retryHousing } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: gigs = [], isLoading: gigsLoading, isError: gigsError, refetch: retryGigs } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = [], isLoading: giftsLoading, isError: giftsError, refetch: retryGifts } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = [], isLoading: sellsLoading, isError: sellsError, refetch: retrySells } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
  const housing = Array.isArray(housingRaw) ? housingRaw as MapRow[] : (housingRaw && typeof housingRaw === "object" && Array.isArray((housingRaw as { posts?: unknown[] }).posts) ? (housingRaw as { posts: MapRow[] }).posts : []);
  const reorder = (id: RailId, delta: number) => setRailOrder(current => { const from = current.indexOf(id); const to = Math.max(0, Math.min(current.length - 1, from + delta)); const next = [...current]; next.splice(from, 1); next.splice(to, 0, id); localStorage.setItem("zaylist.map.rail-order", JSON.stringify(next)); return next; });
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
  const visiblePlaces = useMemo(() => places.filter(p => !q || `${p.name} ${p.type} ${p.neighborhood || ""}`.toLowerCase().includes(q)), [places, q]);
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
    ...gigs.map(row => ({ ...row, _board: "Gigz", _href: "/pride-work" })),
    ...gifts.map(row => ({ ...row, _board: "Giftz", _href: "/gifting" })),
    ...sells.map(row => ({ ...row, _board: "Sellz", _href: "/sellz" })),
  ];
  const genericRail = (id: RailId) => {
    const config: Record<RailId, { label: string; rows: MapRow[]; loading: boolean; error?: boolean; retry?: () => void; href: (row: MapRow) => string }> = {
      placez: { label: "Nearby Placez", rows: nearbyPlaces as MapRow[], loading: placesLoading, error: placesError, retry: () => { void retryPlaces(); }, href: row => placePath(Number(row.id), String(row.name || "place")) },
      mizzed: { label: "Mizzed Connections", rows: mizzed, loading: mizzedLoading, error: mizzedError, retry: () => { void retryMizzed(); }, href: () => "/spotted" },
      outz: { label: "OutZide Nearby", rows: [], loading: false, href: () => "/outz" },
      housing: { label: "Housing", rows: housing, loading: housingLoading, error: housingError, retry: () => { void retryHousing(); }, href: row => row.id ? `/the-hauz/${row.id}` : "/the-hauz" },
      carpool: { label: "Carpool", rows: [], loading: false, href: () => "/z" },
      boards: { label: "Boards · Gigz / Giftz / Sellz", rows: boardRows, loading: gigsLoading || giftsLoading || sellsLoading, error: gigsError || giftsError || sellsError, retry: () => { void retryGigs(); void retryGifts(); void retrySells(); }, href: row => String(row._href || "/z") },
    };
    const item = config[id];
    const railIndex = railOrder.indexOf(id);
    return <section className="living-map-feed-section" key={id}>
      <div className="living-map-section-head"><b>{item.label}</b><span>{item.rows.length}</span><span className="living-map-reorder"><button type="button" disabled={railIndex === 0} aria-label={`Move ${item.label} up`} onClick={() => reorder(id, -1)}>↑</button><button type="button" disabled={railIndex === railOrder.length - 1} aria-label={`Move ${item.label} down`} onClick={() => reorder(id, 1)}>↓</button></span></div>
      {item.loading ? <p className="living-map-rail-empty">Loading…</p> : item.error ? <p className="living-map-rail-empty" role="alert">This rail could not load. <button type="button" onClick={item.retry}>Try again</button></p> : item.rows.length === 0 ? <p className="living-map-rail-empty">Nothing live nearby right now.</p> : <div className="living-map-rail">{item.rows.slice(0, 10).map((row, i) => {
        const contents = <><small>{String(row._board || row.type || item.label)}</small><strong>{String(row.title || row.name || "Open listing")}</strong><em>{String(row.destination || row.neighborhood || row.time || "View details")} →</em></>;
        if (id === "placez") return <button type="button" className="living-map-card place" key={`${id}-${row.id ?? i}`} onClick={event => { setCardOriginRect(originRect(event.currentTarget)); setSelectedPlace(row as unknown as Place); }}>{contents}</button>;
        return <Link className="living-map-card place" key={`${id}-${row.id ?? i}`} href={item.href(row)}>{contents}</Link>;
      })}</div>}
    </section>;
  };

  const closeSoon = useCallback(() => setSoon(null), []);
  const comingDialogRef = useModalA11y({ open: Boolean(soon), enabled: Boolean(soon), onClose: closeSoon });

  return <section className="living-map-page" aria-label="Zaylist living map">
    <div className="living-map-canvas">
      <MapContainer center={[45.523, -122.676]} zoom={13} minZoom={10} maxBounds={[[45.35, -122.92], [45.70, -122.42]]} className="living-map-leaflet" attributionControl>
        <TileLayer url={cartoDarkTileUrl()} attribution={CARTO_ATTRIBUTION} subdomains="abcd" maxZoom={20} />
        <MapReader onZoom={setZoom} onCenter={setMapCenter} />
        {marks.map(mark => {
          const chosen = selected === mark.key;
          const item = mark.item;
          const icon = mark.kind === "event"
            ? waypointIcon({ id: (item as Event).isSexPositive ? "plus" : "eventz", size: waypointSize(zoom, chosen), scoop: hour((item as Event).dateStart), color: DAY[String((item as Event).dayOfWeek || "").slice(0,3).toUpperCase()] || WAYPOINT_COLOR.eventz, selected: chosen })
            : waypointIcon({
              id: PLACE_ICON[(item as Place).type] || "venue",
              size: waypointSize(zoom, chosen),
              color: directoryTypeColor((item as Place).type),
              logoUrl: resolveDirectoryLogo((item as Place).name, (item as Place).imageUrl) || directoryFallbackLogo((item as Place).type),
              selected: chosen,
            });
          return <Marker key={mark.key} position={[mark.lat, mark.lng]} icon={icon} eventHandlers={{ click: event => {
            setSelected(mark.key);
            setCardOriginRect(originRect(event.originalEvent?.target instanceof Element ? event.originalEvent.target.closest(".leaflet-marker-icon") : null));
            if (mark.kind === "event") setSelectedEvent(item as Event);
            else setSelectedPlace(item as Place);
          } }}><Tooltip direction="top">{mark.kind === "event" ? (item as Event).title : (item as Place).name}</Tooltip></Marker>;
        })}
      </MapContainer>
    </div>
    <Drawer.Root open modal={false} dismissible={false} shouldScaleBackground={false} disablePreventScroll snapPoints={desktop ? undefined : [...MOBILE_SHEET_SNAPS]} activeSnapPoint={desktop ? undefined : mobileSnap} setActiveSnapPoint={desktop ? undefined : setMobileSnap}>
      <Drawer.Portal>
      <Drawer.Content className="living-map-drawer pdx-glass-rebind pdx-liquid-overlay" aria-label="Explore the map">
      <Drawer.Title className="sr-only">Explore the map</Drawer.Title>
      <div className="living-map-drawer-controls">
      <button type="button" className="living-map-handle" aria-label={mobileSnap === MOBILE_SHEET_SNAPS[3] ? "Rest map drawer on the dock" : "Open map drawer fully"} onClick={() => setMobileSnap(mobileSnap === MOBILE_SHEET_SNAPS[3] ? MOBILE_SHEET_SNAPS[0] : MOBILE_SHEET_SNAPS[3])}><span /></button>
      <label className="living-map-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, places, DJs…" aria-label="Search the living map" /></label>
      <div className="living-map-filter-block">
      <h2>Map Filters</h2>
      <div className="living-map-time" aria-label="Event date filters"><button type="button" aria-pressed={timeFilter === "soon"} className={timeFilter === "soon" ? "is-on" : ""} onClick={() => setTimeFilter("soon")}>Soon</button><button type="button" aria-pressed={timeFilter === "weekend"} className={timeFilter === "weekend" ? "is-on" : ""} onClick={() => setTimeFilter("weekend")}>This weekend</button><button type="button" aria-pressed={timeFilter === "custom"} className={timeFilter === "custom" ? "is-on" : ""} onClick={() => setTimeFilter("custom")}>Custom date range</button>{timeFilter === "custom" && <span className="living-map-date-range"><label>From<input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label><label>To<input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label></span>}</div>
      <div className="living-map-chips" aria-label="Map layer filters">
        <button type="button" aria-pressed={showEvents} className={showEvents ? "is-on" : ""} onClick={() => setShowEvents(v => !v)}>Eventz</button>
        <button type="button" aria-pressed={showPlaces} className={showPlaces ? "is-on cyan" : "cyan"} onClick={() => setShowPlaces(v => !v)}>Placez</button>
        <button type="button" onClick={() => setSoon("ZayDark")}>ZayDark</button>
        <button type="button" onClick={() => setSoon("Zenegades")}>Zenegades</button>
        <button type="button" onClick={() => setSoon("Afterz")}>Afterz</button>
      </div>
      </div>
      </div>
      <div className="living-map-drawer-scroll">
      {loading && <p className="living-map-state">Loading the city…</p>}
      {failed && <div className="living-map-state">The map feed could not load. <button onClick={() => { void retryEvents(); void retryPlaces(); }}>Try again</button></div>}
      {!loading && !failed && marks.length === 0 && <p className="living-map-state">Nothing on the map matches that search.</p>}
      <div className="living-map-section-head"><b>Soon</b><span>{soonEvents.length}</span></div>
      <div className="living-map-rail">
        {soonEvents.slice(0, 10).map(e => <button type="button" className="living-map-card event" key={`${e.id}-${e.dateStart}`} onClick={event => { setCardOriginRect(originRect(event.currentTarget)); setSelectedEvent(e); }} style={{ "--c": DAY[String(e.dayOfWeek || "").slice(0,3).toUpperCase()] || "#ccff00" } as React.CSSProperties}>
          {e.posterImageUrl && <img src={e.posterImageUrl} alt="" />}<span className="shade"/><small>{String(e.dayOfWeek || "").slice(0,3)} {hour(e.dateStart)} · {e.neighborhood || "Portland"}</small><strong>{e.title}</strong><em>{e.venueName}</em>
        </button>)}
      </div>
      {railOrder.map(genericRail)}
      </div>
      </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    {selectedEvent && <EventModal event={selectedEvent} originRect={cardOriginRect} onClose={() => { setSelectedEvent(null); setCardOriginRect(null); }} onEventUpdated={setSelectedEvent} />}
    {selectedPlace && <PlaceModal key={selectedPlace.id} place={selectedPlace} originRect={cardOriginRect} onClose={() => { setSelectedPlace(null); setCardOriginRect(null); }} onRequireAuth={() => setShowAuth(true)} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    {soon && <div className="living-map-coming-backdrop" role="presentation" onClick={closeSoon}><div ref={comingDialogRef} tabIndex={-1} className="living-map-coming" role="dialog" aria-modal="true" aria-labelledby="living-map-coming-title" onClick={e => e.stopPropagation()}><small>Zaylist living map</small><h2 id="living-map-coming-title">{soon} is coming soon</h2><p>This layer is staying visible while we finish it. It is not active yet.</p><button onClick={closeSoon}>Got it</button></div></div>}
  </section>;
}
