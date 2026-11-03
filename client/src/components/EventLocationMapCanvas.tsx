import { useEffect } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";
const CARTO_DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function mixHex(a: string, b: string, amount: number) {
  const parse = (value: string) => {
    const hex = value.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    const n = Number.parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return a;
  return `#${left.map((channel, index) => Math.round(channel + (right[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function applyEventPalette(map: MapLibreMap, primary: string, complementary: string) {
  const layers = map.getStyle().layers || [];
  for (const layer of layers) {
    try {
      if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-color", complementary);
        map.setPaintProperty(layer.id, "text-halo-color", "#050506");
        map.setPaintProperty(layer.id, "text-halo-width", 1.4);
      } else if (layer.type === "line") {
        const strength = /road|street|bridge|tunnel/i.test(layer.id) ? primary : mixHex("#16161c", primary, 0.38);
        map.setPaintProperty(layer.id, "line-color", strength);
      } else if (layer.type === "fill" && /building|water|park|landcover|landuse/i.test(layer.id)) {
        map.setPaintProperty(layer.id, "fill-color", mixHex("#09090c", primary, /building/i.test(layer.id) ? 0.22 : 0.14));
      }
    } catch {
      // CARTO occasionally changes optional layers; keep the rest of the map usable.
    }
  }
}

export default function EventLocationMapCanvas({ node, lat, lng, precise, primary, complementary, memory, onUnavailable }: {
  node: HTMLDivElement; lat: number; lng: number; precise: boolean;
  primary: string; complementary: string; memory: IncidentalMapMemory;
  onUnavailable: (unavailable: boolean) => void;
}) {
  useEffect(() => {
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: node,
        style: CARTO_DARK_STYLE,
        center: memory.current ? [memory.current.center[1], memory.current.center[0]] : [lng, lat],
        zoom: memory.current?.zoom ?? (precise ? 14.2 : 10.5),
        attributionControl: false,
        interactive: true,
      });
    } catch {
      onUnavailable(true);
      return;
    }
    onUnavailable(false);
    const record = () => { const center = map.getCenter(); memory.current = { center: [center.lat, center.lng], zoom: map.getZoom() }; };
    map.on("moveend", record);
    map.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> · <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    }));
    map.once("load", () => {
      applyEventPalette(map, primary, complementary);
      const marker = document.createElement("span");
      marker.className = "event-location-map__pin";
      marker.style.setProperty("--pin-primary", primary);
      marker.style.setProperty("--pin-complementary", complementary);
      new maplibregl.Marker({ element: marker, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map);
      map.resize();
    });
    return () => { map.off("moveend", record); map.remove(); };
  }, [node, lat, lng, precise, primary, complementary, memory, onUnavailable]);

  return null;
}
