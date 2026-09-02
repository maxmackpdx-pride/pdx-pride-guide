import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CalendarPlus, Check, Copy, Map as MapIcon } from "lucide-react";
import type { Event } from "@shared/schema";
import { appleMapsUrl, googleMapsUrl } from "@/lib/eventLinks";

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

export default function EventLocationMap({
  event,
  primary,
  complementary,
  scheduled,
  schedulePending,
  onSchedule,
}: {
  event: Event;
  primary: string;
  complementary: string;
  scheduled: boolean;
  schedulePending: boolean;
  onSchedule: () => void;
}) {
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const lat = Number.isFinite(Number(event.lat)) ? Number(event.lat) : 45.5152;
  const lng = Number.isFinite(Number(event.lng)) ? Number(event.lng) : -122.6784;
  const precise = Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng));

  useEffect(() => {
    const node = mapNodeRef.current;
    if (!node) return;
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: node,
        style: CARTO_DARK_STYLE,
        center: [lng, lat],
        zoom: precise ? 14.2 : 10.5,
        attributionControl: false,
        interactive: true,
      });
    } catch {
      setMapUnavailable(true);
      return;
    }
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
    return () => map.remove();
  }, [lat, lng, precise, primary, complementary]);

  const copyAddress = async () => {
    const value = event.address || event.venueName;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="event-location-map" aria-label={`Map showing ${event.venueName}`}>
      <div ref={mapNodeRef} className={`event-location-map__canvas${mapUnavailable ? " event-location-map__canvas--fallback" : ""}`} />
      <div className="event-location-map__veil" aria-hidden="true" />
      <header className="event-location-map__header">
        <MapIcon aria-hidden="true" />
        <span><i aria-hidden="true" />Event location</span>
      </header>
      <div className="event-location-map__copy">
        <strong>{event.venueName || "Event location"}</strong>
        <span>{event.isPrivate ? "Location provided upon RSVP" : event.address || "Portland, OR"}</span>
      </div>
      <div className="event-location-map__actions">
        {!event.isPrivate && (
          <div className="event-location-map__directions">
            <button type="button" aria-expanded={directionsOpen} onClick={() => setDirectionsOpen(value => !value)}>
              Directions <span aria-hidden="true">▾</span>
            </button>
            {directionsOpen && (
              <div className="event-location-map__directions-menu">
                <a href={googleMapsUrl(event)} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a href={appleMapsUrl(event)} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              </div>
            )}
          </div>
        )}
        {!event.isPrivate && <button type="button" onClick={copyAddress} aria-label="Copy event address">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}<span>{copied ? "Copied" : "Copy"}</span></button>}
        <button type="button" onClick={onSchedule} disabled={schedulePending} aria-pressed={scheduled}>
          {scheduled ? <Check aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
          <span>{scheduled ? "Scheduled" : "Schedule"}</span>
        </button>
      </div>
    </section>
  );
}
