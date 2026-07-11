import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NudeBeachesSnapshot } from "@shared/nudeBeaches";
import { formatWindStat } from "@shared/nudeBeaches";

type BeachTab = "rooster" | "collins";

type ApiPayload = {
  data: NudeBeachesSnapshot;
  stale: boolean;
  fromCache: boolean;
  rateLimited?: boolean;
};

type Props = {
  showCollins?: boolean;
};

function swimStatusTone(status?: string | null): "good" | "warn" | "bad" | "neutral" {
  if (status === "pass") return "good";
  if (status === "fail") return "bad";
  if (status === "warning") return "warn";
  return "neutral";
}

function riverLevelTone(ft?: number | null): "good" | "warn" | "neutral" {
  if (ft == null) return "neutral";
  return ft >= 15 ? "warn" : "good";
}

export default function HomeBeachWidget({ showCollins = true }: Props) {
  const [tab, setTab] = useState<BeachTab>("rooster");

  const { data } = useQuery<ApiPayload>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 5 * 60_000,
    refetchInterval: query => (query.state.data?.stale ? 20_000 : false),
    refetchOnWindowFocus: true,
  });

  const snapshot = data?.data;
  const rooster = snapshot?.roosterRock;
  const sauvie = snapshot?.sauvieIsland;
  const roosterWind = formatWindStat(rooster?.wind);
  const sauvieWind = formatWindStat(sauvie?.wind);
  const isStale = Boolean(data?.stale);

  return (
    <div className="home-beach-widget">
      <div className="home-beach-widget__live">
        <span className="home-beach-widget__live-dot" aria-hidden />
        Live conditions
        {isStale ? <span className="home-beach-widget__stale">· refreshing</span> : null}
      </div>
      <div className="home-beach-widget__tabs" role="tablist" aria-label="Beach location">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rooster"}
          className={`home-beach-widget__tab${tab === "rooster" ? " home-beach-widget__tab--active home-beach-widget__tab--cyan" : ""}`}
          onClick={() => setTab("rooster")}
        >
          Rooster Rock
        </button>
        {showCollins && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "collins"}
            className={`home-beach-widget__tab${tab === "collins" ? " home-beach-widget__tab--active home-beach-widget__tab--orange" : ""}`}
            onClick={() => setTab("collins")}
          >
            Sauvie Island
          </button>
        )}
      </div>
      <div className="home-beach-widget__panel">
        {tab === "rooster" && rooster && (
          <>
            <h3 className="home-beach-widget__name">Rooster Rock</h3>
            <div className="home-beach-widget__grid">
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--good">
                  {rooster.airTempF != null ? `${rooster.airTempF}°` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">Air temp</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--neutral">
                  {rooster.waterTempF != null ? `${Math.round(rooster.waterTempF)}°` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">Water temp</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--good">
                  {roosterWind.value}
                </div>
                <div className="home-beach-widget__stat-label">{roosterWind.label}</div>
              </div>
              <div>
                <div className={`home-beach-widget__stat home-beach-widget__stat--${riverLevelTone(rooster.riverLevelFt)}`}>
                  {rooster.riverLevelFt != null ? `${rooster.riverLevelFt.toFixed(1)}ft` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">
                  {rooster.crossingBand ? `River · ${rooster.crossingBand}` : "River level"}
                </div>
              </div>
            </div>
            <Link href="/nude-beaches?tab=rooster-rock" className="home-beach-widget__link home-beach-widget__link--cyan">
              Full conditions →
            </Link>
          </>
        )}
        {tab === "collins" && sauvie && (
          <>
            <h3 className="home-beach-widget__name">Collins Beach</h3>
            <div className="home-beach-widget__sub">Sauvie Island</div>
            <div className="home-beach-widget__grid">
              <div>
                <div className={`home-beach-widget__stat home-beach-widget__stat--${swimStatusTone(sauvie.swimStatus)}`}>
                  {sauvie.swimStatusLabel || "—"}
                </div>
                <div className="home-beach-widget__stat-label">Collins swim</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--good">
                  {sauvie.airTempF != null ? `${sauvie.airTempF}°` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">Air temp</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--good">
                  {sauvieWind.value}
                </div>
                <div className="home-beach-widget__stat-label">{sauvieWind.label}</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--neutral">Permits</div>
                <div className="home-beach-widget__stat-label">Parking</div>
              </div>
            </div>
            <Link href="/nude-beaches?tab=sauvie-island" className="home-beach-widget__link home-beach-widget__link--orange">
              Full conditions →
            </Link>
          </>
        )}
        {!snapshot && <div className="home-beach-widget__loading">Loading beach conditions…</div>}
      </div>
    </div>
  );
}