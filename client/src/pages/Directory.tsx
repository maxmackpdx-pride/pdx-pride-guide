import type React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DirectoryAddPlaceForm from "@/components/DirectoryAddPlaceForm";
import AuthModal from "@/components/AuthModal";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import { Plus } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { placePath, placeUrl, slugifyPlaceName } from "@shared/placeSlug";
import { Button, PlaceCard, SearchInput } from "@/components/ds";
import { parsePacificDateTime } from "@shared/missedConnections";
import { isGrandOpeningActive } from "@shared/grandOpening";
import type { BusinessLocation } from "@shared/businessLocations";
import { resolveBusinessLocations } from "@shared/businessLocations";
import {
  DIRECTORY_TYPE_COLORS as TYPE_COLORS,
  DIRECTORY_TYPE_LABELS as TYPE_LABELS,
} from "@shared/directoryTheme";

import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";
import {
  pushDirectoryRecent,
} from "@/lib/directoryRecent";
import PlaceModal from "@/components/PlaceModal";
import "./Directory.css";

export type DirectoryEventSummary = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  listingInstanceKey?: string;
  posterImageUrl?: string | null;
  hostDisplayName?: string | null;
  hostUsername?: string | null;
};

export type Business = {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  donateUrl: string | null;
  hours: string | null;
  phone: string | null;
  queerOwned: boolean;
  queerFriendly: boolean;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  /**
   * Resolved storefronts for multi-location brands (API attaches via resolveBusinessLocations).
   * When missing, client falls back to the same shared resolver.
   */
  locations?: BusinessLocation[];
  isNew: boolean;
  /** OPEN (default) | CLOSED  -  closed places are not returned by public directory list. */
  status?: string;
  /** YYYY-MM-DD when status is CLOSED. */
  closedAt?: string | null;
  /** Verified doors-open day (YYYY-MM-DD). Only this drives Grand Opening UI. */
  grandOpeningDate?: string | null;
  createdAt?: string;
  ownerId?: number | null;
  isOwner?: boolean;
  isFollowing?: boolean;
  followerCount?: number;
  upcomingEvents?: DirectoryEventSummary[];
  /** Past nights at this venue (incl. Tucker archive for Sanctuary / Eagle). */
  pastEvents?: DirectoryEventSummary[];
  canEditVenue?: boolean;
  promoters?: DirectoryPromoter[];
  spotted?: DirectorySpotted[];
  gigs?: DirectoryGig[];
};

export type DirectoryPromoter = { id: number; username: string; displayName: string | null };
export type DirectorySpotted = { id: number; title: string; body: string; createdAt: string };
export type DirectoryGig = { id: number; title: string; postType: string; createdAt: string };

export { TYPE_LABELS, TYPE_COLORS };

/** Preferred chip order (design handoff). Extras from data append after. */
const NEIGHBORHOOD_ORDER = [
  "ALL",
  "Downtown",
  "Old Town",
  "Pearl",
  "NW",
  "N",
  "NE",
  "Alberta",
  "Inner East",
  "Central Eastside",
  "SE",
  "Montavilla",
  "Multiple",
  "SW",
  "Hawthorne",
  "Belmont",
  "Division",
  "Mississippi",
  "Alberta Arts District",
];

/** Collapse spelling variants in filters; keep the listing's original location text. */
function browseNeighborhood(value?: string | null): string {
  const raw = (value || "").trim();
  const area = raw.match(/^(NE|NW|SE|SW|N)\b/i)?.[1]?.toUpperCase();
  if (area) return area;
  if (/^Alberta(?: Arts District)?$/i.test(raw)) return "Alberta";
  if (/online|national/i.test(raw)) return "Online / national";
  return raw;
}


/** Group records power Z/ communities and QSearch, but are not public PLACEZ. */
const CATEGORY_ORDER = Object.keys(TYPE_LABELS).filter(key => key !== "group");

/** Session keys so closing a place card does not dump you at top of page. */
const DIR_SCROLL_KEY = "zaylist.directory.scrollY";

function rememberDirectoryScroll() {
  try {
    sessionStorage.setItem(DIR_SCROLL_KEY, String(window.scrollY || 0));
  } catch {
    /* ignore */
  }
}

function consumeDirectoryScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(DIR_SCROLL_KEY);
    if (raw == null) return null;
    sessionStorage.removeItem(DIR_SCROLL_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

type DirectoryProps = {
  surface?: "directory" | "spaces";
  /** Wouter supplies params when Directory is mounted through component=. */
  params?: Record<string, string | undefined>;
};

export default function Directory({ surface = "directory" }: DirectoryProps) {
  const isSpaces = surface === "spaces";
  const [directoryRouteMatch, directoryRouteParams] = useRoute("/directory/:id/:slug?");
  const [spacesRouteMatch, spacesRouteParams] = useRoute("/z/squadz/:id/:slug?");
  const [, setLocation] = useLocation();
  const routeMatch = isSpaces ? spacesRouteMatch : directoryRouteMatch;
  const routeParams = isSpaces ? spacesRouteParams : directoryRouteParams;
  const routePlaceId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const boardPath = isSpaces ? "/z/squadz" : "/directory";
  const listingPath = useCallback(
    (biz: Pick<Business, "id" | "name">) => isSpaces
      ? `${boardPath}/${biz.id}/${slugifyPlaceName(biz.name)}`
      : placePath(biz.id, biz.name),
    [boardPath, isSpaces],
  );

  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(() => new URLSearchParams(window.location.search).get("add") === "1");
  const [activeType, setActiveType] = useState(() => {
    if (isSpaces) return "group";
    const t = new URLSearchParams(window.location.search).get("type");
    return t && t !== "group" && t in TYPE_LABELS ? t : "ALL";
  });
  const [activeNeighborhood, setActiveNeighborhood] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [selectedPlace, setSelectedPlace] = useState<Business | null>(null);
  const [placeOriginRect, setPlaceOriginRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const restoreScrollOnce = useRef(false);

  const recordRecentView = useCallback((biz: Business) => {
    const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || null;
    pushDirectoryRecent({
      id: biz.id,
      name: biz.name,
      type: biz.type,
      logoUrl,
    });
  }, []);

  const { data: businesses = [], isLoading, isError } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const visibleBusinesses = useMemo(
    () => businesses.filter(b => isSpaces ? b.type === "group" : b.type !== "group"),
    [businesses, isSpaces],
  );

  /** Keep type/q on the place URL so remount from /directory → /directory/:id doesn't wipe filters. */
  const directoryQuerySuffix = useCallback(() => {
    const params = new URLSearchParams();
    if (!isSpaces && activeType !== "ALL") params.set("type", activeType);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    const incomingFrom = new URLSearchParams(window.location.search).get("from") ?? "";
    if (/^\/(z|directory)(\/|\?|$)/.test(incomingFrom) && !incomingFrom.startsWith("//")) {
      params.set("from", incomingFrom);
    }
    const next = params.toString();
    return next ? `?${next}` : "";
  }, [activeType, isSpaces, searchQuery]);

  const openPlace = useCallback(
    (biz: Business, originEl?: HTMLElement | null) => {
      if (originEl) {
        const r = originEl.getBoundingClientRect();
        setPlaceOriginRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
      } else {
        setPlaceOriginRect(null);
      }
      recordRecentView(biz);
      setSelectedPlace(biz);
      rememberDirectoryScroll();
      setLocation(`${listingPath(biz)}${directoryQuerySuffix()}`);
    },
    [setLocation, directoryQuerySuffix, listingPath, recordRecentView],
  );

  const closePlace = useCallback(() => {
    setSelectedPlace(null);
    setPlaceOriginRect(null);
    const from = new URLSearchParams(window.location.search).get("from") ?? "";
    const safeFrom = /^\/(z|directory)(\/|\?|$)/.test(from) && !from.startsWith("//");
    setLocation(safeFrom ? from : `${boardPath}${directoryQuerySuffix()}`);
  }, [setLocation, boardPath, directoryQuerySuffix]);

  // After closing a place (or remounting on the list), put scroll back where the user was.
  useEffect(() => {
    if (routePlaceId) {
      restoreScrollOnce.current = false;
      return;
    }
    if (restoreScrollOnce.current) return;
    const y = consumeDirectoryScroll();
    if (y == null) return;
    restoreScrollOnce.current = true;
    const t = window.setTimeout(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    }, 40);
    return () => window.clearTimeout(t);
  }, [routePlaceId]);

  // Deep link: /directory/:id/:slug or legacy ?place= - open when present, clear when gone (browser back).
  useEffect(() => {
    if (!businesses.length) return;
    const queryPlaceId = Number(new URLSearchParams(window.location.search).get("place"));
    const placeId = routePlaceId || (Number.isFinite(queryPlaceId) && queryPlaceId > 0 ? queryPlaceId : null);
    if (!placeId) {
      setSelectedPlace(null);
      setPlaceOriginRect(null);
      return;
    }
    const sourceBusiness = businesses.find(b => b.id === placeId);
    if (!isSpaces && sourceBusiness?.type === "group") {
      setSelectedPlace(null);
      setPlaceOriginRect(null);
      setLocation("/z");
      return;
    }
    const match = visibleBusinesses.find(b => b.id === placeId);
    if (!match) {
      setSelectedPlace(null);
      setPlaceOriginRect(null);
      return;
    }
    setSelectedPlace(match);
    recordRecentView(match);
    // Canonicalize legacy ?place= to /directory/:id/:slug (keep type/q query).
    if (!routePlaceId) {
      const qs = window.location.search || "";
      setLocation(`${listingPath(match)}${qs}`);
    }
  }, [businesses, isSpaces, visibleBusinesses, listingPath, routePlaceId, setLocation, recordRecentView]);

  const placeSeo = selectedPlace;
  usePageSeo(
    placeSeo
      ? `${placeSeo.name} | ${isSpaces ? "MY SQUADZ" : "OUR PLACEZ"} | Zaylist`
      : isSpaces ? "MY SQUADZ | Zaylist" : "OUR PLACEZ | Zaylist",
    placeSeo
      ? [
          placeSeo.neighborhood,
          TYPE_LABELS[placeSeo.type] || placeSeo.type,
          placeSeo.description,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 160) || `${placeSeo.name} on Zaylist.`
      : isSpaces
        ? "Queer clubs, crews, nonprofits, and community groups in Portland."
        : "Bars, restaurants, cafes, venues, and services that are ours - or truly for us - in Portland.",
    placeSeo
      ? {
          url: placeUrl(placeSeo.id, placeSeo.name),
          image: `https://www.zaylist.com/api/og/place/${placeSeo.id}`,
          imageAlt: placeSeo.name,
          type: "article",
        }
      : undefined,
  );

  const categoryCounts = useMemo(() => {
    return visibleBusinesses.reduce<Record<string, number>>((acc, b) => {
      acc[b.type] = (acc[b.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [visibleBusinesses]);

  const categoryBands = useMemo(() => {
    return CATEGORY_ORDER
      .map(key => ({
        key,
        label: TYPE_LABELS[key],
        color: TYPE_COLORS[key],
        count: categoryCounts[key] ?? 0,
      }))
      .filter(c => c.count > 0);
  }, [categoryCounts]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleBusinesses
      .filter(b => {
        if (activeType !== "ALL" && b.type !== activeType) return false;
        if (activeNeighborhood !== "ALL" && browseNeighborhood(b.neighborhood) !== browseNeighborhood(activeNeighborhood)) return false;
        if (q) {
          const haystack = [
            b.name,
            TYPE_LABELS[b.type] || b.type,
            b.type,
            b.description,
            b.address,
            b.neighborhood,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Queer-owned first, then verified grand openings, then A–Z.
        const aQo = a.queerOwned ? 1 : 0;
        const bQo = b.queerOwned ? 1 : 0;
        if (bQo !== aQo) return bQo - aQo;
        const aGo = isGrandOpeningActive(a.grandOpeningDate) ? 1 : 0;
        const bGo = isGrandOpeningActive(b.grandOpeningDate) ? 1 : 0;
        if (bGo !== aGo) return bGo - aGo;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [visibleBusinesses, activeType, activeNeighborhood, searchQuery]);

  const neighborhoodsInUse = useMemo(() => {
    const seen = new Set(
      visibleBusinesses
        .filter(b => activeType === "ALL" || b.type === activeType)
        .map(b => browseNeighborhood(b.neighborhood))
        .filter((n): n is string => Boolean(n)),
    );
    const ordered = NEIGHBORHOOD_ORDER.filter(n => n === "ALL" || seen.has(n));
    const extras = [...seen]
      .filter(n => !NEIGHBORHOOD_ORDER.includes(n))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return [...ordered, ...extras];
  }, [activeType, visibleBusinesses]);

  const handleSelectCategory = (key: string) => {
    setActiveType(key);
    setActiveNeighborhood("ALL");
    setSelectedPlace(null);
  };

  const openAddForm = () => {
    if (!user) { setShowAuth(true); return; }
    setFormOpen(true);
  };
  useEffect(() => {
    if (!formOpen) return;
    const timer=window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return ()=>window.clearTimeout(timer);
  }, [formOpen]);

  const resultLine = isLoading
    ? "Loading…"
    : `${filtered.length} ${isSpaces ? (filtered.length === 1 ? "squad" : "squadz") : (filtered.length === 1 ? "PLACE" : "PLACEZ")}`;

  return (
    <div className={`zine-page directory-page board-page board-page--makeover directory-page--v2${isSpaces ? " directory-page--spaces" : ""}`}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <header className="directory-browser-header">
        <div className="directory-browser-header__identity">
          <img
            className="directory-browser-header__wordmark"
            src={isSpaces ? "/brand/family/my-squadz.svg" : "/brand/family/our-placez.svg"}
            alt={isSpaces ? "MY SQUADZ" : "OUR PLACEZ"}
            decoding="async"
          />
          <p className="directory-browser-header__lede">
            {isSpaces
              ? "Find queer clubs, crews, nonprofits, and community groups across Portland."
              : "Find Portland bars, food, shops, services, care, and spaces that are ours or truly for us."}
          </p>
        </div>

        <div className="directory-browser-search pdx-glass-card pdx-glass-rebind">
          <label className="directory-browser-search__field">
            <span>Search {isSpaces ? "MY SQUADZ" : "OUR PLACEZ"}</span>
            <SearchInput
              id="directory-search"
              aria-label={isSpaces ? "Search MY SQUADZ" : "Search OUR PLACEZ"}
              placeholder={isSpaces ? "Name, group, or keyword" : "Search by name, category, neighborhood, or what you need"}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              data-testid="directory-search"
            />
          </label>

          <div className="directory-browser-search__filters">
            {!isSpaces && (
              <label className="directory-browser-search__select">
                <span>Category</span>
                <select
                  value={activeType}
                  onChange={e => handleSelectCategory(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="ALL">All categories</option>
                  {categoryBands.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="directory-browser-search__select">
              <span>Neighborhood</span>
              <select
                value={activeNeighborhood}
                onChange={e => setActiveNeighborhood(e.target.value)}
                aria-label="Filter by neighborhood"
              >
                {neighborhoodsInUse.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood === "ALL" ? "Anywhere in Portland" : neighborhood}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="solid" accent="yellow" size="md" onClick={openAddForm} data-testid="directory-top-add">
              <Plus size={15} /> {isSpaces ? "Add a squad" : "Add a place"}
            </Button>
          </div>
        </div>

        {!isSpaces && (
          <div className="directory-browser-categories" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`directory-browser-category${activeType === "ALL" ? " directory-browser-category--active" : ""}`}
              style={{ ["--_c" as string]: "#19e3ff" }}
              aria-pressed={activeType === "ALL"}
              onClick={() => handleSelectCategory("ALL")}
            >
              <span>All</span>
              <strong>{visibleBusinesses.length}</strong>
            </button>
            {categoryBands.map(category => (
              <button
                key={category.key}
                type="button"
                className={`directory-browser-category${activeType === category.key ? " directory-browser-category--active" : ""}`}
                style={{ ["--_c" as string]: category.color }}
                aria-pressed={activeType === category.key}
                onClick={() => handleSelectCategory(category.key)}
              >
                <span>{category.label}</span>
                <strong>{category.count}</strong>
              </button>
            ))}
          </div>
        )}
      </header>

      {formOpen && <ScrollReveal><DirectoryAddPlaceForm isSpaces={isSpaces} onClose={()=>setFormOpen(false)}/></ScrollReveal>}

      <section id="directory-results" className="directory-browser-results" aria-label={isSpaces ? "MY SQUADZ" : "PLACEZ"}>
        <div className="directory-browser-results__head">
          <div>
            <p className="directory-browser-results__eyebrow">Browse Portland</p>
            <h2 className="directory-browser-results__title">
              {activeType === "ALL" ? (isSpaces ? "All squadz" : "All PLACEZ") : TYPE_LABELS[activeType]}
            </h2>
          </div>
          <div className="directory-browser-results__status">
            <span data-testid="directory-result-count">{resultLine}</span>
            {(searchQuery || activeType !== "ALL" || activeNeighborhood !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  handleSelectCategory(isSpaces ? "group" : "ALL");
                  setActiveNeighborhood("ALL");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <BoardLoadingState label="Loading directory" />
        ) : isError ? (
          <div className="directory-inline-error">Could not load directory.</div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype directory-browser-results__empty">
            <p className="display section-heading">Nothing matches</p>
            <p className="board-copy-sm">
              {isSpaces
                ? "Try a broader search. If a squad is missing, add it for the next person."
                : "Try a broader search or clear the filters. If a place is missing, add it for the next person."}
            </p>
            <button type="button" className="btn-neon magenta pdx-glass-rebind" onClick={openAddForm} style={{ marginTop: 16 }}>
              <Plus size={16} /> {isSpaces ? "Add a squad" : "Add a place"}
            </button>
          </div>
        ) : (
          <div className="directory-browser-grid">
            {filtered.map(biz => (
              <DirectoryCard
                key={biz.id}
                biz={biz}
                onClick={(el) => openPlace(biz, el)}
                onRequireAuth={() => setShowAuth(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add-a-place band */}
      <section
        className="directory-add-band pdx-glass pdx-glass-rebind"
        style={{ ["--_c" as string]: "var(--neon-yellow, #ccff00)" }}
        aria-label="Add a place"
      >
        <div className="directory-add-band__copy">
          <p className="directory-add-band__title">{isSpaces ? "Is your squad on Zaylist?" : "Is your place on Zaylist?"}</p>
          <p className="directory-add-band__lede">
            {isSpaces ? "Members can list queer clubs, crews, nonprofits, and community groups. Organizers can claim a listing and keep it current." : "Members can list spots that are ours or truly for us. Owners can claim a listing and keep the hours honest."}
          </p>
        </div>
        <Button variant="solid" accent="yellow" size="lg" arrow onClick={openAddForm} data-testid="directory-add-place">
          {isSpaces ? "Add a squad" : "Add a place"}
        </Button>
      </section>

      {selectedPlace && (
        <PlaceModal
          key={selectedPlace.id}
          place={selectedPlace}
          originRect={placeOriginRect}
          onClose={closePlace}
          onRequireAuth={() => setShowAuth(true)}
        />
      )}
    </div>
  );
}

export function formatDirectoryEventWhen(event: DirectoryEventSummary) {
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

export const TYPE_TO_DS_CATEGORY: Record<string, string> = {
  bar: "bars",
  restaurant: "food",
  cafe: "cafes",
  venue: "venues",
  service: "services",
  shop: "shops",
  hotel: "hotels",
  nonprofit: "services",
  healthcare: "healthcare",
  realestate: "realestate",
  group: "groups",
  campground: "campgrounds",
};

/** Image-led directory tile adapted from the approved PlaceCard primitive. */
function DirectoryCard({
  biz,
  onClick,
  onRequireAuth,
}: {
  biz: Business;
  onClick?: (el: HTMLElement) => void;
  onRequireAuth?: () => void;
}) {
  const upcomingEvents = biz.upcomingEvents ?? [];
  const locations =
    Array.isArray(biz.locations) && biz.locations.length > 0
      ? biz.locations
      : resolveBusinessLocations(biz);
  const multiLoc = locations.length > 1;
  // Multi-loc cards: neighborhood + "N locations" instead of dumping one address.
  const address = multiLoc
    ? [biz.neighborhood, `${locations.length} locations`].filter(Boolean).join(" · ") ||
      `${locations.length} locations`
    : [biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined;
  const isNonprofit = biz.type === "nonprofit";
  const grandOpening = isGrandOpeningActive(biz.grandOpeningDate);
  const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || undefined;
  const fallbackLogoUrl = directoryFallbackLogo(biz.type);
  return (
    <PlaceCard
      name={biz.name}
      variant="full"
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        onClick?.(e.currentTarget);
      }}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className="pdxPlace--clickable pdx-glass-rebind"
      isNonprofit={isNonprofit}
      logoUrl={logoUrl}
      fallbackLogoUrl={fallbackLogoUrl}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={address}
      description={biz.description}
      hours={multiLoc ? undefined : biz.hours || undefined}
      phone={multiLoc ? undefined : biz.phone || undefined}
      website={biz.website || undefined}
      instagram={biz.instagram || undefined}
      donateUrl={biz.donateUrl || undefined}
      lat={multiLoc ? null : biz.lat}
      lng={multiLoc ? null : biz.lng}
      grandOpening={grandOpening}
      businessId={biz.id}
      isFollowing={Boolean(biz.isFollowing)}
      onRequireAuth={onRequireAuth}
      promoters={biz.promoters || []}
      events={upcomingEvents.map(event => ({
        day: event.dayOfWeek || undefined,
        date: formatDirectoryEventWhen(event),
        title: event.title,
        href: eventPath(event.id, event.title, event.dayOfWeek),
      }))}
    />
  );
}
