import { sqlite } from "./storage";
import {
  aqiCategoryFromValue,
  crossingBandFromLevel,
  depthEstimateFromGage,
  estimateWaterClarity,
  SAUVIE_ISLAND_PARKING_URL,
  type NudeBeachesSnapshot,
  type RiverLevelTrend,
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
        Accept: "application/geo+json,application/json,text/html",
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

type UsgsRiverSnapshot = {
  ft: number;
  at: string;
  todayLowFt: number | null;
  todayLowAt: string | null;
  todayHighFt: number | null;
  todayHighAt: string | null;
  crossingWindowNote: string | null;
  levelTrend: RiverLevelTrend | null;
};

function crossingWindowNoteFromSeries(
  series: Array<{ ft: number; at: string }>,
  latest: { ft: number; at: string },
): string | null {
  if (series.length < 2) return null;

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const today = series.filter(p => new Date(p.at).getTime() >= midnight.getTime());
  const window = today.length ? today : series.slice(-96);
  if (!window.length) return null;

  let lo = window[0];
  let hi = window[0];
  for (const p of window) {
    if (p.ft < lo.ft) lo = p;
    if (p.ft > hi.ft) hi = p;
  }

  const target = new Date(latest.at).getTime() - 3_600_000;
  let past = series[0];
  for (let i = series.length - 1; i >= 0; i--) {
    if (new Date(series[i].at).getTime() <= target) {
      past = series[i];
      break;
    }
  }
  const delta = latest.ft - past.ft;
  const loTime = new Date(lo.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (latest.ft - lo.ft < 0.15) {
    return `About as low as it's been today — a good window to cross. Today's range: ${lo.ft.toFixed(2)}–${hi.ft.toFixed(2)} ft.`;
  }
  if (delta < -0.1) {
    return `Should keep getting easier over the next few hours. Today's range: ${lo.ft.toFixed(2)}–${hi.ft.toFixed(2)} ft.`;
  }
  if (delta > 0.1) {
    return `Earlier is better, or wait for the next low (today's was ${lo.ft.toFixed(2)} ft around ${loTime}). Today's range: ${lo.ft.toFixed(2)}–${hi.ft.toFixed(2)} ft.`;
  }
  return `Today the level has ranged ${lo.ft.toFixed(2)}–${hi.ft.toFixed(2)} ft.`;
}

function levelTrendFromSeries(
  series: Array<{ ft: number; at: string }>,
  latest: { ft: number; at: string },
): RiverLevelTrend | null {
  if (series.length < 2) return null;
  const target = new Date(latest.at).getTime() - 3_600_000;
  let past = series[0];
  for (let i = series.length - 1; i >= 0; i--) {
    if (new Date(series[i].at).getTime() <= target) {
      past = series[i];
      break;
    }
  }
  const delta = latest.ft - past.ft;
  if (delta < -0.1) return "falling";
  if (delta > 0.1) return "rising";
  return "steady";
}

async function fetchUsgsRiverLevel(): Promise<UsgsRiverSnapshot | null> {
  try {
  const data = await fetchJson<{
    value: {
      timeSeries: Array<{
        values: Array<{ value: Array<{ value: string; dateTime: string }> }>;
      }>;
    };
  }>(
    "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14128870&parameterCd=00065&period=P1D&siteStatus=all",
  );
  const points = data.value?.timeSeries?.[0]?.values?.[0]?.value ?? [];
  if (!points.length) return null;

  const series = points
    .map(p => ({ ft: Number(p.value), at: p.dateTime }))
    .filter(p => Number.isFinite(p.ft));
  if (!series.length) return null;

  const latest = series[series.length - 1];
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const today = series.filter(p => new Date(p.at).getTime() >= midnight.getTime());
  const window = today.length ? today : series.slice(-96);

  let lo = window[0];
  let hi = window[0];
  for (const p of window) {
    if (p.ft < lo.ft) lo = p;
    if (p.ft > hi.ft) hi = p;
  }

  return {
    ft: latest.ft,
    at: latest.at,
    todayLowFt: lo.ft,
    todayLowAt: lo.at,
    todayHighFt: hi.ft,
    todayHighAt: hi.at,
    crossingWindowNote: crossingWindowNoteFromSeries(series, latest),
    levelTrend: levelTrendFromSeries(series, latest),
  };
  } catch {
    return null;
  }
}

type NwsPoints = {
  properties?: { forecast?: string };
};

type NwsGridForecast = {
  properties?: {
    periods?: Array<{
      shortForecast?: string;
      temperature?: number;
      windSpeed?: string;
      windDirection?: string;
    }>;
  };
};

const EMPTY_NWS_SUMMARY = {
  summary: null as string | null,
  airTempF: null as number | null,
  wind: null as string | null,
  windFrom: null as string | null,
  windMph: null as number | null,
};

function parseWindParts(windDir?: string | null, windSpeed?: string | null) {
  const dir = windDir && windDir !== "null" ? windDir : null;
  const speedRaw = windSpeed && windSpeed !== "null" ? windSpeed : null;
  const mph = speedRaw ? Number.parseInt(speedRaw, 10) : null;
  const wind =
    dir && speedRaw ? `${dir} ${speedRaw}` : dir ? dir : speedRaw ? speedRaw : null;
  return { wind, windFrom: dir, windMph: Number.isFinite(mph) ? mph : null };
}

async function fetchNwsSummary(lat: number, lon: number) {
  try {
    const points = await fetchJson<NwsPoints>(`https://api.weather.gov/points/${lat},${lon}`);
    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) return { ...EMPTY_NWS_SUMMARY };

    const forecast = await fetchJson<NwsGridForecast>(forecastUrl);
    const period = forecast.properties?.periods?.[0];
    if (!period) return { ...EMPTY_NWS_SUMMARY };

    const summary = period.shortForecast?.replace(/\s+/g, " ").trim() || null;
    const airTempF = typeof period.temperature === "number" ? period.temperature : null;
    const { wind, windFrom, windMph } = parseWindParts(period.windDirection, period.windSpeed);
    return { summary, airTempF, wind, windFrom, windMph };
  } catch {
    return { ...EMPTY_NWS_SUMMARY };
  }
}

async function fetchUsgsWaterTemp(): Promise<Pick<RoosterRockLive, "waterTempF" | "waterTempSite">> {
  try {
    const data = await fetchJson<{
      value?: {
        timeSeries?: Array<{
          values?: Array<{ value?: Array<{ value?: string }> }>;
        }>;
      };
    }>(
      "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14105700&parameterCd=00010&siteStatus=all",
    );
    const point = data.value?.timeSeries?.[0]?.values?.[0]?.value?.[0];
    const c = Number(point?.value);
    if (!Number.isFinite(c)) return { waterTempF: null, waterTempSite: null };
    return {
      waterTempF: (c * 9) / 5 + 32,
      waterTempSite: "Columbia at Warrendale (below Bonneville)",
    };
  } catch {
    return { waterTempF: null, waterTempSite: null };
  }
}

function compassFromDegrees(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function fetchOpenMeteoCurrent(lat: number, lon: number) {
  try {
    const data = await fetchJson<{
      current?: {
        temperature_2m?: number;
        wind_speed_10m?: number;
        wind_direction_10m?: number;
      };
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,wind_speed_10m,wind_direction_10m" +
        "&temperature_unit=fahrenheit&wind_speed_unit=mph",
    );
    const current = data.current;
    if (!current) return null;
    const windFrom =
      typeof current.wind_direction_10m === "number"
        ? compassFromDegrees(current.wind_direction_10m)
        : null;
    const windMph =
      typeof current.wind_speed_10m === "number"
        ? Math.round(current.wind_speed_10m)
        : null;
    return {
      airTempF: typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null,
      wind: windFrom && windMph != null ? `${windFrom} ${windMph} mph` : null,
      windFrom,
      windMph,
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteoAirQuality(
  lat: number,
  lon: number,
): Promise<Pick<RoosterRockLive, "airQuality">> {
  try {
    const data = await fetchJson<{
      current?: { us_aqi?: number; pm2_5?: number };
    }>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`,
    );
    const current = data.current;
    const aqi = current?.us_aqi;
    if (aqi == null) return { airQuality: null };
    const pm =
      typeof current?.pm2_5 === "number"
        ? ` · PM2.5 ${current.pm2_5.toFixed(1)}`
        : "";
    return { airQuality: `${aqiCategoryFromValue(aqi)} · AQI ${aqi}${pm}` };
  } catch {
    return { airQuality: null };
  }
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
  const empty = {
    swimStatus: null as SwimGuideStatus | null,
    swimStatusLabel: null as string | null,
    lastSampleAt: null as string | null,
    swimSummary: null as string | null,
  };
  try {
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
  } catch {
    return empty;
  }
}

async function fetchParkingNote(): Promise<string | null> {
  try {
    const html = await fetchText(SAUVIE_ISLAND_PARKING_URL);
    const soldOut = /sold\s*out/i.test(html);
    const available = /available/i.test(html);
    if (soldOut) return "At least one permit date appears sold out on SauvieIslandParking.com — verify before you drive out.";
    if (available) return "Permit inventory appears open on SauvieIslandParking.com — confirm your date before you go.";
    if (html.length < 800) {
      return "Permit portal loads dynamically — open SauvieIslandParking.com to check live sold-out dates.";
    }
    return "Buy and check permit availability at SauvieIslandParking.com for weekends and holidays through Labor Day.";
  } catch {
    return "Could not reach Sauvie Island Parking — use the permit link to check sold-out dates before you go.";
  }
}

function hasRoosterRockLiveData(live: RoosterRockLive): boolean {
  return (
    live.riverLevelFt != null
    || live.weatherSummary != null
    || live.airTempF != null
    || live.wind != null
    || live.waterTempF != null
    || live.airQuality != null
    || live.waterClarity != null
  );
}

function hasSauvieIslandLiveData(live: SauvieIslandLive): boolean {
  return (
    live.swimStatus != null
    || live.swimSummary != null
    || live.parkingNote != null
    || live.weatherSummary != null
    || live.airTempF != null
    || live.wind != null
  );
}

function mergeLiveSnapshot<T extends RoosterRockLive | SauvieIslandLive>(
  previous: T | undefined,
  next: T,
  hasData: (live: T) => boolean,
): T {
  if (!previous) return next;
  const merged = { ...next };
  for (const key of Object.keys(next) as Array<keyof T>) {
    if (key === "error" || key === "source") continue;
    const nextVal = next[key];
    const prevVal = previous[key];
    if ((nextVal == null || nextVal === "") && prevVal != null && prevVal !== "") {
      merged[key] = prevVal;
    }
  }
  if ("error" in merged && hasData(merged)) {
    delete (merged as { error?: string }).error;
  }
  return merged;
}

async function fetchRoosterRockLive(): Promise<RoosterRockLive> {
  const base: RoosterRockLive = {
    riverLevelFt: null,
    riverLevelAt: null,
    todayLowFt: null,
    todayLowAt: null,
    todayHighFt: null,
    todayHighAt: null,
    crossingWindowNote: null,
    levelTrend: null,
    depthEstimate: null,
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
    source: "USGS + NWS + Open-Meteo",
  };
  const parkLat = 45.5446;
  const parkLon = -122.2342;
  const [river, weather, waterTemp, airQuality, openMeteo] = await Promise.all([
    fetchUsgsRiverLevel(),
    fetchNwsSummary(parkLat, parkLon),
    fetchUsgsWaterTemp(),
    fetchOpenMeteoAirQuality(parkLat, parkLon),
    fetchOpenMeteoCurrent(parkLat, parkLon),
  ]);
  const windFrom = weather.windFrom ?? openMeteo?.windFrom ?? null;
  const windMph = weather.windMph ?? openMeteo?.windMph ?? null;
  const wind = weather.wind ?? openMeteo?.wind ?? null;
  if (river) {
    const band = crossingBandFromLevel(river.ft);
    base.riverLevelFt = river.ft;
    base.riverLevelAt = river.at;
    base.todayLowFt = river.todayLowFt;
    base.todayLowAt = river.todayLowAt;
    base.todayHighFt = river.todayHighFt;
    base.todayHighAt = river.todayHighAt;
    base.crossingWindowNote = river.crossingWindowNote;
    base.levelTrend = river.levelTrend;
    base.depthEstimate = depthEstimateFromGage(river.ft);
    base.crossingBand = band.band;
    base.crossingAdvice = band.advice;
    base.worthCrossing = band.worthCrossing;
  }
  base.weatherSummary = weather.summary;
  base.airTempF = weather.airTempF ?? openMeteo?.airTempF ?? null;
  base.wind = wind;
  base.waterTempF = waterTemp.waterTempF;
  base.waterTempSite = waterTemp.waterTempSite;
  base.waterClarity = estimateWaterClarity(windFrom, windMph);
  base.airQuality = airQuality.airQuality;
  if (!hasRoosterRockLiveData(base)) {
    base.error = "Live conditions temporarily unavailable";
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
    source: "Swim Guide + NWS + Sauvie Island Parking",
  };
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
  if (!hasSauvieIslandLiveData(base)) {
    base.error = "Live conditions temporarily unavailable";
  }
  return base;
}

export async function refreshNudeBeachesSnapshot(): Promise<NudeBeachesSnapshot> {
  const previous = readCache();
  const [roosterRock, sauvieIsland] = await Promise.all([
    fetchRoosterRockLive(),
    fetchSauvieIslandLive(),
  ]);
  const snapshot: NudeBeachesSnapshot = {
    fetchedAt: new Date().toISOString(),
    roosterRock: mergeLiveSnapshot(previous?.roosterRock, roosterRock, hasRoosterRockLiveData),
    sauvieIsland: mergeLiveSnapshot(previous?.sauvieIsland, sauvieIsland, hasSauvieIslandLiveData),
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