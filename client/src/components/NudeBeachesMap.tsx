import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BEACH_MAP_LOCATIONS, BEACH_POIS, type NudeBeachTab } from "@shared/nudeBeaches";

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

const RAINBOW_RING =
  "conic-gradient(#ff3b30,#ff9500,#ffcc00,#34c759,#0a84ff,#5e5ce6,#ff2d92,#ff3b30)";

/** Smaller solid dot for points of interest so they read as secondary to the
 *  beach anchor. Rainbow variant marks the queer hangout areas. */
function buildPoiPin(color: string, rainbow: boolean) {
  const ring = rainbow ? RAINBOW_RING : color;
  return divIcon({
    className: "",
    html: `<div style="width:15px;height:15px;border-radius:50%;background:${ring};border:2px solid #050505;box-shadow:0 0 8px ${rainbow ? "rgba(255,255,255,0.5)" : color + "cc"},0 2px 5px rgba(0,0,0,0.85);"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
    popupAnchor: [0, -10],
  });
}

function PoiPopup({ title, accent }: { title: string; accent: string }) {
  return (
    <div
      style={{
        border: `2px solid ${accent}`,
        boxShadow: `0 0 24px -14px ${accent}99`,
        background: "#050505",
        color: "#fff",
        padding: "11px 14px",
        fontFamily: "var(--font-body, sans-serif)",
        fontSize: "0.8125rem",
        lineHeight: 1.4,
        minWidth: 150,
        maxWidth: 240,
      }}
    >
      {title}
    </div>
  );
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

function FitToPois({ tab }: { tab: NudeBeachTab }) {
  const map = useMap();
  useEffect(() => {
    const location = BEACH_MAP_LOCATIONS[tab];
    const pois = BEACH_POIS[tab] ?? [];
    if (pois.length === 0) return;
    const bounds = latLngBounds(
      [[location.lat, location.lng], ...pois.map(p => [p.lat, p.lng] as [number, number])],
    );
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  }, [map, tab]);
  return null;
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
        className={`directory-map nude-beaches-map__canvas${fillParent ? " directory-map--fill" : ""}`}
        style={{
          width: "100%",
          position: "relative",
          ...(heightStyle
            ? { height: heightStyle, minHeight: fillParent ? heightStyle : undefined }
            : {}),
        }}
      >
        <div className="nude-beaches-map__chip" aria-hidden="true">
          <span
            className="nude-beaches-map__chip-dot"
            style={{ background: location.pinColor, boxShadow: `0 0 10px ${location.pinColor}` }}
          />
          <span>
            <span className="nude-beaches-map__chip-title">{location.label}</span>
            <span className="nude-beaches-map__chip-sub">{location.subtitle}</span>
          </span>
        </div>
        <style>{POPUP_STYLES}</style>
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
          <FitToPois tab={tab} />
          <Marker position={[location.lat, location.lng]} icon={buildPin(location.pinColor)}>
            <Popup className="pdx-beach-popup" maxWidth={280}>
              <BeachPopup
                label={location.label}
                subtitle={location.subtitle}
                accent={location.pinColor}
              />
            </Popup>
          </Marker>
          {(BEACH_POIS[tab] ?? []).map((poi, i) => (
            <Marker
              key={`${poi.lat},${poi.lng},${i}`}
              position={[poi.lat, poi.lng]}
              icon={buildPoiPin(location.pinColor, poi.marker === "rainbow")}
            >
              <Popup className="pdx-beach-popup" maxWidth={260}>
                <PoiPopup title={poi.title} accent={location.pinColor} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}