import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  outzPlaceHref,
  outzPlacesWithCatalog,
  type OutzBrowseCatalogRow,
  type OutzSnapshot,
} from "@shared/outz";
import AzIndexList, { groupAzEntries, type AzEntry } from "@/components/AzIndexList";

/**
 * Every OutZide location on one A–Z page, same plain-text treatment as the
 * master directory index. Generated from the same sources the OutZide
 * places page uses — the /outzide-map/places.json catalog merged with the
 * /api/outz conditions snapshot via outzPlacesWithCatalog — so a location
 * added to the catalog appears here automatically. The area rides after
 * each name in small print, because names repeat across the state.
 */

type CatalogRow = OutzBrowseCatalogRow & { region?: string };

export default function OutzideIndex() {
  usePageSeo(
    "Every OutZide location, A–Z — Zaylist",
    "Every OutZide destination on Zaylist, in one A–Z list, with its area.",
  );
  const snapshot = useQuery<{ data: OutzSnapshot }>({ queryKey: ["/api/outz"] });
  const catalog = useQuery<{ places: CatalogRow[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json").then((r) => r.json()),
    staleTime: 300000,
  });

  const entries = useMemo<AzEntry[]>(() => {
    if (!catalog.data) return [];
    const areaById = new Map<string, string>();
    for (const row of catalog.data.places) {
      if (row.region) areaById.set(row.id, row.region);
    }
    for (const stay of snapshot.data?.data.communityStays ?? []) {
      if (!areaById.has(stay.id)) areaById.set(stay.id, stay.region);
    }
    for (const dest of snapshot.data?.data.destinations ?? []) {
      if (areaById.has(dest.id)) continue;
      const tail = dest.subtitle
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean)
        .pop();
      if (tail) areaById.set(dest.id, tail);
    }
    return outzPlacesWithCatalog(snapshot.data?.data, catalog.data.places).map((place) => {
      const area = areaById.get(place.id);
      return { name: place.name, href: outzPlaceHref(place), tags: area ? [area] : [] };
    });
  }, [catalog.data, snapshot.data]);

  return (
    <main className="az-page">
      <h1>Every OutZide location, A–Z</h1>
      <p className="az-lede">
        Every trailhead, campground, beach and stay on OutZide — one list, smallest print we have.
        {catalog.data ? ` ${entries.length} locations.` : ""} The area rides after the name,
        because half the state has a Badger Lake. City side instead?{" "}
        <Link href="/directory/a-z">Places &amp; groups A–Z</Link>.
      </p>
      {catalog.isError ? (
        <p role="alert" className="az-status">
          The location catalog could not load.{" "}
          <button onClick={() => catalog.refetch()}>Try again</button>
        </p>
      ) : catalog.isPending ? (
        <p role="status" className="az-status">
          Loading locations…
        </p>
      ) : (
        <AzIndexList groups={groupAzEntries(entries)} label="OutZide locations" />
      )}
    </main>
  );
}
