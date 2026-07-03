import { useState, useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import { MapPin } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { PlaceCard } from "@/components/ds";
import { parsePacificDateTime } from "@shared/missedConnections";

import { lazyWithReload } from "@/lib/lazyWithReload";
import { FilterChip } from "@/components/ds";
import { dayAccentToken } from "@/lib/dsColors";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

type DirectoryEventSummary = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  listingInstanceKey?: string;
};

type Business = {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  hours: string | null;
  phone: string | null;
  queerOwned: boolean;
  queerFriendly: boolean;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  isNew: boolean;
  upcomingEvents?: DirectoryEventSummary[];
};

const TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
};

const TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
};

const NEIGHBORHOODS = [
  "ALL", "Downtown", "SE", "NE", "N", "NW", "SW", "Pearl", "Alberta", "Hawthorne",
  "Belmont", "Division", "Mississippi", "Alberta Arts District",
];

export default function Directory() {
  usePageSeo(
    "Queer Portland Directory — PDX Pride Guide",
    "Queer-owned and queer-friendly bars, restaurants, cafes, venues, and services in Portland.",
  );

  const [activeType, setActiveType] = useState("ALL");
  const [activeNeighborhood, setActiveNeighborhood] = useState("ALL");

  const { data: businesses = [], isLoading, isError } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const filtered = useMemo(() => {
    return businesses
      .filter(b => {
        if (activeType !== "ALL" && b.type !== activeType) return false;
        if (activeNeighborhood !== "ALL" && b.neighborhood !== activeNeighborhood) return false;
        return true;
      })
      .sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }, [businesses, activeType, activeNeighborhood]);

  const neighborhoodsInUse = useMemo(() => {
    const seen = new Set(businesses.map(b => b.neighborhood).filter(Boolean));
    return NEIGHBORHOODS.filter(n => n === "ALL" || seen.has(n));
  }, [businesses]);

  return (
    <div className="zine-page directory-page board-page">
      <PageHeader
        section="Portland"
        title="Queer Directory"
        titleAccent="magenta"
        kicker="Queer-owned · Queer-friendly · Community-rooted"
        lede="Bars, restaurants, cafes, shops, and services that make up Portland's LGBTQ+ community. Show up, spend money, keep them alive."
      />

      {/* Map */}
      {!isLoading && (
        <Suspense fallback={<div style={{ height: 380, background: "#0a0a0a" }} />}>
          <DirectoryMap businesses={filtered} />
        </Suspense>
      )}

      {/* Filter bar */}
      <div className="zine-filter-bar" style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: "var(--site-header-height)", zIndex: 50,
      }}>
        <div className="events-filter-row" style={{ flexWrap: "wrap", rowGap: 8 }}>
          <FilterChip
            selected={activeType === "ALL"}
            fill={activeType === "ALL"}
            accent={dayAccentToken("ALL")}
            onToggle={() => setActiveType("ALL")}
          >
            ALL
          </FilterChip>
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const selected = activeType === key;
            return (
              <FilterChip
                key={key}
                selected={selected}
                fill={selected}
                accent={TYPE_COLORS[key]}
                onToggle={() => setActiveType(key)}
              >
                {label}
              </FilterChip>
            );
          })}
        </div>

        <div className="events-filter-row" style={{ paddingTop: 6, paddingBottom: 10, overflowX: "auto" }}>
          {neighborhoodsInUse.map(n => {
            const selected = activeNeighborhood === n;
            return (
              <FilterChip
                key={n}
                selected={selected}
                fill={selected}
                accent={n === "ALL" ? dayAccentToken("ALL") : "lime"}
                onToggle={() => setActiveNeighborhood(n)}
                style={{ fontSize: "0.7rem" }}
              >
                {n}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="zine-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <ScrollReveal>
          <div className="events-count-row">
            <div className="events-count-banner">
              <MapPin size={13} />
              <span>
                {isLoading ? "Loading…" : `${filtered.length} place${filtered.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <BoardLoadingState label="Loading directory" />
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>Could not load directory.</div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">Nothing here yet</p>
            <p className="board-copy-sm">
              {businesses.length === 0
                ? "The directory is being built — check back soon."
                : "No places match your filters."}
            </p>
          </div>
        ) : (
          <div className="directory-grid">
            {filtered.map((biz, i) => (
              <ScrollReveal key={biz.id} delay={Math.min(i * 40, 300)}>
                <DirectoryCard biz={biz} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDirectoryEventWhen(event: DirectoryEventSummary) {
  const startMs = parsePacificDateTime(event.dateStart);
  if (startMs == null) return event.dayOfWeek || "Upcoming";
  const start = new Date(startMs);
  const dateLabel = start.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = start.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} · ${timeLabel}`;
}

const TYPE_TO_DS_CATEGORY: Record<string, string> = {
  bar: "bars",
  restaurant: "food",
  cafe: "cafes",
  venue: "venues",
  service: "services",
  shop: "shops",
  hotel: "hotels",
};

function DirectoryCard({ biz }: { biz: Business }) {
  const upcomingEvents = biz.upcomingEvents ?? [];
  const address = [biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined;
  return (
    <PlaceCard
      name={biz.name}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={address}
      hours={biz.hours || undefined}
      phone={biz.phone || undefined}
      description={biz.description || undefined}
      website={biz.website || undefined}
      instagram={biz.instagram || undefined}
      grandOpening={biz.isNew}
      events={upcomingEvents.map(event => ({
        day: event.dayOfWeek || undefined,
        date: formatDirectoryEventWhen(event),
        title: event.title,
        href: eventPath(event.id, event.title, event.dayOfWeek),
      }))}
    />
  );
}
