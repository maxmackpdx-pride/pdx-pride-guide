/**
 * Multi-location directory businesses: one brand card, several storefronts.
 *
 * Prefer `biz.locations` JSON when present; else known chain registry by name;
 * else a single primary address from the row.
 *
 * Fantasy Land (Foster) stays single-location. FANTASY (Fantasy for Adults Only)
 * is the multi-store chain.
 */
import { normalizeVenueKey } from "./venueLinks";

export type BusinessLocation = {
  label: string;
  address: string;
  phone?: string | null;
  hours?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type BusinessLocationSource = {
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  hours?: string | null;
  lat?: number | null;
  lng?: number | null;
  locations?: string | BusinessLocation[] | null;
};

/** Known multi-location chains (registry keyed by normalizeVenueKey). */
const MULTI_LOCATION_REGISTRY: Record<string, BusinessLocation[]> = {
  // Taboo Video — Broadway, SE 82nd, MLK, Vancouver WA
  "taboo video": [
    {
      label: "Broadway / Pearl",
      address: "311 NW Broadway, Portland, OR 97209",
      phone: "(503) 227-3443",
      hours: "Sun to Mon 11am to midnight, Tue to Sat 11am to 2am",
      lat: 45.5255,
      lng: -122.6785,
    },
    {
      label: "SE 82nd",
      address: "2330 SE 82nd Ave, Portland, OR 97216",
      phone: "(503) 206-4708",
      hours: "Open 24 hours",
      lat: 45.5054,
      lng: -122.5787,
    },
    {
      label: "MLK",
      address: "237 SE MLK Jr Blvd, Portland, OR 97214",
      phone: "(503) 239-1678",
      hours: "Sun to Thu 10am to midnight, Fri to Sat 10am to 2am",
      lat: 45.5208,
      lng: -122.6615,
    },
    {
      label: "Vancouver WA",
      address: "4811 NE 94th Ave, Vancouver, WA 98662",
      phone: "(360) 254-1126",
      hours: "Open 24 hours",
      lat: 45.6585,
      lng: -122.5535,
    },
  ],
  // Mr. Peeps — Portland 122nd, Beaverton, Aloha
  "mr peeps": [
    {
      label: "Portland (The Peep Hole)",
      address: "709 SE 122nd Ave, Portland, OR 97233",
      phone: "(503) 257-8617",
      hours: "Open 24 hours (confirm)",
      lat: 45.5178,
      lng: -122.5378,
    },
    {
      label: "Beaverton",
      address: "13355 SW Henry St, Beaverton, OR 97005",
      phone: "(503) 643-6645",
      hours: "Open 24 hours (confirm)",
      lat: 45.4865,
      lng: -122.816,
    },
    {
      label: "Aloha",
      address: "20625 SW Tualatin Valley Hwy, Aloha, OR 97003",
      phone: "(503) 356-5624",
      hours: "Open 24 hours (confirm)",
      lat: 45.4935,
      lng: -122.8715,
    },
  ],
  // FANTASY (Fantasy for Adults Only) — not Fantasy Land on Foster
  fantasy: [
    {
      label: "Hollywood / Sandy",
      address: "3137 NE Sandy Blvd, Portland, OR 97232",
      phone: "(503) 239-6969",
      hours: "10am to 12am",
      lat: 45.5328,
      lng: -122.6325,
    },
    {
      label: "Downtown / Burnside",
      address: "1703 W Burnside St, Portland, OR 97209",
      phone: "(503) 295-6969",
      hours: "12pm to 8pm",
      lat: 45.523,
      lng: -122.6895,
    },
    {
      label: "Tigard",
      address: "6440 SW Coronado Dr, Portland, OR 97219",
      phone: "(503) 244-6969",
      hours: "10am to 12am",
      lat: 45.4395,
      lng: -122.746,
    },
    {
      label: "Clackamas",
      address: "15536 SE 82nd Dr, Clackamas, OR 97015",
      phone: "(503) 203-6969",
      hours: "12pm to 8pm",
      lat: 45.3995,
      lng: -122.547,
    },
  ],
};

/** Alias keys → registry key (normalizeVenueKey form). */
const REGISTRY_ALIASES: Record<string, string> = {
  taboo: "taboo video",
  "taboo adult video": "taboo video",
  "taboo video pdx": "taboo video",
  "taboo pdx": "taboo video",
  "mr peeps adult superstores": "mr peeps",
  "the peep hole": "mr peeps",
  "peep hole": "mr peeps",
  "fantasy for adults only": "fantasy",
  "fantasy adults only": "fantasy",
  "fantasy portland": "fantasy",
  "fantasy oregon": "fantasy",
  "fantasy oregon portland": "fantasy",
};

function parseLocationsField(
  raw: string | BusinessLocation[] | null | undefined,
): BusinessLocation[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const cleaned = raw
      .filter((loc): loc is BusinessLocation => Boolean(loc && typeof loc === "object" && loc.address))
      .map(normalizeLocation);
    return cleaned.length > 0 ? cleaned : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;
    const cleaned = parsed
      .filter((loc): loc is BusinessLocation => {
        if (!loc || typeof loc !== "object") return false;
        const row = loc as BusinessLocation;
        return Boolean(row.address && String(row.address).trim());
      })
      .map(normalizeLocation);
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

function normalizeLocation(loc: BusinessLocation): BusinessLocation {
  return {
    label: String(loc.label || "").trim() || "Location",
    address: String(loc.address || "").trim(),
    phone: loc.phone != null && String(loc.phone).trim() ? String(loc.phone).trim() : null,
    hours: loc.hours != null && String(loc.hours).trim() ? String(loc.hours).trim() : null,
    lat: typeof loc.lat === "number" && Number.isFinite(loc.lat) ? loc.lat : null,
    lng: typeof loc.lng === "number" && Number.isFinite(loc.lng) ? loc.lng : null,
  };
}

function registryLocationsForName(name: string): BusinessLocation[] | null {
  const key = normalizeVenueKey(name);
  if (!key) return null;
  // Explicit: Fantasy Land is a single Foster shop, never the FANTASY chain.
  if (key === "fantasy land" || key === "fantasy on foster" || key === "fantasyland") {
    return null;
  }
  const registryKey = REGISTRY_ALIASES[key] || key;
  const list = MULTI_LOCATION_REGISTRY[registryKey];
  return list ? list.map(normalizeLocation) : null;
}

function primaryAsSingleLocation(biz: BusinessLocationSource): BusinessLocation[] {
  const address = (biz.address || "").trim();
  if (!address) return [];
  return [
    normalizeLocation({
      label: "Primary",
      address,
      phone: biz.phone,
      hours: biz.hours,
      lat: biz.lat,
      lng: biz.lng,
    }),
  ];
}

/**
 * Resolve locations for a directory business.
 * Order: stored JSON → known multi-loc registry by name → single primary address.
 */
export function resolveBusinessLocations(biz: BusinessLocationSource): BusinessLocation[] {
  const fromField = parseLocationsField(biz.locations);
  if (fromField && fromField.length > 0) return fromField;

  const fromRegistry = registryLocationsForName(biz.name);
  if (fromRegistry && fromRegistry.length > 0) return fromRegistry;

  return primaryAsSingleLocation(biz);
}

/** True when the business has more than one storefront. */
export function isMultiLocationBusiness(biz: BusinessLocationSource): boolean {
  return resolveBusinessLocations(biz).length > 1;
}
