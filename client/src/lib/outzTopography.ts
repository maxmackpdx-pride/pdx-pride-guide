import maplibregl, { type Map } from "maplibre-gl";
import mlcontour from "maplibre-contour";

// Share one DEM worker/cache across OutZide map mounts.
let elevation: InstanceType<typeof mlcontour.DemSource> | undefined;
export function addOutzTopography(map: Map) {
  if (!elevation) {
    elevation = new mlcontour.DemSource({
      id: "outz-elevation",
      url: "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
      encoding: "terrarium", maxzoom: 13, worker: true, cacheSize: 64,
    });
    elevation.setupMaplibre(maplibregl);
  }
  map.addSource("outz-dem", {
    type: "raster-dem", tiles: [elevation.sharedDemProtocolUrl],
    encoding: "terrarium", tileSize: 256, maxzoom: 13,
  });
  // Keep terrain below water, roads, and place labels.
  const before = map.getLayer("water") ? "water" : undefined;
  map.addLayer({
    id: "outz-relief", type: "hillshade", source: "outz-dem",
    paint: {
      "hillshade-shadow-color": "#000000",
      "hillshade-highlight-color": "#B6FF00",
      "hillshade-accent-color": "#416014",
      "hillshade-exaggeration": 0.65,
    },
  }, before);
  map.addSource("outz-contours", {
    type: "vector", maxzoom: 15,
    tiles: [elevation.contourProtocolUrl({
      multiplier: 3.28084,
      thresholds: { 6: [2000, 10000], 8: [1000, 5000], 10: [500, 2000], 12: [100, 500], 14: [50, 200], 15: [20, 100] },
      contourLayer: "contours", elevationKey: "ele", levelKey: "level",
    })],
  });
  map.addLayer({
    id: "outz-contour-lines", type: "line", source: "outz-contours",
    "source-layer": "contours", minzoom: 6,
    paint: {
      "line-color": "#df6a23",
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.2, 11, 0.5],
      "line-width": ["match", ["get", "level"], 1, 0.9, 0.4],
    },
  }, before);
  const font = map.getStyle().layers?.find(layer => layer.type === "symbol" && layer.layout?.["text-font"]);
  map.addLayer({
    id: "outz-contour-labels", type: "symbol", source: "outz-contours",
    "source-layer": "contours", minzoom: 12,
    filter: [">", ["get", "level"], 0],
    layout: {
      "symbol-placement": "line", "text-size": 10,
      "text-field": ["concat", ["to-string", ["get", "ele"]], " ft"],
      "text-font": font?.type === "symbol" ? font.layout?.["text-font"] : ["Open Sans Regular"],
    },
    paint: { "text-color": "#d3a381", "text-halo-color": "#281811", "text-halo-width": 1 },
  }, before);
}
