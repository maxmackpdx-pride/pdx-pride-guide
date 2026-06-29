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

const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

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

function buildPinIcon(days: string[], rsvpPulse = false) {
  if (typeof divIcon !== "function") return null;
  const SIZE = 22;
  const R = SIZE / 2;
  const pulseClass = rsvpPulse ? " map-pin-rsvp-pulse" : "";
  const pulseGlow = rsvpPulse ? `,0 0 22px #CCFF00,0 0 36px rgba(204,255,0,0.55)` : "";

  if (days.length === 1) {
    const color = DAY_COLORS[days[0]] || "#CCFF00";
    return divIcon({
      html: `<div class="${pulseClass.trim()}" style="width:${SIZE}px;height:${SIZE}px;background:transparent;border:3px solid ${color};border-radius:50%;box-shadow:0 0 8px ${color},0 0 16px ${color}99,0 2px 6px rgba(0,0,0,0.8)${pulseGlow};"></div>`,
      iconSize: [SIZE, SIZE],
      iconAnchor: [R, R],
      popupAnchor: [0, -R - 4],
      className: "",
    });
  }

  const n = days.length;
  const sliceAngle = (2 * Math.PI) / n;
  let paths = "";
  days.forEach((day, i) => {
    const color = DAY_COLORS[day] || "#CCFF00";
    const a0 = i * sliceAngle - Math.PI / 2;
    const a1 = a0 + sliceAngle;
    const x1 = +(R + R * Math.cos(a0)).toFixed(2);
    const y1 = +(R + R * Math.sin(a0)).toFixed(2);
    const x2 = +(R + R * Math.cos(a1)).toFixed(2);
    const y2 = +(R + R * Math.sin(a1)).toFixed(2);
    const large = sliceAngle > Math.PI ? 1 : 0;
    paths += `<path d="M${R},${R} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z" fill="${color}"/>`;
  });

  return divIcon({
    html: `<div class="${pulseClass.trim()}" style="width:${SIZE}px;height:${SIZE}px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8))${rsvpPulse ? " drop-shadow(0 0 10px rgba(204,255,0,0.75))" : ""};"><svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${paths}<circle cx="${R}" cy="${R}" r="${R - 1}" fill="none" stroke="#000" stroke-width="2"/></svg></div>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [R, R],
    popupAnchor: [0, -R - 4],
    className: "",
  });
}

function groupEventsByVenue(events: Event[]) {
  const groups: Record<string, Event[]> = {};
  events.forEach(e => {
    if (!e.lat || !e.lng) return;
    const key = `${e.lat},${e.lng}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

function UserLocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null;
  const icon = divIcon({
    html: `<div style="width:14px;height:14px;background:#19E3FF;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 14px #19E3FF,0 0 24px rgba(25,227,255,0.55);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: "",
  });
  return <Marker position={position} icon={icon} />;
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
        const days = Array.from(new Set(evts.map(e => e.dayOfWeek).filter(Boolean))) as string[];
        const hasRsvp = evts.some(e => rsvpEventIds.has(e.id));
        const icon = buildPinIcon(days, hasRsvp);
        if (!icon) return null;
        const primaryColor = DAY_COLORS[days[0]] || "#CCFF00";
        return (
          <Marker key={key} position={[lat, lng]} icon={icon}>
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

function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [position, map]);
  return null;
}

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
        className={variant === "events" ? "events-map-panel" : "home-map-panel"}
        style={{
          position: expanded ? "fixed" : "relative",
          top: expanded ? 0 : undefined,
          left: expanded ? 0 : undefined,
          right: expanded ? 0 : undefined,
          bottom: expanded ? 0 : undefined,
          zIndex: expanded ? 999 : 1,
          height: expanded ? "100vh" : undefined,
          width: "100%",
          borderBottom: expanded ? "none" : "2px solid #1a1a1a",
        }}
      >
        <style>{`
          .pdx-popup .leaflet-popup-content-wrapper { background:#0d0d0d !important; border:1.5px solid #333 !important; border-radius:0 !important; box-shadow:0 4px 24px rgba(0,0,0,0.9) !important; padding:0 !important; }
          .pdx-popup .leaflet-popup-content { margin:0 !important; width:auto !important; }
          .pdx-popup .leaflet-popup-tip-container { display:none; }
          .leaflet-popup-close-button { color:#666 !important; top:6px !important; right:8px !important; }
          .leaflet-control-attribution { background:rgba(0,0,0,0.65) !important; color:var(--text-faint) !important; font-size:9px !important; }
          .leaflet-control-attribution a { color:var(--text-meta) !important; }
          .leaflet-control-zoom a { background:#111 !important; color:#CCFF00 !important; border-color:#333 !important; }
          .leaflet-control-zoom a:hover { background:#222 !important; }
          .venue-hover-tooltip { background:#050505 !important; border:1px solid #CCFF00 !important; border-radius:0 !important; box-shadow:0 0 14px rgba(204,255,0,0.42) !important; color:#fff !important; font-family:var(--font-display); font-size:0.7rem; font-weight:900; letter-spacing:0.08em; text-transform:uppercase; padding:4px 8px !important; }
          .venue-hover-tooltip::before { border-top-color:#CCFF00 !important; }
          .venue-street-glow { filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 10px currentColor); mix-blend-mode: screen; }
        `}</style>

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
            style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
            zoomControl={true}
            attributionControl={true}
          >
            <TileLayer
              url={DARK_TILE}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={19}
              subdomains="abcd"
            />
            <MarkersLayer events={events} onSelect={onSelect} rsvpEventIds={rsvpEventIds} />
            <UserLocationMarker position={userPosition} />
            <MapFlyTo position={userPosition} />
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
            onClick={event => {
              event.stopPropagation();
              expanded ? onCollapse() : onExpand();
            }}
            data-testid={expanded ? "button-collapse-map" : "button-expand-map"}
            title={expanded ? "Collapse map" : "Expand map"}
            style={{
              position: "absolute",
              top: 10,
              right: expanded ? 60 : 10,
              zIndex: 1001,
              background: "#000",
              border: "1.5px solid #CCFF00",
              color: "#CCFF00",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-display)",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
            }}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {expanded ? "COLLAPSE" : "EXPAND"}
          </button>
        )}

        <div className={`map-legend${variant === "home" ? " map-legend--home" : ""}`} aria-label="Map key">
          <div className="map-legend-items">
            {Object.entries(DAY_COLORS).map(([day, color]) => (
              <div key={day} className="map-legend-item">
                <span
                  className="map-legend-swatch"
                  style={{ background: color, boxShadow: `0 0 8px ${color}, 2px 2px 0 rgba(0,0,0,0.7)` }}
                />
                <span className="map-legend-label">{day}</span>
              </div>
            ))}
            <div className="map-legend-item map-legend-item--multi">
              <svg width="20" height="20" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M5,5 L5,0 A5,5 0 0,1 10,5 Z" fill="#00FFFF" />
                <path d="M5,5 L10,5 A5,5 0 0,1 5,10 Z" fill="#FF6600" />
                <path d="M5,5 L5,10 A5,5 0 0,1 0,5 Z" fill="#FF00CC" />
                <path d="M5,5 L0,5 A5,5 0 0,1 5,0 Z" fill="#FF2400" />
                <circle cx="5" cy="5" r="4.5" fill="none" stroke="#000" strokeWidth="1" />
              </svg>
              <span className="map-legend-label">MULTI-DAY</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}