/**
 * Travel links for the event card's Ridez and Directions panels (owner, Nov 20).
 * One shared helper: every third-party link is a public web / universal URL that
 * opens in a NEW TAB (`target="_blank" rel="noopener noreferrer"`), never the
 * current tab, an in-app webview, an iframe or a sheet. On a phone with the app
 * installed, the OS may hand a universal URL to the app (app first); otherwise
 * the website opens. The venue is the destination wherever the URL supports it.
 */
export type TravelPlace = { name: string; address?: string | null; lat?: number | null; lng?: number | null };
export type TravelLink = { key: string; name: string; label: string; href: string; external: boolean; passesVenue: boolean };

/** Attributes every external travel link must carry. */
export const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;

const hasCoords = (p: TravelPlace): p is TravelPlace & { lat: number; lng: number } =>
  typeof p.lat === "number" && typeof p.lng === "number" && Number.isFinite(p.lat) && Number.isFinite(p.lng);
const enc = encodeURIComponent;
const where = (p: TravelPlace) => p.address?.trim() || p.name;

/** Ride websites: Lyft, Uber, TriMet. */
export function rideWebsiteLinks(p: TravelPlace): TravelLink[] {
  const c = hasCoords(p);
  return [
    {
      key: "lyft", name: "LYFT", label: "Get a Lyft (opens lyft.com in a new tab)", external: true, passesVenue: c,
      // Lyft SDK web mode: destination[latitude|longitude] only (no name/address parameter).
      href: c ? `https://ride.lyft.com/u?destination[latitude]=${p.lat}&destination[longitude]=${p.lng}` : "https://ride.lyft.com/",
    },
    {
      key: "uber", name: "UBER", label: "Get an Uber (opens uber.com in a new tab)", external: true, passesVenue: c,
      // m.uber.com web ride flow: drop[0] is a URL-encoded Location JSON.
      href: c
        ? `https://m.uber.com/go/product-selection?drop[0]=${enc(JSON.stringify({ latitude: p.lat, longitude: p.lng, addressLine1: p.name, addressLine2: p.address || "" }))}`
        : "https://m.uber.com/go/home",
    },
    {
      key: "trimet", name: "TRIMET", label: "Plan a TriMet trip (opens trimet.org in a new tab)", external: true, passesVenue: true,
      // TriMet trip planner: toPlace=<label>::<lat>,<lng>, or a place/address to geocode.
      href: `https://trimet.org/home/planner?toPlace=${enc(c ? `${p.name}::${p.lat},${p.lng}` : where(p))}`,
    },
  ];
}

/** Directions: Zaylist Mapz first (in-app), then Google Maps, Apple Maps, Waze, Citymapper. */
export function directionsLinks(p: TravelPlace): TravelLink[] {
  const c = hasCoords(p);
  const dest = c ? `${p.lat},${p.lng}` : where(p);
  const out: TravelLink[] = [
    {
      key: "zaylist", name: "ZAYLIST MAPZ", label: "Open in Zaylist Mapz", external: false, passesVenue: true,
      href: c ? `/placez/map?layer=events&lat=${p.lat}&lng=${p.lng}&zoom=15` : `/placez/map?layer=events&q=${enc(p.name)}`,
    },
    // Google Maps URLs (api=1): destination = coordinates or a place/address.
    { key: "google", name: "GOOGLE MAPS", label: "Directions in Google Maps (new tab)", external: true, passesVenue: true, href: `https://www.google.com/maps/dir/?api=1&destination=${enc(dest)}` },
    // Apple Map Links: daddr = destination; dirflg=d driving.
    { key: "apple", name: "APPLE MAPS", label: "Directions in Apple Maps (new tab)", external: true, passesVenue: true, href: `https://maps.apple.com/?daddr=${enc(dest)}&dirflg=d` },
    // Waze deep link: ll=<lat>,<lng>&navigate=yes (coordinates), or q=<address> search.
    { key: "waze", name: "WAZE", label: "Navigate with Waze (new tab)", external: true, passesVenue: true, href: c ? `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes` : `https://waze.com/ul?q=${enc(where(p))}&navigate=yes` },
  ];
  // Citymapper directions links need end coordinates (endcoord); skip it without them.
  if (c) out.push({ key: "citymapper", name: "CITYMAPPER", label: "Directions in Citymapper (new tab)", external: true, passesVenue: true, href: `https://citymapper.com/directions?endcoord=${p.lat},${p.lng}&endname=${enc(p.name)}${p.address ? `&endaddress=${enc(p.address)}` : ""}` });
  return out;
}
