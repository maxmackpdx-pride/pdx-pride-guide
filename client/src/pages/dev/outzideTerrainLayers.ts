import type { Map as LibreMap } from "maplibre-gl";
import { maplibre } from "@/lib/maplibre";
import contours from "maplibre-contour";

// Same tile encoding, native scale and bounded mobile cache as the locked Outzide release.
const elevationTiles = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp";
const elevationCredit = '<a href="https://mapterhorn.com/attribution/">Mapterhorn elevation sources</a>';
let sharedDem: InstanceType<typeof contours.DemSource> | undefined;

function elevation() {
  if (!sharedDem) {
    sharedDem = new contours.DemSource({
      id: "outzide-terrain-preview", url: elevationTiles, encoding: "terrarium",
      maxzoom: 13, worker: true, cacheSize: matchMedia("(pointer:coarse)").matches ? 16 : 32,
    });
    sharedDem.setupMaplibre(maplibre);
  }
  return sharedDem;
}

const DEM = "preview-dem";
const CONTOURS = "preview-contours";
const SHADE = "preview-hillshade";
const LINES = "preview-contour-lines";
const USFS = "preview-usfs-trails";

export function applyTerrainComparison(map: LibreMap, relief: boolean) {
  const before = map.getStyle().layers?.find(layer => layer.type === "symbol")?.id;
  if (!map.getSource(USFS)) {
    map.addSource(USFS, { type: "geojson", data: "/outzide-map/routes.json", attribution: "US Forest Service trails" });
    map.addLayer({ id: USFS, type: "line", source: USFS, minzoom: 8,
      paint: { "line-color": "#00FFFF", "line-width": 1.6, "line-dasharray": [2, 2] } }, before);
  }
  if (!relief) {
    if (map.getTerrain()) map.setTerrain(null);
    for (const layer of [LINES, SHADE]) if (map.getLayer(layer)) map.removeLayer(layer);
    for (const source of [CONTOURS, DEM]) if (map.getSource(source)) map.removeSource(source);
    return;
  }
  if (map.getTerrain()?.source === DEM) return;
  const dem = elevation();
  if (!map.getSource(DEM)) map.addSource(DEM, {
    type: "raster-dem", tiles: [dem.sharedDemProtocolUrl], tileSize: 512, encoding: "terrarium",
    maxzoom: 13, attribution: elevationCredit,
  });
  if (!map.getLayer(SHADE)) map.addLayer({ id: SHADE, type: "hillshade", source: DEM,
    paint: { "hillshade-shadow-color": "#031009", "hillshade-highlight-color": "#8bab43",
      "hillshade-exaggeration": 0.65 } }, USFS);
  if (!map.getSource(CONTOURS)) map.addSource(CONTOURS, {
    type: "vector", maxzoom: 15,
    tiles: [dem.contourProtocolUrl({ multiplier: 3.28084, thresholds: {
      4: [4000, 10000], 6: [2000, 10000], 8: [1000, 5000], 10: [500, 2000],
      12: [100, 500], 14: [50, 200], 15: [20, 100],
    }, contourLayer: "contours", elevationKey: "ele", levelKey: "level" })],
  });
  if (!map.getLayer(LINES)) map.addLayer({ id: LINES, type: "line", source: CONTOURS, "source-layer": "contours",
    paint: { "line-color": "#FF7B00", "line-width": ["match", ["get", "level"], 1, 1.5, 0.7],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.4, 13, 0.8] } }, USFS);
  map.stop();
  map.setTerrain({ source: DEM, exaggeration: 1 });
}

export function sampledElevation(map: LibreMap) {
  if (map.getTerrain()?.source !== DEM || !map.isSourceLoaded(DEM)) return null;
  const meters = map.queryTerrainElevation(map.getCenter());
  return typeof meters === "number" && Number.isFinite(meters) ? Math.round(meters) : null;
}
