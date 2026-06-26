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
};

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

function prideCaption(high: number, low: number, code: number) {
  if (code >= 51 && code <= 82) return `H ${high}° · L ${low}° · Pack a light layer`;
  if (high >= 75) return `H ${high}° · L ${low}° · Hot out — hydrate`;
  if (high >= 65) return `H ${high}° · L ${low}° · Solid parade weather`;
  return `H ${high}° · L ${low}° · Cooler — bring a layer`;
}

export async function fetchPortlandWeather(): Promise<PortlandWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", "45.5152");
  url.searchParams.set("longitude", "-122.6784");
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("timezone", "America/Los_Angeles");
  url.searchParams.set("forecast_days", "4");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather unavailable");

  const data = await res.json();
  const currentCode = data.current?.weather_code ?? 0;
  const currentTemp = Math.round(data.current?.temperature_2m ?? 0);
  const high = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp);
  const low = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp);
  const style = weatherStyle(currentCode);

  const forecast = (data.daily?.time ?? []).slice(1, 4).map((iso: string, i: number) => {
    const date = new Date(`${iso}T12:00:00`);
    const day = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3);
    const temp = Math.round(data.daily.temperature_2m_max[i + 1] ?? 0);
    const highlight = day === "SAT";
    return { day, high: temp, highlight };
  });

  return {
    currentTemp,
    condition: wmoLabel(currentCode),
    high,
    low,
    caption: prideCaption(high, low, currentCode),
    forecast,
    ...style,
  };
}