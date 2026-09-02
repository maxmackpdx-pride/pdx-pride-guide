import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "wouter";
import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import OutzMap from "@/components/OutzMap";
import { Badge, Button, Divider, SectionHeader } from "@/components/ds";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  OUTZ_COMMUNITY_STAYS,
  outzPlaceHref,
  outzPlacesFromSnapshot,
  type OutzCommunityStay,
  type OutzPlaceKind,
  type OutzSnapshot,
} from "@shared/outz";
import type { NudeBeachesSnapshot } from "@shared/nudeBeaches";
import { OUTZ_BUTTON_ACCENT, OUTZ_KIND_META, OUTZ_MOTIF, outzBandArt, outzTempLabel } from "@/lib/outzKinds";
import "./Outz.css";

type OutzPayload = { data: OutzSnapshot; stale?: boolean; fromCache?: boolean };
type BeachesPayload = { data: NudeBeachesSnapshot };

const LEGEND: OutzPlaceKind[] = ["beach", "camp-hike", "campground", "trailhead", "outdoor-stay"];

type BeachCard = {
  key: "roosterRock" | "sauvieIsland";
  name: string;
  region: string;
  href: string;
  detail: string;
  color: string;
  accent: string;
};

const BEACHES: BeachCard[] = [
  {
    key: "roosterRock",
    name: "Rooster Rock",
    region: "Columbia River · Corbett, OR",
    href: "/outz/rooster-rock",
    detail: "River conditions, crossing notes, parking, carpools, and the beach chat before you head east.",
    color: "orange",
    accent: "#FF6600",
  },
  {
    key: "sauvieIsland",
    name: "Sauvie Island",
    region: "Collins Beach · Sauvie Island, OR",
    href: "/outz/sauvie-island",
    detail: "Water quality, parking permits, island weather, and the practical intel for a good day on the sand.",
    color: "green",
    accent: "#39FF14",
  },
];

function timeLabel(value?: string) {
  if (!value) return "Loading official sources";
  return `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value))}`;
}

/** Conditions strip: the same three-slot mono row on every card in the design. */
function ConditionRow({ items }: { items: Array<string | null | undefined> }) {
  return (
    <div className="outz-conditions">
      {items.map((item, index) => <span key={index}>{item?.trim() ? item : "—"}</span>)}
    </div>
  );
}

function StatusLine({ tone, children }: { tone: "good" | "warn" | "bad"; children: ReactNode }) {
  return <p className={`outz-status outz-status--${tone}`}>{children}</p>;
}

function MotifBand({ src, accent }: { src: string; accent: string }) {
  return (
    <div className="outz-card__band" style={{ "--c": accent, "--outz-c": accent } as CSSProperties} aria-hidden="true">
      <img src={src} alt="" loading="lazy" />
    </div>
  );
}

export default function Outz() {
  usePageSeo("OUTZ | Camping, hiking, trails and conditions | Zaylist", "Official-source camping, hiking, trail, weather and access information across Oregon and southern Washington.");
  const queryClient = useQueryClient();
  const query = useQuery<OutzPayload>({
    queryKey: ["/api/outz"],
    queryFn: () => apiRequest("GET", "/api/outz").then(response => response.json()),
  });
  const beaches = useQuery<BeachesPayload>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(response => response.json()),
  });
  const refresh = useMutation({
    mutationFn: () => apiRequest("POST", "/api/outz/refresh", {}).then(response => response.json()),
    onSuccess: payload => queryClient.setQueryData(["/api/outz"], payload),
  });

  const snapshot = query.data?.data;
  const beachSnapshot = beaches.data?.data;
  const destinations = snapshot?.destinations ?? [];
  const stays = snapshot?.communityStays ?? OUTZ_COMMUNITY_STAYS;
  const allPlaces = snapshot ? outzPlacesFromSnapshot(snapshot) : [];
  const alertCount = destinations.reduce((total, place) => total + place.alerts.length, 0);
  const legendKinds = LEGEND.filter(kind => allPlaces.some(place => place.kind === kind));

  return (
    <div className="zine-page board-page outz-surface outz-page">
      <div className="outz-surface__terrain" aria-hidden="true" />
      <img className="outz-surface__topo" src={`${OUTZ_MOTIF}/topographic-ridge-basin-amber.svg`} alt="" aria-hidden="true" />

      <div className="outz-hero">
        <img className="outz-hero__art" src={`${OUTZ_MOTIF}/adventure-map-alpine-waypoints.svg`} alt="" aria-hidden="true" />
        <BoardHero
        accent="orange"
        kicker="OUTZ · live field desk"
        title={<img className="board-hero__brand-logo board-hero__brand-logo--outz" src="/brand/family/outz.svg" alt="OUTZ" />}
        lede="Camping, hiking, trails, weather, alerts, and practical access notes from the agencies that manage the places, plus the people who make the trip better."
        />
      </div>

      {/* Same counter the rest of the site uses (Rooster Rock, Eventz, Sellz...). */}
      <BoardStatsBar
        key={snapshot?.fetchedAt ?? "pending"}
        stats={[
          { num: allPlaces.length, label: "Destinations", color: "#19e3ff" },
          { num: alertCount, label: "Active alerts", color: "#ff6600" },
          { num: stays.length, label: "Community stays", color: "#ccff00" },
        ]}
        variant="band"
        showLive={false}
      />

      <section className="outz-livebar">
        <img className="outz-livebar__art" src={`${OUTZ_MOTIF}/alpine-lake-loop-lime.svg`} alt="" aria-hidden="true" />
        <span className="outz-livebar__stamp" role="status" aria-live="polite" aria-atomic="true">
          {timeLabel(snapshot?.fetchedAt)} · Live NWS + agency feeds{query.data?.stale ? " · Refreshing in background" : ""}
        </span>
        <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {refresh.isPending ? "REFRESHING" : "REFRESH LIVE DATA"}
        </Button>
      </section>

      {query.isError ? <div className="outz-error" role="alert">Official outdoor conditions are temporarily unavailable. Try the direct agency links below.</div> : null}

      <section id="outz-map" className="outz-section outz-section--map">
        <div className="outz-map-frame">
          <img className="outz-map-frame__art" src={`${OUTZ_MOTIF}/ridge-loop-cyan.svg`} alt="" aria-hidden="true" />
          {snapshot
            ? <OutzMap destinations={snapshot.destinations} catalog={snapshot.catalog} stays={snapshot.communityStays} />
            : <p className="outz-empty">Map loads once the official sources respond.</p>}
        </div>
      </section>

      <section id="outz-beaches" className="outz-section outz-section--beaches" aria-labelledby="outz-beaches-heading">
        <img className="outz-section__art outz-section__art--left" src={`${OUTZ_MOTIF}/adventure-map-waterfall-route.svg`} alt="" aria-hidden="true" />
        <img className="outz-section__art outz-section__art--corner" src={`${OUTZ_MOTIF}/topographic-twin-summits.svg`} alt="" aria-hidden="true" />
        <SectionHeader
          kicker="Featured · Seasonal"
          title={<span id="outz-beaches-heading">Nude Beaches</span>}
          subtitle="Open in season, river-dependent. Live conditions, parking, and the group chat for each beach."
          accent="cyan"
        />
        <div className="outz-beach-grid">
          {BEACHES.map(beach => {
            const live = beachSnapshot?.[beach.key];
            const status = beach.key === "roosterRock"
              ? beachSnapshot?.roosterRock.crossingAdvice ?? beachSnapshot?.roosterRock.crossingBand
              : beachSnapshot?.sauvieIsland.swimStatusLabel ?? beachSnapshot?.sauvieIsland.parkingStatusLabel;
            return (
              <article className="outz-card outz-beach-card pdx-glass-card pdx-glass-rebind" key={beach.key} style={{ "--c": beach.accent, "--outz-c": beach.accent } as CSSProperties}>
                <div className="outz-card__head">
                  <p className="outz-card__eyebrow">{beach.region}</p>
                  <Badge color={beach.color} variant="outline" size="md">Seasonal</Badge>
                </div>
                <h3>{beach.name}</h3>
                <p className="outz-card__detail">{beach.detail}</p>
                <ConditionRow items={[outzTempLabel(live?.airTempF), live?.weatherSummary, live?.wind]} />
                <StatusLine tone="good">{status || "Seasonal access. Open in season, conditions change daily."}</StatusLine>
                <Link className="outz-card__cta" href={beach.href}>
                  <Button as="span" variant="solid" accent={OUTZ_BUTTON_ACCENT[beach.color]} size="sm">OPEN SPOT</Button>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section id="outz-destinations" className="outz-section outz-section--destinations">
        <img className="outz-section__art outz-section__art--right" src={`${OUTZ_MOTIF}/adventure-map-twin-falls.svg`} alt="" aria-hidden="true" />
        <img className="outz-section__art outz-section__art--corner" src={`${OUTZ_MOTIF}/canyon-overlook-orange.svg`} alt="" aria-hidden="true" />
        <SectionHeader
          kicker="Plan a Trip"
          title="Featured camp + hike destinations"
          subtitle="Live conditions pulled from the agencies that manage each place, across Oregon and southern Washington."
          accent="lime"
        />
        {legendKinds.length ? (
          <div className="outz-legend">
            {legendKinds.map(kind => (
              <span key={kind}><i style={{ background: OUTZ_KIND_META[kind].accent }} />{OUTZ_KIND_META[kind].label}</span>
            ))}
          </div>
        ) : null}
        <div className="outz-card-grid">
          {destinations.map(place => {
            const meta = OUTZ_KIND_META[place.kind];
            return (
              <article className="outz-card outz-card--tall pdx-glass-card pdx-glass-rebind" key={place.id} style={{ "--c": meta.accent, "--outz-c": meta.accent } as CSSProperties}>
                <MotifBand src={outzBandArt(place.id)} accent={meta.accent} />
                <div className="outz-card__body">
                  <div className="outz-card__head">
                    <div>
                      <p className="outz-card__eyebrow">{place.sourceName}</p>
                      <h3>{place.name}</h3>
                    </div>
                    <Badge color={meta.color} variant="outline">{meta.label}</Badge>
                  </div>
                  <p className="outz-card__detail">{place.subtitle}</p>
                  <ConditionRow items={[outzTempLabel(place.airTempF), place.forecast, place.wind]} />
                  {place.alerts.length
                    ? <StatusLine tone="bad"><strong>Alert:</strong> {place.alerts[0].headline}</StatusLine>
                    : <StatusLine tone="good">No active NWS alert.</StatusLine>}
                  {place.sourceStatus ? <p className="outz-card__source">{place.sourceStatus}</p> : null}
                  <div className="outz-card__actions">
                    <Link href={outzPlaceHref(place)}>
                      <Button as="span" variant="solid" accent={OUTZ_BUTTON_ACCENT[meta.color]} size="sm">CHECK IN + CHAT</Button>
                    </Link>
                    <a href={place.officialUrl} target="_blank" rel="noreferrer">
                      <Button as="span" variant="outline" accent={OUTZ_BUTTON_ACCENT[meta.color]} size="sm">Official details ↗</Button>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
          {!destinations.length && !query.isError
            ? <p className="outz-empty">{query.isLoading ? "Pulling live conditions from the agencies…" : "No featured destinations returned yet."}</p>
            : null}
        </div>
      </section>

      <section className="outz-section outz-section--stays" aria-labelledby="outz-stays-heading">
        <SectionHeader
          kicker="Queer Stays + Trip Leads"
          title={<span id="outz-stays-heading">More places to pitch a tent</span>}
          subtitle="Operator details are reviewed separately from official conditions. A directory lead is not an endorsement or an access guarantee."
          accent="amber"
        />
        <div className="outz-card-grid outz-card-grid--stays">
          {stays.map((stay: OutzCommunityStay) => (
            <article className="outz-card pdx-glass-card pdx-glass-rebind" key={stay.id} style={{ "--c": "var(--amber)", "--outz-c": "var(--amber)" } as CSSProperties}>
              <div className="outz-card__body">
                <div className="outz-card__head">
                  <div>
                    <p className="outz-card__eyebrow">{stay.region}</p>
                    <h3>{stay.name}</h3>
                  </div>
                  <Badge color="amber" variant="outline">{stay.kind === "campground" ? "Camp" : "Stay"}</Badge>
                </div>
                <p className="outz-card__detail">{stay.detail}</p>
                <StatusLine tone="warn"><strong>Before you go:</strong> {stay.accessNote}</StatusLine>
                <p className="outz-card__source">{stay.inclusionNote} · Operator details checked {stay.reviewedAt}.</p>
                <div className="outz-card__actions">
                  <Link href={outzPlaceHref(stay)}>
                    <Button as="span" variant="solid" accent="orange" size="sm">CHECK IN + CHAT</Button>
                  </Link>
                  <a href={stay.officialUrl} target="_blank" rel="noreferrer">
                    <Button as="span" variant="outline" accent="orange" size="sm">Operator details ↗</Button>
                  </a>
                  <a href={stay.discoverySource.href} target="_blank" rel="noreferrer">
                    <Button as="span" variant="ghost" accent="orange" size="sm">Research source ↗</Button>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="outz-seam"><Divider variant="faint" /></div>

      <section id="outz-directory" className="outz-section outz-section--directory">
        <img className="outz-section__art outz-section__art--right" src={`${OUTZ_MOTIF}/adventure-map-river-pass.svg`} alt="" aria-hidden="true" />
        <img className="outz-section__art outz-section__art--bottom" src={`${OUTZ_MOTIF}/waterfall-crossing-lime.svg`} alt="" aria-hidden="true" />
        <SectionHeader
          kicker="Full Field Directory"
          title="Every OUTZ listing, one trailhead at a time"
          subtitle="Each address has its own check-in, short-lived group chat, ratings, and trip wall."
          accent="lime"
        />
        <div className="outz-directory">
          <div className="outz-dir-row outz-dir-row--head" role="presentation">
            <span>Destination</span><span>Type</span><span>Source</span><span />
          </div>
          {allPlaces.map(place => (
            <div className="outz-dir-row" key={place.id}>
              <b>{place.name}</b>
              <span className="outz-dir-row__kind" style={{ color: OUTZ_KIND_META[place.kind].accent }}>{OUTZ_KIND_META[place.kind].label}</span>
              <span className="outz-dir-row__source">{place.sourceName}</span>
              <Link className="outz-dir-row__open" href={outzPlaceHref(place)}>Open Z/ Page →</Link>
            </div>
          ))}
          {!allPlaces.length ? <p className="outz-empty">{query.isLoading ? "Loading the field directory…" : "No listings available right now."}</p> : null}
        </div>
      </section>

      <section className="outz-section outz-section--sources">
        <p className="outz-ledger__label">Source ledger: what powers the live updates</p>
        <div className="outz-ledger">
          {(snapshot?.sources ?? []).map(source => (
            <a key={source.id} href={source.href} target="_blank" rel="noreferrer">
              {source.name} · {source.live ? "Live Feed" : "Key Required"}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
