import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NudeBeachesSnapshot } from "@shared/nudeBeaches";


type BeachTab = "rooster" | "collins";

type Props = {
  showCollins?: boolean;
};

function crowdLabel(band?: string | null): { text: string; status: "good" | "warn" | "bad" | "neutral" } {
  if (!band) return { text: "—", status: "neutral" };
  const lower = band.toLowerCase();
  if (lower.includes("busy") || lower.includes("flood")) return { text: "Busy", status: "warn" };
  if (lower.includes("mellow") || lower.includes("low")) return { text: "Mellow", status: "good" };
  return { text: band, status: "neutral" };
}

export default function HomeBeachWidget({ showCollins = true }: Props) {
  const [tab, setTab] = useState<BeachTab>("rooster");

  const { data } = useQuery<{ data: NudeBeachesSnapshot }>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 120_000,
  });

  const snapshot = data?.data;
  const rooster = snapshot?.roosterRock;
  const sauvie = snapshot?.sauvieIsland;
  const roosterCrowd = crowdLabel(rooster?.crossingBand);
  const sauvieCrowd = { text: "Mellow", status: "good" as const };

  return (
    <div className="home-beach-widget">
      <div className="home-beach-widget__live">
        <span className="home-beach-widget__live-dot" aria-hidden />
        Live conditions
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
                <div className={`home-beach-widget__stat home-beach-widget__stat--good`}>
                  {rooster.airTempF != null ? `${rooster.airTempF}°` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">Weather</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--neutral">
                  {rooster.riverLevelFt != null ? `${rooster.riverLevelFt.toFixed(1)}ft` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">River level</div>
              </div>
              <div>
                <div className={`home-beach-widget__stat home-beach-widget__stat--${roosterCrowd.status}`}>
                  {roosterCrowd.text}
                </div>
                <div className="home-beach-widget__stat-label">Crowd</div>
              </div>
              <div>
                <div className={`home-beach-widget__stat home-beach-widget__stat--${rooster.worthCrossing === false ? "warn" : "good"}`}>
                  {rooster.worthCrossing === false ? "Check" : "Open"}
                </div>
                <div className="home-beach-widget__stat-label">Access</div>
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
                <div className="home-beach-widget__stat home-beach-widget__stat--good">
                  {sauvie.airTempF != null ? `${sauvie.airTempF}°` : "—"}
                </div>
                <div className="home-beach-widget__stat-label">Weather</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--neutral">
                  {sauvie.swimStatusLabel || "—"}
                </div>
                <div className="home-beach-widget__stat-label">Water quality</div>
              </div>
              <div>
                <div className={`home-beach-widget__stat home-beach-widget__stat--${sauvieCrowd.status}`}>
                  {sauvieCrowd.text}
                </div>
                <div className="home-beach-widget__stat-label">Crowd</div>
              </div>
              <div>
                <div className="home-beach-widget__stat home-beach-widget__stat--good">Open</div>
                <div className="home-beach-widget__stat-label">Access</div>
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