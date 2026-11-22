import * as maplibre from "maplibre-gl";
import release from "@shared/mapReleaseLock.json";

// The release ships a self-contained classic worker alongside its five-mode map.
// MapLibre chooses a classic worker from the .cjs suffix.
maplibre.setWorkerUrl(`${release.base}maplibre-worker-${release.stack["maplibre-gl"]}.cjs`);

export { maplibre };
