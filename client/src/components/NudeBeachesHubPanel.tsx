import type { NudeBeachTab, NudeBeachesSnapshot } from "@shared/nudeBeaches";
import {
  swimSummaryDetail,
  normalizeSwimStatusLabel,
  SAUVIE_ISLAND_PARKING_URL,
  SAUVIE_ISLAND_SWIM_GUIDE_URL,
} from "@shared/nudeBeaches";
import WeatherIcon from "@/components/hub/WeatherIcon";
import {
  weatherIconFromForecastText,
  weatherStyle,
} from "@/lib/portlandWeather";
import "./NudeBeachesHubPanel.css";

/** Swim-status color ramp used for the big water-quality value + card border. */
function swimStatusColor(status?: string | null) {
  if (status === "pass") return "#39FF14";
  if (status === "fail") return "#FF4D4D";
  if (status === "warning") return "#FFB347";
  return "#19E3FF";
}

function formatShortTime(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

function trendLabel(trend?: string | null) {
  if (trend === "rising") return "Rising";
  if (trend === "falling") return "Falling";
  if (trend === "steady") return "Steady";
  return null;
}

/** Current-period NWS line → hub-style forecast glyph (same icons as 7-day hub strip). */
function weatherIconForLive(summary?: string | null, forecastDays?: { shortForecast?: string | null }[]) {
  const text = summary || forecastDays?.[0]?.shortForecast || null;
  return weatherIconFromForecastText(text);
}

function WeatherSectionHead({
  summary,
  forecastDays,
}: {
  summary?: string | null;
  forecastDays?: { shortForecast?: string | null }[];
}) {
  const kind = weatherIconForLive(summary, forecastDays);
  // Match hub hero tint: clear/sunny warm gold; rain/storm cooler cyan; else soft gold.
  const style =
    kind === "clear" || kind === "mostly-clear"
      ? weatherStyle(0)
      : kind === "rain" || kind === "showers" || kind === "drizzle"
        ? weatherStyle(61)
        : kind === "thunder"
          ? weatherStyle(95)
          : weatherStyle(2);

  return (
    <div className="nb-hub__weather-head">
      <div className="nb-hub__kicker">Weather</div>
      <span
        className="nb-hub__weather-hero-icon"
        style={{ color: "#ffc14a", filter: `drop-shadow(${style.sunGlow})` }}
        title={summary || undefined}
        aria-hidden
      >
        <WeatherIcon kind={kind} size={30} />
      </span>
    </div>
  );
}

function RoosterHub({ live }: { live: NudeBeachesSnapshot["roosterRock"] }) {
  const trend = trendLabel(live.levelTrend);
  const lowTime = formatShortTime(live.todayLowAt);
  const highTime = formatShortTime(live.todayHighAt);
  const swimBand = live.riverLevelFt != null && live.riverLevelFt >= 15;

  return (
    <div className="nb-hub nb-hub--rooster">
      <section className="nb-hub__section nb-hub__section--pulse">
        <WeatherSectionHead summary={live.weatherSummary} forecastDays={live.forecastDays} />
        <div className="nb-hub__weather-grid">
          <div className="nb-hub__weather-main">
            <span className="nb-hub__weather-value">
              {live.airTempF != null ? `${live.airTempF}°F` : "-"}
            </span>
            <span className="nb-hub__weather-label">Air temp</span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">{live.wind || "-"}</span>
            <span className="nb-hub__weather-stat-label">Wind</span>
          </div>
          <div className="nb-hub__weather-stat nb-hub__weather-stat--water">
            <span className="nb-hub__weather-stat-value">
              {live.waterTempF != null ? `${Math.round(live.waterTempF)}°F` : "-"}
            </span>
            <span className="nb-hub__weather-stat-label">
              Water{live.waterTempSite ? " · Warrendale" : ""}
            </span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">
              {live.airQuality?.split(" · ")[0] || "-"}
            </span>
            <span className="nb-hub__weather-stat-label">Air quality</span>
          </div>
        </div>
        <p className="nb-hub__summary">{live.weatherSummary || "NWS forecast unavailable."}</p>
        {live.waterClarity ? (
          <p className="nb-hub__summary" style={{ marginTop: 8 }}>
            {live.waterClarity}
          </p>
        ) : null}
      </section>

      <section
        className={`nb-hub__section nb-hub__level${
          swimBand ? " nb-hub__level--bad" : live.riverLevelFt != null ? " nb-hub__level--good" : ""
        }`}
      >
        <div className="nb-hub__level-head">
          <div className="nb-hub__kicker">River level</div>
          {live.crossingBand ? <span className="nb-hub__badge">{live.crossingBand}</span> : null}
        </div>
        <div className="nb-hub__level-value">
          {live.riverLevelFt != null ? live.riverLevelFt.toFixed(2) : "-"}
          <span className="nb-hub__level-unit">ft</span>
        </div>
        <p className="nb-hub__level-detail">
          {live.crossingAdvice || live.depthEstimate || "USGS gage below Bonneville Dam."}
        </p>
        <div className="nb-hub__level-range">
          <div>
            <span className="nb-hub__range-label">Today&apos;s low</span>
            <span className="nb-hub__range-value">
              {live.todayLowFt != null ? `${live.todayLowFt.toFixed(2)} ft` : "-"}
              {lowTime ? ` · ${lowTime}` : ""}
            </span>
          </div>
          <div>
            <span className="nb-hub__range-label">Today&apos;s high</span>
            <span className="nb-hub__range-value">
              {live.todayHighFt != null ? `${live.todayHighFt.toFixed(2)} ft` : "-"}
              {highTime ? ` · ${highTime}` : ""}
            </span>
          </div>
        </div>
        {(trend || live.crossingWindowNote) && (
          <p className="nb-hub__advice">
            {trend ? `${trend} over the last hour. ` : ""}
            {live.crossingWindowNote || ""}
          </p>
        )}
        <a className="nb-hub__link" href="https://roosterrockcrossing.com" target="_blank" rel="noopener noreferrer">
          Charts &amp; history →
        </a>
      </section>
    </div>
  );
}

function swimStatusClass(status?: string | null) {
  if (status === "pass") return "pass";
  if (status === "fail") return "fail";
  if (status === "warning") return "warning";
  return "unknown";
}

function SauvieHub({ live }: { live: NudeBeachesSnapshot["sauvieIsland"] }) {
  const swimClass = swimStatusClass(live.swimStatus);
  const swimLabel = normalizeSwimStatusLabel(live.swimStatusLabel, live.swimStatus);
  const swimColor = swimStatusColor(live.swimStatus);

  return (
    <div className="nb-hub nb-hub--sauvie">
      <section className="nb-hub__section nb-hub__section--pulse">
        <WeatherSectionHead summary={live.weatherSummary} forecastDays={live.forecastDays} />
        <div className="nb-hub__weather-grid">
          <div className="nb-hub__weather-main">
            <span className="nb-hub__weather-value">
              {live.airTempF != null ? `${live.airTempF}°F` : "-"}
            </span>
            <span className="nb-hub__weather-label">Air temp</span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">{live.wind || "-"}</span>
            <span className="nb-hub__weather-stat-label">Wind</span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">
              {live.forecastDays?.[0]?.highF != null ? `${live.forecastDays[0].highF}°F` : "-"}
            </span>
            <span className="nb-hub__weather-stat-label">
              {live.forecastDays?.[0]?.name ? `${live.forecastDays[0].name} high` : "Day high"}
            </span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">
              {live.parkingStatusLabel || "-"}
            </span>
            <span className="nb-hub__weather-stat-label">Parking</span>
          </div>
        </div>
        <p className="nb-hub__summary">{live.weatherSummary || "NWS forecast unavailable."}</p>
      </section>

      <section
        className={`nb-hub__section nb-hub__swim nb-hub__swim--${swimClass} nb-hub__section--water`}
        style={{ ["--nb-rim" as string]: swimColor }}
      >
        <div className="nb-hub__kicker">Water quality</div>
        <div className="nb-hub__swim-head">
          <span
            className="nb-hub__swim-value"
            style={{ color: swimColor, textShadow: `0 0 22px ${swimColor}59` }}
          >
            {swimLabel || "-"}
          </span>
          {live.lastSampleAt ? (
            <span className="nb-hub__swim-sampled">sampled {live.lastSampleAt}</span>
          ) : null}
        </div>
        <p className="nb-hub__summary">
          {swimSummaryDetail(live.swimSummary)
            || "Collins Beach is sampled bi-weekly through the Swim Guide. Verify the current sample before you get in."}
        </p>
        <a className="nb-hub__link" href={SAUVIE_ISLAND_SWIM_GUIDE_URL} target="_blank" rel="noopener noreferrer">
          Swim Guide →
        </a>
      </section>

      <section className="nb-hub__section">
        <div className="nb-hub__kicker">Parking permits</div>
        <p className="nb-hub__summary">
          {live.parkingNote ||
            "Mandatory on summer weekends through Labor Day. Buy a daily day pass online - seasonal sold-out is not the same as day passes gone."}
        </p>
        <a className="nb-hub__link" href={SAUVIE_ISLAND_PARKING_URL} target="_blank" rel="noopener noreferrer">
          Sauvie Island Parking →
        </a>
      </section>
    </div>
  );
}

type Props = {
  tab: NudeBeachTab;
  snapshot?: NudeBeachesSnapshot | null;
};

export default function NudeBeachesHubPanel({ tab, snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="nb-hub nb-hub--loading" aria-hidden>
        <div className="nb-hub__kicker">Loading conditions…</div>
      </div>
    );
  }

  return tab === "rooster-rock" ? (
    <RoosterHub live={snapshot.roosterRock} />
  ) : (
    <SauvieHub live={snapshot.sauvieIsland} />
  );
}