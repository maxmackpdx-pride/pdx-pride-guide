import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";
import { ZaylistMap, ZaylistMapMarker } from "./ZaylistMap";
import {
  outzPlaceHref,
  type OutzCatalogPlace,
  type OutzCommunityStay,
  type OutzDestination,
} from "@shared/outz";
import { LIVE_MAP_CHROME_CSS, MAP_SURFACE_BG, mapPinHtml } from "@/components/ds/mapTheme";
import { outzPinHex } from "@/lib/outzKinds";

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
  const pins = [
    ...destinations.map(place => ({ place, detail: place.officialNotice?.summary ?? place.subtitle })),
    ...catalog.map(place => ({ place, detail: [place.kind, place.status ?? "Check official details"].join(" · ") })),
    ...stays.map(place => ({ place, detail: place.detail })),
  ];
  return (
    <div className="directory-map-wrap outz-map">
      <div className="directory-map outz-map__canvas pdx-map-live pdx-map-surface">
        <style>{LIVE_MAP_CHROME_CSS}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        <div className="pdx-map-live__shaft" aria-hidden="true" />
        {minimal ? null : <div className="outz-map__chip pdx-glass-rebind" aria-hidden="true"><span /> Live official sources</div>}
        <ZaylistMap ariaLabel="Outdoor destinations" center={center ? [center[1], center[0]] : [-122.6, 45.2]}
          zoom={(zoom ?? 7) - 1} minZoom={0} zoomControl={!minimal} memory={cameraMemory} accent={accent}
          style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}>
          {pins.map(({place, detail}) => {
            if(place.lat == null || place.lng == null) return null;
            return <ZaylistMapMarker key={place.id} label={place.name} position={[place.lng, place.lat]}
              popup={<PopupCard name={place.name} detail={detail} href={place.officialUrl} zHref={outzPlaceHref(place)} />}>
              <span aria-hidden="true" dangerouslySetInnerHTML={{__html: mapPinHtml(outzPinHex(place.name, place.kind))}} />
            </ZaylistMapMarker>;
          })}
        </ZaylistMap>
      </div>
    </div>
  );
}
