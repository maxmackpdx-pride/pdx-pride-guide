import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { shareCardUrl } from "@shared/shareCards";
import { useToast } from "@/hooks/use-toast";
import NudeBeachesHero from "@/components/NudeBeachesHero";
import ZBoardAddressStrip from "@/components/ZBoardAddressStrip";
import NudeBeachesHubPanel from "@/components/NudeBeachesHubPanel";
import NudeBeachesMap from "@/components/NudeBeachesMap";
import RiverBratsShell from "@/components/river-brats/RiverBratsShell";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import {
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
        an Oregon State Parks pass. {ROOSTER_ROCK_PARKING.hours}.
      </p>
      <div className="nb-log__grid nb-log__grid--fees">
        {fees.map(fee => (
          <div className="nb-log-fee pdx-glass-rebind" key={fee.label}>
            <div className="nb-log-fee__label">{fee.label}</div>
            <div className="nb-log-fee__value">{fee.value}</div>
          </div>
        ))}
      </div>
      <div className="nb-log__actions">
        <a
          className="nude-map-btn nude-map-btn--primary pdx-glass-rebind"
          href="https://stateparks.oregon.gov/index.cfm?do=visit.day-use"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy day-use permit
        </a>
        <a
          className="nude-map-btn pdx-glass-rebind"
          href="https://stateparks.oregon.gov/index.cfm?do=v.page&id=30"
          target="_blank"
          rel="noopener noreferrer"
        >
          Where to buy passes
        </a>
        <a
          className="nude-map-btn pdx-glass-rebind"
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
          <div className="nb-log-step pdx-glass-rebind" key={step.step}>
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
          <div className="nb-log-rule pdx-glass-rebind" key={rule}>
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
            className="nb-log-farm pdx-glass-rebind"
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

export default function NudeBeaches({ beachId = "rooster-rock" }: { beachId?: NudeBeachTab }) {
  const isRooster = beachId === "rooster-rock";
  usePageSeo(
    `${isRooster ? "Rooster Rock" : "Sauvie Island"} · OUTZ | Zaylist`,
    `${isRooster ? "Rooster Rock" : "Sauvie Island and Collins Beach"} live conditions, trip logistics, check-ins, carpools, and River Brats chat on OUTZ.`,
    {
      image: shareCardUrl("nudeBeaches"),
      imageAlt:
        "RIVERBRATS on Zaylist — Make naked friends on Zaylist. Sun, sand, and a speaker. Clothing optional. JOIN NOW BECAUSE, FUCK META!",
    },
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  return (
    <div
      className={`zine-page nude-beaches-page pdx-glass-rebind board-page board-page--makeover events-page${isRooster ? "" : " nude-beaches-page--sauvie"}`}
    >
      <ZBoardAddressStrip path={`out/${beachId}`} board={isRooster ? "Rooster Rock" : "Sauvie Island"} />
      <header className="nude-beaches-header">
        <NudeBeachesHero
          key={beachId}
          activeTab={beachId}
          snapshot={snapshot}
          statsKey={`${beachId}-${snapshot?.fetchedAt ?? "pending"}`}
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

      <div key={beachId} className="events-map-row nude-beaches-map-row nude-beaches-map-row--enter">
        <div className="events-map-row__panel">
          <NudeBeachesHubPanel tab={beachId} snapshot={snapshot} />
        </div>
        <div className="events-map-row__map">
          <NudeBeachesMap tab={beachId} />
        </div>
      </div>
      <div key={`${beachId}-actions`} className="nude-beaches-map-row__actions nude-beaches-map-row__actions--enter">
        {(isRooster ? ROOSTER_ROCK_MAPS : SAUVIE_ISLAND_MAPS).map(map => (
          <a key={map.href} className="nude-map-btn pdx-glass-rebind" href={map.href} target="_blank" rel="noopener noreferrer">
            {map.label}
          </a>
        ))}
      </div>

      <RiverBratsShell beachId={beachId} />

      <section className="nude-outz-link pdx-glass-card pdx-glass-rebind" style={{ "--c": isRooster ? "#ff6600" : "#39ff14" } as CSSProperties}>
        <p>BEYOND THE BEACH</p>
        <h2>Camping, trails, and practical trip leads live in OUTZ.</h2>
        <Link className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" href="/z/out#outz-stays" style={{ "--c": isRooster ? "#ff6600" : "#39ff14" } as CSSProperties}>
          MORE OUTZ
        </Link>
      </section>

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
