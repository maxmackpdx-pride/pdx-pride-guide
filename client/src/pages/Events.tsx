import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "../components/EventModal";
import { List, Grid, MapPin, Maximize2, Minimize2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#FF6600",
  SUN: "#FF2400",
};
const DAYS = ["ALL", "THU", "FRI", "SAT", "SUN"];
const TYPE_FILTERS = ["FREE", "TICKETED", "21+", "ALL AGES", "PUBLIC", "HOUSE PARTY", "SEX POSITIVE", "NUDITY OK"];

const PDX_CENTER: [number, number] = [45.5231, -122.6765];
const PDX_ZOOM = 12;
const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// ── Pin icon builder ────────────────────────────────────────────────────────
function buildPinIcon(days: string[]) {
  const SIZE = 22;
  const R = SIZE / 2;

  if (days.length === 1) {
    const color = DAY_COLORS[days[0]] || "#CCFF00";
    return divIcon({
      html: `<div style="width:${SIZE}px;height:${SIZE}px;background:${color};border:2.5px solid #000;border-radius:50%;box-shadow:0 0 10px ${color}bb,0 2px 6px rgba(0,0,0,0.8);"></div>`,
      iconSize: [SIZE, SIZE], iconAnchor: [R, R], popupAnchor: [0, -R - 4], className: "",
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
    html: `<div style="width:${SIZE}px;height:${SIZE}px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));"><svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${paths}<circle cx="${R}" cy="${R}" r="${R - 1}" fill="none" stroke="#000" stroke-width="2"/></svg></div>`,
    iconSize: [SIZE, SIZE], iconAnchor: [R, R], popupAnchor: [0, -R - 4], className: "",
  });
}

// ── Markers layer ───────────────────────────────────────────────────────────
function MarkersLayer({ events, onSelect }: { events: Event[]; onSelect: (e: Event) => void }) {
  useMap();
  const byVenue = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    events.forEach(e => {
      if (!e.lat || !e.lng) return;
      const key = `${e.lat},${e.lng}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [events]);

  return (
    <>
      {Object.entries(byVenue).map(([key, evts]) => {
        const [lat, lng] = key.split(",").map(Number);
        const days = Array.from(new Set(evts.map(e => e.dayOfWeek).filter(Boolean))) as string[];
        const icon = buildPinIcon(days);
        const primaryColor = DAY_COLORS[days[0]] || "#CCFF00";
        return (
          <Marker key={key} position={[lat, lng]} icon={icon}>
            <Popup className="pdx-popup" maxWidth={240}>
              <div style={{ background: "#0d0d0d", color: "#fff", padding: "10px 12px", fontFamily: "sans-serif", minWidth: 180 }}>
                <div style={{ color: primaryColor, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{evts[0].venueName}</div>
                {evts[0].address && <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{evts[0].address}</div>}
                {evts.map(e => {
                  const dc = DAY_COLORS[e.dayOfWeek || ""] || "#fff";
                  return (
                    <div key={e.id} onClick={() => onSelect(e)} style={{ fontSize: 11, color: "#aaa", padding: "5px 0", borderTop: "1px solid #1a1a1a", cursor: "pointer" }}>
                      <span style={{ color: dc, fontWeight: 700, marginRight: 4 }}>{e.dayOfWeek}</span>
                      {e.title}
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

// Fires invalidateSize after expand/collapse transition
function MapResizer({ expanded }: { expanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── Map panel — half-height by default, expands to fullscreen ──────────────
function MapView({ events, expanded, onToggleExpand, onSelect }: {
  events: Event[];
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: (e: Event) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {/* Full-screen overlay backdrop when expanded */}
      {expanded && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 998, background: "#000" }}
          onClick={onToggleExpand}
        />
      )}
      <div style={{
        position: expanded ? "fixed" : "relative",
        top: expanded ? 0 : undefined,
        left: expanded ? 0 : undefined,
        right: expanded ? 0 : undefined,
        bottom: expanded ? 0 : undefined,
        zIndex: expanded ? 999 : 1,
        height: expanded ? "100vh" : "42vh",
        width: "100%",
        borderBottom: expanded ? "none" : "2px solid #1a1a1a",
      }}>
        <style>{`
          .pdx-popup .leaflet-popup-content-wrapper { background:#0d0d0d !important; border:1.5px solid #333 !important; border-radius:0 !important; box-shadow:0 4px 24px rgba(0,0,0,0.9) !important; padding:0 !important; }
          .pdx-popup .leaflet-popup-content { margin:0 !important; width:auto !important; }
          .pdx-popup .leaflet-popup-tip-container { display:none; }
          .leaflet-popup-close-button { color:#666 !important; top:6px !important; right:8px !important; }
          .leaflet-control-attribution { background:rgba(0,0,0,0.65) !important; color:#444 !important; font-size:9px !important; }
          .leaflet-control-attribution a { color:#555 !important; }
          .leaflet-control-zoom a { background:#111 !important; color:#CCFF00 !important; border-color:#333 !important; }
          .leaflet-control-zoom a:hover { background:#222 !important; }
        `}</style>

        {mounted && (
          <MapContainer
            center={PDX_CENTER}
            zoom={PDX_ZOOM}
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
            <MarkersLayer events={events} onSelect={onSelect} />
            <MapResizer expanded={expanded} />
          </MapContainer>
        )}

        {/* Expand / collapse button */}
        <button
          onClick={onToggleExpand}
          title={expanded ? "Collapse map" : "Expand map"}
          style={{
            position: "absolute", top: 10, right: expanded ? 60 : 10, zIndex: 1001,
            background: "#000", border: "1.5px solid #CCFF00", color: "#CCFF00",
            padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            fontFamily: "var(--font-display)", fontSize: "0.6rem", letterSpacing: "0.08em",
          }}
        >
          {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {expanded ? "COLLAPSE" : "EXPAND"}
        </button>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 28, right: 12, zIndex: 1000,
          background: "rgba(0,0,0,0.92)", padding: "10px 14px",
          border: "1.5px solid #CCFF00", pointerEvents: "none",
        }}>
          {Object.entries(DAY_COLORS).map(([day, color]) => (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, background: color, borderRadius: "50%", boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", color: "#ccc", letterSpacing: "0.1em" }}>{day}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, paddingTop: 5, borderTop: "1px solid #222" }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M5,5 L5,0 A5,5 0 0,1 10,5 Z" fill="#00FFFF"/>
              <path d="M5,5 L10,5 A5,5 0 0,1 5,10 Z" fill="#FF6600"/>
              <path d="M5,5 L5,10 A5,5 0 0,1 0,5 Z" fill="#FF00CC"/>
              <path d="M5,5 L0,5 A5,5 0 0,1 5,0 Z" fill="#FF2400"/>
              <circle cx="5" cy="5" r="4.5" fill="none" stroke="#000" strokeWidth="1"/>
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", color: "#ccc", letterSpacing: "0.1em" }}>MULTI-DAY</span>
          </div>
        </div>
      </div>
    </>
  );
}

function EventCard({ event, onClick, viewMode }: { event: Event; onClick: () => void; viewMode: "grid" | "list" }) {
  const types = JSON.parse(event.eventTypes || "[]") as string[];
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const time = event.dateStart
    ? new Date(event.dateStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  if (viewMode === "list") {
    return (
      <div
        className="poster-card"
        onClick={onClick}
        data-testid={`event-card-${event.id}`}
        style={{
          display: "flex", gap: 0, alignItems: "stretch",
          borderLeft: `4px solid ${dayColor}`,
          cursor: "pointer",
        }}
      >
        {/* Flyer thumbnail */}
        {event.posterImageUrl ? (
          <div style={{
            width: 72, minWidth: 72, flexShrink: 0,
            background: "#111", overflow: "hidden",
          }}>
            <img
              src={event.posterImageUrl}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ) : (
          <div style={{
            width: 72, minWidth: 72, flexShrink: 0,
            background: "#111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: dayColor + "22", border: `1px solid ${dayColor}44` }} />
          </div>
        )}
        {/* Info */}
        <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span className="sticker" style={{ color: dayColor, borderColor: dayColor, fontSize: "0.55rem" }}>{event.dayOfWeek}</span>
            {hasPendingClaim ? (
              <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", fontSize: "0.55rem" }}>CLAIM PENDING</span>
            ) : event.isClaimable && (
              <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF", fontSize: "0.55rem" }}>CLAIM ME</span>
            )}
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
            color: "#fff", lineHeight: 1.1, marginBottom: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{event.title}</div>
          <div style={{ fontSize: "0.72rem", color: "#888" }}>{event.venueName}</div>
          <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 2 }}>{time} · {event.neighborhood}</div>
        </div>
        {/* Types */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", justifyContent: "center", flexShrink: 0 }}>
          {types.slice(0, 2).map(t => (
            <span key={t} style={{
              display: "inline-block",
              fontSize: "0.55rem", color: "#444",
              fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>{t}</span>
          ))}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="poster-card"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
      style={{ aspectRatio: "2/3", display: "flex", flexDirection: "column" }}
    >
      {/* Flyer image if available, else halftone bg */}
      {event.posterImageUrl ? (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <img
            src={event.posterImageUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Overlay gradient for readability */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.1) 100%)",
          }} />
          {/* Day stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: dayColor }} />
          {/* Info overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
              <span className="sticker" style={{ color: dayColor, borderColor: dayColor, fontSize: "0.55rem" }}>{event.dayOfWeek}</span>
              {hasPendingClaim ? (
                <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", fontSize: "0.55rem" }}>CLAIM PENDING</span>
              ) : event.isClaimable && (
                <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF", fontSize: "0.55rem" }}>CLAIM ME</span>
              )}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
              color: "#fff", lineHeight: 1.05, marginBottom: 4,
            }}>{event.title}</div>
            <div style={{ fontSize: "0.68rem", color: "#aaa" }}>{event.venueName}</div>
            <div style={{ fontSize: "0.62rem", color: "#666", marginTop: 2 }}>{time}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 5, background: dayColor }} />
          <div
            className="halftone"
            style={{
              flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: 14, background: "#0d0d0d", minHeight: 140, position: "relative",
            }}
          >
            <div style={{
              position: "absolute", top: 0, right: 0, width: 60, height: 60,
              background: `radial-gradient(circle at top right, ${dayColor}22, transparent 70%)`,
              pointerEvents: "none",
            }} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, position: "relative" }}>
              <span className="sticker" style={{ color: dayColor, borderColor: dayColor, fontSize: "0.58rem" }}>{event.dayOfWeek}</span>
              {event.ageRequirement !== "ALL_AGES" && (
                <span className="sticker" style={{ color: "#777", borderColor: "#333", fontSize: "0.58rem" }}>
                  {event.ageRequirement?.replace("_PLUS", "+").replace("ALL_AGES", "") || ""}
                </span>
              )}
              {hasPendingClaim ? (
                <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", fontSize: "0.58rem" }}>CLAIM PENDING</span>
              ) : event.isClaimable && (
                <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF", fontSize: "0.58rem" }}>CLAIM ME</span>
              )}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
              color: "#fff", lineHeight: 1.05, marginBottom: 6,
            }}>
              {event.title}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#888" }}>{event.venueName}</div>
            <div style={{ fontSize: "0.68rem", color: "#555", marginTop: 2 }}>{time} · {event.neighborhood}</div>
            {types.slice(0, 2).map(t => (
              <span key={t} style={{
                display: "inline-block", marginTop: 5,
                fontSize: "0.58rem", color: "#444",
                fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase",
              }}>{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Events() {
  const [activeDay, setActiveDay] = useState("ALL");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mapExpanded, setMapExpanded] = useState(false);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });

  const filtered = events.filter(e => {
    if (activeDay !== "ALL" && e.dayOfWeek !== activeDay) return false;
    if (activeFilters.includes("FREE") && e.admission !== "FREE") return false;
    if (activeFilters.includes("TICKETED") && e.admission !== "TICKETED") return false;
    if (activeFilters.includes("21+") && e.ageRequirement !== "21_PLUS") return false;
    if (activeFilters.includes("ALL AGES") && e.ageRequirement !== "ALL_AGES") return false;
    if (activeFilters.includes("PUBLIC") && !e.isPublic) return false;
    if (activeFilters.includes("HOUSE PARTY") && !e.isHouseParty) return false;
    if (activeFilters.includes("SEX POSITIVE") && !e.isSexPositive) return false;
    if (activeFilters.includes("NUDITY OK") && !e.nudityOk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = `${e.title} ${e.venueName} ${e.neighborhood} ${e.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div className="zine-page events-page">
      {/* Map — always visible at top, half-height by default */}
      <MapView
        events={filtered}
        expanded={mapExpanded}
        onToggleExpand={() => setMapExpanded(p => !p)}
        onSelect={setSelectedEvent}
      />

      {/* Filters + View Toggle */}
      <div className="zine-filter-bar" style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: 60, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "10px 20px",
          display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center",
        }}>
          {DAYS.map(d => (
            <button
              key={d}
              className={`filter-tag ${activeDay === d ? "active" : ""}`}
              onClick={() => setActiveDay(d)}
              data-testid={`filter-day-${d}`}
              style={activeDay === d && d !== "ALL" ? {
                color: DAY_COLORS[d], borderColor: DAY_COLORS[d],
                background: DAY_COLORS[d] + "18",
              } : {}}
            >
              {d}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: "#222", margin: "0 2px" }} />
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-tag ${activeFilters.includes(f) ? "active" : ""}`}
              onClick={() => toggleFilter(f)}
              data-testid={`filter-type-${f.replace(/[+ ]/g, "-")}`}
            >
              {f}
            </button>
          ))}
          {/* Search bar */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", marginLeft: 4 }}>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="event-search"
              style={{
                background: "#111",
                border: "1px solid #2a2a2a",
                color: "#fff",
                padding: "5px 28px 5px 10px",
                fontSize: "0.75rem",
                fontFamily: "var(--font-body)",
                outline: "none",
                width: 160,
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#CCFF00")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#555", cursor: "pointer",
                  fontSize: "0.75rem", lineHeight: 1, padding: 0,
                }}
                title="Clear search"
              >×</button>
            )}
          </div>
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* View toggle — grid / list only (map is always shown above) */}
          <div style={{ display: "flex", gap: 2, border: "1px solid #222", padding: 2 }}>
            <button
              data-testid="toggle-grid-view"
              onClick={() => setViewMode("grid")}
              style={{
                padding: "4px 8px", background: viewMode === "grid" ? "#CCFF00" : "transparent",
                border: "none", cursor: "pointer", color: viewMode === "grid" ? "#000" : "#555",
                display: "flex", alignItems: "center",
              }}
              title="Grid view"
            >
              <Grid size={13} />
            </button>
            <button
              data-testid="toggle-list-view"
              onClick={() => setViewMode("list")}
              style={{
                padding: "4px 8px", background: viewMode === "list" ? "#CCFF00" : "transparent",
                border: "none", cursor: "pointer", color: viewMode === "list" ? "#000" : "#555",
                display: "flex", alignItems: "center",
              }}
              title="List view"
            >
              <List size={13} />
            </button>
            {/* Map expand button in filter bar too */}
            <button
              data-testid="toggle-map-expand"
              onClick={() => setMapExpanded(p => !p)}
              style={{
                padding: "4px 8px", background: mapExpanded ? "#CCFF00" : "transparent",
                border: "none", cursor: "pointer", color: mapExpanded ? "#000" : "#555",
                display: "flex", alignItems: "center",
              }}
              title={mapExpanded ? "Collapse map" : "Expand map"}
            >
              <MapPin size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Events listing */}
      <div className="zine-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: "1.4rem", margin: 0 }}>{filtered.length} EVENTS</h2>
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              style={{ background: "none", border: "none", color: "#555", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)" }}
            >
              CLEAR FILTERS ×
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{
            display: viewMode === "grid" ? "grid" : "flex",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(180px, 1fr))" : undefined,
            flexDirection: "column",
            gap: 16,
          }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ height: viewMode === "grid" ? undefined : 72, aspectRatio: viewMode === "grid" ? "2/3" : undefined, background: "#111" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}>
            <p className="display" style={{ fontSize: "1.4rem" }}>NO EVENTS MATCH</p>
            <button
              onClick={() => { setActiveDay("ALL"); setActiveFilters([]); }}
              style={{ marginTop: 12, background: "none", border: "1px solid #333", color: "#888", padding: "8px 18px", cursor: "pointer", fontSize: "0.8rem" }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {filtered.map(e => (
              <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(e => (
              <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} viewMode="list" />
            ))}
          </div>
        )}

        <div className="zine-callout" style={{
          marginTop: 60, textAlign: "center", padding: "36px 20px",
          background: "#050505", border: "1px solid #1a1a1a",
        }}>
          <div className="motif events-callout-protest" style={{ backgroundImage: 'url("/motifs/pride-protest.jpg")' }} aria-hidden="true" />
          <div className="motif events-callout-badge" style={{ backgroundImage: 'url("/motifs/go-piss-girl.jpg")' }} aria-hidden="true" />
          <div className="display" style={{ fontSize: "1.3rem", marginBottom: 6 }}>NOT SEEING YOUR EVENT?</div>
          <div style={{ color: "#555", marginBottom: 20, fontSize: "0.85rem" }}>
            Submit it or claim an existing listing.
          </div>
          <a href="#/submit" className="btn-neon solid">Get Started →</a>
        </div>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
