import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPortlandWeather,
  weatherStyle,
  type PortlandForecastDay,
} from "@/lib/portlandWeather";
import WeatherIcon from "@/components/hub/WeatherIcon";

/**
 * 7-day Portland forecast for the hub feed.
 * Stays pinned on today unless the viewer taps another day.
 */
export default function HubWeatherForecast() {
  const [selectedIdx, setSelectedIdx] = useState(0);

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
  const todayIdx = Math.max(0, days.findIndex((d) => d.highlight));

  useEffect(() => {
    if (n === 0) return;
    setSelectedIdx(todayIdx);
  }, [n, todayIdx]);

  const featured: PortlandForecastDay | null = n > 0 ? days[Math.min(selectedIdx, n - 1)] : null;
  const heroIcon = featured?.icon ?? weather?.currentIcon ?? "partly-cloudy";
  const heroStyle = weatherStyle(featured?.code ?? weather?.currentCode ?? 1);

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
    <section className="card hub-v2-weather pdx-glass-rebind" aria-label="Portland, Oregon 7-day forecast">
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
              const active = i === Math.min(selectedIdx, n - 1);
              return (
                <button
                  key={day.iso || day.day + day.dateLabel}
                  type="button"
                  role="listitem"
                  className={`hub-v2-weather__day${active ? " is-hot" : ""}${day.highlight ? " is-today" : ""}`}
                  onClick={() => setSelectedIdx(i)}
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
