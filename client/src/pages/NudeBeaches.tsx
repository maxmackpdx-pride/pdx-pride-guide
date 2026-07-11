import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useToast } from "@/hooks/use-toast";
import NudeBeachesHero from "@/components/NudeBeachesHero";
import NudeBeachesHubPanel from "@/components/NudeBeachesHubPanel";
import NudeBeachesMap from "@/components/NudeBeachesMap";
import RiverBratsShell from "@/components/river-brats/RiverBratsShell";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import {
  NUDE_BEACH_TABS,
  ROOSTER_ROCK_MAPS,
  ROOSTER_ROCK_PARKING,
  SAUVIE_ISLAND_MAPS,
  SAUVIE_ISLAND_CHECKLIST,
  SAUVIE_ISLAND_FARM_STORES,
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

function RoosterRockPanel() {
  return (
    <div className="nude-tab-panel">
      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--lime">Parking &amp; pass</div>
        <h3 className="nude-panel__title">Day-use fees</h3>
        <div className="nude-prose">
          <p>{ROOSTER_ROCK_PARKING.location}</p>
          <ul>
            <li>Oregon residents: {ROOSTER_ROCK_PARKING.dayUseOr}</li>
            <li>Out of state: {ROOSTER_ROCK_PARKING.dayUseOutOfState}</li>
            <li>Annual pass (OR): {ROOSTER_ROCK_PARKING.annualOr}</li>
            <li>Annual pass (out of state): {ROOSTER_ROCK_PARKING.annualOutOfState}</li>
          </ul>
          <p>{ROOSTER_ROCK_PARKING.note}</p>
        </div>
        <div className="nude-map-actions" style={{ marginTop: 14 }}>
          <a className="nude-map-btn" href="https://stateparks.oregon.gov/index.cfm?do=visit.day-use" target="_blank" rel="noopener noreferrer">
            Buy day-use permit
          </a>
          <a className="nude-map-btn" href="https://stateparks.oregon.gov/index.cfm?do=v.page&id=30" target="_blank" rel="noopener noreferrer">
            Where to buy passes
          </a>
          <a className="nude-map-btn" href="https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=126" target="_blank" rel="noopener noreferrer">
            Official park page
          </a>
        </div>
      </section>

    </div>
  );
}

function SauvieIslandPanel() {
  return (
    <div className="nude-tab-panel">
      <section className="nude-panel">
        <div className="nude-panel__kicker nude-panel__kicker--lime">Before you go</div>
        <ul className="nude-checklist">
          {SAUVIE_ISLAND_CHECKLIST.map(item => (
            <li key={item.step}>
              <strong>{item.step}</strong>
              {item.detail}
              {item.href && item.linkLabel ? (
                <a
                  className="nude-checklist__link"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.linkLabel} →
                </a>
              ) : null}
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
        <div className="nude-panel__kicker nude-panel__kicker--orange">Farm stops</div>
        <p className="nude-prose nude-farm-intro">
          <strong>Cracker Barrel Grocery</strong> sits right after the bridge — your last easy stop for snacks,
          drinks, and supplies before the wildlife area. Popular farm stands on the drive out:
        </p>
        <ResourceList links={SAUVIE_ISLAND_FARM_STORES} />
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

  const { data } = useQuery<ApiPayload>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 5 * 60_000,
    // A stale snapshot means the server is refreshing live conditions in the
    // background; poll so the fresh numbers land without a manual reload, and
    // stop once the snapshot is current again.
    refetchInterval: query => (query.state.data?.stale ? 20_000 : false),
    refetchOnWindowFocus: true,
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
    <div
      className={`zine-page nude-beaches-page board-page board-page--makeover events-page${isRooster ? "" : " nude-beaches-page--sauvie"}`}
    >
      <header className="nude-beaches-header">
        <NudeBeachesHero
          key={activeTab}
          activeTab={activeTab}
          snapshot={snapshot}
          statsKey={`${activeTab}-${snapshot?.fetchedAt ?? "pending"}`}
          tabs={
            <nav className="events-tab-bar nude-beaches-tab-bar" aria-label="Beach location">
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
            </nav>
          }
        />
      </header>

      <div className="nude-refresh-bar">
        <p className="nude-refresh-bar__meta">
          {isRooster ? "Rooster Rock" : "Sauvie Island"} · updated{" "}
          <strong className="nude-refresh-bar__time">{formatFetchedAt(snapshot?.fetchedAt)}</strong>
          {data?.stale && <span className="nude-refresh-bar__stale">· refreshing in background</span>}
        </p>
        <Button
          accent="cyan"
          variant="outline"
          size="sm"
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCw
            size={14}
            className={refreshMutation.isPending ? "nude-refresh-bar__spin" : undefined}
            style={{ marginRight: 6, verticalAlign: -2 }}
            aria-hidden
          />
          {refreshMutation.isPending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div key={activeTab} className="events-map-row nude-beaches-map-row nude-beaches-map-row--enter">
        <div className="events-map-row__panel">
          <NudeBeachesHubPanel tab={activeTab} snapshot={snapshot} />
        </div>
        <div className="events-map-row__map">
          <NudeBeachesMap tab={activeTab} />
        </div>
      </div>
      <div key={`${activeTab}-actions`} className="nude-beaches-map-row__actions nude-beaches-map-row__actions--enter">
        {(isRooster ? ROOSTER_ROCK_MAPS : SAUVIE_ISLAND_MAPS).map(map => (
          <a key={map.href} className="nude-map-btn" href={map.href} target="_blank" rel="noopener noreferrer">
            {map.label}
          </a>
        ))}
      </div>

      <RiverBratsShell beachId={activeTab} />

      <section className="events-board-feed nude-beach-logistics diag">
        <div className="board-active-feed__inner">
          <ScrollReveal delay={30}>
            {isRooster ? <RoosterRockPanel /> : <SauvieIslandPanel />}
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