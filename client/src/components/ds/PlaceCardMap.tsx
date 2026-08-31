import React, { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, MapPinned } from "lucide-react";

type MapTile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

function toWorldTile(latitude: number, longitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const latitudeRadians = (latitude * Math.PI) / 180;
  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
        2) *
      scale,
  };
}

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
  const [settledTiles, setSettledTiles] = useState(0);
  const mapId = `place-map-${useId().replace(/:/g, "")}`;

  const tiles = useMemo<MapTile[]>(() => {
    const world = toWorldTile(latitude, longitude, zoom);
    const centerX = Math.floor(world.x);
    const centerY = Math.floor(world.y);
    const markerX = (1 + world.x - centerX) * 256;
    const markerY = (1 + world.y - centerY) * 256;
    const nextTiles: MapTile[] = [];

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const x = centerX + xOffset;
        const y = centerY + yOffset;
        nextTiles.push({
          key: `${zoom}-${x}-${y}`,
          url: `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${x}/${y}.png`,
          left: (xOffset + 1) * 256 - markerX,
          top: (yOffset + 1) * 256 - markerY,
        });
      }
    }

    return nextTiles;
  }, [latitude, longitude, zoom]);

  useEffect(() => {
    setSettledTiles(0);
  }, [tiles]);

  const tilesReady = settledTiles >= tiles.length;

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
              <div className={`pdxPlaceMap__tiles${tilesReady ? " pdxPlaceMap__tiles--ready" : ""}`} aria-hidden="true">
                {tiles.map((tile) => (
                  <img
                    key={tile.key}
                    src={tile.url}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    onLoad={() => setSettledTiles((count) => count + 1)}
                    onError={() => setSettledTiles((count) => count + 1)}
                    style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }}
                  />
                ))}
              </div>
              {!tilesReady && <div className="pdxPlaceMap__loading" aria-hidden="true" />}
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
