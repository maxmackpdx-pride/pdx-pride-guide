import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import OutzMap from "@/components/OutzMap";
import { Button } from "@/components/ds";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { OUTZ_COMMUNITY_STAYS, outzPlaceHref, outzPlacesFromSnapshot, type OutzSnapshot } from "@shared/outz";
import "./Outz.css";

type OutzPayload = { data: OutzSnapshot; stale?: boolean; fromCache?: boolean };

type OutzCrew = {
  name: string;
  place: string;
  detail: string;
  href: string;
  accent: string;
};

const OUTZ_CREWS: OutzCrew[] = [
  {
    name: "River Brats",
    place: "Rooster Rock",
    detail: "River conditions, crossing notes, parking, carpools, and the beach chat before you head east.",
    href: "/z/out/rooster-rock",
    accent: "#19e3ff",
  },
  {
    name: "Sauvie Sirens",
    place: "Sauvie Island · Collins Beach",
    detail: "Water quality, parking permits, island weather, and the practical intel for a good day on the sand.",
    href: "/z/out/sauvie-island",
    accent: "#39ff14",
  },
];

function timeLabel(value?: string) {
  if (!value) return "Loading official sources";
  return `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value))}`;
}

export default function Outz() {
  usePageSeo("Z/OUT | Camping, hiking, trails and conditions | Zaylist", "Official-source camping, hiking, trail, weather and access information across Oregon and southern Washington.");
  const queryClient = useQueryClient();
  const query = useQuery<OutzPayload>({
    queryKey: ["/api/outz"],
    queryFn: () => apiRequest("GET", "/api/outz").then(response => response.json()),
  });
  const refresh = useMutation({
    mutationFn: () => apiRequest("POST", "/api/outz/refresh", {}).then(response => response.json()),
    onSuccess: payload => queryClient.setQueryData(["/api/outz"], payload),
  });
  const snapshot = query.data?.data;
  const allPlaces = snapshot ? outzPlacesFromSnapshot(snapshot) : [];

  return (
    <div className="zine-page board-page outz-page">
      <div className="outz-page__terrain" aria-hidden="true" />
      <svg className="outz-page__topo" viewBox="0 0 1440 1100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-80 186c170-154 340 94 501-31 149-116 241 17 395-58 142-70 302 80 698-71" />
        <path d="M-52 246c151-134 330 81 472-20 155-111 256 35 406-31 167-74 340 70 656-80" />
        <path d="M-45 315c134-123 322 59 472-8 162-72 259 70 407 3 175-79 337 71 659-75" />
        <path d="M-50 742c157-150 311 58 481-44 164-99 258 40 414-32 160-75 311 75 644-66" />
        <path d="M-72 820c153-132 318 80 501-22 150-83 252 31 415-33 157-62 314 86 622-49" />
        <path d="M-41 898c125-115 296 79 475-8 154-75 245 64 403 3 175-68 308 83 614-51" />
      </svg>
      <PageHero
        kicker="Z/OUT · LIVE FIELD DESK"
        titleLine1="PITCH A TENT."
        titleLine2="FIND YOUR PEOPLE."
        accent="cyan"
        lede="Camping, hiking, trails, weather, alerts, and practical access notes from the agencies that manage the places — plus the people who make the trip better."
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 44%"
        actions={<div className="outz-hero-actions"><Link href="/z/out/rooster-rock"><Button as="span" variant="solid">BEACH CONDITIONS</Button></Link><a href="#outz-directory"><Button as="span" accent="cyan">ALL LISTINGS</Button></a></div>}
      />

      <section className="outz-refresh" aria-live="polite">
        <span>{timeLabel(snapshot?.fetchedAt)}{query.data?.stale ? " · Refreshing in background" : ""}</span>
        <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? "REFRESHING" : "REFRESH LIVE DATA"}</Button>
      </section>

      {query.isError ? <div className="outz-error">Official outdoor conditions are temporarily unavailable. Try the direct agency links below.</div> : null}

      <section id="outz-stays" className="outz-section outz-section--stays" aria-labelledby="outz-stays-heading">
        <div className="outz-section__head">
          <p>QUEER STAYS + TRIP LEADS</p>
          <h2 id="outz-stays-heading">More places to pitch a tent</h2>
          <span>Operator details are reviewed separately from official conditions. A directory lead is not an endorsement or an access guarantee.</span>
        </div>
        <div className="outz-stays-grid">
          {(snapshot?.communityStays ?? OUTZ_COMMUNITY_STAYS).map(stay => (
            <article className="outz-stay-card pdx-glass-card pdx-glass-rebind" key={stay.id} style={{ "--c": "#ff6600" } as CSSProperties}>
              <p className="outz-stay-card__type">{stay.kind === "campground" ? "CAMPGROUND" : "OUTDOOR STAY"}</p>
              <h3>{stay.name}</h3>
              <p className="outz-stay-card__region">{stay.region}</p>
              <p>{stay.detail}</p>
              <p className="outz-stay-card__access"><strong>Before you go:</strong> {stay.accessNote}</p>
              <p className="outz-stay-card__source">{stay.inclusionNote} · Operator details checked {stay.reviewedAt}.</p>
              <div className="outz-stay-card__actions">
                <Link className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" href={outzPlaceHref(stay)} style={{ "--c": "#ff6600" } as CSSProperties}>CHECK IN + CHAT</Link>
                <a href={stay.officialUrl} target="_blank" rel="noreferrer">Operator details ↗</a>
                <a href={stay.discoverySource.href} target="_blank" rel="noreferrer">Research source ↗</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="outz-section outz-crews" aria-labelledby="outz-crews-heading">
        <div className="outz-section__head">
          <p>LOCAL CREWS</p>
          <h2 id="outz-crews-heading">Pick your spot. Find your people.</h2>
          <span>Two outdoor home bases for the river, the island, and the group chat that gets you there.</span>
        </div>
        <div className="outz-crew-grid">
          {OUTZ_CREWS.map(crew => (
            <article className="outz-crew-card pdx-glass-card pdx-glass-rebind" key={crew.href} style={{ "--c": crew.accent } as CSSProperties}>
              <svg className="outz-crew-card__motif" viewBox="0 0 240 160" aria-hidden="true">
                <path d="M12 137 78 61l30 37 31-50 90 89" />
                <path d="M37 137 92 79l56 58" />
                <path d="M102 137v-35l18-26 19 26v35" />
                <path d="M120 76v61" />
              </svg>
              <div className="outz-crew-card__content">
                <p className="outz-crew-card__eyebrow">{crew.place}</p>
                <h3>{crew.name}</h3>
                <p>{crew.detail}</p>
                <Link className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind outz-crew-card__action" href={crew.href} style={{ "--c": crew.accent } as CSSProperties}>
                  OPEN SPOT
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="outz-section">
        <div className="outz-section__head"><p>PLAN A TRIP</p><h2>Featured camp + hike destinations</h2></div>
        <div className="outz-feature-grid">
          {(snapshot?.destinations ?? []).map(place => (
            <article className="outz-feature-card" key={place.id}>
              <div className="outz-feature-card__eyebrow">{place.sourceName}</div>
              <h3>{place.name}</h3>
              <p>{place.subtitle}</p>
              <div className="outz-condition-row">
                <span>{place.airTempF == null ? "—" : `${place.airTempF}°F`}</span>
                <span>{place.forecast ?? "Forecast unavailable"}</span>
                <span>{place.wind ?? "Wind unavailable"}</span>
              </div>
              {place.sourceStatus ? <div className="outz-source-status">{place.sourceStatus}</div> : null}
              {place.alerts.length ? <div className="outz-alert"><strong>Alert:</strong> {place.alerts[0].headline}</div> : <div className="outz-no-alert">No active NWS alert returned for this point.</div>}
              <div className="outz-feature-card__actions"><Link href={outzPlaceHref(place)}>CHECK IN + CHAT</Link><a href={place.officialUrl} target="_blank" rel="noreferrer">Open official park page ↗</a></div>
            </article>
          ))}
        </div>
      </section>

      {snapshot ? <section className="outz-map-section"><OutzMap destinations={snapshot.destinations} catalog={snapshot.catalog} /></section> : null}

      <section id="outz-directory" className="outz-section outz-section--directory">
        <div className="outz-section__head"><p>FULL FIELD DIRECTORY</p><h2>Every OUTZ listing, one trailhead at a time</h2><span>Each address has its own check-in, short-lived group chat, ratings, and trip board. Official details stay linked to their source.</span></div>
        <div className="outz-directory__count">{allPlaces.length || "—"} CURRENT DESTINATIONS · CAMPGROUNDS · TRAILHEADS · STAYS</div>
        <div className="outz-directory-grid">
          {allPlaces.map(place => (
            <article className="outz-directory-card pdx-glass-card pdx-glass-rebind" key={place.id} style={{ "--c": place.kind === "beach" ? "#19e3ff" : "#ff8a1f" } as CSSProperties}>
              <div><span>{place.kind.replace(/-/g, " ")}</span><b>{place.sourceName}</b></div>
              <h3>{place.name}</h3>
              <p>{place.sourceStatus || place.detail}</p>
              <Link className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" href={outzPlaceHref(place)} style={{ "--c": place.kind === "beach" ? "#19e3ff" : "#ff8a1f" } as CSSProperties}>OPEN Z/ PAGE</Link>
              {place.officialUrl ? <a href={place.officialUrl} target="_blank" rel="noreferrer">Official details ↗</a> : <small>Official source has no direct visitor page.</small>}
            </article>
          ))}
        </div>
      </section>

      <section className="outz-section outz-section--sources">
        <div className="outz-section__head"><p>SOURCE LEDGER</p><h2>What powers the live updates</h2></div>
        <div className="outz-source-grid">
          {(snapshot?.sources ?? []).map(source => <a key={source.id} href={source.href} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>{source.detail}</span><em>{source.live ? "LIVE FEED" : "KEY REQUIRED"}</em></a>)}
        </div>
      </section>
    </div>
  );
}
