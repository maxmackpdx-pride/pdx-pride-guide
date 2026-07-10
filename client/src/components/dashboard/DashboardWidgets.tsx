import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import { PRIDE_WEEK_START_DATE } from "@shared/prideWeek";
import { parsePacificEventTime, useCountdown } from "@/lib/countdown";
import { fetchPortlandWeather, isAfterPrideWeekend } from "@/lib/portlandWeather";
import "@/components/hub/hub-home.css";

export default function DashboardWidgets() {
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events").then(r => r.json()),
  });

  const showPrideWidgets = !isAfterPrideWeekend();
  const showPrideWeather = showPrideWidgets;

  const { data: weather, isError: weatherError } = useQuery({
    queryKey: ["portland-weather", "pride-weekend-2026"],
    queryFn: fetchPortlandWeather,
    staleTime: 1000 * 60 * 30,
    retry: 1,
    enabled: showPrideWeather,
  });

  const prideTarget = useMemo(() => {
    const starts = events
      .map(event => parsePacificEventTime(event.dateStart))
      .filter((time): time is number => typeof time === "number" && Number.isFinite(time))
      .sort((a, b) => a - b);
    return starts[0] || new Date(`${PRIDE_WEEK_START_DATE}T00:00:00-07:00`).getTime();
  }, [events]);

  const countdown = useCountdown(prideTarget);
  const nextEvent = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const at = parsePacificEventTime(a.dateStart) || 0;
      const bt = parsePacificEventTime(b.dateStart) || 0;
      return at - bt;
    });
    return sorted[0];
  }, [events]);

  const live = countdown !== null;

  if (!showPrideWidgets && !showPrideWeather) return null;

  return (
    <div className="hub-widget-stack">
      {showPrideWeather && weather && (
        <section className="hub-weather" aria-label="Pride week weather">
          <div className="hub-weather__top">
            <span className="hub-weather__kicker">Pride Week · Jul 13 to 19</span>
            <span
              className="hub-weather__sun"
              style={{
                background: weather.sunGradient,
                boxShadow: weather.sunGlow,
              }}
              aria-hidden
            />
          </div>
          {(weatherError || weather.isEstimate) && (
            <span className="hub-weather__badge">{weatherError ? "Offline" : "Estimate"}</span>
          )}
          <div className="hub-weather__temp-row">
            <span className="hub-weather__temp">{weather.currentTemp}°</span>
            <span className="hub-weather__cond">{weather.condition}</span>
          </div>
          <div className="hub-weather__caption">{weather.caption}</div>
          <div className="hub-weather__forecast">
            {weather.forecast.map(day => (
              <div key={day.day} className="hub-weather__day">
                <div className="hub-weather__day-label">{day.day}</div>
                <div className={`hub-weather__day-temp${day.highlight ? " is-hot" : ""}`}>
                  {day.high}°
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPrideWidgets && (
        <section className="hub-pride-live" aria-label="Pride week countdown">
          <div className="hub-pride-live__top">
            <h3 className="hub-pride-live__title">Pride Week</h3>
            <span className="hub-pride-live__badge">
              <i aria-hidden />
              {live ? "Live" : "Soon"}
            </span>
          </div>
          <span className="hub-pride-live__kicker">Jul 13 to 19 · Portland</span>
          {countdown ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginTop: 4,
              }}
            >
              {[
                [countdown.days, "Days", "#ccff00"],
                [countdown.hours, "Hrs", "#00ffff"],
                [countdown.minutes, "Min", "#ff00cc"],
              ].map(([value, label, color]) => (
                <div
                  key={label as string}
                  style={{
                    textAlign: "center",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "10px 6px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontWeight: 900,
                      fontSize: 28,
                      lineHeight: 1,
                      color: color as string,
                    }}
                  >
                    {String(value).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#666",
                      marginTop: 4,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 14, color: "#999" }}>Pride weekend is here.</div>
          )}
          {nextEvent && (
            <div className="hub-pride-live__next">
              <span aria-hidden />
              Next up: <b>{nextEvent.title}</b>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
