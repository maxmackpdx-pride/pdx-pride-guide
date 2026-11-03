import { useEffect } from "react";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import CartoVectorBasemap from "@/components/CartoVectorBasemap";
import { MAP_SURFACE_BG } from "./mapTheme";
function ResizeCanvas() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize({ animate: false });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    observer?.observe(map.getContainer()); refresh();
    return () => observer?.disconnect();
  }, [map]);
  return null;
}
export default function PlaceCardMapCanvas({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  return <MapContainer center={[latitude, longitude]} zoom={zoom} minZoom={1}
    zoomControl={false} attributionControl={false} dragging={false}
    scrollWheelZoom={false} doubleClickZoom={false}
    style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}>
    <CartoVectorBasemap /><ResizeCanvas />
  </MapContainer>;
}
