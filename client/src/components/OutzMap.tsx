import IncidentalMapCamera from "./IncidentalMapCamera";
import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  outzPlaceHref,
  type OutzCatalogPlace,
  type OutzCommunityStay,
  type OutzDestination,
} from "@shared/outz";
import { LIVE_MAP_CHROME_CSS, MAP_PIN_SIZE, MAP_SURFACE_BG, mapPinHtml } from "@/components/ds/mapTheme";
import CartoVectorBasemap from "@/components/CartoVectorBasemap";
import { outzPinHex } from "@/lib/outzKinds";

const PIN_HALF = MAP_PIN_SIZE / 2;

function pin(color: string) {
  return divIcon({
    className: "",
    html: mapPinHtml(color),
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
    iconAnchor: [PIN_HALF, PIN_HALF],
    popupAnchor: [0, -PIN_HALF - 4],
  });
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize({ animate: false });
    const timers = [0, 80, 300, 1000].map(ms => setTimeout(refresh, ms));
    window.addEventListener("resize", refresh);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", refresh);
    };
  }, [map]);
  return null;
}

function PopupCard({ name, detail, href, zHref }: { name: string; detail: string; href?: string | null; zHref: string }) {
  return (
    <div className="outz-map-popup">
      <strong>{name}</strong>
      <span>{detail}</span>
      <a href={zHref}>Check in + chat</a>
      {href ? <a href={href} target="_blank" rel="noreferrer">Official details</a> : null}
    </div>
  );
}

type OutzMapProps = {
  cameraMemory?: IncidentalMapMemory;
  destinations: OutzDestination[];
  catalog: OutzCatalogPlace[];
  stays?: OutzCommunityStay[];
  /** Frame a single place instead of the whole region. */
  center?: [number, number];
  zoom?: number;
  /** Locator mode: no source chip, no zoom control. Attribution always stays. */
  minimal?: boolean;
  /** Vector basemap accent, e.g. Rooster orange / Sauvie green. */
  accent?: string | null;
};

export default function OutzMap({
  cameraMemory,
  destinations,
  catalog,
  stays = [],
  center,
  zoom,
  minimal = false,
  accent = null,
}: OutzMapProps) {
  const [savedView] = useState(() => cameraMemory?.current);
  return (
    <div className="directory-map-wrap outz-map">
      <div className="directory-map outz-map__canvas pdx-map-live pdx-map-surface">
        <style>{LIVE_MAP_CHROME_CSS}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        <div className="pdx-map-live__shaft" aria-hidden="true" />
        {minimal ? null : <div className="outz-map__chip pdx-glass-rebind" aria-hidden="true"><span /> Live official sources</div>}
        <MapContainer center={savedView?.center ?? center ?? [45.2, -122.6]} zoom={savedView?.zoom ?? zoom ?? 7} minZoom={1} zoomControl={!minimal} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}>
          <CartoVectorBasemap accent={accent} />
          <MapResizer />
          <IncidentalMapCamera memory={cameraMemory} />
          {destinations.map(place => (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={pin(outzPinHex(place.name, place.kind))}>
              <Popup><PopupCard name={place.name} detail={place.officialNotice?.summary ?? place.subtitle} href={place.officialUrl} zHref={outzPlaceHref(place)} /></Popup>
            </Marker>
          ))}
          {catalog.map(place => (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={pin(outzPinHex(place.name, place.kind))}>
              <Popup><PopupCard name={place.name} detail={`${place.kind} · ${place.status ?? "Check official details"}`} href={place.officialUrl} zHref={outzPlaceHref(place)} /></Popup>
            </Marker>
          ))}
          {stays.filter(place => place.lat != null && place.lng != null).map(place => (
            <Marker key={place.id} position={[place.lat!, place.lng!]} icon={pin(outzPinHex(place.name, place.kind))}>
              <Popup><PopupCard name={place.name} detail={place.detail} href={place.officialUrl} zHref={outzPlaceHref(place)} /></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
