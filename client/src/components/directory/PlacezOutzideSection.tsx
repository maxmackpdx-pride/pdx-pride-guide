import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BrowseLane } from "@/components/discovery/EventzBrowse";
import TodayLocationCard, { type TodayLocation } from "@/components/home/TodayLocationCard";
import OutzSmallCard from "@/components/home/OutzSmallCard";
import { LoadMore, useProgressiveList } from "@/hooks/useProgressiveList";
import { hasBlendRecipe } from "@/lib/outzBlend";
import { OUTZ_REGIONS, outzRegionFor } from "@/lib/outzRegions";
import type { OutzPhotoData } from "@/components/outz/OutzPhoto";
import "./PlacezOutzideSection.css";

type OutzRow = { id: string; name: string; kind: string; region?: string; state?: string; lat: number; lng: number; browseRegion?: string; art?: string; photo?: OutzPhotoData };
const TALL_COUNT = 8;

/** Outzide inside Placez: pick a region, see its best destinations as tall cards and the rest as small cards. */
export default function PlacezOutzideSection({ query = "", onRequireAuth }: { query?: string; onRequireAuth?: () => void; quiet?: boolean }) {
  const [region, setRegion] = useState("portland-gorge");
  const { data } = useQuery<{ places: OutzRow[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json?v=20261017-sculpted-v3").then(r => r.json()),
    staleTime: 3_600_000,
  });
  const all = useMemo(() => (data?.places ?? []).map(p => ({ ...p, regionId: outzRegionFor(p) })), [data]);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => all.filter(p => !q || p.name.toLowerCase().includes(q) || (p.region ?? "").toLowerCase().includes(q)), [all, q]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of matches) if (p.regionId) map.set(p.regionId, (map.get(p.regionId) ?? 0) + 1);
    return map;
  }, [matches]);
  // With a search, show every region that matches; otherwise the picked region.
  const active = q ? (counts.get(region) ? region : [...counts.keys()][0] ?? region) : region;
  const inRegion = useMemo(() => matches
    .filter(p => p.regionId === active)
    .sort((a, b) => Number(hasBlendRecipe(b.id)) - Number(hasBlendRecipe(a.id)) || Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || a.name.localeCompare(b.name)), [matches, active]);
  const tall = inRegion.slice(0, TALL_COUNT), small = inRegion.slice(TALL_COUNT);
  const list = useProgressiveList(small.length, { initial: 24, step: 24, resetKey: `${active}|${q}` });
  const toLocation = (p: OutzRow): TodayLocation => ({ key: `outz:${p.id}`, name: p.name, room: "OutZide", detail: p.region || "Outdoor destination", kind: p.kind, art: p.art, photo: p.photo, href: `/outzide?place=${encodeURIComponent(p.id)}` });
  if (!all.length) return null;
  const regionMeta = OUTZ_REGIONS.find(r => r.id === active);
  return (
    <section className="placez-outzide" id="placez-outzide" aria-labelledby="placez-outzide-title">
      <header className="placez-outzide__head">
        <img src="/brand/outzide.png" alt="" className="placez-outzide__logo" />
        <div>
          <h2 id="placez-outzide-title">Outzide</h2>
          <p>Trails, camps, beaches and hot springs, by region.</p>
        </div>
      </header>
      <div className="placez-outzide__regions" role="tablist" aria-label="Outzide regions">
        {OUTZ_REGIONS.map(r => (
          <button key={r.id} type="button" role="tab" aria-selected={active === r.id} disabled={q ? !counts.get(r.id) : false} className="placez-outzide__region" onClick={() => setRegion(r.id)}>
            {r.name}<b>{counts.get(r.id) ?? 0}</b>
          </button>
        ))}
      </div>
      {regionMeta && <p className="placez-outzide__note">{regionMeta.note}</p>}
      {tall.length ? (
        <div className="eb-lanes"><BrowseLane title={regionMeta?.name ?? "Outzide"} color="var(--neon-orange)" count={inRegion.length}>
          {tall.map(p => <div className="eb-original-card" key={p.id}><TodayLocationCard location={toLocation(p)} onRequireAuth={onRequireAuth} /></div>)}
        </BrowseLane></div>
      ) : <p className="placez-outzide__empty">No Outzide destinations match here yet.</p>}
      {small.length > 0 && (
        <>
          <h3 className="placez-outzide__more">More in {regionMeta?.name}</h3>
          <div className="placez-outzide__small">
            {small.slice(0, list.limit).map(p => <OutzSmallCard key={p.id} location={toLocation(p)} onRequireAuth={onRequireAuth} />)}
          </div>
          <LoadMore hasMore={list.hasMore} remaining={list.remaining} onLoad={list.loadMore} label="Show more destinations" />
        </>
      )}
    </section>
  );
}
