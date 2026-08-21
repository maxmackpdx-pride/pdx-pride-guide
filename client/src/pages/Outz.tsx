import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import OutzMap from "@/components/OutzMap";
import { Button } from "@/components/ds";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import type { OutzSnapshot } from "@shared/outz";
import "./Outz.css";

type OutzPayload = { data: OutzSnapshot; stale?: boolean; fromCache?: boolean };

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

  return (
    <div className="zine-page board-page outz-page">
      <PageHero
        kicker="Z/OUT · LIVE FIELD DESK"
        titleLine1="CAMP. HIKE."
        titleLine2="GET OUT."
        accent="cyan"
        lede="Camping, hiking, trails, weather, alerts, and practical access notes from the agencies that manage the places. Nude beaches are one part of the map."
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 44%"
        actions={<div className="outz-hero-actions"><Link href="/z/out/rooster-rock"><Button as="span" variant="solid">BEACH CONDITIONS</Button></Link><a href="#official-catalog"><Button as="span" accent="cyan">OFFICIAL CATALOG</Button></a></div>}
      />

      <section className="outz-refresh" aria-live="polite">
        <span>{timeLabel(snapshot?.fetchedAt)}{query.data?.stale ? " · Refreshing in background" : ""}</span>
        <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? "REFRESHING" : "REFRESH LIVE DATA"}</Button>
      </section>

      {query.isError ? <div className="outz-error">Official outdoor conditions are temporarily unavailable. Try the direct agency links below.</div> : null}

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
              <a href={place.officialUrl} target="_blank" rel="noreferrer">Open official park page ↗</a>
            </article>
          ))}
        </div>
      </section>

      {snapshot ? <section className="outz-map-section"><OutzMap destinations={snapshot.destinations} catalog={snapshot.catalog} /></section> : null}

      <section id="official-catalog" className="outz-section outz-section--catalog">
        <div className="outz-section__head"><p>USFS LIVE CATALOG</p><h2>Campgrounds and trailheads</h2><span>Current agency status is a planning signal, not a reservation. Confirm access before driving.</span></div>
        <div className="outz-catalog-grid">
          {(snapshot?.catalog ?? []).slice(0, 30).map(place => (
            <article className="outz-catalog-card" key={place.id}>
              <span>{place.kind}</span><h3>{place.name}</h3>
              <p>{place.status ?? "Status unavailable"}{place.statusReason ? ` · ${place.statusReason}` : ""}</p>
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
