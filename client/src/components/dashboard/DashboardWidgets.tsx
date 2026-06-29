import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import { parsePacificEventTime, useCountdown } from "@/lib/countdown";
import { fetchPortlandWeather, isAfterPrideWeekend } from "@/lib/portlandWeather";

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
    return starts[0] || new Date("2026-07-16T00:00:00-07:00").getTime();
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

  return (
    <div className="dash-widget-stack">
      {showPrideWeather && weather && (
        <section className="dash-weather">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div className="dash-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "var(--dash-muted)" }}>
                  Pride Weekend · Jul 16–19
                </div>
                {(weatherError || weather.isEstimate) && (
                  <span
                    className="dash-mono"
                    style={{
                      fontSize: 9,
                      color: "#0a0a0a",
                      background: weatherError ? "rgba(255,255,255,0.55)" : "rgba(255,237,0,0.85)",
                      padding: "3px 7px",
                      borderRadius: 999,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {weatherError ? "Offline" : "Estimate"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span className="dash-weather-temp">{weather.currentTemp}°</span>
                <span className="dash-anton" style={{ fontSize: 16, color: "var(--dash-orange)" }}>{weather.condition}</span>
              </div>
              <div className="dash-mono" style={{ fontSize: 11, color: "#9d9a92", marginTop: 8, textTransform: "none", letterSpacing: "0.04em" }}>
                {weather.caption}
              </div>
            </div>
            <div style={{ position: "relative", width: 48, height: 48, flex: "0 0 auto" }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: weather.sunGradient,
                  boxShadow: weather.sunGlow,
                }}
              />
            </div>
          </div>
          <div className="dash-weather-forecast">
            {weather.forecast.map(day => (
              <div key={day.day} className="dash-weather-day">
                <div className="dash-mono" style={{ fontSize: 9.5, color: "#6f736c" }}>{day.day}</div>
                <div
                  className="dash-anton"
                  style={{
                    fontSize: 16,
                    color: day.highlight ? "#FFED00" : "#fff",
                    marginTop: 3,
                  }}
                >
                  {day.high}°
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPrideWidgets && (
      <section className="dash-countdown">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div className="dash-anton" style={{ fontSize: 22, color: "#fff" }}>Pride Weekend</div>
          <span
            className={`dash-mono${live ? " dash-live-badge" : ""}`}
            style={{
              fontSize: 10,
              color: "#0a0a0a",
              background: "var(--dash-lime)",
              padding: "5px 9px",
              borderRadius: 999,
            }}
          >
            {live ? "Live" : "Soon"}
          </span>
        </div>
        <div className="dash-mono" style={{ fontSize: 11, color: "#9d9a92", marginTop: 4 }}>
          Jul 16 – 19 · Portland
        </div>
        {countdown ? (
          <div className="dash-countdown-grid">
            {[
              [countdown.days, "Days", "var(--dash-lime)"],
              [countdown.hours, "Hrs", "var(--dash-cyan)"],
              [countdown.minutes, "Min", "var(--dash-magenta)"],
            ].map(([value, label, color]) => (
              <div key={label as string} className="dash-countdown-box">
                <div className="dash-countdown-num" style={{ color: color as string }}>
                  {String(value).padStart(2, "0")}
                </div>
                <div className="dash-mono" style={{ fontSize: 9, color: "#6f736c", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 14, color: "var(--dash-muted)" }}>Pride weekend is here.</div>
        )}
        {nextEvent && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,.08)",
              fontSize: 12.5,
              color: "#cbc8c0",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-lime)" }} />
            Next up: <span style={{ color: "#fff", fontWeight: 600 }}>{nextEvent.title}</span>
          </div>
        )}
      </section>
      )}
    </div>
  );
}