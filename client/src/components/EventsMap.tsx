import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import type { Event } from "@shared/schema";
import { listingKey } from "@shared/multiDayEvents";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { EventTypeTagList } from "./EventTypeTag";
import { ArrowLeft, Maximize2, Minimize2, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

import { DAY_COLORS, DAY_SORT_ORDER, EVENT_WEEK_DAYS, RSVP_COLOR } from "@shared/eventWeek";
import {
  MAP_PIN_SIZE,
  MAP_SURFACE_BG,
  LIVE_MAP_CHROME_CSS,
  mapPinHtml,
  mapPinMultiHtml,
} from "@/components/ds/mapTheme";

/** Pin color when an event has no recognizable day - neutral so it can't read as a day. */
const UNKNOWN_DAY_COLOR = "#FFFFFF";

function sortByPrideDay(days: string[]): string[] {
  return [...days].sort(
    (a, b) =>
      (DAY_SORT_ORDER[a as keyof typeof DAY_SORT_ORDER] ?? 99) -
      (DAY_SORT_ORDER[b as keyof typeof DAY_SORT_ORDER] ?? 99),
  );
}

const MAP_VIEWS = {
  events: {
    center: [45.5128, -122.6703] as [number, number],
    zoom: 14,
  },
  home: {
    center: [45.5152, -122.6784] as [number, number],
    zoom: 13,
  },
} as const;

const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const PIN_HALF = MAP_PIN_SIZE / 2;

function buildPinIcon(days: string[], rsvpPulse = false) {
  if (typeof divIcon !== "function") return null;
  const rsvpOpts = { rsvpPulse, rsvpColor: RSVP_COLOR };

  // Single-day (or unknown): black core + day border + inward only (no outer bloom).
  // Multi-day: conic rainbow + black rim. RSVP = scale pulse class only.
  if (days.length <= 1) {
    const color =
      days.length === 1
        ? DAY_COLORS[days[0] as keyof typeof DAY_COLORS] || UNKNOWN_DAY_COLOR
        : UNKNOWN_DAY_COLOR;
    return divIcon({
      html: mapPinHtml(color, rsvpOpts),
      iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
      iconAnchor: [PIN_HALF, PIN_HALF],
      popupAnchor: [0, -PIN_HALF - 4],
      className: "",
    });
  }

  return divIcon({
    html: mapPinMultiHtml(rsvpOpts),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    popupAnchor: [0, -PIN_HALF - 4],
    className: "",
  });
}

function hasMapPin(event: Event) {
  return typeof event.lat === "number" && Number.isFinite(event.lat)
    && typeof event.lng === "number" && Number.isFinite(event.lng);
}

function groupEventsByVenue(events: Event[]) {
  const groups: Record<string, Event[]> = {};
  events.forEach(e => {
    if (!hasMapPin(e)) return;
    const key = `${e.lat},${e.lng}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

function UserLocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null;
  const icon = divIcon({
    html: mapPinHtml("#19E3FF"),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    className: "",
  });
  return <Marker position={position} icon={icon} />;
}

/** Stable signature so Leaflet remounts pins when the filtered set changes. */
function selectionPinKey(events: Event[]): string {
  if (events.length === 0) return "empty";
  return events
    .map(e => `${e.id}:${e.dateStart ?? ""}`)
    .sort()
    .join("|");
}

function MarkersLayer({
  events,
  onSelect,
  rsvpEventIds,
}: {
  events: Event[];
  onSelect: (e: Event) => void;
  rsvpEventIds: Set<number>;
}) {
  useMap();
  const byVenue = useMemo(() => groupEventsByVenue(events), [events]);

  return (
    <>
      {Object.entries(byVenue).map(([key, evts]) => {
        const [lat, lng] = key.split(",").map(Number);
        const days = sortByPrideDay(Array.from(new Set(evts.map(e => e.dayOfWeek).filter(Boolean))) as string[]);
        const hasRsvp = evts.some(e => rsvpEventIds.has(e.id));
        const icon = buildPinIcon(days, hasRsvp);
        if (!icon) return null;
        const primaryColor = DAY_COLORS[days[0] as keyof typeof DAY_COLORS] || UNKNOWN_DAY_COLOR;
        // Include listing ids in the key so react-leaflet rebuilds the pin when
        // the board filter adds/removes nights at the same venue (icon + popup).
        const markerKey = `${key}:${evts.map(e => listingKey(e)).sort().join(",")}`;
        return (
          <Marker key={markerKey} position={[lat, lng]} icon={icon}>
            <Tooltip direction="top" offset={[0, -16]} opacity={1} className="venue-hover-tooltip">
              {evts[0].venueName}
            </Tooltip>
            <Popup className="pdx-popup" maxWidth={240}>
              <div style={{ background: "#0d0d0d", color: "#fff", padding: "10px 12px", fontFamily: "sans-serif", minWidth: 180 }}>
                <div style={{ color: primaryColor, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{evts[0].venueName}</div>
                {evts[0].address && <div style={{ fontSize: 11, color: "var(--text-meta)", marginBottom: 6 }}>{evts[0].address}</div>}
                {evts.map(e => {
                  const dc = DAY_COLORS[e.dayOfWeek || ""] || "#fff";
                  const typeTags = getEventTypeTagsForEvent(e);
                  return (
                    <div
                      key={listingKey(e)}
                      onClick={() => onSelect(e)}
                      style={{ fontSize: 11, color: "#aaa", padding: "5px 0", borderTop: "1px solid #1a1a1a", cursor: "pointer" }}
                    >
                      <div>
                        <span style={{ color: dc, fontWeight: 700, marginRight: 4 }}>{e.dayOfWeek}</span>
                        {e.title}
                      </div>
                      {typeTags.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <EventTypeTagList labels={typeTags} size="sm" max={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function MapResizer({ expanded }: { expanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * When board filters change, refit the map to the pins that remain so the
 * viewport matches the selection (not a stale city-wide zoom full of ghosts).
 */
function MapFitToSelection({
  events,
  selectionKey,
  defaultCenter,
  defaultZoom,
}: {
  events: Event[];
  selectionKey: string;
  defaultCenter: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    const points = events.filter(hasMapPin).map(e => [e.lat as number, e.lng as number] as [number, number]);
    // Frame Portland by default: only fit to metro-area pins so a few statewide
    // outliers don't zoom the whole state out. Outlier pins still render.
    const inMetro = ([lat, lng]: [number, number]) =>
      lat >= 45.35 && lat <= 45.70 && lng >= -122.92 && lng <= -122.42;
    const metroPoints = points.filter(inMetro);
    const fitPoints = metroPoints.length ? metroPoints : points;
    if (fitPoints.length === 0) {
      map.setView(defaultCenter, defaultZoom, { animate: true });
      return;
    }
    if (fitPoints.length === 1) {
      map.flyTo(fitPoints[0], Math.max(map.getZoom(), 14), { duration: 0.55 });
      return;
    }
    map.fitBounds(fitPoints, { padding: [48, 48], maxZoom: 15, animate: true });
  }, [selectionKey, map, defaultCenter, defaultZoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [position, map]);
  return null;
}

const EVENTS_MAP_EXTRA_CSS = `
  .pdx-popup .leaflet-popup-content-wrapper { background:#0d0d0d !important; border:1.5px solid #333 !important; border-radius:0 !important; box-shadow:0 4px 24px rgba(0,0,0,0.9) !important; padding:0 !important; }
  .pdx-popup .leaflet-popup-content { margin:0 !important; width:auto !important; }
  .pdx-popup .leaflet-popup-tip-container { display:none; }
  .leaflet-popup-close-button { color:#666 !important; top:6px !important; right:8px !important; }
  .venue-hover-tooltip { background:#050505 !important; border:1px solid #000 !important; border-radius:0 !important; box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.8) !important; outline:1px solid #CCFF00; outline-offset:-2px; color:#fff !important; font-family:var(--font-display); font-size:0.7rem; font-weight:900; letter-spacing:0.08em; text-transform:uppercase; padding:4px 8px !important; }
  .venue-hover-tooltip::before { border-top-color:#000 !important; }
  .pdx-map-live__expand{
    position:absolute; top:10px; z-index:1001;
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 10px; cursor:pointer;
    font-family:var(--font-display); font-size:0.6rem; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase;
    color:var(--lime, #CCFF00);
    background:rgba(5,5,7,.88);
    border:1px solid #000;
    box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75);
    outline:1px solid color-mix(in srgb, var(--lime, #CCFF00) 70%, #000);
    outline-offset:-2px;
  }
`;

export function MapView({
  events,
  expanded,
  onExpand,
  onCollapse,
  onSelect,
  variant = "events",
}: {
  events: Event[];
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onSelect: (e: Event) => void;
  variant?: "events" | "home";
}) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const { data: checkIns = [] } = useQuery<Array<{ eventId?: number; event_id?: number }>>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => fetch("/api/events/mine/check-ins", { credentials: "include" }).then(r => (r.ok ? r.json() : [])),
    enabled: !!user,
  });

  const rsvpEventIds = useMemo(
    () => new Set(checkIns.map(row => row.eventId ?? row.event_id).filter((id): id is number => typeof id === "number")),
    [checkIns],
  );

  // Board filters pass the already-filtered list; remount pins + refit when it changes.
  const selectionKey = useMemo(() => selectionPinKey(events), [events]);
  const legendDays = useMemo(() => {
    const present = new Set(
      events.map(e => e.dayOfWeek).filter((d): d is string => Boolean(d)),
    );
    return sortByPrideDay(Array.from(present));
  }, [events]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocateError("Could not get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {expanded && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 998, background: "#000" }}
          onClick={onCollapse}
        />
      )}
      <div
        className={
          variant === "events"
            ? "directory-map-wrap events-map-wrap"
            : "home-map-panel-wrap"
        }
        style={{
          position: expanded ? "fixed" : "relative",
          top: expanded ? 0 : undefined,
          left: expanded ? 0 : undefined,
          right: expanded ? 0 : undefined,
          bottom: expanded ? 0 : undefined,
          zIndex: expanded ? 999 : 1,
          height: expanded ? "100vh" : undefined,
          width: "100%",
        }}
      >
      <div
        className={
          variant === "events"
            ? "events-map-panel directory-map pdx-map-live pdx-map-surface"
            : "home-map-panel pdx-map-live pdx-map-surface"
        }
        style={{
          position: "relative",
          height: expanded ? "100%" : undefined,
          width: "100%",
        }}
      >
        <style>{`${LIVE_MAP_CHROME_CSS}${EVENTS_MAP_EXTRA_CSS}`}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        {/* Removed the diagonal light-shaft overlay - read as a "triangle" over the map. */}

        {expanded && (
          <button
            type="button"
            className="map-exit-button"
            onClick={event => {
              event.stopPropagation();
              onCollapse();
            }}
            data-testid="button-exit-map"
            aria-label="Back to events"
          >
            <ArrowLeft size={15} />
            <span>BACK TO EVENTS</span>
          </button>
        )}

        {mounted && (
          <MapContainer
            center={MAP_VIEWS[variant].center}
            zoom={MAP_VIEWS[variant].zoom}
            style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}
            zoomControl={true}
            attributionControl={true}
          >
            <TileLayer
              url={DARK_TILE}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={19}
              subdomains="abcd"
            />
            <MarkersLayer
              key={selectionKey}
              events={events}
              onSelect={onSelect}
              rsvpEventIds={rsvpEventIds}
            />
            <UserLocationMarker position={userPosition} />
            <MapFlyTo position={userPosition} />
            <MapFitToSelection
              events={events}
              selectionKey={selectionKey}
              defaultCenter={MAP_VIEWS[variant].center}
              defaultZoom={MAP_VIEWS[variant].zoom}
            />
            <MapResizer expanded={expanded} />
          </MapContainer>
        )}

        {variant === "home" && (
          <Link href="/events" className="home-map-all-events">
            <span>View all {events.length} events</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}

        <button
          type="button"
          className="map-locate-btn"
          onClick={e => {
            e.stopPropagation();
            locateMe();
          }}
          title="Show my location on map"
          aria-label="Show my location on map"
        >
          <Navigation size={14} />
          <span>{locating ? "LOCATING..." : "YOU"}</span>
        </button>
        {locateError && <span className="map-locate-error">{locateError}</span>}

        {variant !== "home" && (
          <button
            type="button"
            className="pdx-map-live__expand"
            onClick={event => {
              event.stopPropagation();
              expanded ? onCollapse() : onExpand();
            }}
            data-testid={expanded ? "button-collapse-map" : "button-expand-map"}
            title={expanded ? "Collapse map" : "Expand map"}
            style={{ right: expanded ? 60 : 10 }}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {expanded ? "COLLAPSE" : "EXPAND"}
          </button>
        )}

        <div className={`map-legend${variant === "home" ? " map-legend--home" : ""}`} aria-label="Map key">
          <div className="map-legend-items">
            {(legendDays.length > 0 ? legendDays : EVENT_WEEK_DAYS).map((day) => {
              const color = DAY_COLORS[day as keyof typeof DAY_COLORS] || UNKNOWN_DAY_COLOR;
              return (
                <div key={day} className="map-legend-item">
                  <span
                    className="map-legend-swatch"
                    style={{
                      background: "#000",
                      border: `3px solid ${color}`,
                      boxShadow: "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85)",
                      boxSizing: "border-box",
                    }}
                  />
                  <span className="map-legend-label">{day}</span>
                </div>
              );
            })}
            <div className="map-legend-item map-legend-item--multi">
              <span
                className="map-legend-swatch"
                style={{
                  background:
                    "conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF))",
                  border: "2px solid #000",
                  boxShadow: "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85)",
                }}
                aria-hidden="true"
              />
              <span className="map-legend-label">MULTI-DAY</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
