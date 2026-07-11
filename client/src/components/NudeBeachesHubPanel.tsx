import type { NudeBeachTab, NudeBeachesSnapshot } from "@shared/nudeBeaches";
import {
  SAUVIE_ISLAND_PARKING_URL,
  SAUVIE_ISLAND_SWIM_GUIDE_URL,
} from "@shared/nudeBeaches";
import "./NudeBeachesHubPanel.css";

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

function RoosterHub({ live }: { live: NudeBeachesSnapshot["roosterRock"] }) {
  const trend = trendLabel(live.levelTrend);
  const lowTime = formatShortTime(live.todayLowAt);
  const highTime = formatShortTime(live.todayHighAt);
  const swimBand = live.riverLevelFt != null && live.riverLevelFt >= 15;

  return (
    <div className="nb-hub nb-hub--rooster">
      <section className="nb-hub__section nb-hub__section--pulse">
        <div className="nb-hub__kicker">Weather</div>
        <div className="nb-hub__weather-grid">
          <div className="nb-hub__weather-main">
            <span className="nb-hub__weather-value">
              {live.airTempF != null ? `${live.airTempF}°F` : "—"}
            </span>
            <span className="nb-hub__weather-label">Air temp</span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">{live.wind || "—"}</span>
            <span className="nb-hub__weather-stat-label">Wind</span>
          </div>
          <div className="nb-hub__weather-stat nb-hub__weather-stat--water">
            <span className="nb-hub__weather-stat-value">
              {live.waterTempF != null ? `${Math.round(live.waterTempF)}°F` : "—"}
            </span>
            <span className="nb-hub__weather-stat-label">
              Water{live.waterTempSite ? " · Warrendale" : ""}
            </span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">
              {live.airQuality?.split(" · ")[0] || "—"}
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
          {live.riverLevelFt != null ? live.riverLevelFt.toFixed(2) : "—"}
          <span className="nb-hub__level-unit">ft</span>
        </div>
        <p className="nb-hub__level-detail">
          {live.crossingAdvice || live.depthEstimate || "USGS gage below Bonneville Dam."}
        </p>
        <div className="nb-hub__level-range">
          <div>
            <span className="nb-hub__range-label">Today&apos;s low</span>
            <span className="nb-hub__range-value">
              {live.todayLowFt != null ? `${live.todayLowFt.toFixed(2)} ft` : "—"}
              {lowTime ? ` · ${lowTime}` : ""}
            </span>
          </div>
          <div>
            <span className="nb-hub__range-label">Today&apos;s high</span>
            <span className="nb-hub__range-value">
              {live.todayHighFt != null ? `${live.todayHighFt.toFixed(2)} ft` : "—"}
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

  return (
    <div className="nb-hub nb-hub--sauvie">
      <section className={`nb-hub__section nb-hub__swim nb-hub__swim--${swimClass} nb-hub__section--water`}>
        <div className="nb-hub__kicker">Water quality</div>
        <div
          className={`nb-hub__level-value nb-hub__swim-value--${swimClass}`}
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
        >
          {live.swimStatusLabel || "—"}
        </div>
        <p className="nb-hub__summary">
          {live.swimSummary || "Bi-weekly Collins Beach samples — verify before you swim."}
          {live.lastSampleAt ? ` Latest: ${live.lastSampleAt}.` : ""}
        </p>
        <a className="nb-hub__link" href={SAUVIE_ISLAND_SWIM_GUIDE_URL} target="_blank" rel="noopener noreferrer">
          Swim Guide →
        </a>
      </section>

      <section className="nb-hub__section">
        <div className="nb-hub__kicker">Parking permits</div>
        <p className="nb-hub__summary">
          {live.parkingNote ||
            "Mandatory on summer weekends through Labor Day. Check live sold-out dates on SauvieIslandParking.com."}
        </p>
        <a className="nb-hub__link" href={SAUVIE_ISLAND_PARKING_URL} target="_blank" rel="noopener noreferrer">
          Sauvie Island Parking →
        </a>
      </section>

      <section className="nb-hub__section">
        <div className="nb-hub__kicker">Weather</div>
        <div className="nb-hub__weather-grid">
          <div className="nb-hub__weather-main">
            <span className="nb-hub__weather-value">
              {live.airTempF != null ? `${live.airTempF}°F` : "—"}
            </span>
            <span className="nb-hub__weather-label">Air temp</span>
          </div>
          <div className="nb-hub__weather-stat">
            <span className="nb-hub__weather-stat-value">{live.wind || "—"}</span>
            <span className="nb-hub__weather-stat-label">Wind</span>
          </div>
        </div>
        <p className="nb-hub__summary">{live.weatherSummary || "NWS forecast unavailable."}</p>
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