import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useToast } from "@/hooks/use-toast";
import NudeBeachesHero from "@/components/NudeBeachesHero";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import BoardLoadingState from "@/components/BoardLoadingState";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import {
  NUDE_BEACH_TABS,
  PLANNING_CHECKLIST,
  ROOSTER_ROCK_RESOURCES,
  SAUVIE_ISLAND_RESOURCES,
  TRAVELER_RULES,
  type NudeBeachTab,
  type NudeBeachesSnapshot,
} from "@shared/nudeBeaches";
import "./NudeBeaches.css";

type ApiPayload = {
  data: NudeBeachesSnapshot;
  stale: boolean;
  fromCache: boolean;
  rateLimited?: boolean;
};

function readTab(search: string): NudeBeachTab {
  const raw = new URLSearchParams(search).get("tab");
  if (raw === "sauvie-island" || raw === "sauvie") return "sauvie-island";
  return "rooster-rock";
}

function formatFetchedAt(iso?: string) {
  if (!iso) return "Not yet loaded";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusClass(status?: string | null) {
  if (status === "pass" || status === "good") return "nude-live-card--good";
  if (status === "fail" || status === "bad") return "nude-live-card--bad";
  if (status === "warning" || status === "warn") return "nude-live-card--warn";
  return "nude-live-card--neutral";
}

function ResourceList({ links }: { links: typeof ROOSTER_ROCK_RESOURCES }) {
  return (
    <div className="nude-resource-list">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`nude-resource-link${link.priority === "primary" ? " nude-resource-link--primary" : ""}`}
        >
          <div className="nude-resource-link__title">{link.title}</div>
          <p className="nude-resource-link__desc">{link.description}</p>
        </a>
      ))}
    </div>
  );
}

function RoosterRockPanel({ data }: { data: NudeBeachesSnapshot }) {
  const live = data.roosterRock;
  const worth = live.worthCrossing;

  return (
    <div className="nude-beach-grid">
      <article className={`nude-live-card ${statusClass(worth === false ? "bad" : worth ? "good" : "neutral")}`}>
        <div className="nude-live-card__label">River level · USGS</div>
        <div className="nude-live-card__value">
          {live.riverLevelFt != null ? `${live.riverLevelFt.toFixed(2)} ft` : "Unavailable"}
        </div>
        <p className="nude-live-card__detail">
          {live.crossingBand ? `${live.crossingBand}. ` : ""}
          {live.crossingAdvice || "Columbia gage below Bonneville Dam — check roosterrockcrossing.com before you cross."}
        </p>
        {live.riverLevelAt && (
          <p className="nude-live-card__detail">Gage reading: {formatFetchedAt(live.riverLevelAt)}</p>
        )}
        <a className="nude-live-card__link" href="https://roosterrockcrossing.com" target="_blank" rel="noopener noreferrer">
          Open Rooster Rock Crossing →
        </a>
      </article>

      <article className="nude-live-card nude-live-card--neutral">
        <div className="nude-live-card__label">Weather · NWS</div>
        <div className="nude-live-card__value">
          {live.airTempF != null ? `${live.airTempF}°F` : "—"}
        </div>
        <p className="nude-live-card__detail">
          {live.weatherSummary || "Forecast unavailable — use the NWS link below."}
          {live.wind ? ` Wind: ${live.wind}.` : ""}
        </p>
      </article>

      <div className="nude-logistics-block">
        <h3>Getting there</h3>
        <p>
          Rooster Rock State Park · I-84 Exit 25 · Corbett, Oregon. Day-use fee ($10/day or Oregon State Parks pass).
          The far east end is Oregon&apos;s designated clothing-optional beach.
        </p>
        <ul>
          <li>Park near the east end of the lot, then walk east along the beach or Sand Island Trail.</li>
          <li>Rough rule: about 18 ft gage is the highest worth attempting a crossing to Sand Island.</li>
          <li>Early July is usually the first safe bet; August is typically the easiest crossing of the year.</li>
          <li>Water is cold, currents are strong, and underwater sand ridges drop off abruptly.</li>
        </ul>
      </div>

      <div className="nude-logistics-block">
        <h3>Resources</h3>
        <ResourceList links={ROOSTER_ROCK_RESOURCES} />
      </div>
    </div>
  );
}

function SauvieIslandPanel({ data }: { data: NudeBeachesSnapshot }) {
  const live = data.sauvieIsland;

  return (
    <div className="nude-beach-grid">
      <article className={`nude-live-card ${statusClass(live.swimStatus)}`}>
        <div className="nude-live-card__label">Water quality · Swim Guide</div>
        <div className="nude-live-card__value">{live.swimStatusLabel || "Unknown"}</div>
        <p className="nude-live-card__detail">
          {live.swimSummary || "Bi-weekly samples for Collins Beach — always verify before you swim."}
        </p>
        {live.lastSampleAt && (
          <p className="nude-live-card__detail">Latest sample: {live.lastSampleAt}</p>
        )}
        <a className="nude-live-card__link" href="https://www.theswimguide.org/beach/1792" target="_blank" rel="noopener noreferrer">
          Open Swim Guide →
        </a>
      </article>

      <article className="nude-live-card nude-live-card--warn">
        <div className="nude-live-card__label">Parking permits</div>
        <div className="nude-live-card__value">Check live</div>
        <p className="nude-live-card__detail">
          {live.parkingNote ||
            "Weekends and holidays through Labor Day require a permit. Sold-out dates update in real time on the official portal."}
        </p>
        <a className="nude-live-card__link" href={live.parkingHref} target="_blank" rel="noopener noreferrer">
          Open Sauvie Island Parking →
        </a>
      </article>

      <article className="nude-live-card nude-live-card--neutral">
        <div className="nude-live-card__label">Island weather · NWS</div>
        <div className="nude-live-card__value">
          {live.airTempF != null ? `${live.airTempF}°F` : "—"}
        </div>
        <p className="nude-live-card__detail">
          {live.weatherSummary || "Forecast unavailable — use Windfinder for live wind and tide patterns."}
          {live.wind ? ` Wind: ${live.wind}.` : ""}
        </p>
        <a className="nude-live-card__link" href="https://www.windfinder.com/forecast/reeder_beach" target="_blank" rel="noopener noreferrer">
          Open Windfinder →
        </a>
      </article>

      <div className="nude-logistics-block">
        <h3>Collins Beach logistics</h3>
        <p>
          Collins Beach sits on Sauvie Island&apos;s western shore inside the wildlife area — wild, sandy, and partly
          clothing-optional. Access is via the Sauvie Island bridge; permit-controlled parking applies on busy days.
        </p>
        <ul>
          <li>Check SauvieIslandParking.com first on weekends and holidays.</li>
          <li>Verify Swim Guide before swimming — sampling is limited on Columbia beaches.</li>
          <li>SICA beaches page consolidates island-wide alerts (roads, bridge, access changes).</li>
        </ul>
      </div>

      <div className="nude-logistics-block">
        <h3>Resources</h3>
        <ResourceList links={SAUVIE_ISLAND_RESOURCES} />
      </div>
    </div>
  );
}

export default function NudeBeaches() {
  usePageSeo(
    "Nude Beaches | PDX Pride Guide",
    "Traveler logistics for Rooster Rock and Collins Beach on Sauvie Island — live river levels, swim status, parking permits, and essential links.",
  );

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTabState] = useState<NudeBeachTab>(() =>
    readTab(typeof window !== "undefined" ? window.location.search : ""),
  );

  const setActiveTab = useCallback(
    (tab: NudeBeachTab) => {
      setActiveTabState(tab);
      const params = new URLSearchParams(window.location.search);
      if (tab === "sauvie-island") params.set("tab", "sauvie-island");
      else params.delete("tab");
      const qs = params.toString();
      setLocation(qs ? `/nude-beaches?${qs}` : "/nude-beaches");
    },
    [setLocation],
  );

  useEffect(() => {
    const onPopState = () => setActiveTabState(readTab(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery<ApiPayload>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/nude-beaches/refresh", {}).then(r => r.json() as Promise<ApiPayload>),
    onSuccess: payload => {
      queryClient.setQueryData(["/api/nude-beaches"], payload);
      toast({
        title: payload.rateLimited ? "Already fresh" : "Conditions updated",
        description: payload.rateLimited
          ? "Please wait a few seconds between refreshes."
          : `Last checked ${formatFetchedAt(payload.data.fetchedAt)}`,
      });
    },
    onError: () => {
      toast({
        title: "Refresh failed",
        description: "Could not reach live sources. Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const snapshot = data?.data;

  return (
    <div className="zine-page nude-beaches-page board-page board-page--makeover events-page">
      <NudeBeachesHero snapshot={snapshot} />

      <div className="nude-refresh-bar">
        <p className="nude-refresh-bar__meta">
          Last updated: <strong>{formatFetchedAt(snapshot?.fetchedAt)}</strong>
          {data?.stale && <span className="nude-refresh-bar__stale">· refreshing in background</span>}
        </p>
        <Button
          accent="cyan"
          variant="outline"
          size="sm"
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
          {refreshMutation.isPending ? "Refreshing…" : "Refresh live data"}
        </Button>
      </div>

      <ScrollReveal delay={20}>
        <div className="events-tab-bar">
          {NUDE_BEACH_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`events-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollReveal>

      <section className="events-board-feed board-active-feed diag">
        <div className="board-active-feed__inner">
          <ScrollReveal delay={40}>
            <div className="board-active-feed__head">
              <div className="board-active-feed__kicker board-active-feed__kicker--magenta">
                {activeTab === "rooster-rock" ? "Rooster Rock" : "Sauvie Island"}
              </div>
              <div className="board-active-feed__head-row">
                <h2 className="display section-heading board-active-feed__title">
                  {activeTab === "rooster-rock" ? "Sand Island crossing" : "Collins Beach logistics"}
                </h2>
              </div>
              <p className="nude-section-copy" style={{ marginTop: 12 }}>
                {activeTab === "rooster-rock"
                  ? "Live Columbia River gage and crossing guidance for travelers heading to Oregon's clothing-optional Rooster Rock beach."
                  : "Water quality, parking permits, and island conditions for Collins Beach — the most useful pre-trip checks."}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div className="board-active-feed__body" style={{ marginTop: 20 }}>
              {isLoading && !snapshot ? (
                <BoardLoadingState label="beach conditions" />
              ) : isError && !snapshot ? (
                <div className="board-empty board-empty--prototype">
                  <p>Could not load live beach data.</p>
                  <Button accent="cyan" variant="solid" size="sm" onClick={() => refetch()}>
                    Try again
                  </Button>
                </div>
              ) : snapshot ? (
                activeTab === "rooster-rock" ? (
                  <RoosterRockPanel data={snapshot} />
                ) : (
                  <SauvieIslandPanel data={snapshot} />
                )
              ) : null}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div style={{ marginTop: 32 }}>
              <div className="board-active-feed__kicker board-active-feed__kicker--cyan" style={{ marginBottom: 12 }}>
                Before you go
              </div>
              <ul className="nude-checklist">
                {PLANNING_CHECKLIST.map(item => (
                  <li key={item.step}>
                    <strong>{item.step}</strong>
                    {item.detail}
                  </li>
                ))}
              </ul>
              <ul className="nude-rules" style={{ marginTop: 20 }}>
                {TRAVELER_RULES.map(rule => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <BoardCloseSeam
        line="Sun, sand, and a little homework first."
        url="prideguidepdx.com/nude-beaches"
      />
    </div>
  );
}