import {
  PRIDE_WEEK_DAYS,
  PRIDE_WEEK_DAY_OPTIONS,
  PRIDE_WEEK_START_DATE,
  PRIDE_WEEK_END_DATE,
} from "@shared/prideWeek";

export type PortlandForecastDay = {
  day: string;
  dateLabel: string;
  high: number;
  low: number;
  highlight: boolean;
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
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

function wmoLabel(code: number) {
  return WMO_LABELS[code] ?? "Mixed skies";
}

function weatherStyle(code: number) {
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
  return {
    sunGradient: "radial-gradient(circle,#C8FA3C,#19E3FF)",
    sunGlow: "0 0 20px rgba(200,250,60,.4)",
  };
}

/** Captions assume °F (US / Portland display). */
function prideCaption(high: number, low: number, code: number, isEstimate: boolean) {
  const range = `Week H ${high}° · L ${low}°`;
  if (isEstimate) {
    return `${range} · ${PORTLAND_LOCATION_LABEL} · Jul 13 to 19 · Live forecast when available`;
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

export function isDuringPrideWeekend(now = new Date()) {
  const start = new Date(`${PRIDE_WEEKEND_START}T00:00:00-07:00`).getTime();
  const end = new Date(`${PRIDE_WEEKEND_END}T23:59:59-07:00`).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

export function isAfterPrideWeekend(now = new Date()) {
  return now.getTime() > new Date(`${PRIDE_WEEKEND_END}T23:59:59-07:00`).getTime();
}

/** Mid-July Portland climate-style fallback when the live API is offline. */
function prideFallback(): PortlandWeather {
  const forecast: PortlandForecastDay[] = PRIDE_DAY_LABELS.map((day, i) => ({
    day,
    dateLabel: PRIDE_DATE_LABELS[i],
    high: [84, 86, 87, 85, 88, 90, 86][i],
    low: [58, 59, 60, 59, 61, 62, 60][i],
    highlight: day === "SAT",
  }));
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
  // Avoid matching "fahrenheit"
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
  // Critical: hub UI is °F for Portland, OR. Open-Meteo defaults to °C.
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

  // Sanity: Portland mid-July highs are almost never under ~50°F or over 120°F.
  const maxHigh = Math.max(...out.map(r => r.high));
  if (maxHigh < 50 || maxHigh > 120) return null;

  // If unit metadata missing, still reject Celsius-looking peaks (~25–38).
  if (!isFahrenheitUnit(data.daily_units?.temperature_2m_max) && maxHigh < 50) return null;

  return out;
}

function assemble(
  rows: Array<{ day: string; dateLabel: string; high: number; low: number; code: number; iso: string }>,
  current: { temp?: number; code?: number } | null,
  isEstimate: boolean,
): PortlandWeather {
  const today = pacificTodayIso();
  const during = isDuringPrideWeekend();
  const satRow = rows.find(r => r.day === "SAT") ?? rows[5] ?? rows[0];
  const todayRow = rows.find(r => r.iso === today);
  const featured = todayRow ?? satRow;
  const weekHigh = Math.max(...rows.map(r => r.high));
  const weekLow = Math.min(...rows.map(r => r.low));

  const hasLiveNow = current?.temp != null && Number.isFinite(current.temp);
  const currentTemp = hasLiveNow ? Math.round(current!.temp!) : featured.high;
  const currentCode = hasLiveNow && current?.code != null ? current.code : featured.code;

  let tempContext: string;
  if (hasLiveNow) {
    tempContext = during ? `Now · ${PORTLAND_LOCATION_LABEL}` : `Now in ${PORTLAND_LOCATION_LABEL}`;
  } else if (todayRow) {
    tempContext = `Today high · ${PORTLAND_LOCATION_LABEL}`;
  } else {
    tempContext = `${featured.day} high · Pride Week · ${PORTLAND_LOCATION_LABEL}`;
  }

  const forecast: PortlandForecastDay[] = rows.map(row => ({
    day: row.day,
    dateLabel: row.dateLabel,
    high: row.high,
    low: row.low,
    highlight: row.iso === today || (!during && !todayRow && row.day === "SAT"),
  }));

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
    tempContext,
    ...weatherStyle(currentCode),
  };
}

export async function fetchPortlandWeather(): Promise<PortlandWeather> {
  // Always ask for current conditions in Portland so the big number is real "now".
  const includeCurrent = true;

  // 1) Explicit Pride Week window Jul 13–19 for downtown Portland (°F).
  const prideData = await fetchJson(
    openMeteoUrl({
      startDate: PRIDE_WEEKEND_START,
      endDate: PRIDE_WEEKEND_END,
      includeCurrent,
    }),
  );
  if (prideData) {
    const rows = buildPrideForecast(prideData);
    if (rows) {
      const cur =
        prideData.current?.temperature_2m != null
          ? {
              temp: prideData.current.temperature_2m,
              code: prideData.current.weather_code,
            }
          : null;
      // If current came back in C somehow, drop it (keep daily F forecast).
      if (cur && isCelsiusUnit(prideData.current_units?.temperature_2m)) {
        return assemble(rows, null, false);
      }
      return assemble(rows, cur, false);
    }
  }

  // 2) Rolling 16-day forecast (still °F) may include Jul 13–19.
  const extendedData = await fetchJson(
    openMeteoUrl({ forecastDays: 16, includeCurrent }),
  );
  if (extendedData) {
    const rows = buildPrideForecast(extendedData);
    if (rows) {
      const cur =
        extendedData.current?.temperature_2m != null
          ? {
              temp: extendedData.current.temperature_2m,
              code: extendedData.current.weather_code,
            }
          : null;
      if (cur && isCelsiusUnit(extendedData.current_units?.temperature_2m)) {
        return assemble(rows, null, false);
      }
      return assemble(rows, cur, false);
    }
  }

  return prideFallback();
}
