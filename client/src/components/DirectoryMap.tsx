import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

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
  lat: number | null;
  lng: number | null;
};

const TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
};

const TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
};

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
      {biz.isNew && (
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
          marginBottom: 8,
        }}
      >
        {biz.name}
      </div>
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

export default function DirectoryMap({
  businesses,
  height = 380,
}: {
  businesses: Business[];
  height?: number | string;
}) {
  const mapped = businesses.filter(b => b.lat != null && b.lng != null);
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div style={{ height: heightStyle, width: "100%", position: "relative" }}>
      <style>{POPUP_STYLES}</style>
      <MapContainer
        center={[45.5231, -122.6765]}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        {mapped.map(biz => {
          const accent = TYPE_COLORS[biz.type] || "#FF00CC";
          return (
            <Marker
              key={biz.id}
              position={[biz.lat!, biz.lng!]}
              icon={buildPin(accent)}
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
}