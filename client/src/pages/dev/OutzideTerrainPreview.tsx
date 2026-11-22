import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Map as LibreMap } from "maplibre-gl";
import { ZaylistMap, ZaylistMapMarker, useZaylistMap } from "@/components/ZaylistMap";
import release from "@shared/mapReleaseLock.json";
import { applyTerrainComparison, sampledElevation } from "./outzideTerrainLayers";
import "./OutzideTerrainPreview.css";

type Place = {
  id: string; name: string; kind: string; lat: number; lng: number;
  accent?: string; officialUrl?: string; sourceName?: string;
};
const cameras = [
  { id: "silver-falls", label: "Silver Falls", zoom: 11.8 },
  { id: "bagby-hot-springs", label: "Bagby Hot Springs", zoom: 12.4 },
  { id: "winter-timberline", label: "Timberline", zoom: 11.4 },
];
const glyphs = new Set(["atv", "beach", "boating", "camp", "day-use", "fishing", "nude-recreation", "spring", "stay", "trail", "watercamp", "winter", "winter-closed"]);

function Waypoint({ place }: { place: Place }) {
  const glyph = place.kind === "dayuse" ? "day-use" : place.kind === "coastcamp" ? "camp" : place.kind;
  return <ZaylistMapMarker position={[place.lng, place.lat]} label={place.name} className="terrain-preview__waypoint"
    popup={<div className="terrain-preview__popup"><strong>{place.name}</strong><small>{place.sourceName}</small>
      <a href={`/map?mode=outzide&place=${encodeURIComponent(place.id)}`}>Open Outzide card</a>
      {place.officialUrl && <a href={place.officialUrl} target="_blank" rel="noreferrer">Official site</a>}
    </div>}>
    {glyphs.has(glyph)
      ? <img alt="" src={`${release.base}waypoints/outzide-new/outzide-${glyph}.svg`} />
      : <span className="terrain-preview__other-pin" />}
  </ZaylistMapMarker>;
}

function Scene({ relief, places, onReady, onElevation, onCamera }: {
  relief: boolean; places: Place[]; onReady: (map: LibreMap | null) => void;
  onElevation: (meters: number | null) => void; onCamera: (pitch: number, bearing: number) => void;
}) {
  const map = useZaylistMap();
  const [pins, setPins] = useState<Place[]>([]);
  useEffect(() => {
    if (!map) return;
    onReady(map);
    const update = () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const visible = places.filter(p => Number.isFinite(p.lng) && Number.isFinite(p.lat) && bounds.contains([p.lng, p.lat]));
      const distance = (p: Place) => Math.hypot(p.lng - center.lng, p.lat - center.lat);
      setPins(visible.sort((a, b) => distance(a) - distance(b)).slice(0, 40));
      onCamera(Math.round(map.getPitch()), Math.round(map.getBearing()));
    };
    update();
    map.on("moveend", update);
    return () => { map.off("moveend", update); onReady(null); };
  }, [map, places, onReady, onCamera]);
  useEffect(() => {
    if (!map) return;
    onElevation(null);
    const apply = () => applyTerrainComparison(map, relief);
    const read = () => onElevation(relief ? sampledElevation(map) : null);
    // A ready style may still be waiting on some of its tiles.
    if (map.getStyle()?.layers?.length) apply();
    map.on("style.load", apply);
    map.on("idle", read);
    map.on("moveend", read);
    return () => {
      map.off("style.load", apply);
      map.off("idle", read);
      map.off("moveend", read);
    };
  }, [map, relief, onElevation]);
  return <>{pins.map(place => <Waypoint key={place.id} place={place} />)}</>;
}

export default function OutzideTerrainPreview() {
  const catalog = useQuery<{ places: Place[] }>({
    queryKey: ["/outzide-map/places.json", "terrain-preview"],
    queryFn: async () => {
      const response = await fetch("/outzide-map/places.json");
      if (!response.ok) throw new Error("Destination catalog could not load.");
      return response.json();
    },
    staleTime: 3600_000,
  }, queryClient);
  const [relief, setRelief] = useState(true);
  const [selected, setSelected] = useState(cameras[0].id);
  const [map, setMap] = useState<LibreMap | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [camera, setCamera] = useState({ pitch: 55, bearing: -20 });
  const silver = catalog.data?.places.find(place => place.id === cameras[0].id);
  const current = catalog.data?.places.find(place => place.id === selected);

  function focusPlace(id: string) {
    const place = catalog.data?.places.find(p => p.id === id);
    const camera = cameras.find(c => c.id === id);
    if (place && camera) {
      setSelected(id);
      map?.jumpTo({ center: [place.lng, place.lat], zoom: camera.zoom, pitch: 55, bearing: -20 });
    }
  }
  function movePitch(pitch: number) {
    setCamera(previous => ({ ...previous, pitch }));
    map?.jumpTo({ pitch });
  }
  function moveBearing(bearing: number) {
    setCamera(previous => ({ ...previous, bearing }));
    map?.jumpTo({ bearing });
  }
  const updateCamera = useCallback((pitch: number, bearing: number) => {
    setCamera(previous => previous.pitch === pitch && previous.bearing === bearing ? previous : { pitch, bearing });
  }, []);
  useEffect(() => {
    if (map) map.jumpTo({ pitch: 55, bearing: -20 });
  }, [map]);

  return <main className="terrain-preview">
    <header className="terrain-preview__header">
      <img src="/outzide-native/outzide-full.png" alt="Outzide" />
      <h1>Terrain study</h1>
    </header>
    {catalog.isError ? <p role="alert">Destinations could not load. <button onClick={() => catalog.refetch()}>Retry</button></p>
      : !silver || !catalog.data || !current ? <p role="status">Loading destinations…</p>
      : <>
        <section className="terrain-preview__board" aria-label="Terrain comparison">
          <div className="terrain-preview__toolbar">
            <label htmlFor="terrain-site">Destination</label>
            <select id="terrain-site" value={selected} onChange={event => focusPlace(event.target.value)}>
              {cameras.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <div role="group" aria-label="Map treatment" className="terrain-preview__switch">
              <button aria-pressed={!relief} onClick={() => setRelief(false)}>Flat locator</button>
              <button aria-pressed={relief} onClick={() => setRelief(true)}>3D relief</button>
            </div>
          </div>
          <ZaylistMap allow3D center={[silver.lng, silver.lat]} zoom={cameras[0].zoom} minZoom={5} maxZoom={16}
            ariaLabel="Outzide terrain comparison map" className="terrain-preview__map" accent={silver.accent} zoomControl scrollZoom>
            <Scene relief={relief} places={catalog.data.places} onReady={setMap} onElevation={setElevation} onCamera={updateCamera}/>
          </ZaylistMap>
          <div className="terrain-preview__controls">
            <label>Pitch <output>{camera.pitch}°</output>
              <input aria-label="Camera pitch" type="range" min="0" max="70" value={camera.pitch} onChange={e => movePitch(Number(e.target.value))}/>
            </label>
            <label>Rotate <output>{camera.bearing}°</output>
              <input aria-label="Camera bearing" type="range" min="-180" max="180" value={camera.bearing} onChange={e => moveBearing(Number(e.target.value))}/>
            </label>
            <button onClick={() => focusPlace(selected)}>Reset view</button>
          </div>
        </section>
        <footer>
          <strong>{current.name}</strong>
          <p role="status">{relief ? elevation === null ? "Waiting for elevation tiles." : `Elevation at map center · ${elevation.toLocaleString()} m` : "Flat locator · Dark Matter"}</p>
          <a href={`/map?mode=outzide&place=${encodeURIComponent(current.id)}`}>Open original Outzide ↗</a>
          <small>Map © OpenStreetMap contributors, CARTO. Elevation <a href="https://mapterhorn.com/attribution/" target="_blank" rel="noreferrer">Mapterhorn</a>. Trails from the U.S. Forest Service.</small>
        </footer>
      </>}
  </main>;
}
