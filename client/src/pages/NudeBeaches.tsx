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
  ROOSTER_ROCK_CHECKLIST,
  ROOSTER_ROCK_RESOURCES,
  ROOSTER_ROCK_RULES,
  SAUVIE_ISLAND_CHECKLIST,
  SAUVIE_ISLAND_RESOURCES,
  SAUVIE_ISLAND_RULES,
  type NudeBeachTab,
  type NudeBeachesSnapshot,
  type ResourceLink,
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

function ResourceList({ links }: { links: ResourceLink[] }) {
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
    <div className="nude-tab-panel">
      <div className="nude-live-strip">
        <article className={`nude-live-card ${statusClass(worth === false ? "bad" : worth ? "good" : "neutral")}`}>
          <div className="nude-live-card__label">River level · USGS</div>
          <div className="nude-live-card__value">
            {live.riverLevelFt != null ? `${live.riverLevelFt.toFixed(2)} ft` : "—"}
          </div>
          <p className="nude-live-card__detail">
            {live.crossingBand ? `${live.crossingBand}. ` : ""}
            {live.crossingAdvice || "Check roosterrockcrossing.com before you cross."}
          </p>
          <a className="nude-live-card__link" href="https://roosterrockcrossing.com" target="_blank" rel="noopener noreferrer">
            Rooster Rock Crossing →
          </a>
        </article>

        <article className={`nude-live-card ${statusClass(worth === false ? "bad" : worth ? "good" : "neutral")}`}>
          <div className="nude-live-card__label">Sand Island crossing</div>
          <div className="nude-live-card__value">{live.crossingBand || "—"}</div>
          <p className="nude-live-card__detail">
            {worth === false
              ? "Gage is high — crossing is usually not worth attempting right now."
              : "Rough ceiling: ~18 ft gage. Always re-check at the water's edge."}
          </p>
        </article>

        <article className="nude-live-card nude-live-card--neutral">
          <div className="nude-live-card__label">Park weather · NWS</div>
          <div className="nude-live-card__value">
            {live.airTempF != null ? `${live.airTempF}°F` : "—"}
          </div>
          <p className="nude-live-card__detail">
            {live.weatherSummary || "Forecast unavailable."}
            {live.wind ? ` Wind ${live.wind}.` : ""}
          </p>
          <a
            className="nude-live-card__link"
            href="https://forecast.weather.gov/MapClick.php?lat=45.5446&lon=-122.2342"
            target="_blank"
            rel="noopener noreferrer"
          >
            NWS forecast →
          </a>
        </article>
      </div>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--cyan">Getting there</div>
        <h3 className="nude-panel__title">Rooster Rock State Park</h3>
        <div className="nude-prose">
          <p>
            I-84 Exit 25 · Corbett, Oregon. Day-use fee ($10/day or Oregon State Parks pass). The far east end is
            Oregon&apos;s designated clothing-optional beach.
          </p>
          <ul>
            <li>Park near the east end of the lot, walk east along the beach or Sand Island Trail.</li>
            <li>Early July is usually the first safe crossing window; August is typically easiest.</li>
            <li>Mosquitoes are worst on the paths near the lot — less so on Sand Island, worst in early evening.</li>
          </ul>
        </div>
      </section>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--lime">Before you go</div>
        <ul className="nude-checklist">
          {ROOSTER_ROCK_CHECKLIST.map(item => (
            <li key={item.step}>
              <strong>{item.step}</strong>
              {item.detail}
            </li>
          ))}
        </ul>
        <ul className="nude-rules">
          {ROOSTER_ROCK_RULES.map(rule => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--magenta">Links</div>
        <ResourceList links={ROOSTER_ROCK_RESOURCES} />
      </section>
    </div>
  );
}

function SauvieIslandPanel({ data }: { data: NudeBeachesSnapshot }) {
  const live = data.sauvieIsland;

  return (
    <div className="nude-tab-panel">
      <div className="nude-live-strip">
        <article className={`nude-live-card ${statusClass(live.swimStatus)}`}>
          <div className="nude-live-card__label">Water quality · Swim Guide</div>
          <div className="nude-live-card__value">{live.swimStatusLabel || "—"}</div>
          <p className="nude-live-card__detail">
            {live.swimSummary || "Bi-weekly Collins Beach samples — verify before you swim."}
            {live.lastSampleAt ? ` Latest: ${live.lastSampleAt}.` : ""}
          </p>
          <a className="nude-live-card__link" href="https://www.theswimguide.org/beach/1792" target="_blank" rel="noopener noreferrer">
            Swim Guide →
          </a>
        </article>

        <article className="nude-live-card nude-live-card--warn">
          <div className="nude-live-card__label">Parking permits</div>
          <div className="nude-live-card__value">Check live</div>
          <p className="nude-live-card__detail">
            {live.parkingNote ||
              "Weekends and holidays through Labor Day require a permit. Sold-out dates update on the official portal only."}
          </p>
          <a className="nude-live-card__link" href={live.parkingHref} target="_blank" rel="noopener noreferrer">
            Sauvie Island Parking →
          </a>
        </article>

        <article className="nude-live-card nude-live-card--neutral">
          <div className="nude-live-card__label">Island weather · NWS</div>
          <div className="nude-live-card__value">
            {live.airTempF != null ? `${live.airTempF}°F` : "—"}
          </div>
          <p className="nude-live-card__detail">
            {live.weatherSummary || "Forecast unavailable."}
            {live.wind ? ` Wind ${live.wind}.` : ""}
          </p>
          <a
            className="nude-live-card__link"
            href="https://www.windfinder.com/forecast/reeder_beach"
            target="_blank"
            rel="noopener noreferrer"
          >
            Windfinder →
          </a>
        </article>
      </div>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--cyan">Getting there</div>
        <h3 className="nude-panel__title">Collins Beach</h3>
        <div className="nude-prose">
          <p>
            Western shore of Sauvie Island inside the wildlife area — sandy, wild, and partly clothing-optional.
            Access via the Sauvie Island bridge; permit-controlled parking on busy days.
          </p>
          <ul>
            <li>Check SauvieIslandParking.com first on weekends and holidays.</li>
            <li>SICA beaches page consolidates island-wide alerts (roads, bridge, access).</li>
            <li>Windfinder at Reeder Beach is the best live read for wind and tide patterns nearby.</li>
          </ul>
        </div>
      </section>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--lime">Before you go</div>
        <ul className="nude-checklist">
          {SAUVIE_ISLAND_CHECKLIST.map(item => (
            <li key={item.step}>
              <strong>{item.step}</strong>
              {item.detail}
            </li>
          ))}
        </ul>
        <ul className="nude-rules">
          {SAUVIE_ISLAND_RULES.map(rule => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--magenta">Links</div>
        <ResourceList links={SAUVIE_ISLAND_RESOURCES} />
      </section>
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
  const isRooster = activeTab === "rooster-rock";

  return (
    <div className="zine-page nude-beaches-page board-page board-page--makeover events-page">
      <ScrollReveal>
        <div className="events-tab-bar" style={{ paddingTop: 18 }}>
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

      <NudeBeachesHero activeTab={activeTab} snapshot={snapshot} />

      <div className="nude-refresh-bar">
        <p className="nude-refresh-bar__meta">
          {isRooster ? "Rooster Rock" : "Sauvie Island"} · updated{" "}
          <strong>{formatFetchedAt(snapshot?.fetchedAt)}</strong>
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
          {refreshMutation.isPending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <section className="events-board-feed board-active-feed diag">
        <div className="board-active-feed__inner">
          <ScrollReveal delay={30}>
            <div className="board-active-feed__head">
              <div className={`board-active-feed__kicker ${isRooster ? "board-active-feed__kicker--cyan" : "board-active-feed__kicker--magenta"}`}>
                Live now
              </div>
              <div className="board-active-feed__head-row">
                <h2 className="display section-heading board-active-feed__title">
                  {isRooster ? "River & crossing" : "Water & parking"}
                </h2>
              </div>
              <p className="nude-section-copy" style={{ marginTop: 10 }}>
                {isRooster
                  ? "Columbia gage and park weather only — nothing here about Collins or Sauvie permits."
                  : "Collins swim samples, permit portal, and island weather only — no Rooster Rock crossing data."}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <div className="board-active-feed__body" style={{ marginTop: 18 }}>
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
                isRooster ? (
                  <RoosterRockPanel data={snapshot} />
                ) : (
                  <SauvieIslandPanel data={snapshot} />
                )
              ) : null}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <BoardCloseSeam
        line={isRooster ? "Check the gage before you wade." : "Check permits before you drive out."}
        url="prideguidepdx.com/nude-beaches"
      />
    </div>
  );
}