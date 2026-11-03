import L from "leaflet";
import type { MaplibreGL } from "@maplibre/maplibre-gl-leaflet";
import type { Map as MapLibreMap } from "maplibre-gl";

// Adapter 0.1.4's resize/transition handler queues an untracked animation frame.
// Leaflet can remove the layer before that frame runs and clear its _map reference.
// Keep the adapter's transition behavior, but own and cancel those deferred frames.
type AdapterLayer = InstanceType<typeof MaplibreGL>;
type TransitionLayer = AdapterLayer & {
  _map: L.Map | null;
  _glMap: MapLibreMap | null;
  _transitionEnd: () => void;
  _resizeContainer: () => void;
  _zoomEnd: () => void;
};

export function guardMaplibreLayerLifecycle(layer: AdapterLayer): void {
  const adapter = layer as TransitionLayer;
  const frames = new Set<number>();
  const remove = adapter.onRemove;
  adapter._transitionEnd = () => {
    const map = adapter._map;
    const gl = adapter._glMap;
    if (!map || !gl) return;
    const frame = L.Util.requestAnimFrame(() => {
      frames.delete(frame);
      if (adapter._map !== map || adapter._glMap !== gl) return;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const offset = map.latLngToContainerPoint(map.getBounds().getNorthWest());
      adapter._resizeContainer();
      L.DomUtil.setTransform(gl.getCanvas(), offset, 1);
      gl.once("moveend", () => {
        if (adapter._map === map && adapter._glMap === gl) adapter._zoomEnd();
      });
      gl.jumpTo({ center, zoom: zoom - 1 });
    });
    frames.add(frame);
  };
  adapter.onRemove = function (map: L.Map) {
    for (const frame of frames) L.Util.cancelAnimFrame(frame);
    frames.clear();
    return remove.call(this, map);
  };
}
