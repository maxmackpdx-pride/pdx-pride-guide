import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";
import { useToast } from "@/hooks/use-toast";
import NudeBeachesHero from "@/components/NudeBeachesHero";
import NudeBeachesHubPanel from "@/components/NudeBeachesHubPanel";
import NudeBeachesMap from "@/components/NudeBeachesMap";
import RiverBratsShell from "@/components/river-brats/RiverBratsShell";
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

function RoosterRockPanel() {
  const fees = [
    { label: "Oregon residents", value: ROOSTER_ROCK_PARKING.dayUseOr },
    { label: "Out of state", value: ROOSTER_ROCK_PARKING.dayUseOutOfState },
    { label: "Annual pass · OR", value: ROOSTER_ROCK_PARKING.annualOr },
    { label: "Annual pass · out of state", value: ROOSTER_ROCK_PARKING.annualOutOfState },
  ];
  return (
    <div className="nb-log nb-log--rooster">
      <div className="nb-log__kicker nb-log__kicker--orange">Trip logistics · Rooster Rock</div>
      <h2 className="nb-log__title">Parking &amp; pass</h2>
      <p className="nb-log__lede">
        {ROOSTER_ROCK_PARKING.location}. Day-use only, pay at the fee machine or the QR on site, or bring
        an Oregon State Parks pass.
      </p>
      <div className="nb-log__grid nb-log__grid--fees">
        {fees.map(fee => (
          <div className="nb-log-fee" key={fee.label}>
            <div className="nb-log-fee__label">{fee.label}</div>
            <div className="nb-log-fee__value">{fee.value}</div>
          </div>
        ))}
      </div>
      <div className="nb-log__actions">
        <a
          className="nude-map-btn nude-map-btn--primary"
          href="https://stateparks.oregon.gov/index.cfm?do=visit.day-use"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy day-use permit
        </a>
        <a
          className="nude-map-btn"
          href="https://stateparks.oregon.gov/index.cfm?do=v.page&id=30"
          target="_blank"
          rel="noopener noreferrer"
        >
          Where to buy passes
        </a>
        <a
          className="nude-map-btn"
          href="https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=126"
          target="_blank"
          rel="noopener noreferrer"
        >
          Official park page
        </a>
      </div>
    </div>
  );
}

function SauvieIslandPanel() {
  return (
    <div className="nb-log nb-log--sauvie">
      <div className="nb-log__kicker nb-log__kicker--green">Trip logistics · Collins Beach</div>
      <h2 className="nb-log__title">Before you go</h2>
      <p className="nb-log__lede">
        Three checks before you point the car at the bridge. Collins Beach is wild, sandy, and worth the
        small bit of prep.
      </p>
      <div className="nb-log__grid nb-log__grid--3">
        {SAUVIE_ISLAND_CHECKLIST.map((step, i) => (
          <div className="nb-log-step" key={step.step}>
            <div className="nb-log-step__num">{i + 1}</div>
            <div className="nb-log-step__title">{step.step}</div>
            <p className="nb-log-step__detail">{step.detail}</p>
            {step.href && step.linkLabel ? (
              <a
                className="nb-log-step__link"
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {step.linkLabel} →
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div className="nb-log__kicker nb-log__kicker--green nb-log__kicker--section">Know the rules</div>
      <div className="nb-log__grid nb-log__grid--2">
        {SAUVIE_ISLAND_RULES.map(rule => (
          <div className="nb-log-rule" key={rule}>
            <svg
              className="nb-log-rule__icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="nb-log-rule__text">{rule}</p>
          </div>
        ))}
      </div>

      <div className="nb-log__kicker nb-log__kicker--farm nb-log__kicker--section">Farm stops on the drive</div>
      <p className="nb-log__intro">
        <strong>Cracker Barrel Grocery</strong> sits right after the bridge, your last easy stop for
        snacks, drinks, and supplies before the wildlife area. A few island classics on the drive out:
      </p>
      <div className="nb-log__grid nb-log__grid--2">
        {SAUVIE_ISLAND_FARM_STORES.map(store => (
          <a
            className="nb-log-farm"
            key={store.href}
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="nb-log-farm__row">
              <div className="nb-log-farm__title">{store.title}</div>
              <span className="nb-log-farm__arrow" aria-hidden="true">→</span>
            </div>
            <p className="nb-log-farm__desc">{store.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function NudeBeaches() {
  usePageSeo(
    "RIVERBRATS · Beaches | Zaylist",
    "Make naked friends on Zaylist. Sun, sand, and a speaker — Rooster Rock and Sauvie Island logistics, live conditions, and the people heading out. Pull up, bring water, pack it out.",
    {
      image: shareCardUrl("nudeBeaches"),
      imageAlt:
        "RIVERBRATS on Zaylist — Make naked friends on Zaylist. Sun, sand, and a speaker. Clothing optional. JOIN NOW BECAUSE, FUCK META!",
    },
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
                  className={`events-tab events-tab--${tab.key}${activeTab === tab.key ? " active" : ""}`}
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
          accent={isRooster ? "orange" : "green"}
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
    </div>
  );
}