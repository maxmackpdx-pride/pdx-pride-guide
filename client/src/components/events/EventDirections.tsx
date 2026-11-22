import { useState } from "react";
import { haversineMeters } from "@shared/geo";
import type { EventListing } from "@shared/multiDayEvents";

export function EventDirections({ event, google, apple }: { event: EventListing; google: string; apple: string }) {
  const [status, setStatus] = useState("");
  const [distance, setDistance] = useState("");
  const [locating, setLocating] = useState(false);
  const target = event.lat != null && event.lng != null ? { lat: event.lat, lng: event.lng } : null;
  const address = event.address || event.venueName;
  const waze = new URL("https://www.waze.com/ul");
  if (target) waze.searchParams.set("ll", target.lat + "," + target.lng);
  else waze.searchParams.set("q", address);
  waze.searchParams.set("navigate", "yes");
  const links = [
    ["Zaylist Mapz", `/placez/map?mode=mapz&item=event-${event.id}`],
    ["Google Maps", google], ["Apple Maps", apple], ["Waze", waze.href],
    ...(target ? [["Citymapper", "https://citymapper.com/directions?" + new URLSearchParams({
      endcoord: target.lat + "," + target.lng, endname: event.venueName, endaddress: address,
    })]] : []),
  ];
  const lyft = target
    ? `https://www.lyft.com/ride?id=lyft&destination[latitude]=${target.lat}&destination[longitude]=${target.lng}`
    : "https://www.lyft.com/ride?id=lyft";
  const uberParams = new URLSearchParams({
    action: "setPickup",
    "dropoff[nickname]": event.venueName,
    "dropoff[formatted_address]": address,
  });
  if (target) {
    uberParams.set("dropoff[latitude]", String(target.lat));
    uberParams.set("dropoff[longitude]", String(target.lng));
  }
  const rideShareLinks: Array<[string, string]> = [
    ["Lyft", lyft],
    ["Uber", `https://m.uber.com/ul/?${uberParams}`],
  ];
  const transitLinks: Array<[string, string]> = [
    ["Plan trip · TriMet", "https://trimet.org/planner"],
    ["MAX light rail", "https://www.trimet.org/max/index.htm"],
    ["Bus & transit directions", `${google}&travelmode=transit`],
  ];
  function locate() {
    if (!target || !navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const meters = haversineMeters({lat: coords.latitude, lng: coords.longitude}, target);
      setDistance(`${(meters / 1609.344).toFixed(1)} mi away in a straight line`);
      setLocating(false);
    }, () => { setLocating(false); setDistance("Location unavailable. Pick a map for a route."); }, { timeout: 8000, maximumAge: 60000 });
  }
  return <>
    <h3>{event.venueName}</h3><p>{address}</p>
    <button type="button" className="evz-x__link" onClick={async () => {
      try { await navigator.clipboard.writeText(address); setStatus("Address copied."); }
      catch { setStatus("Select the address above to copy it."); }
    }}>Copy address</button>
    {target && navigator.geolocation && <button type="button" className="evz-x__link" disabled={locating} onClick={locate}>{locating ? "Locating…" : "Distance from me"}</button>}
    <p role="status">{status} {distance}</p>
    <div className="evz-x__dirrow">{links.map(([label, href]) =>
      <a key={label} className="evz-x__link" href={href} target={href.startsWith("/") ? undefined : "_blank"} rel="noreferrer">{label}</a>
    )}</div>
    <h4 className="evz-x__dirlabel">Ride share</h4>
    <div className="evz-x__dirrow">{rideShareLinks.map(([label, href]) =>
      <a key={label} className="evz-x__link" href={href} target="_blank" rel="noreferrer">{label}</a>
    )}</div>
    <h4 className="evz-x__dirlabel">City transit</h4>
    <div className="evz-x__dirrow">{transitLinks.map(([label, href]) =>
      <a key={label} className="evz-x__link" href={href} target="_blank" rel="noreferrer">{label}</a>
    )}</div>
  </>;
}
