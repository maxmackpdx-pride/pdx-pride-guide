import type { BeachMapLocation } from "@shared/nudeBeaches";
import { ZaylistMap, ZaylistMapMarker } from "@/components/ZaylistMap";
import { mapPinHtml } from "@/components/ds/mapTheme";
import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";

export default function NudeBeachesMapCanvas({ location, memory }: {
  location: BeachMapLocation;
  memory: IncidentalMapMemory;
}) {
  const center: [number, number] = [location.lng, location.lat];
  // The published beach camera uses 256px tiles; the vector map uses 512px tiles.
  const zoom = location.zoom - 1;
  return (
    <ZaylistMap
      center={center}
      zoom={zoom}
      memory={memory}
      zoomControl
      scrollZoom={false}
      accent={location.pinColor}
      ariaLabel={`Map of ${location.label}`}
      style={{ height: "100%", width: "100%" }}
    >
      <ZaylistMapMarker
        position={center}
        label={location.label}
        className="nude-beaches-map__pin"
        popupClassName="nude-beaches-map-popup"
        popup={
          <div className="nude-beaches-map__popup">
            <strong>{location.label}</strong>
            <span>{location.subtitle}</span>
          </div>
        }
      >
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: mapPinHtml(location.pinColor) }} />
      </ZaylistMapMarker>
    </ZaylistMap>
  );
}
