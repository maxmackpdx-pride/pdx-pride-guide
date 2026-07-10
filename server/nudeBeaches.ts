import { sqlite } from "./storage";
import {
  crossingBandFromLevel,
  SAUVIE_ISLAND_PARKING_URL,
  type NudeBeachesSnapshot,
  type RoosterRockLive,
  type SauvieIslandLive,
  type SwimGuideStatus,
} from "@shared/nudeBeaches";

const CACHE_ID = 1;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MIN_REFRESH_GAP_MS = 30 * 1000;

let lastForcedRefreshAt = 0;

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS nude_beach_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
  `);
} catch (e) {
  console.error("nude_beach_cache migration failed:", e);
}

function readCache(): NudeBeachesSnapshot | null {
  const row = sqlite
    .prepare(`SELECT payload, fetched_at AS fetchedAt FROM nude_beach_cache WHERE id = ?`)
    .get(CACHE_ID) as { payload: string; fetchedAt: string } | undefined;
  if (!row?.payload) return null;
  try {
    const parsed = JSON.parse(row.payload) as NudeBeachesSnapshot;
    if (!parsed.fetchedAt) parsed.fetchedAt = row.fetchedAt;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snapshot: NudeBeachesSnapshot) {
  sqlite
    .prepare(
      `INSERT INTO nude_beach_cache (id, payload, fetched_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
    )
    .run(CACHE_ID, JSON.stringify(snapshot), snapshot.fetchedAt);
}

async function fetchText(url: string, timeoutMs = 12_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PDX-Pride-Guide/1.0 (+https://www.prideguidepdx.com)",
        Accept: "text/html,application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const text = await fetchText(url);
  return JSON.parse(text) as T;
}

async function fetchUsgsRiverLevel(): Promise<{ ft: number; at: string } | null> {
  const data = await fetchJson<{
    value: {
      timeSeries: Array<{
        values: Array<{ value: Array<{ value: string; dateTime: string }> }>;
      }>;
    };
  }>(
    "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14128870&parameterCd=00065&siteStatus=all",
  );
  const point = data.value?.timeSeries?.[0]?.values?.[0]?.value?.[0];
  if (!point?.value) return null;
  const ft = Number(point.value);
  if (!Number.isFinite(ft)) return null;
  return { ft, at: point.dateTime };
}

type NwsForecast = {
  data?: {
    text?: string[];
    temperature?: string[];
    windSpeed?: string[];
    windDirection?: string[];
  };
};

async function fetchNwsSummary(lat: number, lon: number) {
  const data = await fetchJson<NwsForecast>(
    `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}&unit=0&lg=english&FcstType=json`,
  );
  const summary = data.data?.text?.[0]?.replace(/\s+/g, " ").trim() || null;
  const temp = data.data?.temperature?.[0];
  const windSpeed = data.data?.windSpeed?.[0];
  const windDir = data.data?.windDirection?.[0];
  const wind =
    windSpeed && windDir && windSpeed !== "null"
      ? `${windDir} ${windSpeed} mph`
      : null;
  return {
    summary,
    airTempF: temp && temp !== "null" ? Number(temp) : null,
    wind,
  };
}

function swimStatusLabel(status: SwimGuideStatus | null): string | null {
  switch (status) {
    case "pass":
      return "Passed";
    case "fail":
      return "Failed";
    case "warning":
      return "Advisory";
    case "unknown":
      return "Unknown";
    default:
      return null;
  }
}

async function fetchSwimGuideCollins(): Promise<Pick<SauvieIslandLive, "swimStatus" | "swimStatusLabel" | "lastSampleAt" | "swimSummary">> {
  const html = await fetchText("https://www.theswimguide.org/beach/1792");
  const headerStatus = html.match(/header-section[\s\S]*?beach-status status-(pass|fail|warning|unknown)/i);
  const status = (headerStatus?.[1]?.toLowerCase() as SwimGuideStatus | undefined) || "unknown";
  const sampleMatch = html.match(/taken on\s+([^.<]+)/i);
  const lastSampleAt = sampleMatch?.[1]?.trim() || null;
  const summaryMatch = html.match(/Passed water quality tests[\s\S]*?<\/p>/i)
    || html.match(/Failed water quality tests[\s\S]*?<\/p>/i)
    || html.match(/We have no current water quality[\s\S]*?<\/p>/i);
  const swimSummary = summaryMatch?.[0]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
  return {
    swimStatus: status,
    swimStatusLabel: swimStatusLabel(status),
    lastSampleAt,
    swimSummary,
  };
}

async function fetchParkingNote(): Promise<string | null> {
  try {
    const html = await fetchText(SAUVIE_ISLAND_PARKING_URL);
    const soldOut = /sold\s*out/i.test(html);
    const available = /available/i.test(html);
    if (soldOut) return "At least one permit date appears sold out on the ODFW portal — verify before you drive out.";
    if (available) return "Permit inventory appears open on the ODFW portal — confirm your date before you go.";
    if (html.length < 800) {
      return "Permit portal loads dynamically — open the ODFW link to check live sold-out dates.";
    }
    return "Buy and check permit availability on the official ODFW portal for weekends and holidays through Labor Day.";
  } catch {
    return "Could not reach the ODFW permit portal — use the parking link to check sold-out dates before you go.";
  }
}

type RrcWaterPayload = {
  clarity?: { label?: string; windFrom?: string; windMph?: number };
  temp?: { f?: number; site?: string };
};

type RrcAirPayload = {
  category?: string;
  aqi?: number;
};

async function fetchRrcWater(): Promise<Pick<RoosterRockLive, "waterTempF" | "waterTempSite" | "waterClarity" | "wind">> {
  try {
    const data = await fetchJson<RrcWaterPayload>("https://roosterrockcrossing.com/api/water");
    const wind =
      data.clarity?.windFrom && data.clarity?.windMph != null
        ? `${data.clarity.windFrom} ${data.clarity.windMph} mph`
        : null;
    return {
      waterTempF: typeof data.temp?.f === "number" ? data.temp.f : null,
      waterTempSite: data.temp?.site || null,
      waterClarity: data.clarity?.label || null,
      wind,
    };
  } catch {
    return { waterTempF: null, waterTempSite: null, waterClarity: null, wind: null };
  }
}

async function fetchRrcAir(): Promise<Pick<RoosterRockLive, "airQuality">> {
  try {
    const data = await fetchJson<RrcAirPayload>("https://roosterrockcrossing.com/api/air");
    if (!data.category) return { airQuality: null };
    const aqi = typeof data.aqi === "number" ? ` · AQI ${data.aqi}` : "";
    return { airQuality: `${data.category}${aqi}` };
  } catch {
    return { airQuality: null };
  }
}

async function fetchRoosterRockLive(): Promise<RoosterRockLive> {
  const base: RoosterRockLive = {
    riverLevelFt: null,
    riverLevelAt: null,
    crossingBand: null,
    crossingAdvice: null,
    worthCrossing: null,
    weatherSummary: null,
    airTempF: null,
    wind: null,
    waterTempF: null,
    waterTempSite: null,
    waterClarity: null,
    airQuality: null,
    source: "USGS + NWS + roosterrockcrossing.com",
  };
  try {
    const [river, weather, rrcWater, rrcAir] = await Promise.all([
      fetchUsgsRiverLevel(),
      fetchNwsSummary(45.5446, -122.2342),
      fetchRrcWater(),
      fetchRrcAir(),
    ]);
    if (river) {
      const band = crossingBandFromLevel(river.ft);
      base.riverLevelFt = river.ft;
      base.riverLevelAt = river.at;
      base.crossingBand = band.band;
      base.crossingAdvice = band.advice;
      base.worthCrossing = band.worthCrossing;
    }
    base.weatherSummary = weather.summary;
    base.airTempF = weather.airTempF;
    base.wind = rrcWater.wind || weather.wind;
    base.waterTempF = rrcWater.waterTempF;
    base.waterTempSite = rrcWater.waterTempSite;
    base.waterClarity = rrcWater.waterClarity;
    base.airQuality = rrcAir.airQuality;
  } catch (err) {
    base.error = err instanceof Error ? err.message : "Could not refresh Rooster Rock data";
  }
  return base;
}

async function fetchSauvieIslandLive(): Promise<SauvieIslandLive> {
  const base: SauvieIslandLive = {
    swimStatus: null,
    swimStatusLabel: null,
    lastSampleAt: null,
    swimSummary: null,
    parkingNote: null,
    parkingHref: SAUVIE_ISLAND_PARKING_URL,
    weatherSummary: null,
    airTempF: null,
    wind: null,
    source: "Swim Guide + NWS + ODFW parking portal",
  };
  try {
    const [swim, parking, weather] = await Promise.all([
      fetchSwimGuideCollins(),
      fetchParkingNote(),
      fetchNwsSummary(45.696, -122.774),
    ]);
    Object.assign(base, swim);
    base.parkingNote = parking;
    base.weatherSummary = weather.summary;
    base.airTempF = weather.airTempF;
    base.wind = weather.wind;
  } catch (err) {
    base.error = err instanceof Error ? err.message : "Could not refresh Sauvie Island data";
  }
  return base;
}

export async function refreshNudeBeachesSnapshot(): Promise<NudeBeachesSnapshot> {
  const [roosterRock, sauvieIsland] = await Promise.all([
    fetchRoosterRockLive(),
    fetchSauvieIslandLive(),
  ]);
  const snapshot: NudeBeachesSnapshot = {
    fetchedAt: new Date().toISOString(),
    roosterRock,
    sauvieIsland,
  };
  writeCache(snapshot);
  return snapshot;
}

export async function getNudeBeachesSnapshot(options?: { force?: boolean }): Promise<{
  data: NudeBeachesSnapshot;
  stale: boolean;
  fromCache: boolean;
}> {
  const cached = readCache();
  const ageMs = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;
  const stale = !cached || ageMs > CACHE_TTL_MS;

  if (!options?.force && cached && !stale) {
    return { data: cached, stale: false, fromCache: true };
  }

  if (!options?.force && cached && stale) {
    void refreshNudeBeachesSnapshot().catch(err => {
      console.error("Background nude beaches refresh failed:", err);
    });
    return { data: cached, stale: true, fromCache: true };
  }

  const fresh = await refreshNudeBeachesSnapshot();
  return { data: fresh, stale: false, fromCache: false };
}

export async function forceRefreshNudeBeachesSnapshot(): Promise<{
  data: NudeBeachesSnapshot;
  rateLimited?: boolean;
}> {
  const now = Date.now();
  if (now - lastForcedRefreshAt < MIN_REFRESH_GAP_MS) {
    const cached = readCache();
    if (cached) return { data: cached, rateLimited: true };
    const fresh = await refreshNudeBeachesSnapshot();
    return { data: fresh };
  }
  lastForcedRefreshAt = now;
  const fresh = await refreshNudeBeachesSnapshot();
  return { data: fresh };
}