import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import { MapPin, Globe, Instagram, Clock, Phone } from "lucide-react";

const DirectoryMap = lazy(() => import("@/components/DirectoryMap"));

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
    staleTime: 300_000,
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
      <PageHero
        titleLine1="QUEER"
        titleLine2="PORTLAND"
        accent="magenta"
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 55%"
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
          <button
            className={`filter-tag${activeType === "ALL" ? " active" : ""}`}
            onClick={() => setActiveType("ALL")}
          >ALL</button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`filter-tag${activeType === key ? " active" : ""}`}
              style={activeType === key ? {
                color: "#000", borderColor: TYPE_COLORS[key],
                background: TYPE_COLORS[key], boxShadow: `0 0 14px ${TYPE_COLORS[key]}aa`,
              } : {}}
              onClick={() => setActiveType(key)}
            >{label}</button>
          ))}
        </div>

        <div className="events-filter-row" style={{ paddingTop: 6, paddingBottom: 10, overflowX: "auto" }}>
          {neighborhoodsInUse.map(n => (
            <button
              key={n}
              className={`filter-tag${activeNeighborhood === n ? " active" : ""}`}
              style={{ fontSize: "0.7rem" }}
              onClick={() => setActiveNeighborhood(n)}
            >{n}</button>
          ))}
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

function DirectoryCard({ biz }: { biz: Business }) {
  const color = TYPE_COLORS[biz.type] || "#FF00CC";
  return (
    <div className="directory-card" style={{ "--card-accent": color } as React.CSSProperties}>
      <div className="directory-card__body">
        {biz.isNew && (
          <div className="directory-card__grand-opening">GRAND OPENING</div>
        )}
        <div className="directory-card__badges">
          <span className="directory-card__type-badge" style={{ background: color, color: "#000" }}>
            {TYPE_LABELS[biz.type] || biz.type}
          </span>
        </div>
        <h3 className="directory-card__name display">{biz.name}</h3>
        {(biz.address || biz.neighborhood) && (
          <div className="directory-card__address">
            <MapPin size={11} />
            {biz.address ?? biz.neighborhood}
          </div>
        )}
        {biz.hours && (
          <div className="directory-card__hours">
            <Clock size={11} /> {biz.hours}
          </div>
        )}
        {biz.phone && (
          <div className="directory-card__phone">
            <Phone size={11} /> <a href={`tel:${biz.phone}`}>{biz.phone}</a>
          </div>
        )}
        {biz.description && (
          <p className="directory-card__desc">{biz.description}</p>
        )}
        <div className="directory-card__links">
          {biz.website && (
            <a href={biz.website} target="_blank" rel="noopener noreferrer" className="directory-card__link">
              <Globe size={13} /> Website
            </a>
          )}
          {biz.instagram && (
            <a
              href={biz.instagram.startsWith("http") ? biz.instagram : `https://instagram.com/${biz.instagram.replace("@", "")}`}
              target="_blank" rel="noopener noreferrer" className="directory-card__link"
            >
              <Instagram size={13} /> {biz.instagram.startsWith("@") ? biz.instagram : `@${biz.instagram}`}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
