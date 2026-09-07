import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer } from "vaul";
import { Link } from "wouter";
import { MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Event } from "@shared/schema";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { apiRequest } from "@/lib/queryClient";
import { cartoDarkTileUrl, CARTO_ATTRIBUTION } from "@/lib/mapTiles";
import { resolveBusinessLocations, type BusinessLocation } from "@shared/businessLocations";
import { waypointIcon, waypointSize, WAYPOINT_COLOR, type WaypointId } from "@/lib/livingMapWaypoints";
import "./LivingMap.css";

type Place = {
  id: number; name: string; type: string; neighborhood?: string | null; address?: string | null;
  imageUrl?: string | null; lat?: number | null; lng?: number | null; locations?: BusinessLocation[];
};

type Mark = { key: string; kind: "event" | "place"; lat: number; lng: number; item: Event | Place };
type MapRow = Record<string, unknown> & { id?: number | string; title?: string; name?: string };
const DEFAULT_RAIL_ORDER = ["placez", "mizzed", "outz", "housing", "carpool", "boards"] as const;
type RailId = typeof DEFAULT_RAIL_ORDER[number];
const DAY: Record<string, string> = { MON: "#8800ff", TUE: "#0044ff", WED: "#ffee00", THU: "#00ffff", FRI: "#ff00cc", SAT: "#39ff14", SUN: "#ff6600" };
const PLACE_ICON: Record<string, WaypointId> = { bar: "bar", restaurant: "venue", cafe: "cafe", venue: "venue", shop: "shop", hotel: "hauz", campground: "park" };

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

function ZoomReader({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: event => onZoom(event.target.getZoom()) });
  return null;
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
  const [soon, setSoon] = useState<string | null>(null);
  const desktop = useDesktop();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [railOrder, setRailOrder] = useState<RailId[]>(() => { try { const saved = JSON.parse(localStorage.getItem("zaylist.map.rail-order") || "null"); return Array.isArray(saved) && DEFAULT_RAIL_ORDER.every(id => saved.includes(id)) ? saved : [...DEFAULT_RAIL_ORDER]; } catch { return [...DEFAULT_RAIL_ORDER]; } });
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: retryEvents } = useQuery<Event[]>({ queryKey: ["/api/events"], queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()) });
  const { data: places = [], isLoading: placesLoading, isError: placesError, refetch: retryPlaces } = useQuery<Place[]>({ queryKey: ["/api/directory"], queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()) });
  const { data: mizzed = [], isLoading: mizzedLoading } = useQuery<MapRow[]>({ queryKey: ["/api/missed-connections"], queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()) });
  const { data: housingRaw, isLoading: housingLoading } = useQuery<unknown>({ queryKey: ["/api/housing", "map"], queryFn: () => apiRequest("GET", "/api/housing").then(r => r.json()) });
  const { data: gigs = [], isLoading: gigsLoading } = useQuery<MapRow[]>({ queryKey: ["/api/gigs"], queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()) });
  const { data: gifts = [], isLoading: giftsLoading } = useQuery<MapRow[]>({ queryKey: ["/api/gifting"], queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()) });
  const { data: sells = [], isLoading: sellsLoading } = useQuery<MapRow[]>({ queryKey: ["/api/sellz"], queryFn: () => apiRequest("GET", "/api/sellz").then(r => r.json()) });
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
    const config: Record<RailId, { label: string; rows: MapRow[]; loading: boolean; href: (row: MapRow) => string }> = {
      placez: { label: "Nearby Placez", rows: visiblePlaces as MapRow[], loading: placesLoading, href: row => placePath(Number(row.id), String(row.name || "place")) },
      mizzed: { label: "Mizzed Connections", rows: mizzed, loading: mizzedLoading, href: () => "/spotted" },
      outz: { label: "OutZide Nearby", rows: [], loading: false, href: () => "/outz" },
      housing: { label: "Housing", rows: housing, loading: housingLoading, href: row => row.id ? `/the-hauz/${row.id}` : "/the-hauz" },
      carpool: { label: "Carpool", rows: [], loading: false, href: () => "/z" },
      boards: { label: "Boards · Gigz / Giftz / Sellz", rows: boardRows, loading: gigsLoading || giftsLoading || sellsLoading, href: row => String(row._href || "/z") },
    };
    const item = config[id];
    return <section className="living-map-feed-section" key={id}>
      <div className="living-map-section-head"><b>{item.label}</b><span>{item.rows.length}</span><span className="living-map-reorder"><button aria-label={`Move ${item.label} up`} onClick={() => reorder(id, -1)}>↑</button><button aria-label={`Move ${item.label} down`} onClick={() => reorder(id, 1)}>↓</button></span></div>
      {item.loading ? <p className="living-map-rail-empty">Loading…</p> : item.rows.length === 0 ? <p className="living-map-rail-empty">Nothing live nearby right now.</p> : <div className="living-map-rail">{item.rows.slice(0, 10).map((row, i) => <Link className="living-map-card place" key={`${id}-${row.id ?? i}`} href={item.href(row)}><small>{String(row._board || row.type || item.label)}</small><strong>{String(row.title || row.name || "Open listing")}</strong><em>{String(row.destination || row.neighborhood || row.time || "View details")} →</em></Link>)}</div>}
    </section>;
  };

  return <section className="living-map-page" aria-label="Zaylist living map">
    <div className="living-map-canvas">
      <MapContainer center={[45.523, -122.676]} zoom={13} minZoom={10} maxBounds={[[45.35, -122.92], [45.70, -122.42]]} className="living-map-leaflet" attributionControl>
        <TileLayer url={cartoDarkTileUrl()} attribution={CARTO_ATTRIBUTION} subdomains="abcd" maxZoom={20} />
        <ZoomReader onZoom={setZoom} />
        {marks.map(mark => {
          const chosen = selected === mark.key;
          const item = mark.item;
          const icon = mark.kind === "event"
            ? waypointIcon({ id: (item as Event).isSexPositive ? "plus" : "eventz", size: waypointSize(zoom, chosen), scoop: hour((item as Event).dateStart), color: DAY[String((item as Event).dayOfWeek || "").slice(0,3).toUpperCase()] || WAYPOINT_COLOR.eventz, selected: chosen })
            : waypointIcon({ id: PLACE_ICON[(item as Place).type] || "venue", size: waypointSize(zoom, chosen), selected: chosen });
          return <Marker key={mark.key} position={[mark.lat, mark.lng]} icon={icon} eventHandlers={{ click: () => setSelected(mark.key) }}><Tooltip direction="top">{mark.kind === "event" ? (item as Event).title : (item as Place).name}</Tooltip></Marker>;
        })}
      </MapContainer>
    </div>
    <Drawer.Root open={desktop || drawerOpen} onOpenChange={setDrawerOpen} modal={false} dismissible={!desktop}>
      <Drawer.Portal>
      <Drawer.Content className="living-map-drawer pdx-glass-rebind" aria-label="Explore the map">
      <Drawer.Title className="sr-only">Explore the map</Drawer.Title>
      <button className="living-map-handle" aria-label="Close map drawer" onClick={() => setDrawerOpen(false)}><span /></button>
      <label className="living-map-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, places, DJs…" aria-label="Search the living map" /></label>
      <div className="living-map-filter-block">
      <h2>Map Filters</h2>
      <div className="living-map-time" aria-label="Event date filters"><button className={timeFilter === "soon" ? "is-on" : ""} onClick={() => setTimeFilter("soon")}>Soon</button><button className={timeFilter === "weekend" ? "is-on" : ""} onClick={() => setTimeFilter("weekend")}>This weekend</button><button className={timeFilter === "custom" ? "is-on" : ""} onClick={() => setTimeFilter("custom")}>Custom date range</button>{timeFilter === "custom" && <span className="living-map-date-range"><label>From<input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label><label>To<input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label></span>}</div>
      <div className="living-map-chips" aria-label="Map layer filters">
        <button className={showEvents ? "is-on" : ""} onClick={() => setShowEvents(v => !v)}>Eventz</button>
        <button className={showPlaces ? "is-on cyan" : "cyan"} onClick={() => setShowPlaces(v => !v)}>Placez</button>
        <button onClick={() => setSoon("ZayDark")}>ZayDark</button>
        <button onClick={() => setSoon("Zenegades")}>Zenegades</button>
        <button onClick={() => setSoon("Afterz")}>Afterz</button>
      </div>
      </div>
      {loading && <p className="living-map-state">Loading the city…</p>}
      {failed && <div className="living-map-state">The map feed could not load. <button onClick={() => { void retryEvents(); void retryPlaces(); }}>Try again</button></div>}
      {!loading && !failed && marks.length === 0 && <p className="living-map-state">Nothing on the map matches that search.</p>}
      <div className="living-map-section-head"><b>Soon</b><span>{visibleEvents.length}</span></div>
      <div className="living-map-rail">
        {visibleEvents.slice(0, 10).map(e => <Link className="living-map-card event" key={`${e.id}-${e.dateStart}`} href={eventPath(e.id, e.title, e.dayOfWeek)} style={{ "--c": DAY[String(e.dayOfWeek || "").slice(0,3).toUpperCase()] || "#ccff00" } as React.CSSProperties}>
          {e.posterImageUrl && <img src={e.posterImageUrl} alt="" />}<span className="shade"/><small>{String(e.dayOfWeek || "").slice(0,3)} {hour(e.dateStart)} · {e.neighborhood || "Portland"}</small><strong>{e.title}</strong><em>{e.venueName}</em>
        </Link>)}
      </div>
      {railOrder.map(genericRail)}
      </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    {!desktop && !drawerOpen && <button className="living-map-handle living-map-handle--closed" aria-label="Open map drawer" onClick={() => setDrawerOpen(true)}><span /></button>}
    {soon && <div className="living-map-coming-backdrop" role="presentation" onClick={() => setSoon(null)}><div className="living-map-coming" role="dialog" aria-modal="true" aria-labelledby="living-map-coming-title" onClick={e => e.stopPropagation()}><small>Zaylist living map</small><h2 id="living-map-coming-title">{soon} is coming soon</h2><p>This layer is staying visible while we finish it. It is not active yet.</p><button autoFocus onClick={() => setSoon(null)}>Got it</button></div></div>}
  </section>;
}
