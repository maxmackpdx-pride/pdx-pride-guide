import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { placePath } from "@shared/placeSlug";
import type { Business } from "./Directory";
import AzIndexList, { groupAzEntries, type AzEntry } from "@/components/AzIndexList";
import { parseCommunityRegistry, registryNameKey } from "@/lib/communityRegistry";
import { RESOURCE_CATEGORIES } from "@/lib/resourcesData";
import registryText from "../../../qsearch/community-registry.md?raw";

/**
 * The master directory: every venue, place, club, group and service on
 * Zaylist on one A–Z page, small print, no cards. Generated at runtime from
 * GET /api/directory + GET /api/communities, merged with the QSearch
 * community registry (imported from qsearch/community-registry.md, the
 * single source of record) and the Needz resources directory
 * (client/src/lib/resourcesData.ts, the same dataset the Needz page reads) —
 * so a place added on any of those surfaces appears here automatically.
 * Entries with no page yet render as plain text, and registry residency
 * nods earn the (hosts our community) tag. Residency-nod venues are
 * community-friendly hosts, never labeled as LGBTQ venues.
 */

type CommunitySummary = { slug: string; name: string; sourcePlaceId: number | null };

const DIRECTORY_TAGS: Record<string, string> = {
  bar: "bar",
  venue: "venue",
  restaurant: "restaurant",
  cafe: "cafe",
  shop: "shop",
  service: "services",
  nonprofit: "nonprofit",
  healthcare: "health & care",
  realestate: "real estate",
  group: "group",
  campground: "campground",
  hotel: "hotel",
};

const REGISTRY_TAGS: Record<string, string> = {
  venue: "venue",
  shop: "shop",
  "club / organization": "club",
  organization: "organization",
  "service provider": "services",
};

const HOSTS_TAG = "hosts our community";
const NEEDZ_TAG = "resources";

export default function DirectoryIndex() {
  usePageSeo(
    "Every place, A–Z — Zaylist Directory",
    "Every venue, place, club, group and service on Zaylist, in one A–Z list.",
  );
  const directory = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then((r) => r.json()),
  });
  const communities = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"] });

  const entries = useMemo<AzEntry[]>(() => {
    if (!directory.data) return [];
    const communityByPlaceId = new Map<number, string>();
    const communityByName = new Map<string, string>();
    for (const community of communities.data ?? []) {
      if (community.sourcePlaceId != null) {
        communityByPlaceId.set(community.sourcePlaceId, community.slug);
      }
      communityByName.set(registryNameKey(community.name), community.slug);
    }

    const out: AzEntry[] = [];
    const seen = new Set<string>();
    for (const biz of directory.data) {
      const key = registryNameKey(biz.name);
      seen.add(key);
      let href = placePath(biz.id, biz.name);
      if (biz.type === "group") {
        const slug = communityByPlaceId.get(biz.id);
        if (slug) href = `/z/${slug}`;
      }
      out.push({ name: biz.name, href, tags: [DIRECTORY_TAGS[biz.type] ?? biz.type] });
    }

    for (const reg of parseCommunityRegistry(registryText)) {
      const key = registryNameKey(reg.name);
      const isResidency = reg.type === "residency nod";
      if (seen.has(key)) {
        // Already listed from the directory; a residency nod only adds its tag.
        if (isResidency) {
          const hit = out.find((entry) => registryNameKey(entry.name) === key);
          if (hit && !hit.tags.includes(HOSTS_TAG)) hit.tags = [...hit.tags, HOSTS_TAG];
        }
        continue;
      }
      seen.add(key);
      const slug = communityByName.get(key);
      out.push({
        name: reg.name,
        href: slug ? `/z/${slug}` : null,
        tags: isResidency ? [HOSTS_TAG] : [REGISTRY_TAGS[reg.type] ?? reg.type],
      });
    }

    // Needz resources: every org in the Needz dataset, across all of its
    // categories. Orgs already listed above keep their linked entry; the
    // rest are Needz-only and render as plain text (no per-org page exists).
    for (const category of RESOURCE_CATEGORIES) {
      for (const org of category.orgs) {
        const key = registryNameKey(org.name);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name: org.name, href: null, tags: [NEEDZ_TAG] });
      }
    }
    return out;
  }, [directory.data, communities.data]);

  return (
    <main className="az-page">
      <h1>Every place, A–Z</h1>
      <p className="az-lede">
        Every venue, place, club, group, service and Needz resource on Zaylist — one list, smallest print we have.
        {directory.data ? ` ${entries.length} listings.` : ""} Names with no page yet are plain text.
        Looking for the outdoors? <Link href="/outzide/a-z">OutZide locations A–Z</Link>.
      </p>
      {directory.isError ? (
        <p role="alert" className="az-status">
          The directory could not load.{" "}
          <button onClick={() => directory.refetch()}>Try again</button>
        </p>
      ) : directory.isPending ? (
        <p role="status" className="az-status">
          Loading the directory…
        </p>
      ) : (
        <AzIndexList groups={groupAzEntries(entries)} label="Directory" />
      )}
    </main>
  );
}
