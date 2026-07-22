import {
  PRIDE_WEEK_DAYS,
  PRIDE_WEEK_DAY_OPTIONS,
  PRIDE_WEEK_START_DATE,
  PRIDE_WEEK_END_DATE,
} from "@shared/prideWeek";

/** Visual symbol for WMO weather codes (hub forecast strip). */
export type WeatherIconKind =
  | "clear"
  | "mostly-clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "snow"
  | "thunder";

export type PortlandForecastDay = {
  day: string;
  dateLabel: string;
  high: number;
  low: number;
  highlight: boolean;
  /** WMO weather code for this day. */
  code: number;
  condition: string;
  icon: WeatherIconKind;
  /** ISO date YYYY-MM-DD (Pacific). */
  iso: string;
};

export type PortlandWeather = {
  /** Live current temp in Portland when available; otherwise featured day high. */
  currentTemp: number;
  condition: string;
  high: number;
  low: number;
  caption: string;
  forecast: PortlandForecastDay[];
  sunGradient: string;
  sunGlow: string;
  isEstimate: boolean;
  /** Always "Portland, OR" for the hub card. */
  city: string;
  locationLabel: string;
  /** Short line under the temp, e.g. "Now in Portland" or "Sat forecast high". */
  tempContext: string;
  /** Current / featured WMO code + icon for the hero symbol. */
  currentCode: number;
  currentIcon: WeatherIconKind;
};

export const PRIDE_WEEKEND_START = PRIDE_WEEK_START_DATE;
export const PRIDE_WEEKEND_END = PRIDE_WEEK_END_DATE;
export const PRIDE_DAY_LABELS = PRIDE_WEEK_DAYS;

/** Downtown Portland, OR (Pioneer Courthouse Square area). */
const PORTLAND_LAT = "45.5152";
const PORTLAND_LNG = "-122.6784";
const PORTLAND_TZ = "America/Los_Angeles";
export const PORTLAND_CITY = "Portland";
export const PORTLAND_LOCATION_LABEL = "Portland, OR";

const PRIDE_DATES = PRIDE_WEEK_DAY_OPTIONS.map(d => d.date);
const PRIDE_DATE_LABELS = ["Jul 13", "Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18", "Jul 19"];

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export function wmoLabel(code: number) {
  return WMO_LABELS[code] ?? "Mixed skies";
}

export function weatherIconForCode(code: number): WeatherIconKind {
  if (code === 0) return "clear";
  if (code === 1) return "mostly-clear";
  if (code === 2) return "partly-cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95) return "thunder";
  return "partly-cloudy";
}

/**
 * Map NWS shortForecast / period text → hub WeatherIcon glyph.
 * Beach widgets get hourly NWS text, not WMO codes.
 */
export function weatherIconFromForecastText(
  text: string | null | undefined,
): WeatherIconKind {
  const t = String(text || "").toLowerCase();
  if (!t) return "partly-cloudy";
  if (/thunder|t-?storm|lightning/.test(t)) return "thunder";
  if (/snow|flurries|blizzard|sleet|ice\s*pellet/.test(t)) return "snow";
  if (/heavy\s*rain|rain\s*shower|showers?/.test(t)) return "showers";
  if (/\brain\b|precip/.test(t)) return "rain";
  if (/drizzle|sprinkle|light\s*rain/.test(t)) return "drizzle";
  if (/fog|haze|smoke|mist/.test(t)) return "fog";
  if (/overcast|cloudy/.test(t) && !/partly|mostly\s*sunny|mostly\s*clear/.test(t)) {
    return "overcast";
  }
  if (/partly\s*(cloudy|sunny)|mixed/.test(t)) return "partly-cloudy";
  if (/mostly\s*(sunny|clear)/.test(t)) return "mostly-clear";
  if (/sunny|clear|fair|hot/.test(t)) return "clear";
  if (/cloud/.test(t)) return "overcast";
  return "partly-cloudy";
}

export function weatherStyle(code: number) {
  if (code === 0 || code === 1) {
    return {
      sunGradient: "radial-gradient(circle,#FFED00,#FF8C00)",
      sunGlow: "0 0 24px rgba(255,140,0,.6)",
    };
  }
  if (code === 2 || code === 3) {
    return {
      sunGradient: "radial-gradient(circle,#d8d8d8,#8a8a8a)",
      sunGlow: "0 0 18px rgba(200,200,200,.35)",
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      sunGradient: "radial-gradient(circle,#19E3FF,#0044FF)",
      sunGlow: "0 0 22px rgba(25,227,255,.45)",
    };
  }
  if (code >= 95) {
    return {
      sunGradient: "radial-gradient(circle,#8800FF,#19E3FF)",
      sunGlow: "0 0 22px rgba(136,0,255,.5)",
    };
  }
  return {
    sunGradient: "radial-gradient(circle,#C8FA3C,#19E3FF)",
    sunGlow: "0 0 20px rgba(200,250,60,.4)",
  };
}

/** Captions assume °F (US / Portland display). */
function prideCaption(high: number, low: number, code: number, isEstimate: boolean) {
  const range = `Week H ${high}° · L ${low}°`;
  if (isEstimate) {
    return `${range} · ${PORTLAND_LOCATION_LABEL} · Live forecast when available`;
  }
  if (code >= 51 && code <= 82) return `${range} · ${PORTLAND_CITY} · Pack a light layer`;
  if (high >= 90) return `${range} · Hot ${PORTLAND_CITY} week. Hydrate`;
  if (high >= 75) return `${range} · Solid parade weather in ${PORTLAND_CITY}`;
  if (high >= 65) return `${range} · Mild. Bring a layer for night`;
  return `${range} · Cooler. Bring a layer`;
}

function pacificTodayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: PORTLAND_TZ });
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function dayLabelFromIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  // noon UTC avoids DST edge when labeling
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase().slice(0, 3);
}

function dateLabelFromIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function isDuringPrideWeekend(now = new Date()) {
  const start = new Date(`${PRIDE_WEEKEND_START}T00:00:00-07:00`).getTime();
  const end = new Date(`${PRIDE_WEEKEND_END}T23:59:59-07:00`).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

export function isAfterPrideWeekend(now = new Date()) {
  return now.getTime() > new Date(`${PRIDE_WEEKEND_END}T23:59:59-07:00`).getTime();
}

function forecastDayFrom(
  day: string,
  dateLabel: string,
  high: number,
  low: number,
  code: number,
  iso: string,
  highlight: boolean,
): PortlandForecastDay {
  return {
    day,
    dateLabel,
    high,
    low,
    highlight,
    code,
    condition: wmoLabel(code),
    icon: weatherIconForCode(code),
    iso,
  };
}

/** Mid-July Portland climate-style fallback when the live API is offline. */
function rollingFallback(): PortlandWeather {
  const today = pacificTodayIso();
  const codes = [1, 2, 1, 3, 2, 0, 1];
  const highs = [78, 80, 82, 79, 81, 84, 80];
  const lows = [56, 57, 58, 57, 58, 59, 57];
  const forecast: PortlandForecastDay[] = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysIso(today, i);
    const code = codes[i];
    return forecastDayFrom(
      dayLabelFromIso(iso),
      dateLabelFromIso(iso),
      highs[i],
      lows[i],
      code,
      iso,
      i === 0,
    );
  });
  const high = Math.max(...forecast.map(d => d.high));
  const low = Math.min(...forecast.map(d => d.low));
  const currentCode = forecast[0].code;
  return {
    currentTemp: forecast[0].high,
    condition: wmoLabel(currentCode),
    high,
    low,
    caption: prideCaption(high, low, currentCode, true),
    forecast,
    isEstimate: true,
    city: PORTLAND_CITY,
    locationLabel: PORTLAND_LOCATION_LABEL,
    tempContext: `Estimate · ${PORTLAND_LOCATION_LABEL}`,
    currentCode,
    currentIcon: weatherIconForCode(currentCode),
    ...weatherStyle(currentCode),
  };
}

function prideFallback(): PortlandWeather {
  const codes = [1, 1, 2, 1, 0, 0, 1];
  const forecast: PortlandForecastDay[] = PRIDE_DAY_LABELS.map((day, i) =>
    forecastDayFrom(
      day,
      PRIDE_DATE_LABELS[i],
      [84, 86, 87, 85, 88, 90, 86][i],
      [58, 59, 60, 59, 61, 62, 60][i],
      codes[i],
      PRIDE_DATES[i],
      day === "SAT",
    ),
  );
  const high = Math.max(...forecast.map(d => d.high));
  const low = Math.min(...forecast.map(d => d.low));
  const code = 1;
  return {
    currentTemp: forecast.find(d => d.highlight)?.high ?? high,
    condition: wmoLabel(code),
    high,
    low,
    caption: prideCaption(high, low, code, true),
    forecast,
    isEstimate: true,
    city: PORTLAND_CITY,
    locationLabel: PORTLAND_LOCATION_LABEL,
    tempContext: "Pride Week estimate · Portland, OR",
    currentCode: code,
    currentIcon: weatherIconForCode(code),
    ...weatherStyle(code),
  };
}

type OpenMeteoPayload = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
  current?: { temperature_2m?: number; weather_code?: number };
  daily_units?: { temperature_2m_max?: string };
  current_units?: { temperature_2m?: string };
};

function isFahrenheitUnit(unit: string | undefined): boolean {
  if (!unit) return false;
  const u = unit.toLowerCase();
  return u.includes("f") || u.includes("fahrenheit");
}

function isCelsiusUnit(unit: string | undefined): boolean {
  if (!unit) return false;
  const u = unit.toLowerCase();
  return (u.includes("c") || u.includes("celsius")) && !u.includes("f");
}

function openMeteoUrl(opts: {
  startDate?: string;
  endDate?: string;
  forecastDays?: number;
  includeCurrent: boolean;
}) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", PORTLAND_LAT);
  url.searchParams.set("longitude", PORTLAND_LNG);
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("timezone", PORTLAND_TZ);
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("precipitation_unit", "inch");
  if (opts.forecastDays != null) {
    url.searchParams.set("forecast_days", String(opts.forecastDays));
  } else if (opts.startDate && opts.endDate) {
    url.searchParams.set("start_date", opts.startDate);
    url.searchParams.set("end_date", opts.endDate);
  }
  if (opts.includeCurrent) {
    url.searchParams.set("current", "temperature_2m,weather_code");
  }
  return url;
}

async function fetchJson(url: URL): Promise<OpenMeteoPayload | null> {
  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as OpenMeteoPayload;
  } catch {
    return null;
  }
}

/**
 * Build today + following 6 days (Pacific calendar).
 * Skips any past days Open-Meteo may still return at the head of the series.
 */
function parseDailyRows(
  data: OpenMeteoPayload,
): Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }> | null {
  if (isCelsiusUnit(data.daily_units?.temperature_2m_max)) return null;
  const times = data.daily?.time ?? [];
  const highs = data.daily?.temperature_2m_max ?? [];
  const lows = data.daily?.temperature_2m_min ?? [];
  const codes = data.daily?.weather_code ?? [];
  if (times.length < 1) return null;

  const today = pacificTodayIso();
  let startIdx = times.indexOf(today);
  if (startIdx < 0) {
    // First day on/after today (API timezone edge)
    startIdx = times.findIndex(t => t >= today);
    if (startIdx < 0) startIdx = 0;
  }

  const rows: Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }> = [];
  for (let i = startIdx; i < times.length && rows.length < 7; i++) {
    const iso = times[i];
    const high = highs[i];
    const low = lows[i];
    if (high == null || low == null || !Number.isFinite(high) || !Number.isFinite(low)) continue;
    rows.push({
      day: dayLabelFromIso(iso),
      dateLabel: dateLabelFromIso(iso),
      high: Math.round(high),
      low: Math.round(low),
      code: codes[i] ?? 0,
      iso,
    });
  }

  if (rows.length < 7) return null;
  const maxHigh = Math.max(...rows.map(r => r.high));
  if (maxHigh < 40 || maxHigh > 120) return null;
  if (!isFahrenheitUnit(data.daily_units?.temperature_2m_max) && maxHigh < 50) return null;
  return rows;
}

function buildPrideForecast(
  data: OpenMeteoPayload,
): Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }> | null {
  if (isCelsiusUnit(data.daily_units?.temperature_2m_max)) return null;

  const times = data.daily?.time ?? [];
  const rows = PRIDE_DATES.map((iso, i) => {
    const idx = times.indexOf(iso);
    if (idx < 0) return null;
    const high = data.daily!.temperature_2m_max![idx];
    const low = data.daily!.temperature_2m_min![idx];
    if (high == null || low == null || !Number.isFinite(high) || !Number.isFinite(low)) return null;
    return {
      day: PRIDE_DAY_LABELS[i],
      dateLabel: PRIDE_DATE_LABELS[i],
      high: Math.round(high),
      low: Math.round(low),
      code: data.daily!.weather_code![idx] ?? 0,
      iso,
    };
  });

  if (rows.some(r => r === null)) return null;
  const out = rows as Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }>;
  const maxHigh = Math.max(...out.map(r => r.high));
  if (maxHigh < 50 || maxHigh > 120) return null;
  if (!isFahrenheitUnit(data.daily_units?.temperature_2m_max) && maxHigh < 50) return null;
  return out;
}

function assemble(
  rows: Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }>,
  current: { temp?: number; code?: number } | null,
  isEstimate: boolean,
  mode: "pride" | "rolling",
): PortlandWeather {
  const today = pacificTodayIso();
  const during = isDuringPrideWeekend();
  const todayRow = rows.find(r => r.iso === today);
  const featured = todayRow ?? rows[0];
  const weekHigh = Math.max(...rows.map(r => r.high));
  const weekLow = Math.min(...rows.map(r => r.low));

  const hasLiveNow = current?.temp != null && Number.isFinite(current.temp);
  const currentTemp = hasLiveNow ? Math.round(current!.temp!) : featured.high;
  const currentCode = hasLiveNow && current?.code != null ? current.code : featured.code;

  let tempContext: string;
  if (hasLiveNow) {
    tempContext = `Now · ${PORTLAND_LOCATION_LABEL}`;
  } else if (todayRow) {
    tempContext = `Today high · ${PORTLAND_LOCATION_LABEL}`;
  } else {
    tempContext = `${featured.day} high · ${PORTLAND_LOCATION_LABEL}`;
  }

  const forecast: PortlandForecastDay[] = rows.map(row =>
    forecastDayFrom(
      row.day,
      row.dateLabel,
      row.high,
      row.low,
      row.code,
      row.iso,
      row.iso === today || (!todayRow && row === featured),
    ),
  );

  return {
    currentTemp,
    condition: wmoLabel(currentCode),
    high: weekHigh,
    low: weekLow,
    caption: prideCaption(weekHigh, weekLow, currentCode, isEstimate),
    forecast,
    isEstimate,
    city: PORTLAND_CITY,
    locationLabel: PORTLAND_LOCATION_LABEL,
    tempContext: `${tempContext}${mode === "pride" && during ? " · Pride Week" : ""}`,
    currentCode,
    currentIcon: weatherIconForCode(currentCode),
    ...weatherStyle(currentCode),
  };
}

/**
 * Hub 7-day strip: always **today + following 6 days** (Pacific).
 * Pride Week no longer pins the strip to Jul 13–19 Mon→Sun.
 */
export async function fetchPortlandWeather(): Promise<PortlandWeather> {
  const includeCurrent = true;

  // Ask for a few extra days so we can still slice a full 7 if the series
  // includes a past day or timezone lag at the head.
  const rollingData = await fetchJson(
    openMeteoUrl({ forecastDays: 10, includeCurrent }),
  );
  if (rollingData) {
    const rows = parseDailyRows(rollingData);
    if (rows) {
      const cur =
        rollingData.current?.temperature_2m != null
          ? {
              temp: rollingData.current.temperature_2m,
              code: rollingData.current.weather_code,
            }
          : null;
      if (cur && isCelsiusUnit(rollingData.current_units?.temperature_2m)) {
        return assemble(rows, null, false, "rolling");
      }
      return assemble(rows, cur, false, "rolling");
    }
  }

  // Last resort: still today-centric climate fallback (not fixed Pride week).
  return rollingFallback();
}
