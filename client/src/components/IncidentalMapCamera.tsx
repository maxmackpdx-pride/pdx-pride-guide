import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";
/** The owner survives renderer teardown; no Leaflet objects escape into it. */
export default function IncidentalMapCamera({ memory }: { memory?: IncidentalMapMemory }) {
  const map = useMap();
  useEffect(() => {
    if (!memory) return;
    const record = () => {
      const center = map.getCenter();
      memory.current = { center: [center.lat, center.lng], zoom: map.getZoom() };
    };
    map.on("moveend", record);
    return () => { map.off("moveend", record); };
  }, [map, memory]);
  return null;
}
