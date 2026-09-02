import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatGrandOpeningDate, isGrandOpeningActive } from "@shared/grandOpening";
import CartoVectorBasemap from "@/components/CartoVectorBasemap";
import {
  MAP_PIN_SIZE,
  MAP_SURFACE_BG,
  LIVE_MAP_CHROME_CSS,
  mapPinHtml,
  mapPinMultiHtml,
} from "@/components/ds/mapTheme";
import { placePath } from "@shared/placeSlug";
import {
  resolveBusinessLocations,
  type BusinessLocation,
} from "@shared/businessLocations";

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
  locations?: BusinessLocation[];
};

/** One map pin: brand + optional storefront label for multi-loc chains. */
type MapPin = {
  key: string;
  biz: Business;
  lat: number;
  lng: number;
  locationLabel?: string;
  address?: string | null;
  hours?: string | null;
  phone?: string | null;
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
  group: "#FFD700",
  campground: "#39FF14",
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
  group: "linear-gradient(135deg,#FFFFFF 0%,#FFF3C4 40%,#FFD700 100%)",
  campground: "linear-gradient(135deg,#B8FF3C 0%,#39FF14 32%,#0F8A3D 68%,#064E2A 100%)",
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
  group: "Clubs & Groups",
  campground: "Campgrounds",
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
  "group",
  "campground",
] as const;

const TYPE_COLORS = MAP_TYPE_COLORS;
const TYPE_LABELS = MAP_TYPE_LABELS;

const PIN_HALF = MAP_PIN_SIZE / 2;

/** Keep the directory map framed on the Portland metro (incl. Vancouver WA,
    Aloha, Clackamas multi-loc storefronts). Users can't pan/zoom past this box.
    [SW, NE] corners. */
const PORTLAND_BOUNDS: [[number, number], [number, number]] = [
  [45.35, -122.92], // SW - Aloha / Tigard / Clackamas
  [45.70, -122.42], // NE - Vancouver WA / Gresham
];
const PORTLAND_MIN_ZOOM = 11;

/** Expand multi-loc businesses into one pin per storefront with coords. */
function expandBusinessPins(businesses: Business[]): MapPin[] {
  const pins: MapPin[] = [];
  for (const biz of businesses) {
    const locations =
      Array.isArray(biz.locations) && biz.locations.length > 0
        ? biz.locations
        : resolveBusinessLocations(biz);
    const withCoords = locations.filter(
      (loc) =>
        loc.lat != null &&
        loc.lng != null &&
        Number.isFinite(loc.lat) &&
        Number.isFinite(loc.lng),
    );
    if (withCoords.length > 1) {
      withCoords.forEach((loc, i) => {
        pins.push({
          key: `${biz.id}-loc-${i}`,
          biz,
          lat: loc.lat!,
          lng: loc.lng!,
          locationLabel: loc.label,
          address: loc.address,
          hours: loc.hours,
          phone: loc.phone,
        });
      });
      continue;
    }
    if (withCoords.length === 1) {
      const loc = withCoords[0];
      pins.push({
        key: `${biz.id}`,
        biz,
        lat: loc.lat!,
        lng: loc.lng!,
        address: loc.address || biz.address,
        hours: loc.hours || biz.hours,
        phone: loc.phone || biz.phone,
      });
      continue;
    }
    // Fall back to primary lat/lng on the business row
    if (biz.lat != null && biz.lng != null) {
      pins.push({
        key: `${biz.id}`,
        biz,
        lat: biz.lat,
        lng: biz.lng,
        address: biz.address,
        hours: biz.hours,
        phone: biz.phone,
      });
    }
  }
  return pins;
}

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
    html: mapPinMultiHtml(),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    popupAnchor: [0, -PIN_HALF - 4],
    className: "",
  });
}
function buildPin(color: string) {
  return divIcon({
    className: "",
    html: mapPinHtml(color),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    popupAnchor: [0, -PIN_HALF - 4],
  });
}

function DirectoryPopup({
  pin,
  accent,
}: {
  pin: MapPin;
  accent: string;
}) {
  const { biz, locationLabel, address: pinAddress, hours: pinHours } = pin;
  const address =
    pinAddress ||
    [biz.address, biz.neighborhood].filter(Boolean).join(" · ") ||
    null;
  const hours = pinHours || (!locationLabel ? biz.hours : null);
  const categoryLabel = TYPE_LABELS[biz.type] || biz.type;
  const grandOpening = isGrandOpeningActive(biz.grandOpeningDate);
  const grandDate = grandOpening ? formatGrandOpeningDate(biz.grandOpeningDate) : null;

  return (
    <div
      className="pdx-dir-popup__card"
      style={{
        border: "1px solid #000",
        boxShadow: "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85)",
        outline: `1px solid ${accent}`,
        outlineOffset: -2,
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
          border: "1px solid #000",
          borderRadius: 3,
          outline: `1px solid ${accent}`,
          outlineOffset: -2,
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
            border: "1px solid #000",
            borderRadius: 3,
            outline: "1px solid #CCFF00",
            outlineOffset: -2,
            padding: "4px 7px 3px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,.75)",
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
          marginBottom: locationLabel || grandDate ? 2 : 8,
        }}
      >
        {biz.name}
      </div>
      {locationLabel && (
        <div
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
            color: accent,
            marginBottom: grandDate ? 2 : 8,
          }}
        >
          {locationLabel}
        </div>
      )}
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
      {hours && (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-lo, #aaa)", marginBottom: 6 }}>{hours}</div>
      )}
      {!locationLabel && biz.description && (
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
        href={placePath(biz.id, biz.name)}
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
    border-radius: 0 !important;
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

/** Color key for map pins - sits under the map on Directory. */
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
                        background: "#000",
                        border: `3px solid ${color}`,
                        boxShadow: "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85)",
                        width: 14,
                        height: 14,
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
  const mapped = useMemo(
    () => (renderMarkers ? expandBusinessPins(businesses) : []),
    [businesses, renderMarkers],
  );
  const mapHeight = isBackdrop ? "100%" : height;
  const heightStyle = typeof mapHeight === "number" ? `${mapHeight}px` : mapHeight;
  const fillParent = mapHeight === "100%";

  const mapSurface = (
    <div
      className={[
        fillParent ? "directory-map directory-map--fill" : "directory-map",
        isBackdrop ? "directory-map--backdrop" : "pdx-map-live pdx-map-surface pdx-map-surface--neutral",
      ].filter(Boolean).join(" ")}
      style={{
        height: heightStyle,
        minHeight: fillParent ? heightStyle : undefined,
        width: "100%",
        position: "relative",
        flex: fillParent ? "1 1 auto" : undefined,
      }}
    >
      <style>{POPUP_STYLES}{!isBackdrop ? LIVE_MAP_CHROME_CSS : ""}</style>
      {!isBackdrop && (
        <>
          <div className="pdx-map-live__vignette" aria-hidden="true" />
          <div className="pdx-map-live__shaft" aria-hidden="true" />
        </>
      )}
      <MapContainer
        center={[45.5231, -122.6765]}
        zoom={12}
        style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}
        maxBounds={isBackdrop ? undefined : PORTLAND_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={isBackdrop ? undefined : PORTLAND_MIN_ZOOM}
        dragging={isInteractive}
        scrollWheelZoom={isInteractive}
        doubleClickZoom={isInteractive}
        boxZoom={isInteractive}
        keyboard={isInteractive}
        touchZoom={isInteractive}
        zoomControl={isInteractive}
        attributionControl={isInteractive}
      >
        <CartoVectorBasemap />
        <MapInvalidateSize enabled={isBackdrop} />
        {mapped.map(pin => {
          const accent = TYPE_COLORS[pin.biz.type] || "#FF00CC";
          const rainbow = pin.biz.type === "nonprofit";
          return (
            <Marker
              key={pin.key}
              position={[pin.lat, pin.lng]}
              icon={rainbow ? buildRainbowPin() : buildPin(accent)}
            >
              <Popup className="pdx-dir-popup" maxWidth={280}>
                <DirectoryPopup pin={pin} accent={accent} />
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
