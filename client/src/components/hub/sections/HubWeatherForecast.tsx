import { useQuery } from "@tanstack/react-query";
import { fetchPortlandWeather, isAfterPrideWeekend } from "@/lib/portlandWeather";

/**
 * 7-day Pride Week forecast for the hub feed (Experiment 101 register).
 * Replaces the former feed-top "You hold the keys" slot.
 */
export default function HubWeatherForecast() {
  const show = !isAfterPrideWeekend();

  const {
    data: weather,
    isError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["portland-weather", "hub-feed", "jul-13-19-2026", "f"],
    queryFn: fetchPortlandWeather,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 2,
    enabled: show,
  });

  if (!show) return null;

  return (
    <section className="card hub-v2-weather" aria-label="Portland, Oregon Pride week forecast">
      <div className="hub-v2-weather__top">
        <div className="hub-v2-weather__titles">
          <div className="kick hub-v2-weather__kick">7-day forecast</div>
          <h2 className="hub-v2-weather__city">Portland, OR</h2>
          <p className="hub-v2-weather__sub">Pride Week · Jul 13 to 19</p>
        </div>
        {weather && (
          <span
            className="hub-v2-weather__sun"
            style={{ background: weather.sunGradient, boxShadow: weather.sunGlow }}
            aria-hidden
          />
        )}
      </div>

      {(isError || weather?.isEstimate) && (
        <span className="hub-v2-weather__badge">{isError ? "Offline" : "Estimate"}</span>
      )}

      {isLoading && !weather ? (
        <p className="hub-v2-weather__loading">Loading Portland forecast…</p>
      ) : weather ? (
        <>
          <div className="hub-v2-weather__temp-row">
            <span className="hub-v2-weather__temp">{weather.currentTemp}°</span>
            <div className="hub-v2-weather__temp-meta">
              <span className="hub-v2-weather__unit">F</span>
              <span className="hub-v2-weather__cond">{weather.condition}</span>
              <span className="hub-v2-weather__now">{weather.tempContext}</span>
            </div>
          </div>
          <p className="hub-v2-weather__caption">{weather.caption}</p>
          <div className="hub-v2-weather__forecast" aria-label="Daily highs July 13 to 19">
            {weather.forecast.map((day) => (
              <div
                key={day.day}
                className={`hub-v2-weather__day${day.highlight ? " is-hot" : ""}`}
              >
                <div className="hub-v2-weather__day-label">{day.day}</div>
                <div className="hub-v2-weather__day-date">{day.dateLabel}</div>
                <div className={`hub-v2-weather__day-temp${day.highlight ? " is-hot" : ""}`}>
                  {day.high}°
                </div>
              </div>
            ))}
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
