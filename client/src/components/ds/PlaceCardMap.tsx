import { lazy, Suspense, useId } from "react";
import { ChevronDown, MapPinned } from "lucide-react";
const LivePlaceMap = lazy(() => import("./LivePlaceMap"));

function formatCoordinates(latitude: number, longitude: number) {
  const latitudeDirection = latitude >= 0 ? "N" : "S";
  const longitudeDirection = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${latitudeDirection}, ${Math.abs(longitude).toFixed(4)}° ${longitudeDirection}`;
}

export function PlaceCardMap({
  name,
  latitude,
  longitude,
  expanded,
  onToggle,
  zoom = 15,
}: {
  name: string;
  latitude: number;
  longitude: number;
  expanded: boolean;
  onToggle: () => void;
  zoom?: number;
}) {
  const mapId = `place-map-${useId().replace(/:/g, "")}`;

  return (
    <div
      className={`pdxPlaceMap${expanded ? " pdxPlaceMap--expanded" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="pdxPlaceMap__toggle pdx-glass-btn"
        aria-expanded={expanded}
        aria-controls={mapId}
        aria-label={`${expanded ? "Hide" : "Show"} map for ${name}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <MapPinned size={16} aria-hidden="true" />
        <span>Map</span>
        <ChevronDown className="pdxPlaceMap__chevron" size={15} aria-hidden="true" />
      </button>

      <div
        id={mapId}
        className="pdxPlaceMap__reveal"
        aria-hidden={!expanded}
      >
        <div className="pdxPlaceMap__well">
          {expanded && (
            <>
              <div className="pdxPlaceMap__live">
                <Suspense fallback={<span role="status">Loading map…</span>}>
                  <LivePlaceMap latitude={latitude} longitude={longitude} zoom={zoom} />
                </Suspense>
              </div>
              <span className="pdxPlaceMap__pin" aria-hidden="true">
                <MapPinned size={27} strokeWidth={2.5} />
              </span>
              <div className="pdxPlaceMap__caption">
                <strong>{name}</strong>
                <span>{formatCoordinates(latitude, longitude)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
