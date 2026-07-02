import type { Business } from "@shared/schema";

export type MapCoordinateFields = {
  venueName?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type MapCoordinates = { lat: number; lng: number };

function normalizeVenueKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddressKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/,?\s*portland,?\s*(or|oregon)?\s*\d{0,5}(-\d{4})?/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasMapCoordinates(fields: MapCoordinateFields): boolean {
  return (
    typeof fields.lat === "number" &&
    Number.isFinite(fields.lat) &&
    typeof fields.lng === "number" &&
    Number.isFinite(fields.lng)
  );
}

export function eventMatchesBusiness(
  event: MapCoordinateFields & { venueName: string },
  business: MapCoordinateFields & { name?: string; venueName?: string },
): boolean {
  const eventVenueKey = normalizeVenueKey(event.venueName);
  const businessKey = normalizeVenueKey(business.name || business.venueName || "");
  const eventAddressKey = event.address ? normalizeAddressKey(event.address) : "";
  const businessAddressKey = business.address ? normalizeAddressKey(business.address) : "";

  if (eventAddressKey && businessAddressKey && eventAddressKey === businessAddressKey) {
    return true;
  }

  if (eventVenueKey && businessKey) {
    if (eventVenueKey === businessKey) return true;
    if (eventVenueKey.length >= 4 && businessKey.length >= 4) {
      if (eventVenueKey.includes(businessKey) || businessKey.includes(eventVenueKey)) return true;
    }
  }

  if (hasMapCoordinates(event) && hasMapCoordinates(business)) {
    const latDiff = Math.abs(event.lat! - business.lat!);
    const lngDiff = Math.abs(event.lng! - business.lng!);
    if (latDiff < 0.0003 && lngDiff < 0.0003) return true;
  }

  return false;
}

export function resolveCoordinatesFromDirectory(
  venueName?: string | null,
  address?: string | null,
  businesses: Business[] = [],
): MapCoordinates | null {
  const venueKey = venueName ? normalizeVenueKey(venueName) : "";
  const addressKey = address ? normalizeAddressKey(address) : "";

  if (addressKey) {
    for (const biz of businesses) {
      if (!biz.address || biz.lat == null || biz.lng == null) continue;
      if (normalizeAddressKey(biz.address) === addressKey) {
        return { lat: biz.lat, lng: biz.lng };
      }
    }
  }

  if (venueKey) {
    for (const biz of businesses) {
      if (biz.lat == null || biz.lng == null) continue;
      const bizKey = normalizeVenueKey(biz.name);
      if (!bizKey) continue;
      if (bizKey === venueKey) return { lat: biz.lat, lng: biz.lng };
    }

    for (const biz of businesses) {
      if (biz.lat == null || biz.lng == null) continue;
      const bizKey = normalizeVenueKey(biz.name);
      if (!bizKey || bizKey.length < 4 || venueKey.length < 4) continue;
      if (venueKey.includes(bizKey) || bizKey.includes(venueKey)) {
        return { lat: biz.lat, lng: biz.lng };
      }
    }
  }

  return null;
}

export function mergeMapCoordinates<T extends MapCoordinateFields>(
  fields: T,
  businesses: Business[] = [],
): T {
  if (hasMapCoordinates(fields)) return fields;
  const coords = resolveCoordinatesFromDirectory(fields.venueName, fields.address, businesses);
  if (!coords) return fields;
  return { ...fields, lat: coords.lat, lng: coords.lng };
}

function buildGeocodeQuery(address?: string | null, venueName?: string | null): string | null {
  const parts = [address, venueName].map(v => String(v || "").trim()).filter(Boolean);
  if (!parts.length) return null;
  const joined = parts.join(", ");
  if (/portland|,\s*or\b/i.test(joined)) return joined;
  return `${joined}, Portland, OR`;
}

export async function geocodePortlandLocation(
  address?: string | null,
  venueName?: string | null,
): Promise<MapCoordinates | null> {
  const query = buildGeocodeQuery(address, venueName);
  if (!query) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: { "User-Agent": "PDXPrideGuide/1.0 (map-sync)" },
    });
    if (!response.ok) return null;

    const results = await response.json() as Array<{ lat?: string; lon?: string }>;
    const hit = results[0];
    if (!hit?.lat || !hit.lon) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function resolvePersistedMapCoordinates(
  fields: MapCoordinateFields,
  businesses: Business[] = [],
): Promise<MapCoordinates | null> {
  if (hasMapCoordinates(fields)) {
    return { lat: fields.lat!, lng: fields.lng! };
  }

  const fromDirectory = resolveCoordinatesFromDirectory(fields.venueName, fields.address, businesses);
  if (fromDirectory) return fromDirectory;

  return geocodePortlandLocation(fields.address, fields.venueName);
}