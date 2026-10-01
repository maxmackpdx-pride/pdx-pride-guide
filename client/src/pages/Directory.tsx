import BoardShareButton from "@/components/BoardShareButton";
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { ResourceFilterButton } from '@/components/resources/ResourceFilterButton';
import { PLACE_ACCENTS as TYPE_COLORS } from '@/components/discovery/placeTokens';
import PlaceDiscoveryCard from '@/components/discovery/PlaceDiscoveryCard';
import { ResourceRail } from '@/components/resources/ResourceRail';
import { useTheme } from '@/context/ThemeContext';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import BrowseStatus from "@/components/BrowseStatus";
import BrowseToolbar from "@/components/BrowseToolbar";
import FilterSurvey from "@/components/FilterSurvey";
import SectionBreadcrumb from "@/components/SectionBreadcrumb";
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
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
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
  const [placeIntent, setPlaceIntent] = useState(false);
  const [discoveryChosen, setDiscoveryChosen] = useState(() => /[?&](type|category|neighborhood|q|place)=/.test(window.location.search));
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(() => new URLSearchParams(window.location.search).get("add") === "1");
  const [activeType, setActiveType] = useState(() => {
    if (isSpaces) return "group";
    const t = new URLSearchParams(window.location.search).get("type");
    return t?.split(",").filter(type => type !== "group" && type in TYPE_LABELS).join(",") || "ALL";
  });
  const [activeNeighborhood, setActiveNeighborhood] = useState(() => new URLSearchParams(window.location.search).get("neighborhood") || "ALL");
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

  const { data: businesses = [], isLoading, isError, refetch } = useQuery<Business[]>({
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
    if (activeNeighborhood !== "ALL") params.set("neighborhood", activeNeighborhood);
    if (formOpen) params.set("add", "1");
    const incomingFrom = new URLSearchParams(window.location.search).get("from") ?? "";
    if (/^\/(z|directory)(\/|\?|$)/.test(incomingFrom) && !incomingFrom.startsWith("//")) {
      params.set("from", incomingFrom);
    }
    const next = params.toString();
    return next ? `?${next}` : "";
  }, [activeType, isSpaces, searchQuery, activeNeighborhood, formOpen]);

  useEffect(() => {
    if (routePlaceId || new URLSearchParams(window.location.search).has("place")) return;
    const suffix = directoryQuerySuffix();
    const target = boardPath + suffix;
    if (window.location.pathname + window.location.search !== target) window.history.replaceState(window.history.state, "", target);
  }, [routePlaceId, boardPath, directoryQuerySuffix]);
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      setActiveType(isSpaces ? "group" : type && type !== "group" && type in TYPE_LABELS ? type : "ALL");
      setSearchQuery(params.get("q") || "");
      setActiveNeighborhood(params.get("neighborhood") || "ALL");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [isSpaces]);

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
    return (isSpaces ? ["group"] : CATEGORY_ORDER)
      .map(key => ({
        key,
        label: TYPE_LABELS[key],
        color: TYPE_COLORS[key],
        count: categoryCounts[key] ?? 0,
      }))
      .filter(c => c.count > 0);
  }, [categoryCounts, isSpaces]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleBusinesses
      .filter(b => {
        if (activeType !== "ALL" && !activeType.split(",").includes(b.type)) return false;
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
        .filter(b => activeType === "ALL" || activeType.split(",").includes(b.type))
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
    setDiscoveryChosen(true);
    setActiveType(current => {
      if (key === "ALL" || isSpaces) return key;
      const selected = current === "ALL" ? [] : current.split(",");
      const next = selected.includes(key) ? selected.filter(type => type !== key) : [...selected, key];
      return next.join(",") || "ALL";
    });
    setActiveNeighborhood("ALL");
    setSelectedPlace(null);
  };

  const openAddForm = () => {
    if (!user) { setShowAuth(true); return; }
    setFormOpen(true);
  };


  const resultLine = isError ? "Results unavailable" : isLoading
    ? "Loading…"
    : `${filtered.length} ${isSpaces ? (filtered.length === 1 ? "squad" : "squadz") : (filtered.length === 1 ? "PLACE" : "PLACEZ")}`;

  const { calmMode } = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <div className={`zine-page directory-page board-page board-page--makeover directory-page--v2 resources-page${isSpaces ? " directory-page--spaces" : ""}`}>
      <WebGLShader direction={-1} waveSpeed={0.7} />
      <svg className="placez-shader-contours" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path className="placez-shader-contours__cyan" d="M1080 185 C790 350 710 295 500 220 S165 75 -80 310" />
        <path className="placez-shader-contours__magenta" d="M1080 360 C795 165 670 225 470 375 S165 580 -80 370" />
        <path className="placez-shader-contours__yellow" d="M1080 420 C785 225 680 285 470 425 S165 635 -80 430" />
      </svg>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <motion.header initial={{ opacity: 0, y: calmMode || reducedMotion ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: calmMode || reducedMotion ? 0 : .4 }} className="directory-browser-header">
        <div className="placez-reference-intro rg-intro rg-wrap">
          <div className="rg-intro-top"><span className="rg-eyebrow">{isSpaces ? "MY SQUADZ / FIND YOUR PEOPLE" : "PLACEZ / FIND YOUR PLACE"}</span></div>
          <h1 className="rg-board-logo-frame placez-reference-logo"><img src={isSpaces ? "/brand/family/my-squadz.svg" : "/brand/family/our-placez.svg"} alt={isSpaces ? "My Squadz" : "Our Placez"} /></h1>
          <div className="rg-intro-actions">
            <BoardShareButton title={isSpaces ? "My Squadz" : "Placez"} path={isSpaces ? "/spaces" : "/directory"} />
            <a className="placez-reference-map" href="/map?layer=places">Explore on Mapz ↗</a>
          </div>
        </div>
        <section className="rg-layout rg-wrap placez-reference-start">
          <div className="rg-controls"><div className="rg-step rg-step--intent"><div>
            <span className="rg-eyebrow"><span className="rg-step-number" aria-hidden="true">01</span>Start here</span>
            <h2>What do you need?</h2>
            <LayoutGroup id="placez-intent"><div className="rg-mode rg-mode--animated pdx-glass-rebind">
              <button type="button" aria-pressed={placeIntent && !formOpen} onClick={()=>{setPlaceIntent(true);setFormOpen(false);}}>
                {placeIntent && !formOpen && <motion.span className="rg-mode-highlight" layoutId={calmMode || reducedMotion ? undefined : "placez-mode"} transition={{type:"spring",bounce:0,duration:.25}}/>}
                <span className="rg-mode-label">Find a place</span>
              </button>
              <button type="button" aria-pressed={formOpen} onClick={openAddForm}>
                {formOpen && <motion.span className="rg-mode-highlight" layoutId={calmMode || reducedMotion ? undefined : "placez-mode"} transition={{type:"spring",bounce:0,duration:.25}}/>}
                <span className="rg-mode-label">Add a place</span>
              </button>
            </div></LayoutGroup>
            <button type="button" className="discovery-skip" onClick={()=>{setPlaceIntent(true);handleSelectCategory("ALL");}}>Skip to view all</button>
          </div></div></div>
        </section>
        <AnimatePresence initial={false}>{(placeIntent || formOpen || discoveryChosen) && <motion.div key="placez-choices" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:calmMode || reducedMotion ? 0 : .24}}>
        {formOpen ? <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}><DirectoryAddPlaceForm isSpaces={isSpaces} onClose={()=>setFormOpen(false)}/></motion.div> : <FilterSurvey eyebrow="Choose your places" startStep={2} description="Pick one or more categories. Your places appear below. Choose All Placez to browse everything." detailsLabel="Search by name or neighborhood" selectedValues={isSpaces ? undefined : activeType.split(",")} label={isSpaces ? "My Squadz" : "Placez"} question={isSpaces ? "Where is your community?" : "Which places would you like to explore?"} value={isSpaces ? activeNeighborhood : activeType} onChange={value => { if (value === "ADD") { openAddForm(); return; } if (isSpaces) { setActiveNeighborhood(value); setDiscoveryChosen(true); } else handleSelectCategory(value); }} accent="var(--panel-cyan)" options={isSpaces ? neighborhoodsInUse.map(value=>({value,label:value === "ALL" ? "All areas" : value})) : [{value:"ALL",label:"All Placez",count:visibleBusinesses.length},...categoryBands.map(category=>({value:category.key,label:category.label,color:category.color,count:category.count,description:({bar:"Find your next night out",restaurant:"Sit down for something good",cafe:"Coffee and a place to pause",venue:"Shows, stages, and gathering spaces",shop:"Shop small and local",service:"Find help from local pros",healthcare:"Find care that fits you",nonprofit:"Connect with community support",realestate:"Find your next home",campground:"Make room for an adventure",hotel:"Find somewhere to stay"} as Record<string,string>)[category.key]})),{value:"ADD",label:"Add a place",description:"Share a place with your community",color:"var(--neon-yellow)"}]}>
        <BrowseToolbar label="Search and filter places" className="directory-browser-search pdx-glass-card pdx-glass-rebind">
          <label className="directory-browser-search__field">
            <span>Search {isSpaces ? "MY SQUADZ" : "OUR PLACEZ"}</span>
            <SearchInput
              id="directory-search"
              aria-label={isSpaces ? "Search MY SQUADZ" : "Search OUR PLACEZ"}
              placeholder={isSpaces ? "Name, group, or keyword" : "Search by name, category, neighborhood, or what you need"}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setDiscoveryChosen(true); }}
              onClear={() => setSearchQuery("")}
              data-testid="directory-search"
            />
          </label>

          <div className="directory-browser-search__filters">
            <label className="directory-browser-search__select">
              <span>Neighborhood</span>
              <select
                value={activeNeighborhood}
                onChange={e => { setActiveNeighborhood(e.target.value); setDiscoveryChosen(true); }}
                aria-label="Filter by neighborhood"
              >
                {neighborhoodsInUse.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood === "ALL" ? "Anywhere in Portland" : neighborhood}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </BrowseToolbar>
        </FilterSurvey>}
        </motion.div>}</AnimatePresence>

        {discoveryChosen && !isSpaces && (
          <div className="directory-browser-categories" role="group" aria-label="Filter by category">
            <ResourceFilterButton quietMotion={Boolean(calmMode || reducedMotion)}
              type="button"
              className={`directory-browser-category${activeType === "ALL" ? " directory-browser-category--active" : ""}`}
              style={{ ["--_c" as string]: "var(--neon-cyan)" }}
              aria-pressed={activeType === "ALL"}
              onClick={() => handleSelectCategory("ALL")}
            >
              <span>All</span>
              <strong>{visibleBusinesses.length}</strong>
            </ResourceFilterButton>
            {categoryBands.map(category => (
              <ResourceFilterButton quietMotion={Boolean(calmMode || reducedMotion)}
                key={category.key}
                type="button"
                className={`directory-browser-category${activeType.split(",").includes(category.key) ? " directory-browser-category--active" : ""}`}
                style={{ ["--_c" as string]: category.color }}
                aria-pressed={activeType.split(",").includes(category.key)}
                onClick={() => handleSelectCategory(category.key)}
              >
                <span>{category.label}</span>
                <strong>{category.count}</strong>
              </ResourceFilterButton>
            ))}
          </div>
        )}




      <motion.section key={discoveryChosen ? "revealed" : "hidden"} hidden={!discoveryChosen} initial={{ opacity: 0, y: calmMode || reducedMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: calmMode || reducedMotion ? 0 : .4 }} id="directory-results" className="directory-browser-results" aria-label={isSpaces ? "MY SQUADZ" : "PLACEZ"}>
        <div className="directory-browser-results__head">
          <div>
            <p className="directory-browser-results__eyebrow">Browse Portland</p>
            <h2 className="directory-browser-results__title">
              {activeType === "ALL" ? (isSpaces ? "All squadz" : "All PLACEZ") : activeType.split(",").map(type => TYPE_LABELS[type]).join(" + ")}
            </h2>
          </div>
          <div className="directory-browser-results__status">
            <span role="status" data-testid="directory-result-count">{resultLine}</span>
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
          <BrowseStatus error title="Places couldn’t load" description="Your filters are still here. Try loading the directory again." onAction={() => void refetch()} />
        ) : filtered.length === 0 ? (
          <BrowseStatus title={visibleBusinesses.length ? "No places match your filters" : "No places listed yet"} description="Try a broader search or add a place for the next person." actionLabel="Clear filters" onAction={() => { setSearchQuery(""); setActiveType(isSpaces ? "group" : "ALL"); setActiveNeighborhood("ALL"); }}>
            <Button variant="solid" accent="cyan" onClick={openAddForm}><Plus size={16} /> {isSpaces ? "Add a squad" : "Add a place"}</Button>
          </BrowseStatus>
        ) : (
          <div className="placez-resource-rails">
            {(activeType === 'ALL' ? categoryBands : categoryBands.filter(category=>activeType.split(",").includes(category.key))).map(category => {
              const places = filtered.filter(place=>place.type===category.key);
              if (!places.length) return null;
              return <ResourceRail room={isSpaces ? "Squadz" : "Placez"} itemName={isSpaces ? "squad" : "place"} key={category.key} id={`placez-${category.key}`} title={category.label} color={TYPE_COLORS[category.key] || 'var(--neon-cyan)'} count={places.length} quiet={Boolean(calmMode || reducedMotion)}>
                {places.map(biz=><div className="rg-card-reveal" dir="ltr" key={biz.id}><DirectoryCard biz={biz} onClick={el=>openPlace(biz,el)} onRequireAuth={()=>setShowAuth(true)}/></div>)}
              </ResourceRail>;
            })}
          </div>
        )}
      </motion.section>

      </motion.header>
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
  return <PlaceDiscoveryCard place={biz} onOpen={element => onClick?.(element)} onRequireAuth={onRequireAuth} />;
}
