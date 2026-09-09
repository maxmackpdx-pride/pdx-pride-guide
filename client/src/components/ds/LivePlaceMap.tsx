import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import CartoVectorBasemap from "@/components/CartoVectorBasemap";
import { MAP_SURFACE_BG } from "@/components/ds/mapTheme";

export default function LivePlaceMap({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      minZoom={1}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}
    >
      <CartoVectorBasemap />
    </MapContainer>
  );
}
