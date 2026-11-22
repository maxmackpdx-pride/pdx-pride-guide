import type { Map, MapOptions } from "maplibre-gl";

export function createMapWithStyleRecovery(
  options: MapOptions,
  dependencies: { library: typeof import("maplibre-gl") },
): Map;
export function observeMapSize(map: Map, onResize?: () => void): () => void;
