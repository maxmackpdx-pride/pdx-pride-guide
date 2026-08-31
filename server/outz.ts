import { sqlite } from "./storage";
import { OUTZ_COMMUNITY_STAYS, OUTZ_SOURCES, type OutzAlert, type OutzCatalogPlace, type OutzDestination, type OutzSnapshot } from "@shared/outz";

const CACHE_ID = 1;
const CACHE_TTL_MS = 20 * 60 * 1000;
const MIN_REFRESH_GAP_MS = 30 * 1000;
const NWS_USER_AGENT = "Zaylist Outz/1.0 (+https://www.zaylist.com)";

let lastForcedRefreshAt = 0;

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS outz_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
  `);
} catch (error) {
  console.error("outz_cache migration failed:", error);
}

function readCache(): OutzSnapshot | null {
  const row = sqlite.prepare("SELECT payload, fetched_at AS fetchedAt FROM outz_cache WHERE id = ?")
    .get(CACHE_ID) as { payload: string; fetchedAt: string } | undefined;
  if (!row?.payload) return null;
  try {
    const snapshot = JSON.parse(row.payload) as OutzSnapshot;
    snapshot.fetchedAt ||= row.fetchedAt;
    // Community stays and the source ledger are reviewed data shipped with the
    // app, not remote feeds. Keep cached live conditions and catalog records,
    // but never let an older serialized payload hide a verified correction
    // after deploy.
    snapshot.communityStays = OUTZ_COMMUNITY_STAYS;
    snapshot.sources = OUTZ_SOURCES;
    return snapshot;
  } catch {
    return null;
  }
}

function writeCache(snapshot: OutzSnapshot) {
  sqlite.prepare(`
    INSERT INTO outz_cache (id, payload, fetched_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at
  `).run(CACHE_ID, JSON.stringify(snapshot), snapshot.fetchedAt);
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/geo+json, application/json", ...headers },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
  }
}

type FeaturedConfig = Omit<OutzDestination, "sourceStatus" | "forecast" | "airTempF" | "wind" | "alerts"> & {
  statePark?: "oregon" | "washington";
};

// Each feature has a direct, official visitor page. This is a deliberate small
// launch set; the USFS catalog below is the broader live source, not a scraped list.
const FEATURED: FeaturedConfig[] = [
  {
    id: "silver-falls",
    name: "Silver Falls State Park",
    subtitle: "Campground · Trail of Ten Falls · Silverton, OR",
    kind: "camp-hike",
    lat: 44.876667,
    lng: -122.64805,
    officialUrl: "https://stateparks.oregon.gov/?do=park.profile&parkId=151",
    sourceName: "Oregon Parks and Recreation Department",
    statePark: "oregon",
  },
  {
    id: "cape-lookout",
    name: "Cape Lookout State Park",
    subtitle: "Camping · Cape Trail · Tillamook, OR",
    kind: "camp-hike",
    lat: 45.349,
    lng: -123.971,
    officialUrl: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=134",
    sourceName: "Oregon Parks and Recreation Department",
    statePark: "oregon",
  },
  {
    id: "beacon-rock",
    name: "Beacon Rock State Park",
    subtitle: "Camping · Gorge trails · Skamania, WA",
    kind: "camp-hike",
    lat: 45.62318,
    lng: -122.0253,
    officialUrl: "https://parks.wa.gov/find-parks/state-parks/beacon-rock-state-park",
    sourceName: "Washington State Parks",
    statePark: "washington",
  },
  {
    id: "stub-stewart",
    name: 'L.L. "Stub" Stewart State Park',
    subtitle: "Camping · Multi-use trails · Oregon Coast Range",
    kind: "camp-hike",
    // Center of the official Oregon Parks boundary, not a claimed trailhead.
    lat: 45.728645,
    lng: -123.186849,
    officialUrl: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=75",
    sourceName: "Oregon Parks and Recreation Department",
    statePark: "oregon",
  },
  {
    id: "memaloose",
    name: "Memaloose State Park",
    subtitle: "Campground · Columbia River Gorge · Near The Dalles, OR",
    kind: "camp-hike",
    // Center of the official Oregon Parks boundary, not a claimed campsite or trailhead.
    lat: 45.695376,
    lng: -121.332886,
    officialUrl: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=118",
    sourceName: "Oregon Parks and Recreation Department",
    statePark: "oregon",
  },
];

type NwsPoints = { properties?: { forecast?: string } };
type NwsForecast = { properties?: { periods?: Array<{ isDaytime?: boolean; shortForecast?: string; temperature?: number; windDirection?: string; windSpeed?: string }> } };
type NwsAlerts = { features?: Array<{ properties?: { headline?: string; severity?: string; ends?: string | null; expires?: string | null } }> };

async function fetchConditions(destination: FeaturedConfig): Promise<Pick<OutzDestination, "forecast" | "airTempF" | "wind" | "alerts">> {
  const empty = { forecast: null, airTempF: null, wind: null, alerts: [] as OutzAlert[] };
  try {
    const point = await fetchJson<NwsPoints>(`https://api.weather.gov/points/${destination.lat},${destination.lng}`, { "User-Agent": NWS_USER_AGENT });
    const forecastUrl = point.properties?.forecast;
    const [forecast, alertData] = await Promise.all([
      forecastUrl ? fetchJson<NwsForecast>(forecastUrl, { "User-Agent": NWS_USER_AGENT }) : Promise.resolve(null),
      fetchJson<NwsAlerts>(`https://api.weather.gov/alerts/active?point=${destination.lat},${destination.lng}`, { "User-Agent": NWS_USER_AGENT }),
    ]);
    const period = forecast?.properties?.periods?.find(item => item.isDaytime) ?? forecast?.properties?.periods?.[0];
    const alerts = (alertData.features ?? []).slice(0, 3).flatMap(feature => {
      const props = feature.properties;
      if (!props?.headline) return [];
      return [{ headline: props.headline, severity: props.severity ?? null, endsAt: props.ends ?? props.expires ?? null }];
    });
    return {
      forecast: period?.shortForecast ?? null,
      airTempF: Number.isFinite(period?.temperature) ? period!.temperature! : null,
      wind: period?.windDirection && period.windSpeed ? `${period.windDirection} ${period.windSpeed}` : period?.windSpeed ?? null,
      alerts,
    };
  } catch {
    return empty;
  }
}

type ArcGisFeature<T> = { attributes?: T };
type ArcGisResponse<T> = { features?: Array<ArcGisFeature<T>> };

// The newer RecInfra layer currently returns a 404 for spatial-envelope
// queries. The Forest Service's maintained INFRA layer carries the public
// recreation-site records, including coordinates and official visitor links.
const USFS_QUERY = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_InfraRecreationSites_01/MapServer/0/query";

async function fetchUsfsCatalog(): Promise<OutzCatalogPlace[]> {
  try {
    const query = new URLSearchParams({
      f: "json",
      // ArcGIS's spatial-envelope endpoint is currently unavailable on this
      // official service. These coordinate attributes are part of the same
      // published record and preserve the Oregon + southern Washington scope.
      where: "site_subtype IN ('CAMPGROUND','TRAILHEAD') AND latitude >= 42 AND latitude <= 46.5 AND longitude >= -124.8 AND longitude <= -120",
      outFields: "site_cn,site_name,site_subtype,development_status,recarea_status,rec1stop_url,usda_portal_url,latitude,longitude",
      returnGeometry: "false",
      resultRecordCount: "80",
      orderByFields: "site_name",
    });
    type Attrs = { site_cn?: string; site_name?: string; site_subtype?: string; development_status?: string; recarea_status?: string; rec1stop_url?: string; usda_portal_url?: string; latitude?: number; longitude?: number };
    const data = await fetchJson<ArcGisResponse<Attrs>>(`${USFS_QUERY}?${query}`);
    return (data.features ?? []).flatMap(feature => {
      const place = feature.attributes;
      if (!place?.site_name || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return [];
      const kind = place.site_subtype === "CAMPGROUND" ? "campground" : place.site_subtype === "TRAILHEAD" ? "trailhead" : null;
      if (!kind) return [];
      const accessStatus = place.recarea_status && place.recarea_status !== "None" ? place.recarea_status : null;
      return [{
        id: `usfs-${place.site_cn ?? `${place.latitude}-${place.longitude}`}`,
        name: place.site_name.replace(/\s+/g, " ").trim(),
        kind,
        lat: place.latitude!,
        lng: place.longitude!,
        status: accessStatus ?? place.development_status ?? null,
        statusReason: accessStatus,
        officialUrl: place.usda_portal_url ?? place.rec1stop_url ?? null,
        sourceName: "US Forest Service Recreation Sites",
      }];
    });
  } catch (error) {
    console.error("Outz USFS catalog refresh failed:", error);
    return [];
  }
}

async function fetchStateParkStatuses(): Promise<Map<string, string>> {
  const statuses = new Map<string, string>();
  const oregonQuery = new URLSearchParams({
    f: "json", where: `FULL_NAME IN ('Silver Falls State Park','Cape Lookout State Park','L.L. "Stub" Stewart State Park','Memaloose State Park')`,
    outFields: "FULL_NAME,USE_TYPE", returnGeometry: "false",
  });
  const washingtonQuery = new URLSearchParams({
    f: "json", where: "ParkName = 'Beacon Rock'", outFields: "ParkName,PublicRoadAccess", returnGeometry: "false",
  });
  try {
    const [oregon, washington] = await Promise.all([
      fetchJson<ArcGisResponse<{ FULL_NAME?: string; USE_TYPE?: string }>>(`https://maps.prd.state.or.us/arcgis/rest/services/Land_ownership/Oregon_State_Parks/MapServer/0/query?${oregonQuery}`),
      fetchJson<ArcGisResponse<{ ParkName?: string; PublicRoadAccess?: string }>>(`https://services5.arcgis.com/4LKAHwqnBooVDUlX/arcgis/rest/services/ParkBoundaries/FeatureServer/2/query?${washingtonQuery}`),
    ]);
    for (const row of oregon.features ?? []) {
      if (row.attributes?.FULL_NAME) statuses.set(row.attributes.FULL_NAME, row.attributes.USE_TYPE ?? "Official park record");
    }
    for (const row of washington.features ?? []) {
      if (row.attributes?.ParkName === "Beacon Rock") statuses.set("Beacon Rock State Park", row.attributes.PublicRoadAccess ? `Road access: ${row.attributes.PublicRoadAccess}` : "Official park record");
    }
  } catch (error) {
    console.error("Outz state-park refresh failed:", error);
  }
  return statuses;
}

export async function refreshOutzSnapshot(): Promise<OutzSnapshot> {
  const [conditions, catalog, stateStatuses] = await Promise.all([
    Promise.all(FEATURED.map(fetchConditions)),
    fetchUsfsCatalog(),
    fetchStateParkStatuses(),
  ]);
  const snapshot: OutzSnapshot = {
    fetchedAt: new Date().toISOString(),
    destinations: FEATURED.map((destination, index) => ({
      ...destination,
      ...conditions[index],
      sourceStatus: stateStatuses.get(destination.name) ?? null,
    })),
    catalog,
    communityStays: OUTZ_COMMUNITY_STAYS,
    sources: OUTZ_SOURCES,
  };
  writeCache(snapshot);
  return snapshot;
}

export async function getOutzSnapshot(options?: { force?: boolean }) {
  const cached = readCache();
  const stale = !cached || Date.now() - new Date(cached.fetchedAt).getTime() > CACHE_TTL_MS;
  if (!options?.force && cached && !stale) return { data: cached, stale: false, fromCache: true };
  if (!options?.force && cached && stale) {
    void refreshOutzSnapshot().catch(error => console.error("Outz background refresh failed:", error));
    return { data: cached, stale: true, fromCache: true };
  }
  return { data: await refreshOutzSnapshot(), stale: false, fromCache: false };
}

export async function forceRefreshOutzSnapshot() {
  const now = Date.now();
  if (now - lastForcedRefreshAt < MIN_REFRESH_GAP_MS) {
    const cached = readCache();
    if (cached) return { data: cached, rateLimited: true };
  }
  lastForcedRefreshAt = now;
  return { data: await refreshOutzSnapshot(), rateLimited: false };
}
