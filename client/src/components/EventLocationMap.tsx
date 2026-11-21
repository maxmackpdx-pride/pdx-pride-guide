import { lazy, Suspense, useState, type ReactNode } from "react";
import { useIncidentalMap } from "@/hooks/useIncidentalMap";
const EventLocationMapCanvas = lazy(() => import("./EventLocationMapCanvas"));
import { CalendarPlus, Check, ChevronDown, Map as MapIcon } from "lucide-react";
import { CopyStateIcon } from "@/components/ui/animated-state-icons";
import type { Event } from "@shared/schema";
import { appleMapsUrl, googleMapsUrl } from "@/lib/eventLinks";

export function EventMapSurface({ event, primary, complementary, children }: {
  event: Event; primary: string; complementary: string; children?: ReactNode;
}) {
  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
  const { ref, active, memory } = useIncidentalMap(true, event.id);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const precise = !event.isPrivate && typeof event.lat === "number" && typeof event.lng === "number" && Number.isFinite(event.lat) && Number.isFinite(event.lng);
  const lat = precise ? event.lat! : 45.5152;
  const lng = precise ? event.lng! : -122.6784;
  return (
    <section ref={ref} className="event-location-map" aria-label={`Map showing ${event.venueName}`}>
      <div ref={setMapNode} className={`event-location-map__canvas${mapUnavailable ? " event-location-map__canvas--fallback" : ""}`} />
      {active && mapNode && <Suspense fallback={null}><EventLocationMapCanvas
        node={mapNode} lat={lat} lng={lng} precise={precise} primary={primary} complementary={complementary}
        memory={memory} onUnavailable={setMapUnavailable} /></Suspense>}
      <div className="event-location-map__veil" aria-hidden="true" />
      <header className="event-location-map__header">
        <MapIcon aria-hidden="true" />
        <span><i aria-hidden="true" />Event location</span>
      </header>
      <div className="event-location-map__copy">
        <strong>{event.venueName || "Event location"}</strong>
        <span>{event.isPrivate ? "Location provided upon RSVP" : event.address || "Portland, OR"}</span>
      </div>
      {children}
    </section>
  );
}

export default function EventLocationMap({
  event,
  primary,
  complementary,
  scheduled,
  actionLabel,
  schedulePending,
  onSchedule,
}: {
  event: Event;
  primary: string;
  complementary: string;
  scheduled: boolean;
  actionLabel?: string;
  schedulePending: boolean;
  onSchedule: () => void;
}) {
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyAddress = async () => {
    const value = event.address || event.venueName;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <EventMapSurface event={event} primary={primary} complementary={complementary}>
      <div className="event-location-map__actions">
        {!event.isPrivate && (
          <div className="event-location-map__directions">
            <button type="button" aria-expanded={directionsOpen} onClick={() => setDirectionsOpen(value => !value)}>
              Directions <ChevronDown size={15} aria-hidden="true" />
            </button>
            {directionsOpen && (
              <div className="event-location-map__directions-menu">
                <a href={googleMapsUrl(event)} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a href={appleMapsUrl(event)} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              </div>
            )}
          </div>
        )}
        {!event.isPrivate && <button type="button" onClick={copyAddress} aria-label="Copy event address"><CopyStateIcon copied={copied} /><span>{copied ? "Copied" : "Copy"}</span></button>}
        <button type="button" onClick={onSchedule} disabled={schedulePending} aria-pressed={scheduled}>
          {scheduled ? <Check aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
          <span>{actionLabel ?? (scheduled ? "Scheduled" : "Schedule")}</span>
        </button>
      </div>
    </EventMapSurface>
  );
}
