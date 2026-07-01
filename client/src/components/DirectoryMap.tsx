import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

type Business = {
  id: number;
  name: string;
  type: string;
  address: string | null;
  neighborhood: string | null;
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

function buildPin(color: string) {
  return divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #000;box-shadow:0 0 8px ${color}99"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

export default function DirectoryMap({ businesses }: { businesses: Business[] }) {
  const mapped = businesses.filter(b => b.lat != null && b.lng != null);
  return (
    <div style={{ height: 380, width: "100%", position: "relative" }}>
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
        {mapped.map(biz => (
          <Marker
            key={biz.id}
            position={[biz.lat!, biz.lng!]}
            icon={buildPin(TYPE_COLORS[biz.type] || "#FF00CC")}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", minWidth: 140 }}>
                <strong style={{ fontSize: "0.9rem" }}>{biz.name}</strong>
                {biz.address && <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 2 }}>{biz.address}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
