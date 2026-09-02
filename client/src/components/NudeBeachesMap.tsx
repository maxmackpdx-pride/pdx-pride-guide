import { useEffect } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BEACH_MAP_LOCATIONS, type NudeBeachTab } from "@shared/nudeBeaches";
import {
  MAP_PIN_SIZE,
  MAP_SURFACE_BG,
  LIVE_MAP_CHROME_CSS,
  mapPinHtml,
} from "@/components/ds/mapTheme";
import CartoVectorBasemap from "@/components/CartoVectorBasemap";

const PIN_HALF = MAP_PIN_SIZE / 2;

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
`;

function buildPin(color: string) {
  return divIcon({
    className: "",
    html: mapPinHtml(color),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    popupAnchor: [0, -PIN_HALF - 4],
  });
}

function BeachPopup({ label, subtitle, accent }: { label: string; subtitle: string; accent: string }) {
  return (
    <div
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
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [0, 50, 250, 800, 1500, 2500].map(ms => setTimeout(invalidate, ms));

    const container = map.getContainer()?.parentElement;
    let observer: ResizeObserver | undefined;
    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(invalidate);
      observer.observe(container);
    }

    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
    };
  }, [map, tab]);
  return null;
}

type Props = {
  tab: NudeBeachTab;
  height?: number | string;
};

export default function NudeBeachesMap({ tab, height }: Props) {
  const location = BEACH_MAP_LOCATIONS[tab];
  const fillParent = height === "100%";
  const heightStyle =
    height == null ? undefined : typeof height === "number" ? `${height}px` : height;

  return (
    <div className="directory-map-wrap nude-beaches-map">
      <div
        className={`directory-map nude-beaches-map__canvas pdx-map-live pdx-map-surface${fillParent ? " directory-map--fill" : ""}`}
        style={{
          width: "100%",
          position: "relative",
          ...(heightStyle
            ? { height: heightStyle, minHeight: fillParent ? heightStyle : undefined }
            : {}),
        }}
      >
        <style>{`${POPUP_STYLES}${LIVE_MAP_CHROME_CSS}`}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        <div className="pdx-map-live__shaft" aria-hidden="true" />
        <div className="nude-beaches-map__chip" aria-hidden="true">
          {/* Black-core pin swatch - color ring only, no outer bloom */}
          <span
            className="nude-beaches-map__chip-dot"
            style={{
              background: "#000",
              borderColor: location.pinColor,
            }}
          />
          <span>
            <span className="nude-beaches-map__chip-title">{location.label}</span>
            <span className="nude-beaches-map__chip-sub">{location.subtitle}</span>
          </span>
        </div>
        <MapContainer
          key={tab}
          center={[location.lat, location.lng]}
          zoom={location.zoom}
          style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}
          scrollWheelZoom={false}
          zoomControl
        >
          <CartoVectorBasemap accent={location.pinColor} />
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
      </div>
    </div>
  );
}
