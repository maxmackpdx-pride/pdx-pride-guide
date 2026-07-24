import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPortlandWeather,
  weatherStyle,
  type PortlandForecastDay,
} from "@/lib/portlandWeather";
import WeatherIcon from "@/components/hub/WeatherIcon";

const ROTATE_MS = 2800;

/**
 * 7-day Portland forecast for the hub feed.
 * - Live Open-Meteo data with WMO weather symbols
 * - Always today + the following 6 days (Pacific)
 * - Auto-rotates highlight across the 7 days
 */
export default function HubWeatherForecast() {
  const [rotateIdx, setRotateIdx] = useState(0);

  const {
    data: weather,
    isError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["portland-weather", "hub-feed", "today-plus-6"],
    queryFn: fetchPortlandWeather,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });

  const days = weather?.forecast ?? [];
  const n = days.length;

  // Cycle highlight through all 7 days
  useEffect(() => {
    if (n < 2) return;
    const t = window.setInterval(() => {
      setRotateIdx(i => (i + 1) % n);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [n]);

  // Keep index in range when data reloads
  useEffect(() => {
    if (n > 0 && rotateIdx >= n) setRotateIdx(0);
  }, [n, rotateIdx]);

  const featured: PortlandForecastDay | null = n > 0 ? days[rotateIdx % n] : null;
  const heroIcon = featured?.icon ?? weather?.currentIcon ?? "partly-cloudy";
  const heroStyle = weatherStyle(featured?.code ?? weather?.currentCode ?? 1);

  // While rotating: show that day's high + condition; still note "now" on today's live temp when featured is today
  const showLiveNow = Boolean(
    weather
    && featured
    && featured.highlight
    && !weather.isEstimate
    && weather.tempContext.toLowerCase().includes("now"),
  );
  const displayTemp = showLiveNow
    ? weather!.currentTemp
    : (featured?.high ?? weather?.currentTemp ?? "-");
  const displayCond = featured?.condition ?? weather?.condition ?? "";
  const displayContext = showLiveNow
    ? weather!.tempContext
    : featured
      ? `${featured.day} high · ${featured.dateLabel}`
      : weather?.tempContext ?? "";

  return (
    <section className="card hub-v2-weather" aria-label="Portland, Oregon 7-day forecast">
      <div className="hub-v2-weather__top">
        <div className="hub-v2-weather__titles">
          <div className="kick hub-v2-weather__kick">7-day forecast</div>
          <h2 className="hub-v2-weather__city">Portland, OR</h2>
          <p className="hub-v2-weather__sub">Today + next 6 days</p>
        </div>
        <span
          className="hub-v2-weather__hero-icon"
          style={{ color: "#ffc14a", filter: `drop-shadow(${heroStyle.sunGlow})` }}
          aria-hidden
        >
          <WeatherIcon kind={heroIcon} size={32} />
        </span>
      </div>

      {(isError || weather?.isEstimate) && (
        <span className="hub-v2-weather__badge">{isError ? "Offline" : "Estimate"}</span>
      )}

      {isLoading && !weather ? (
        <p className="hub-v2-weather__loading">Loading Portland forecast…</p>
      ) : weather ? (
        <>
          <div className="hub-v2-weather__temp-row">
            <span className="hub-v2-weather__temp">{displayTemp}°</span>
            <div className="hub-v2-weather__temp-meta">
              <span className="hub-v2-weather__unit">F</span>
              <span className="hub-v2-weather__cond">{displayCond}</span>
              <span className="hub-v2-weather__now">{displayContext}</span>
            </div>
          </div>
          <p className="hub-v2-weather__caption">{weather.caption}</p>
          <div
            className="hub-v2-weather__forecast"
            aria-label="Seven-day forecast"
            role="list"
          >
            {days.map((day, i) => {
              const active = i === rotateIdx % n;
              return (
                <button
                  key={day.iso || day.day + day.dateLabel}
                  type="button"
                  role="listitem"
                  className={`hub-v2-weather__day${active ? " is-hot" : ""}${day.highlight ? " is-today" : ""}`}
                  onClick={() => setRotateIdx(i)}
                  aria-pressed={active}
                  aria-label={`${day.day} ${day.dateLabel}: ${day.condition}, high ${day.high}°, low ${day.low}°`}
                >
                  <div className="hub-v2-weather__day-label">{day.day}</div>
                  <div className="hub-v2-weather__day-date">{day.dateLabel}</div>
                  <div className="hub-v2-weather__day-icon" aria-hidden>
                    <WeatherIcon kind={day.icon} size={20} />
                  </div>
                  <div className={`hub-v2-weather__day-temp${active ? " is-hot" : ""}`}>
                    {day.high}°
                  </div>
                </button>
              );
            })}
          </div>
          {isFetching && !isLoading && (
            <span className="hub-v2-weather__refresh" aria-hidden>
              Updating…
            </span>
          )}
        </>
      ) : (
        <p className="hub-v2-weather__loading">Could not load Portland weather.</p>
      )}
    </section>
  );
}
