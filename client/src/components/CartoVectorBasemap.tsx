import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CARTO_ATTRIBUTION,
  cartoDarkTileUrl,
  cartoDarkVectorStyleUrl,
  cartoTransformRequest,
  mixHex,
} from "@/lib/mapTiles";

const WATER_BASE = "#2C353C";
const PARK_BASE = "#0e0e0e";

type Props = {
  /** Optional place accent (Rooster orange / Sauvie green) mixed into water and parks. */
  accent?: string | null;
};

export default function CartoVectorBasemap({ accent }: Props) {
  const map = useMap();

  useEffect(() => {
    const raster = L.tileLayer(cartoDarkTileUrl(), {
      attribution: CARTO_ATTRIBUTION,
      subdomains: "abcd",
      maxZoom: 20,
    });
    raster.addTo(map);

    const layer = maplibreGL({
      style: cartoDarkVectorStyleUrl(),
      minZoom: 1,
      transformRequest: cartoTransformRequest,
    });
    Object.assign(layer.options, { attribution: CARTO_ATTRIBUTION });
    layer.addTo(map);

    const gl = layer.getMaplibreMap();
    const applyAccent = () => {
      if (!accent) return;
      const water = mixHex(WATER_BASE, accent, 0.22);
      const park = mixHex(PARK_BASE, accent, 0.16);
      if (gl.getLayer("water")) gl.setPaintProperty("water", "fill-color", water);
      if (gl.getLayer("park_national_park")) gl.setPaintProperty("park_national_park", "fill-color", park);
      if (gl.getLayer("park_nature_reserve")) gl.setPaintProperty("park_nature_reserve", "fill-color", park);
      if (gl.getLayer("landcover")) gl.setPaintProperty("landcover", "fill-color", park);
      if (gl.getLayer("watername_lake")) gl.setPaintProperty("watername_lake", "text-color", mixHex("#8a8a8a", accent, 0.45));
    };

    const onVectorLoad = () => {
      applyAccent();
      map.removeLayer(raster);
    };
    if (gl.loaded()) onVectorLoad();
    else gl.once("load", onVectorLoad);

    return () => {
      gl.off("load", onVectorLoad);
      map.removeLayer(layer);
      if (map.hasLayer(raster)) map.removeLayer(raster);
    };
  }, [map, accent]);

  return null;
}
