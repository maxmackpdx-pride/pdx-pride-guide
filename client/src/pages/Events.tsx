import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import EventModal from "../components/EventModal";
import { List, Grid, MapPin } from "lucide-react";

// THU–SUN only — no WED, no MULTI
const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#FF6600",
  SUN: "#FF2400",
};
const DAYS = ["ALL", "THU", "FRI", "SAT", "SUN"];
const TYPE_FILTERS = ["FREE", "TICKETED", "21+", "ALL AGES", "PUBLIC", "HOUSE PARTY", "SEX POSITIVE", "NUDITY OK"];

// Portland, OR center
const PDX_CENTER: [number, number] = [45.5231, -122.6765];
const PDX_ZOOM = 12;

const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_ATTR =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

/** Build a pie-slice SVG divIcon for a multi-day venue.
 *  days = array of day strings (e.g. ["THU","SAT"])
 *  Each day gets an equal arc, colored by DAY_COLORS.
 */
function buildSegmentedIcon(L: any, days: string[]) {
  const size = 18;
  const r = size / 2;
  const n = days.length;

  if (n === 1) {
    const color = DAY_COLORS[days[0]] || "#CCFF00";
    const html = `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid #000;
      border-radius:50%;
      box-shadow:0 0 8px ${color}99,0 0 2px #000;
    "></div>`;
    return L.divIcon({ html, iconSize: [size, size], iconAnchor: [r, r], className: "" });
  }

  // Build SVG pie slices
  const sliceAngle = (2 * Math.PI) / n;
  let svgPaths = "";

  days.forEach((day, i) => {
    const color = DAY_COLORS[day] || "#CCFF00";
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    const x1 = r + r * Math.cos(startAngle);
    const y1 = r + r * Math.sin(startAngle);
    const x2 = r + r * Math.cos(endAngle);
    const y2 = r + r * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    svgPaths += `<path d="M${r},${r} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${color}" />`;
  });

  const glowColors = days.map(d => DAY_COLORS[d] || "#fff").join(",");
  const html = `
    <div style="width:${size}px;height:${size}px;filter:drop-shadow(0 0 5px ${DAY_COLORS[days[0]] || "#fff"});position:relative;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
        ${svgPaths}
        <circle cx="${r}" cy="${r}" r="${r}" fill="none" stroke="#000" stroke-width="1.5"/>
      </svg>
    </div>`;

  return L.divIcon({ html, iconSize: [size, size], iconAnchor: [r, r], className: "" });
}

function MapView({ events }: { events: Event[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Init map once on mount
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    function initMap() {
      const L = (window as any).L;
      if (!L) {
        if (!cancelled) retryTimer = setTimeout(initMap, 200);
        return;
      }
      if (cancelled || !containerRef.current) return;
      if (mapRef.current) return; // already initialized

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(PDX_CENTER, PDX_ZOOM);

      L.tileLayer(DARK_TILE, {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      mapRef.current = map;

      // Invalidate after layout settles — multiple times to be sure
      setTimeout(() => { if (!cancelled) map.invalidateSize(); }, 50);
      setTimeout(() => { if (!cancelled) map.invalidateSize(); }, 300);
      setTimeout(() => { if (!cancelled) map.invalidateSize(); }, 800);
    }

    initMap();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  // Update markers whenever events change (retry until map is ready)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    function updateMarkers() {
      const L = (window as any).L;
      if (!L || !mapRef.current) {
        t = setTimeout(updateMarkers, 200);
        return;
      }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current;

    const byVenue: Record<string, Event[]> = {};
    events.forEach(e => {
      if (!e.lat || !e.lng) return;
      const key = `${e.lat},${e.lng}`;
      if (!byVenue[key]) byVenue[key] = [];
      byVenue[key].push(e);
    });

    Object.entries(byVenue).forEach(([key, evts]) => {
      const [lat, lng] = key.split(",").map(Number);
      const days = [...new Set(evts.map(e => e.dayOfWeek).filter(Boolean))] as string[];

      const icon = buildSegmentedIcon(L, days);

      const primaryColor = DAY_COLORS[days[0]] || "#CCFF00";
      const popup = L.popup({
        className: "pdx-popup",
        maxWidth: 240,
      }).setContent(`
        <div style="background:#0d0d0d;color:#fff;padding:10px 12px;border:none;font-family:sans-serif;">
          <div style="color:${primaryColor};font-weight:700;font-size:13px;margin-bottom:4px;">${evts[0].venueName}</div>
          ${evts[0].address ? `<div style="font-size:11px;color:#666;margin-bottom:6px;">${evts[0].address}</div>` : ""}
          ${evts.map(e => {
            const dc = DAY_COLORS[(e.dayOfWeek || "")] || "#fff";
            return `<div style="font-size:11px;color:#aaa;padding:3px 0;border-top:1px solid #1a1a1a;">
              <span style="color:${dc};font-weight:700;margin-right:4px;">${e.dayOfWeek}</span>
              ${e.title}
            </div>`;
          }).join("")}
        </div>
      `);

      const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      markersRef.current.push(marker);
    });
    } // end updateMarkers
    updateMarkers();
    return () => clearTimeout(t);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", background: "#0a0a0a" }}>
      <style>{`
        .pdx-popup .leaflet-popup-content-wrapper {
          background: #0d0d0d !important;
          border: 1px solid #222 !important;
          border-radius: 0 !important;
          box-shadow: 0 4px 24px #000c !important;
          padding: 0 !important;
        }
        .pdx-popup .leaflet-popup-content { margin: 0 !important; }
        .pdx-popup .leaflet-popup-tip { background: #0d0d0d !important; }
        .leaflet-popup-close-button { color: #555 !important; font-size: 16px !important; top: 6px !important; right: 8px !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.7) !important; color: #444 !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: #555 !important; }
      `}</style>
      <div ref={containerRef} className="map-container" data-testid="events-map" />
      {/* Day legend — THU/FRI/SAT/SUN only */}
      <div style={{
        position: "absolute", bottom: 12, right: 12,
        background: "rgba(0,0,0,0.88)", padding: "8px 12px",
        border: "1px solid #222", zIndex: 999,
      }}>
        {Object.entries(DAY_COLORS).map(([day, color]) => (
          <div key={day} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, background: color, borderRadius: "50%", boxShadow: `0 0 4px ${color}` }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "#888", letterSpacing: "0.08em" }}>{day}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          {/* Multi-day indicator: small segmented circle preview */}
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M4,4 L4,0 A4,4 0 0,1 8,4 Z" fill="#00FFFF"/>
            <path d="M4,4 L8,4 A4,4 0 0,1 4,8 Z" fill="#FF6600"/>
            <path d="M4,4 L4,8 A4,4 0 0,1 0,4 Z" fill="#FF00CC"/>
            <path d="M4,4 L0,4 A4,4 0 0,1 4,0 Z" fill="#FF2400"/>
            <circle cx="4" cy="4" r="4" fill="none" stroke="#000" strokeWidth="0.5"/>
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "#888", letterSpacing: "0.08em" }}>MULTI-DAY</span>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onClick, viewMode }: { event: Event; onClick: () => void; viewMode: "grid" | "list" }) {
  const types = JSON.parse(event.eventTypes || "[]") as string[];
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";
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
            {event.isClaimable && (
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
              {event.isClaimable && (
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
              {event.isClaimable && (
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

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
    <div>
      {/* Map — only mounted when map view is active */}
      {viewMode === "map" && <MapView events={filtered} />}

      {/* Filters + View Toggle */}
      <div style={{
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
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* Search bar */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
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
                width: 180,
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
          {/* View toggle */}
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
            <button
              data-testid="toggle-map-view"
              onClick={() => setViewMode("map")}
              style={{
                padding: "4px 8px", background: viewMode === "map" ? "#CCFF00" : "transparent",
                border: "none", cursor: "pointer", color: viewMode === "map" ? "#000" : "#555",
                display: "flex", alignItems: "center",
              }}
              title="Map view"
            >
              <MapPin size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Events listing — hidden in map view */}
      {viewMode !== "map" && <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
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

        <div style={{
          marginTop: 60, textAlign: "center", padding: "36px 20px",
          background: "#050505", border: "1px solid #1a1a1a",
        }}>
          <div className="display" style={{ fontSize: "1.3rem", marginBottom: 6 }}>NOT SEEING YOUR EVENT?</div>
          <div style={{ color: "#555", marginBottom: 20, fontSize: "0.85rem" }}>
            Submit it or claim an existing listing.
          </div>
          <a href="#/submit" className="btn-neon solid">Get Started →</a>
        </div>
      </div>}

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
