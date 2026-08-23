import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { outzPlaceHref, type OutzCatalogPlace, type OutzDestination } from "@shared/outz";
import { LIVE_MAP_CHROME_CSS, MAP_PIN_SIZE, MAP_SURFACE_BG, mapPinHtml } from "@/components/ds/mapTheme";

const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}{x}{r}.png".replace("{z}/{y}{x}", "{z}/{x}/{y}");
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

export default function OutzMap({ destinations, catalog }: { destinations: OutzDestination[]; catalog: OutzCatalogPlace[] }) {
  return (
    <div className="directory-map-wrap outz-map">
      <div className="directory-map outz-map__canvas pdx-map-live pdx-map-surface">
        <style>{LIVE_MAP_CHROME_CSS}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        <div className="pdx-map-live__shaft" aria-hidden="true" />
        <div className="outz-map__chip" aria-hidden="true"><span /> Live official sources</div>
        <MapContainer center={[45.2, -122.6]} zoom={7} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: MAP_SURFACE_BG }}>
          <TileLayer
            url={DARK_TILE}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
            subdomains="abcd"
          />
          <MapResizer />
          {destinations.map(place => (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={pin("#ff8a1f")}>
              <Popup><PopupCard name={place.name} detail={place.subtitle} href={place.officialUrl} zHref={outzPlaceHref(place)} /></Popup>
            </Marker>
          ))}
          {catalog.slice(0, 35).map(place => (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={pin("#19e3ff")}>
              <Popup><PopupCard name={place.name} detail={`${place.kind} · ${place.status ?? "Check official details"}`} href={place.officialUrl} zHref={outzPlaceHref(place)} /></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
