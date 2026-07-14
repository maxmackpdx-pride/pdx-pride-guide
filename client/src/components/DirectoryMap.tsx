import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatGrandOpeningDate, isGrandOpeningActive } from "@shared/grandOpening";

type Business = {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  address: string | null;
  neighborhood: string | null;
  website?: string | null;
  instagram?: string | null;
  hours?: string | null;
  phone?: string | null;
  isNew?: boolean;
  grandOpeningDate?: string | null;
  createdAt?: string;
  lat: number | null;
  lng: number | null;
};

export const MAP_TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
  nonprofit: "#FFFFFF",
  healthcare: "#FF00CC",
  realestate: "#1A4DFF",
};

/** CSS backgrounds for legend swatches (solid or gradient neon). */
export const MAP_TYPE_SWATCH: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
  nonprofit: "conic-gradient(#FF2400,#FF6600,#FFEE00,#39FF14,#00FFFF,#0044FF,#8800FF,#FF00CC,#FF2400)",
  healthcare: "linear-gradient(135deg,#FF00CC 0%,#FF7AE0 48%,#FFFFFF 100%)",
  realestate: "linear-gradient(135deg,#0A1F8C 0%,#1A4DFF 48%,#FFFFFF 100%)",
};

export const MAP_TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
  healthcare: "Health & Care",
  realestate: "Real Estate",
};

/** Legend order for the directory map key. */
export const MAP_KEY_TYPES = [
  "bar",
  "restaurant",
  "cafe",
  "venue",
  "service",
  "shop",
  "hotel",
  "nonprofit",
  "healthcare",
  "realestate",
] as const;

const TYPE_COLORS = MAP_TYPE_COLORS;
const TYPE_LABELS = MAP_TYPE_LABELS;

function MapInvalidateSize({ enabled = true }: { enabled?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      map.invalidateSize({ animate: false });
    };
    const timers = [0, 120, 320, 720].map(ms => window.setTimeout(refresh, ms));
    const container = map.getContainer();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => refresh())
        : null;
    observer?.observe(container);
    refresh();
    return () => {
      timers.forEach(window.clearTimeout);
      observer?.disconnect();
    };
  }, [enabled, map]);
  return null;
}

function buildRainbowPin() {
  return divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:conic-gradient(#FF2400,#FF6600,#FFEE00,#39FF14,#00FFFF,#0044FF,#8800FF,#FF00CC,#FF2400);box-shadow:0 0 10px rgba(255,255,255,0.7),0 2px 6px rgba(0,0,0,0.8);border:2px solid #000;"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14], className: "",
  });
}
function buildPin(color: string) {
  return divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #000;box-shadow:0 0 8px ${color}99"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function DirectoryPopup({ biz, accent }: { biz: Business; accent: string }) {
  const address = [biz.address, biz.neighborhood].filter(Boolean).join(" · ");
  const categoryLabel = TYPE_LABELS[biz.type] || biz.type;
  const grandOpening = isGrandOpeningActive(biz.grandOpeningDate);
  const grandDate = grandOpening ? formatGrandOpeningDate(biz.grandOpeningDate) : null;

  return (
    <div
      className="pdx-dir-popup__card"
      style={{
        border: `2px solid ${accent}`,
        boxShadow: `0 0 24px -14px ${accent}99`,
        background: "#050505",
        color: "#fff",
        padding: "14px 16px",
        fontFamily: "var(--font-body, sans-serif)",
        minWidth: 200,
        maxWidth: 260,
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 700,
          fontSize: "0.625rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: accent,
          border: `2px solid ${accent}`,
          borderRadius: 3,
          padding: "4px 7px 3px",
          marginBottom: 10,
        }}
      >
        {categoryLabel}
      </div>
      {grandOpening && (
        <div
          style={{
            display: "inline-block",
            marginLeft: 8,
            marginBottom: 10,
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 700,
            fontSize: "0.625rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#CCFF00",
            border: "2px solid #CCFF00",
            borderRadius: 3,
            padding: "4px 7px 3px",
            boxShadow: "0 0 16px -2px #CCFF00",
          }}
        >
          Grand Opening
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 900,
          textTransform: "uppercase",
          fontSize: "1.125rem",
          lineHeight: 1.05,
          color: "#fff",
          marginBottom: grandDate ? 2 : 8,
        }}
      >
        {biz.name}
      </div>
      {grandDate && (
        <div
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: "0.7875rem",
            lineHeight: 1.1,
            letterSpacing: "0.04em",
            color: "#FFEE00",
            marginBottom: 8,
            textShadow: "0 0 10px rgba(255, 238, 0, 0.45)",
          }}
        >
          {grandDate}
        </div>
      )}
      {address && (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-lo, #aaa)", marginBottom: 6, lineHeight: 1.4 }}>
          {address}
        </div>
      )}
      {biz.hours && (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-lo, #aaa)", marginBottom: 6 }}>{biz.hours}</div>
      )}
      {biz.description && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-mid, #ccc)",
            lineHeight: 1.5,
            margin: "8px 0 0",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {biz.description}
        </p>
      )}
      <a
        href="/directory"
        style={{
          display: "inline-block",
          marginTop: 12,
          fontFamily: "var(--font-body, sans-serif)",
          fontWeight: 700,
          fontSize: "0.8125rem",
          color: accent,
          textDecoration: "none",
        }}
      >
        View in directory →
      </a>
    </div>
  );
}

const POPUP_STYLES = `
  .pdx-dir-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    border: none !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .pdx-dir-popup .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .pdx-dir-popup .leaflet-popup-tip-container { display: none; }
  .pdx-dir-popup .leaflet-popup-close-button {
    color: #888 !important;
    top: 4px !important;
    right: 6px !important;
    font-size: 18px !important;
    width: 22px !important;
    height: 22px !important;
    z-index: 1;
  }
  .pdx-dir-popup .leaflet-popup-close-button:hover { color: #fff !important; }
`;

/** Color key for map pins — sits under the map on Directory. */
export function DirectoryMapKey({ className = "" }: { className?: string }) {
  return (
    <div
      className={`directory-map-key ${className}`.trim()}
      role="group"
      aria-label="Map key"
    >
      <div className="directory-map-key__title">Map key</div>
      <ul className="directory-map-key__list">
        {MAP_KEY_TYPES.map(type => {
          const isNonprofit = type === "nonprofit";
          const color = MAP_TYPE_COLORS[type];
          const swatch = MAP_TYPE_SWATCH[type] || color;
          const label = MAP_TYPE_LABELS[type];
          return (
            <li key={type} className="directory-map-key__item">
              <span
                className={
                  isNonprofit
                    ? "directory-map-key__swatch directory-map-key__swatch--rainbow"
                    : "directory-map-key__swatch"
                }
                style={
                  isNonprofit
                    ? undefined
                    : {
                        background: swatch,
                        boxShadow: `0 0 8px ${color}99`,
                      }
                }
                aria-hidden="true"
              />
              <span className="directory-map-key__label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DirectoryMap({
  businesses,
  height = 380,
  showKey = false,
  interactive = true,
  showMarkers = true,
  backdrop = false,
}: {
  businesses: Business[];
  height?: number | string;
  /** When true, render the pin color key under the map (Directory page). */
  showKey?: boolean;
  /** When false, disable pan/zoom and hide controls (category explorer backdrop). */
  interactive?: boolean;
  /** When false, render tiles only (no place pins). */
  showMarkers?: boolean;
  /** Non-interactive full-bleed layer for the category bubble explorer. */
  backdrop?: boolean;
}) {
  const isBackdrop = backdrop;
  const isInteractive = interactive && !isBackdrop;
  const renderMarkers = showMarkers && !isBackdrop;
  const mapped = renderMarkers ? businesses.filter(b => b.lat != null && b.lng != null) : [];
  const mapHeight = isBackdrop ? "100%" : height;
  const heightStyle = typeof mapHeight === "number" ? `${mapHeight}px` : mapHeight;
  const fillParent = mapHeight === "100%";

  const mapSurface = (
    <div
      className={[
        fillParent ? "directory-map directory-map--fill" : "directory-map",
        isBackdrop ? "directory-map--backdrop" : "",
      ].filter(Boolean).join(" ")}
      style={{
        height: heightStyle,
        minHeight: fillParent ? heightStyle : undefined,
        width: "100%",
        position: "relative",
        flex: fillParent ? "1 1 auto" : undefined,
      }}
    >
      <style>{POPUP_STYLES}</style>
      <MapContainer
        center={[45.5231, -122.6765]}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        dragging={isInteractive}
        scrollWheelZoom={isInteractive}
        doubleClickZoom={isInteractive}
        boxZoom={isInteractive}
        keyboard={isInteractive}
        touchZoom={isInteractive}
        zoomControl={isInteractive}
        attributionControl={isInteractive}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapInvalidateSize enabled={isBackdrop} />
        {mapped.map(biz => {
          const accent = TYPE_COLORS[biz.type] || "#FF00CC";
          const rainbow = biz.type === "nonprofit";
          return (
            <Marker
              key={biz.id}
              position={[biz.lat!, biz.lng!]}
              icon={rainbow ? buildRainbowPin() : buildPin(accent)}
            >
              <Popup className="pdx-dir-popup" maxWidth={280}>
                <DirectoryPopup biz={biz} accent={accent} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );

  if (isBackdrop) {
    return mapSurface;
  }

  return (
    <div className={showKey ? "directory-map-wrap" : undefined}>
      {mapSurface}
      {showKey && <DirectoryMapKey />}
    </div>
  );
}