import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import OutzMap from "@/components/OutzMap";
import { Badge, Button, Divider, SectionHeader, StatPill } from "@/components/ds";
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
import "./Outz.css";

type OutzPayload = { data: OutzSnapshot; stale?: boolean; fromCache?: boolean };
type BeachesPayload = { data: NudeBeachesSnapshot };

const MOTIF = "/motifs/outz";

/** Badge label + accent per listing kind. Accents are the DS neon set. */
const KIND_META: Record<OutzPlaceKind, { label: string; color: string; accent: string }> = {
  beach: { label: "Beach", color: "cyan", accent: "var(--cyan)" },
  "camp-hike": { label: "Camp + Hike", color: "lime", accent: "var(--lime)" },
  campground: { label: "Camp", color: "green", accent: "var(--green)" },
  trailhead: { label: "Hike", color: "orange", accent: "var(--orange)" },
  "outdoor-stay": { label: "Stay", color: "amber", accent: "var(--amber)" },
};

/** Button accent tokens are a narrower set than badge colors. */
const BUTTON_ACCENT: Record<string, string> = { amber: "orange", green: "green", cyan: "cyan", lime: "lime", orange: "orange" };

const LEGEND: OutzPlaceKind[] = ["beach", "camp-hike", "campground", "trailhead", "outdoor-stay"];

const QUICK_LINKS = [
  { href: "#outz-beaches", label: "Nude Beaches" },
  { href: "#outz-destinations", label: "Destinations" },
  { href: "#outz-map", label: "Map" },
  { href: "#outz-directory", label: "Directory" },
];

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
    href: "/z/out/rooster-rock",
    detail: "River conditions, crossing notes, parking, carpools, and the beach chat before you head east.",
    color: "cyan",
    accent: "var(--cyan)",
  },
  {
    key: "sauvieIsland",
    name: "Sauvie Island",
    region: "Collins Beach · Sauvie Island, OR",
    href: "/z/out/sauvie-island",
    detail: "Water quality, parking permits, island weather, and the practical intel for a good day on the sand.",
    color: "green",
    accent: "var(--green)",
  },
];

function timeLabel(value?: string) {
  if (!value) return "Loading official sources";
  return `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value))}`;
}

function tempLabel(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}°F`;
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
    <div className="outz-card__band" style={{ "--outz-c": accent } as CSSProperties} aria-hidden="true">
      <img src={src} alt="" loading="lazy" />
    </div>
  );
}

/** Deterministic band art so a card keeps the same motif between renders. */
const BAND_ART = [
  `${MOTIF}/ridge-loop-cyan.svg`,
  `${MOTIF}/canyon-overlook-orange.svg`,
  `${MOTIF}/alpine-lake-loop-lime.svg`,
  `${MOTIF}/waterfall-crossing-lime.svg`,
  `${MOTIF}/topographic-ridge-basin-amber.svg`,
];

function bandArt(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return BAND_ART[hash % BAND_ART.length];
}

export default function Outz() {
  usePageSeo("Z/OUT | Camping, hiking, trails and conditions | Zaylist", "Official-source camping, hiking, trail, weather and access information across Oregon and southern Washington.");
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
    <div className="zine-page board-page outz-page">
      <div className="outz-page__terrain" aria-hidden="true" />
      <img className="outz-page__topo" src={`${MOTIF}/topographic-ridge-basin-amber.svg`} alt="" aria-hidden="true" />

      <div className="outz-hero">
        <img className="outz-hero__art" src={`${MOTIF}/adventure-map-alpine-waypoints.svg`} alt="" aria-hidden="true" />
        <PageHeader
          section="OUTZ"
          kicker="LIVE FIELD DESK"
          title="PITCH A TENT. FIND YOUR PEOPLE."
          titleAccent="cyan"
          lede="Camping, hiking, trails, weather, and alerts from the agencies that manage the places, plus the people who make the trip better."
          actions={
            <div className="outz-hero-actions">
              <a href="#outz-beaches"><Button as="span" variant="solid" accent="lime" size="lg">BEACH CONDITIONS</Button></a>
              <a href="#outz-directory"><Button as="span" accent="orange" size="lg">ALL LISTINGS</Button></a>
            </div>
          }
        />
      </div>

      <nav className="outz-quicklinks" aria-label="Z/OUT sections">
        <img className="outz-quicklinks__mark" src="/brand/family/outz.svg" alt="OUTZ" />
        {QUICK_LINKS.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        {/* No OUTZ spot-submission flow exists yet; /contact is the real intake. */}
        <Link className="outz-quicklinks__cta" href="/contact">
          <Button as="span" variant="solid" accent="orange" size="sm">SUBMIT A SPOT</Button>
        </Link>
      </nav>

      <section className="outz-livebar" aria-live="polite">
        <img className="outz-livebar__art" src={`${MOTIF}/alpine-lake-loop-lime.svg`} alt="" aria-hidden="true" />
        <span className="outz-livebar__stamp">
          {timeLabel(snapshot?.fetchedAt)} · Live NWS + agency feeds{query.data?.stale ? " · Refreshing in background" : ""}
        </span>
        <div className="outz-livebar__stats">
          <StatPill count={allPlaces.length || "—"} color="cyan">Destinations</StatPill>
          <StatPill count={alertCount} color="orange">Active Alerts</StatPill>
          <StatPill count={stays.length} color="lime">Community Stays</StatPill>
          <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            {refresh.isPending ? "REFRESHING" : "REFRESH LIVE DATA"}
          </Button>
        </div>
      </section>

      {query.isError ? <div className="outz-error">Official outdoor conditions are temporarily unavailable. Try the direct agency links below.</div> : null}

      <section id="outz-beaches" className="outz-section outz-section--beaches" aria-labelledby="outz-beaches-heading">
        <img className="outz-section__art outz-section__art--left" src={`${MOTIF}/adventure-map-waterfall-route.svg`} alt="" aria-hidden="true" />
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
              <article className="outz-card outz-beach-card" key={beach.key} style={{ "--outz-c": beach.accent } as CSSProperties}>
                <div className="outz-card__head">
                  <p className="outz-card__eyebrow">{beach.region}</p>
                  <Badge color={beach.color} variant="outline" size="md">Seasonal</Badge>
                </div>
                <h3>{beach.name}</h3>
                <p className="outz-card__detail">{beach.detail}</p>
                <ConditionRow items={[tempLabel(live?.airTempF), live?.weatherSummary, live?.wind]} />
                <StatusLine tone="good">{status || "Seasonal access. Open in season, conditions change daily."}</StatusLine>
                <Link className="outz-card__cta" href={beach.href}>
                  <Button as="span" variant="solid" accent={BUTTON_ACCENT[beach.color]} size="sm">OPEN SPOT</Button>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section id="outz-destinations" className="outz-section outz-section--destinations">
        <img className="outz-section__art outz-section__art--right" src={`${MOTIF}/adventure-map-twin-falls.svg`} alt="" aria-hidden="true" />
        <img className="outz-section__art outz-section__art--corner" src={`${MOTIF}/canyon-overlook-orange.svg`} alt="" aria-hidden="true" />
        <SectionHeader
          kicker="Plan a Trip"
          title="Featured camp + hike destinations"
          subtitle="Live conditions pulled from the agencies that manage each place, across Oregon and southern Washington."
          accent="lime"
        />
        {legendKinds.length ? (
          <div className="outz-legend">
            {legendKinds.map(kind => (
              <span key={kind}><i style={{ background: KIND_META[kind].accent }} />{KIND_META[kind].label}</span>
            ))}
          </div>
        ) : null}
        <div className="outz-card-grid">
          {destinations.map(place => {
            const meta = KIND_META[place.kind];
            return (
              <article className="outz-card outz-card--tall" key={place.id} style={{ "--outz-c": meta.accent } as CSSProperties}>
                <MotifBand src={bandArt(place.id)} accent={meta.accent} />
                <div className="outz-card__body">
                  <div className="outz-card__head">
                    <div>
                      <p className="outz-card__eyebrow">{place.sourceName}</p>
                      <h3>{place.name}</h3>
                    </div>
                    <Badge color={meta.color} variant="outline">{meta.label}</Badge>
                  </div>
                  <p className="outz-card__detail">{place.subtitle}</p>
                  <ConditionRow items={[tempLabel(place.airTempF), place.forecast, place.wind]} />
                  {place.alerts.length
                    ? <StatusLine tone="bad"><strong>Alert:</strong> {place.alerts[0].headline}</StatusLine>
                    : <StatusLine tone="good">No active NWS alert.</StatusLine>}
                  {place.sourceStatus ? <p className="outz-card__source">{place.sourceStatus}</p> : null}
                  <div className="outz-card__actions">
                    <Link href={outzPlaceHref(place)}>
                      <Button as="span" variant="solid" accent={BUTTON_ACCENT[meta.color]} size="sm">CHECK IN + CHAT</Button>
                    </Link>
                    <a href={place.officialUrl} target="_blank" rel="noreferrer">Official park page ↗</a>
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
            <article className="outz-card" key={stay.id} style={{ "--outz-c": "var(--amber)" } as CSSProperties}>
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
                  <a href={stay.officialUrl} target="_blank" rel="noreferrer">Operator details ↗</a>
                  <a href={stay.discoverySource.href} target="_blank" rel="noreferrer">Research source ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="outz-seam"><Divider variant="faint" /></div>

      <section id="outz-map" className="outz-section outz-section--map">
        <SectionHeader
          kicker="Where To Go"
          title="All destinations on one map"
          subtitle="Every pin is a place with a check-in, a chat, and a wall."
          accent="cyan"
        />
        <div className="outz-map-frame">
          <img className="outz-map-frame__art" src={`${MOTIF}/ridge-loop-cyan.svg`} alt="" aria-hidden="true" />
          {snapshot
            ? <OutzMap destinations={snapshot.destinations} catalog={snapshot.catalog} />
            : <p className="outz-empty">Map loads once the official sources respond.</p>}
        </div>
      </section>

      <section id="outz-directory" className="outz-section outz-section--directory">
        <img className="outz-section__art outz-section__art--right" src={`${MOTIF}/adventure-map-river-pass.svg`} alt="" aria-hidden="true" />
        <img className="outz-section__art outz-section__art--bottom" src={`${MOTIF}/waterfall-crossing-lime.svg`} alt="" aria-hidden="true" />
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
              <span className="outz-dir-row__kind" style={{ color: KIND_META[place.kind].accent }}>{KIND_META[place.kind].label}</span>
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
