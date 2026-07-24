import { sqlite } from "./storage";
import {
  aqiCategoryFromValue,
  BEACH_MAP_LOCATIONS,
  BEACH_TIME_ZONE,
  calendarDayInTimeZone,
  crossingBandFromLevel,
  depthEstimateFromGage,
  type DayForecastBrief,
  estimateWaterClarity,
  formatSwimStatusLabel,
  normalizeNudeBeachesSnapshot,
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
        "User-Agent": "Zaylist/1.0 (+https://www.zaylist.com)",
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

function filterSeriesForBeachToday(series: Array<{ ft: number; at: string }>) {
  const today = calendarDayInTimeZone(new Date(), BEACH_TIME_ZONE);
  const points = series.filter(p => calendarDayInTimeZone(p.at, BEACH_TIME_ZONE) === today);
  return points.length ? points : series.slice(-96);
}

function crossingWindowNoteFromSeries(
  series: Array<{ ft: number; at: string }>,
  latest: { ft: number; at: string },
): string | null {
  if (series.length < 2) return null;

  const window = filterSeriesForBeachToday(series);
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

const ROOSTER_GAGE_ID = "USGS-14128870";
const ROOSTER_PARAM_CODE = "00065";
const ROOSTER_PARK = BEACH_MAP_LOCATIONS["rooster-rock"];
const USGS_OGC_BASE = "https://api.waterdata.usgs.gov/ogcapi/v0/collections";
const RRC_WATER_URL = "https://roosterrockcrossing.com/api/water";
const RRC_AIR_URL = "https://roosterrockcrossing.com/api/air";

function parseOgcContinuousSeries(geojson: {
  features?: Array<{ properties?: { time?: string; value?: string } }>;
}): Array<{ ft: number; at: string }> {
  return (geojson.features ?? [])
    .map(f => f.properties)
    .filter(
      (p): p is { time: string; value: string } =>
        !!p?.time && p.value != null && p.value !== "" && Number.isFinite(Number(p.value)),
    )
    .map(p => ({ ft: Number(p.value), at: p.time }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

async function fetchOgcRiverLevel(): Promise<UsgsRiverSnapshot | null> {
  try {
    const endISO = new Date().toISOString();
    const startISO = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const url =
      `${USGS_OGC_BASE}/continuous/items?monitoring_location_id=${ROOSTER_GAGE_ID}` +
      `&parameter_code=${ROOSTER_PARAM_CODE}` +
      `&datetime=${encodeURIComponent(`${startISO}/${endISO}`)}` +
      `&sortby=-time&limit=1500&f=json`;
    const data = await fetchJson<{ features?: Array<{ properties?: { time?: string; value?: string } }> }>(url);
    const series = parseOgcContinuousSeries(data);
    if (!series.length) return null;

    const latest = series[series.length - 1];
    const window = filterSeriesForBeachToday(series);

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
  properties?: { forecast?: string; forecastHourly?: string };
};

type NwsGridForecast = {
  properties?: {
    periods?: NwsForecastPeriod[];
  };
};

const EMPTY_NWS_SUMMARY = {
  summary: null as string | null,
  airTempF: null as number | null,
  wind: null as string | null,
  windFrom: null as string | null,
  windMph: null as number | null,
};

function parseWindMph(speedRaw?: string | null): number | null {
  if (!speedRaw || speedRaw === "null") return null;
  const nums = speedRaw.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  return Math.max(...nums);
}

function parseWindParts(windDir?: string | null, windSpeed?: string | null) {
  const dir = windDir && windDir !== "null" ? windDir : null;
  const speedRaw = windSpeed && windSpeed !== "null" ? windSpeed : null;
  const mph = parseWindMph(speedRaw);
  const wind =
    dir && speedRaw ? `${dir} ${speedRaw}` : dir ? dir : speedRaw ? speedRaw : null;
  return { wind, windFrom: dir, windMph: Number.isFinite(mph) ? mph : null };
}

type NwsForecastPeriod = {
  name?: string;
  startTime?: string;
  endTime?: string;
  isDaytime?: boolean;
  shortForecast?: string;
  temperature?: number;
  windSpeed?: string;
  windDirection?: string;
};

type NwsHourlyForecast = {
  properties?: {
    periods?: NwsForecastPeriod[];
  };
};

/** NWS daily forecast period[0] is often "Tonight" (overnight low), not current air temp. */
function pickCurrentNwsPeriod(periods?: NwsForecastPeriod[]): NwsForecastPeriod | null {
  if (!periods?.length) return null;
  const now = Date.now();
  for (const period of periods) {
    const start = period.startTime ? new Date(period.startTime).getTime() : NaN;
    const end = period.endTime ? new Date(period.endTime).getTime() : NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end) {
      return period;
    }
  }
  return periods[0] ?? null;
}

function pacificDateFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Daytime NWS periods for plan-ahead "weather for that day" UI. */
function extractDayForecasts(daily: NwsGridForecast | null): DayForecastBrief[] {
  const periods = daily?.properties?.periods ?? [];
  const out: DayForecastBrief[] = [];
  for (const p of periods) {
    if (p.isDaytime === false) continue;
    if (!p.startTime) continue;
    const date = pacificDateFromIso(p.startTime);
    if (out.some(x => x.date === date)) continue;
    const { wind } = parseWindParts(p.windDirection, p.windSpeed);
    out.push({
      date,
      name: p.name || date,
      shortForecast: p.shortForecast?.replace(/\s+/g, " ").trim() || null,
      highF: typeof p.temperature === "number" ? p.temperature : null,
      wind,
    });
    if (out.length >= 8) break;
  }
  return out;
}

async function fetchNwsSummary(lat: number, lon: number) {
  try {
    const points = await fetchJson<NwsPoints>(`https://api.weather.gov/points/${lat},${lon}`);
    const hourlyUrl = points.properties?.forecastHourly;
    const dailyUrl = points.properties?.forecast;
    const [hourly, daily] = await Promise.all([
      hourlyUrl ? fetchJson<NwsHourlyForecast>(hourlyUrl).catch(() => null) : null,
      dailyUrl ? fetchJson<NwsGridForecast>(dailyUrl).catch(() => null) : null,
    ]);
    const now = pickCurrentNwsPeriod(hourly?.properties?.periods);
    const today = pickCurrentNwsPeriod(daily?.properties?.periods);
    const forecastDays = extractDayForecasts(daily);
    if (!now && !today && !forecastDays.length) return { ...EMPTY_NWS_SUMMARY, forecastDays: [] as DayForecastBrief[] };

    const summary = (now?.shortForecast ?? today?.shortForecast)?.replace(/\s+/g, " ").trim() || null;
    const airTempF =
      typeof now?.temperature === "number"
        ? now.temperature
        : typeof today?.temperature === "number"
          ? today.temperature
          : null;
    const { wind, windFrom, windMph } = parseWindParts(
      now?.windDirection ?? today?.windDirection,
      now?.windSpeed ?? today?.windSpeed,
    );
    return { summary, airTempF, wind, windFrom, windMph, forecastDays };
  } catch {
    return { ...EMPTY_NWS_SUMMARY, forecastDays: [] as DayForecastBrief[] };
  }
}

type RrcWaterPayload = {
  clarity?: { label?: string; why?: string; windFrom?: string; windMph?: number };
  temp?: { f?: number; site?: string };
};

type RrcAirPayload = {
  aqi?: number;
  pm25?: number;
  category?: string;
};

async function fetchRrcWaterExtras(): Promise<{
  waterTempF: number | null;
  waterTempSite: string | null;
  waterClarity: string | null;
  clarityWindFrom: string | null;
  clarityWindMph: number | null;
}> {
  const empty = {
    waterTempF: null as number | null,
    waterTempSite: null as string | null,
    waterClarity: null as string | null,
    clarityWindFrom: null as string | null,
    clarityWindMph: null as number | null,
  };
  try {
    const data = await fetchJson<RrcWaterPayload>(RRC_WATER_URL);
    const clarity = data.clarity;
    const clarityLabel = clarity?.label?.trim();
    const clarityWhy = clarity?.why?.trim();
    return {
      waterTempF: typeof data.temp?.f === "number" ? data.temp.f : null,
      waterTempSite: data.temp?.site ?? "Columbia at Warrendale (below Bonneville)",
      waterClarity: clarityLabel
        ? clarityWhy
          ? `${clarityLabel} — ${clarityWhy}`
          : clarityLabel
        : null,
      clarityWindFrom: clarity?.windFrom ?? null,
      clarityWindMph: typeof clarity?.windMph === "number" ? clarity.windMph : null,
    };
  } catch {
    return empty;
  }
}

async function fetchRrcAirQuality(): Promise<Pick<RoosterRockLive, "airQuality">> {
  try {
    const data = await fetchJson<RrcAirPayload>(RRC_AIR_URL);
    const aqi = data.aqi;
    if (aqi == null) return { airQuality: null };
    const pm = typeof data.pm25 === "number" ? ` · PM2.5 ${data.pm25.toFixed(1)}` : "";
    const category = data.category ?? aqiCategoryFromValue(aqi);
    return { airQuality: `${category} · AQI ${aqi}${pm}` };
  } catch {
    return { airQuality: null };
  }
}

function parseSwimGuideSampleDate(html: string): string | null {
  const match = html.match(
    /taken on\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i,
  );
  return match?.[1]?.replace(/\s+/g, " ").trim() || null;
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
    const lastSampleAt = parseSwimGuideSampleDate(html);
    const summaryMatch = html.match(/Passed water quality tests[\s\S]*?<\/p>/i)
      || html.match(/Failed water quality tests[\s\S]*?<\/p>/i)
      || html.match(/We have no current water quality[\s\S]*?<\/p>/i);
    const swimSummary = summaryMatch?.[0]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
    return {
      swimStatus: status,
      swimStatusLabel: formatSwimStatusLabel(status),
      lastSampleAt,
      swimSummary,
    };
  } catch {
    return empty;
  }
}

/**
 * Parse Sauvie parking portal copy carefully.
 * Official site often says the **seasonal** beaches permit is SOLD OUT while
 * **daily / day** permits ($10) remain for sale — do not treat that as "parking sold out."
 */
function interpretSauvieParkingHtml(html: string): Pick<SauvieIslandLive, "parkingNote" | "parkingStatusLabel"> {
  const seasonSoldOut =
    /seasonal[^.<>]{0,160}sold\s*out|sold\s*out[^.<>]{0,80}seasonal|seasonal sauvie island beaches permits[^.<>]{0,200}sold\s*out|were available starting[^.]{0,80}are\s+now\s+sold\s*out/i.test(
      html,
    );
  // Day-pass inventory is date-specific; only flag fully sold-out if copy
  // ties "sold out" to daily permits without seasonal context.
  const dailySoldOut =
    /daily\s+permits?[^.<>]{0,120}sold\s*out|day\s+pass(?:es)?[^.<>]{0,80}sold\s*out|sold\s*out[^.<>]{0,80}daily\s+permit/i.test(
      html,
    ) && !seasonSoldOut;

  const dailyMentioned =
    /daily\s+permit|daily\s+permits?\s+cost\s*\$?\s*10|day\s*pass/i.test(html);
  const buyNow = /buy\s+my\s+beaches\s+permit|buy\s+permit|available\s+as\s+of|more\s+permits/i.test(html);

  if (dailySoldOut) {
    return {
      parkingNote:
        "Daily beaches day-passes look sold out on the portal for some dates — check SauvieIslandParking.com for your day (releases often hit Friday 4pm).",
      parkingStatusLabel: "SOLD OUT",
    };
  }

  if (seasonSoldOut) {
    return {
      parkingNote:
        "2026 seasonal beaches permits are sold out — daily $10 day passes are still sold online for weekends/holidays (buy before you go; they go fast).",
      parkingStatusLabel: "DAY PASS",
    };
  }

  if (dailyMentioned || buyNow || /available/i.test(html)) {
    return {
      parkingNote:
        "Daily beaches permits ($10) appear available on SauvieIslandParking.com for permit-required days — confirm your date before you drive out.",
      parkingStatusLabel: "OPEN",
    };
  }

  if (html.length < 800) {
    return {
      parkingNote:
        "Permit portal loads dynamically — open SauvieIslandParking.com. Seasonal passes may be sold out; day passes are sold separately.",
      parkingStatusLabel: "CHECK",
    };
  }

  return {
    parkingNote:
      "Weekends/holidays through Labor Day need a Sauvie beaches permit. Seasonal passes may be sold out — buy a daily day pass online before you go.",
    parkingStatusLabel: "CHECK",
  };
}

async function fetchParkingSnapshot(): Promise<Pick<SauvieIslandLive, "parkingNote" | "parkingStatusLabel">> {
  const fallback = {
    parkingNote:
      "Could not reach the parking portal — buy a daily beaches day pass at SauvieIslandParking.com if you need a weekend/holiday permit (seasonal passes may already be sold out).",
    parkingStatusLabel: "CHECK" as const,
  };
  try {
    const html = await fetchText(SAUVIE_ISLAND_PARKING_URL);
    return interpretSauvieParkingHtml(html);
  } catch {
    return fallback;
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
    || live.parkingStatusLabel != null
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
    forecastDays: [],
    source: "USGS OGC + NWS + RoosterRockCrossing.com (DART + PurpleAir)",
  };
  const [river, weather, rrcWater, airQuality] = await Promise.all([
    fetchOgcRiverLevel(),
    fetchNwsSummary(ROOSTER_PARK.lat, ROOSTER_PARK.lng),
    fetchRrcWaterExtras(),
    fetchRrcAirQuality(),
  ]);
  const windFrom = weather.windFrom ?? rrcWater.clarityWindFrom ?? null;
  const windMph = weather.windMph ?? rrcWater.clarityWindMph ?? null;
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
  base.airTempF = weather.airTempF;
  base.wind = weather.wind;
  base.forecastDays = weather.forecastDays ?? [];
  base.waterTempF = rrcWater.waterTempF;
  base.waterTempSite = rrcWater.waterTempSite;
  base.waterClarity = rrcWater.waterClarity ?? estimateWaterClarity(windFrom, windMph);
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
    parkingStatusLabel: null,
    parkingHref: SAUVIE_ISLAND_PARKING_URL,
    weatherSummary: null,
    airTempF: null,
    wind: null,
    forecastDays: [],
    source: "Swim Guide + NWS + Sauvie Island Parking",
  };
  const [swim, parking, weather] = await Promise.all([
    fetchSwimGuideCollins(),
    fetchParkingSnapshot(),
    fetchNwsSummary(
      BEACH_MAP_LOCATIONS["sauvie-island"].lat,
      BEACH_MAP_LOCATIONS["sauvie-island"].lng,
    ),
  ]);
  Object.assign(base, swim, parking);
  base.weatherSummary = weather.summary;
  base.airTempF = weather.airTempF;
  base.wind = weather.wind;
  base.forecastDays = weather.forecastDays ?? [];
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
  const normalized = normalizeNudeBeachesSnapshot(snapshot);
  writeCache(normalized);
  return normalized;
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
    return { data: normalizeNudeBeachesSnapshot(cached), stale: false, fromCache: true };
  }

  if (!options?.force && cached && stale) {
    void refreshNudeBeachesSnapshot().catch(err => {
      console.error("Background nude beaches refresh failed:", err);
    });
    return { data: normalizeNudeBeachesSnapshot(cached), stale: true, fromCache: true };
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
    if (cached) return { data: normalizeNudeBeachesSnapshot(cached), rateLimited: true };
    const fresh = await refreshNudeBeachesSnapshot();
    return { data: fresh };
  }
  lastForcedRefreshAt = now;
  const fresh = await refreshNudeBeachesSnapshot();
  return { data: fresh };
}