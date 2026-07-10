import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BEACH_MAP_LOCATIONS, type NudeBeachTab } from "@shared/nudeBeaches";

const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const POPUP_STYLES = `
  .pdx-beach-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    border: none !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .pdx-beach-popup .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .pdx-beach-popup .leaflet-popup-tip-container { display: none; }
  .pdx-beach-popup .leaflet-popup-close-button {
    color: #888 !important;
    top: 4px !important;
    right: 6px !important;
    font-size: 18px !important;
    width: 22px !important;
    height: 22px !important;
    z-index: 1;
  }
  .pdx-beach-popup .leaflet-popup-close-button:hover { color: #fff !important; }
  .nude-beaches-map .leaflet-control-attribution {
    background: rgba(0,0,0,0.65) !important;
    color: var(--text-faint, #8a8a8a) !important;
    font-size: 9px !important;
  }
  .nude-beaches-map .leaflet-control-attribution a { color: var(--text-meta, #aaa) !important; }
  .nude-beaches-map .leaflet-control-zoom a {
    background: #111 !important;
    color: #CCFF00 !important;
    border-color: #333 !important;
  }
  .nude-beaches-map .leaflet-control-zoom a:hover { background: #222 !important; }
`;

function buildPin(color: string) {
  return divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:transparent;border:3px solid ${color};box-shadow:0 0 10px ${color},0 0 18px ${color}99,0 2px 6px rgba(0,0,0,0.8);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

function BeachPopup({ label, subtitle, accent }: { label: string; subtitle: string; accent: string }) {
  return (
    <div
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
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 900,
          textTransform: "uppercase",
          fontSize: "1.05rem",
          lineHeight: 1.05,
          color: "#fff",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "0.8125rem", color: "var(--text-lo, #aaa)", lineHeight: 1.4 }}>
        {subtitle}
      </div>
    </div>
  );
}

function MapResizer({ tab }: { tab: NudeBeachTab }) {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const timers = [50, 250, 800, 1500].map(ms => setTimeout(invalidate, ms));

    const container = map.getContainer()?.parentElement;
    let observer: ResizeObserver | undefined;
    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(invalidate);
      observer.observe(container);
    }

    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
    };
  }, [map, tab]);
  return null;
}

type Props = {
  tab: NudeBeachTab;
  height?: number | string;
};

export default function NudeBeachesMap({ tab, height = 380 }: Props) {
  const location = BEACH_MAP_LOCATIONS[tab];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, [tab]);

  return (
    <div className="directory-map-wrap nude-beaches-map">
      <div className="directory-map" style={{ height, width: "100%", position: "relative" }}>
        <style>{POPUP_STYLES}</style>
        {mounted ? (
          <MapContainer
            key={tab}
            center={[location.lat, location.lng]}
            zoom={location.zoom}
            style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
            scrollWheelZoom={false}
            zoomControl
          >
            <TileLayer
              url={DARK_TILE}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
              subdomains="abcd"
            />
            <MapResizer tab={tab} />
            <Marker position={[location.lat, location.lng]} icon={buildPin(location.pinColor)}>
              <Popup className="pdx-beach-popup" maxWidth={280}>
                <BeachPopup
                  label={location.label}
                  subtitle={location.subtitle}
                  accent={location.pinColor}
                />
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div
            style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
            aria-hidden
            role="status"
            aria-label="Loading map"
          />
        )}
      </div>
    </div>
  );
}