export type PortlandForecastDay = {
  day: string;
  high: number;
  highlight: boolean;
};

export type PortlandWeather = {
  currentTemp: number;
  condition: string;
  high: number;
  low: number;
  caption: string;
  forecast: PortlandForecastDay[];
  sunGradient: string;
  sunGlow: string;
  isEstimate: boolean;
};

export const PRIDE_WEEKEND_START = "2026-07-16";
export const PRIDE_WEEKEND_END = "2026-07-19";
export const PRIDE_DAY_LABELS = ["THU", "FRI", "SAT", "SUN"] as const;

const PRIDE_DATES = [
  "2026-07-16",
  "2026-07-17",
  "2026-07-18",
  "2026-07-19",
];

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

function prideCaption(high: number, low: number, code: number, isEstimate: boolean) {
  const range = `H ${high}° · L ${low}°`;
  if (isEstimate) return `${range} · Jul 16–19 · Forecast updates closer to Pride`;
  if (code >= 51 && code <= 82) return `${range} · Pack a light layer`;
  if (high >= 75) return `${range} · Hot out — hydrate`;
  if (high >= 65) return `${range} · Solid parade weather`;
  return `${range} · Cooler — bring a layer`;
}

function pacificTodayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
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

function prideFallback(): PortlandWeather {
  const forecast: PortlandForecastDay[] = [
    { day: "THU", high: 74, highlight: false },
    { day: "FRI", high: 76, highlight: false },
    { day: "SAT", high: 79, highlight: true },
    { day: "SUN", high: 71, highlight: false },
  ];
  const high = Math.max(...forecast.map(day => day.high));
  const low = Math.min(59, ...forecast.map(day => day.high - 12));
  const code = 1;
  return {
    currentTemp: forecast.find(day => day.highlight)?.high ?? high,
    condition: wmoLabel(code),
    high,
    low,
    caption: prideCaption(high, low, code, true),
    forecast,
    isEstimate: true,
    ...weatherStyle(code),
  };
}

function buildFromDaily(
  data: {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weather_code?: number[];
    };
    current?: { temperature_2m?: number; weather_code?: number };
  },
  isEstimate: boolean,
): PortlandWeather | null {
  const times = data.daily?.time ?? [];
  const prideRows = PRIDE_DATES.map((iso, i) => {
    const idx = times.indexOf(iso);
    if (idx < 0) return null;
    return {
      day: PRIDE_DAY_LABELS[i],
      high: Math.round(data.daily!.temperature_2m_max![idx] ?? 0),
      low: Math.round(data.daily!.temperature_2m_min![idx] ?? 0),
      code: data.daily!.weather_code![idx] ?? 0,
      iso,
    };
  });

  if (prideRows.some(row => row === null)) return null;

  const rows = prideRows as Array<{ day: string; high: number; low: number; code: number; iso: string }>;
  const today = pacificTodayIso();
  const satRow = rows.find(row => row.day === "SAT") ?? rows[2];
  const weekendHigh = Math.max(...rows.map(row => row.high));
  const weekendLow = Math.min(...rows.map(row => row.low));
  const featured = rows.find(row => row.iso === today) ?? satRow;
  const currentCode = isDuringPrideWeekend() && data.current?.weather_code != null
    ? data.current.weather_code
    : featured.code;
  const currentTemp = isDuringPrideWeekend() && data.current?.temperature_2m != null
    ? Math.round(data.current.temperature_2m)
    : featured.high;

  const forecast = rows.map(row => ({
    day: row.day,
    high: row.high,
    highlight: row.iso === today || (!isDuringPrideWeekend() && row.day === "SAT"),
  }));

  return {
    currentTemp,
    condition: wmoLabel(currentCode),
    high: weekendHigh,
    low: weekendLow,
    caption: prideCaption(weekendHigh, weekendLow, currentCode, isEstimate),
    forecast,
    isEstimate,
    ...weatherStyle(currentCode),
  };
}

export async function fetchPortlandWeather(): Promise<PortlandWeather> {
  const prideUrl = new URL("https://api.open-meteo.com/v1/forecast");
  prideUrl.searchParams.set("latitude", "45.5152");
  prideUrl.searchParams.set("longitude", "-122.6784");
  prideUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  prideUrl.searchParams.set("timezone", "America/Los_Angeles");
  prideUrl.searchParams.set("start_date", PRIDE_WEEKEND_START);
  prideUrl.searchParams.set("end_date", PRIDE_WEEKEND_END);
  if (isDuringPrideWeekend()) {
    prideUrl.searchParams.set("current", "temperature_2m,weather_code");
  }

  try {
    const prideRes = await fetch(prideUrl);
    if (prideRes.ok) {
      const prideData = await prideRes.json();
      const parsed = buildFromDaily(prideData, false);
      if (parsed) return parsed;
    }
  } catch {
    // fall through to extended forecast / fallback
  }

  const extendedUrl = new URL("https://api.open-meteo.com/v1/forecast");
  extendedUrl.searchParams.set("latitude", "45.5152");
  extendedUrl.searchParams.set("longitude", "-122.6784");
  extendedUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  extendedUrl.searchParams.set("timezone", "America/Los_Angeles");
  extendedUrl.searchParams.set("forecast_days", "16");
  if (isDuringPrideWeekend()) {
    extendedUrl.searchParams.set("current", "temperature_2m,weather_code");
  }

  try {
    const extendedRes = await fetch(extendedUrl);
    if (!extendedRes.ok) return prideFallback();
    const extendedData = await extendedRes.json();
    const parsed = buildFromDaily(extendedData, false);
    if (parsed) return parsed;
  } catch {
    return prideFallback();
  }

  return prideFallback();
}