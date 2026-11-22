import { ZaylistMap } from "../ZaylistMap";
import { MAP_SURFACE_BG } from "./mapTheme";

export default function PlaceCardMapCanvas({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  return <ZaylistMap ariaLabel="Place location" center={[longitude, latitude]} zoom={zoom - 1} minZoom={0}
    interactive={false} style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }} />;
}
