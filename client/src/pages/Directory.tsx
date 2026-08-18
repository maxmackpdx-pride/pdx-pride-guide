import type React from "react";
import { useState, useMemo, Suspense, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DirectoryHero from "@/components/DirectoryHero";
import ZBoardAddressStrip from "@/components/ZBoardAddressStrip";
import AuthModal from "@/components/AuthModal";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import CountUpValue from "@/components/CountUpValue";
import { Plus, X } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { placePath, placeUrl, slugifyPlaceName } from "@shared/placeSlug";
import { Button, FilterChip, PlaceCard, SearchInput } from "@/components/ds";
import { parsePacificDateTime } from "@shared/missedConnections";
import { isGrandOpeningActive } from "@shared/grandOpening";
import type { BusinessLocation } from "@shared/businessLocations";
import { resolveBusinessLocations } from "@shared/businessLocations";
import {
  DIRECTORY_TYPE_COLORS as TYPE_COLORS,
  DIRECTORY_TYPE_LABELS as TYPE_LABELS,
} from "@shared/directoryTheme";

import { lazyWithReload } from "@/lib/lazyWithReload";
import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";
import {
  pushDirectoryRecent,
} from "@/lib/directoryRecent";
import PlaceModal from "@/components/PlaceModal";
import "./Directory.css";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

/** Full-width map height per design handoff (~560px). */
const DIRECTORY_MAP_HEIGHT = 560;

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

const FORM_NEIGHBORHOODS = NEIGHBORHOOD_ORDER.filter(n => n !== "ALL");

const CATEGORY_ORDER = Object.keys(TYPE_LABELS);

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

const blankDirectoryForm = (type = "bar") => ({
  name: "",
  type,
  description: "",
  address: "",
  neighborhood: "SE",
  website: "",
  instagram: "",
  hours: "",
  phone: "",
  queerOwned: false,
  queerFriendly: true,
});

type DirectoryFormState = ReturnType<typeof blankDirectoryForm>;

type DirectoryMatchPreview = {
  businessId: number;
  name: string;
  type: string;
  address: string | null;
  neighborhood: string | null;
  confidence: string;
  reasons: string[];
};

type DirectorySubmitResult = {
  title: string;
  desc: string;
  heldForReview?: boolean;
  potentialMatches?: DirectoryMatchPreview[];
};

function directoryMergePayload(form: DirectoryFormState) {
  return {
    description: form.description,
    hours: form.hours || null,
    phone: form.phone || null,
    website: form.website || null,
    instagram: form.instagram || null,
    neighborhood: form.neighborhood || null,
    queerOwned: form.queerOwned,
    queerFriendly: form.queerFriendly,
  };
}

type DirectoryProps = {
  surface?: "directory" | "spaces";
  /** Wouter supplies params when Directory is mounted through component=. */
  params?: Record<string, string | undefined>;
};

export default function Directory({ surface = "directory" }: DirectoryProps) {
  const isSpaces = surface === "spaces";
  const [directoryRouteMatch, directoryRouteParams] = useRoute("/directory/:id/:slug?");
  const [spacesRouteMatch, spacesRouteParams] = useRoute("/z/spaces/:id/:slug?");
  const [, setLocation] = useLocation();
  const routeMatch = isSpaces ? spacesRouteMatch : directoryRouteMatch;
  const routeParams = isSpaces ? spacesRouteParams : directoryRouteParams;
  const routePlaceId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;
  const boardPath = isSpaces ? "/z/spaces" : "/directory";
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
  const [form, setForm] = useState(() => blankDirectoryForm(isSpaces ? "group" : "bar"));
  const [submitResult, setSubmitResult] = useState<DirectorySubmitResult | null>(null);
  const [claimingBusinessId, setClaimingBusinessId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState(() => {
    if (isSpaces) return "group";
    const t = new URLSearchParams(window.location.search).get("type");
    return t && t in TYPE_LABELS ? t : "ALL";
  });
  const [activeNeighborhood, setActiveNeighborhood] = useState("ALL");
  const [showAllNeighborhoods, setShowAllNeighborhoods] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [selectedPlace, setSelectedPlace] = useState<Business | null>(null);
  const [placeOriginRect, setPlaceOriginRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
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

  /** Keep type/q on the place URL so remount from /directory → /directory/:id doesn't wipe filters. */
  const directoryQuerySuffix = useCallback(() => {
    const params = new URLSearchParams();
    if (!isSpaces && activeType !== "ALL") params.set("type", activeType);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
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
    setLocation(`${boardPath}${directoryQuerySuffix()}`);
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
    const match = businesses.find(b => b.id === placeId && (!isSpaces || b.type === "group"));
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
  }, [businesses, isSpaces, listingPath, routePlaceId, setLocation, recordRecentView]);

  const placeSeo = selectedPlace;
  usePageSeo(
    placeSeo
      ? `${placeSeo.name} | ${isSpaces ? "MY SQUADZ" : "Portland Directory"} | Zaylist`
      : isSpaces ? "MY SQUADZ | Zaylist" : "Portland Directory | Zaylist",
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
    return businesses.reduce<Record<string, number>>((acc, b) => {
      acc[b.type] = (acc[b.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [businesses]);

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
    return businesses
      .filter(b => {
        if (activeType !== "ALL" && b.type !== activeType) return false;
        if (activeNeighborhood !== "ALL" && b.neighborhood !== activeNeighborhood) return false;
        if (q) {
          const haystack = `${b.name} ${b.description || ""} ${b.neighborhood || ""}`.toLowerCase();
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
  }, [businesses, activeType, activeNeighborhood, searchQuery]);

  const neighborhoodsInUse = useMemo(() => {
    const seen = new Set(
      businesses
        .filter(b => activeType === "ALL" || b.type === activeType)
        .map(b => b.neighborhood)
        .filter((n): n is string => Boolean(n)),
    );
    const ordered = NEIGHBORHOOD_ORDER.filter(n => n === "ALL" || seen.has(n));
    const extras = [...seen]
      .filter(n => !NEIGHBORHOOD_ORDER.includes(n))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return [...ordered, ...extras];
  }, [activeType, businesses]);

  const visibleNeighborhoods = useMemo(() => {
    if (showAllNeighborhoods || neighborhoodsInUse.length <= 5) return neighborhoodsInUse;
    const firstRow = neighborhoodsInUse.slice(0, 5);
    return activeNeighborhood !== "ALL" && !firstRow.includes(activeNeighborhood)
      ? [...firstRow, activeNeighborhood]
      : firstRow;
  }, [activeNeighborhood, neighborhoodsInUse, showAllNeighborhoods]);

  const heroStats = useMemo(() => {
    const boardBusinesses = isSpaces ? businesses.filter(b => b.type === "group") : businesses;
    const queerOwned = boardBusinesses.filter(b => b.queerOwned).length;
    const hostingThisWeek = boardBusinesses.filter(b => (b.upcomingEvents?.length ?? 0) > 0).length;
    return [
      { num: boardBusinesses.length, label: isSpaces ? "Squadz listed" : "Places listed", color: "#ff1fa0" },
      { num: queerOwned, label: isSpaces ? "Community-led" : "Queer-owned", color: "#c8fa3c" },
      { num: hostingThisWeek, label: "Hosting this week", color: "#19e3ff" },
    ];
  }, [businesses, isSpaces]);

  const handleSelectCategory = (key: string) => {
    setActiveType(key);
    setSelectedPlace(null);
  };

  const directoryMapFallback = (
    <div style={{ height: DIRECTORY_MAP_HEIGHT, background: "#0a0a0a" }} aria-hidden />
  );

  const createMutation = useMutation({
    mutationFn: async (opts?: { confirmDistinct?: boolean }) => {
      const r = await apiRequest("POST", "/api/directory", {
        ...form,
        confirmDistinct: opts?.confirmDistinct ?? false,
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Could not add place");
      return payload;
    },
    onSuccess: (payload) => {
      const heldForReview = !!payload.heldForReview;
      const potentialMatches: DirectoryMatchPreview[] | undefined = Array.isArray(payload.potentialMatches)
        ? payload.potentialMatches.slice(0, 5).map((match: DirectoryMatchPreview) => ({
          businessId: match.businessId,
          name: match.name,
          type: match.type,
          address: match.address,
          neighborhood: match.neighborhood,
          confidence: match.confidence,
          reasons: match.reasons ?? [],
        }))
        : undefined;

      if (heldForReview) {
        const reason = payload.heldReason
          ? `${payload.heldReason}. Request ownership to merge your updates, or confirm this is a different place.`
          : "We found a similar place already in the directory. Request ownership to merge your updates, or confirm this is a different place.";
        setSubmitResult({
          title: "Possible duplicate",
          desc: reason,
          heldForReview: true,
          potentialMatches,
        });
        toast({ title: "Similar place found", description: "Review the matches below before publishing." });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      const hasMatches = potentialMatches && potentialMatches.length > 0;
      setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
      setSubmitResult({
        title: isSpaces ? "Added to MY SQUADZ" : "Added to directory",
        desc: hasMatches
          ? `Your ${isSpaces ? "squad" : "place"} is live on the map and listings. We also spotted similar listings you may want to double-check.`
          : `Your ${isSpaces ? "squad" : "place"} is live on the map and listings.`,
        potentialMatches: hasMatches ? potentialMatches : undefined,
      });
      toast({
        title: isSpaces ? "Added to MY SQUADZ" : "Added to directory",
        description: `Your ${isSpaces ? "squad" : "place"} is live on the map and listings.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Could not add place", description: err.message, variant: "destructive" });
    },
  });

  const claimMatchMutation = useMutation({
    mutationFn: async ({ businessId, claimReason }: { businessId: number; claimReason: string }) => {
      const r = await apiRequest("POST", `/api/directory/${businessId}/claim`, {
        claimReason,
        pendingMerge: true,
        mergePayload: directoryMergePayload(form),
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Could not submit ownership request");
      return payload;
    },
    onSuccess: () => {
      setClaimingBusinessId(null);
      setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
      setSubmitResult(null);
      setFormOpen(false);
      toast({
        title: "Ownership request sent",
        description: "An admin will review your claim and proposed updates before they go live.",
      });
    },
    onError: (err: Error) => {
      setClaimingBusinessId(null);
      toast({ title: "Could not submit request", description: err.message, variant: "destructive" });
    },
  });

  const openAddForm = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
    setSubmitResult(null);
    setClaimingBusinessId(null);
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const resetDirectoryForm = () => {
    setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
    setSubmitResult(null);
    setClaimingBusinessId(null);
  };

  const requestOwnershipForMatch = (match: DirectoryMatchPreview) => {
    const reason = window.prompt(
      `Tell us how you're connected to ${match.name} (e.g. "I own/manage this venue"):`,
      "",
    );
    if (reason == null) return;
    if (reason.trim().length < 10) {
      toast({ title: "Add a short reason", description: "At least 10 characters so admins can verify your connection.", variant: "destructive" });
      return;
    }
    setClaimingBusinessId(match.businessId);
    claimMatchMutation.mutate({ businessId: match.businessId, claimReason: reason.trim() });
  };

  useEffect(() => {
    if (!formOpen) return;
    window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [formOpen]);

  const submitDirectoryForm = () => {
    if (!form.name.trim()) {
      toast({ title: "Add a name", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Add a description", variant: "destructive" });
      return;
    }
    setSubmitResult(null);
    createMutation.mutate({});
  };

  const publishDespiteMatches = () => {
    createMutation.mutate({ confirmDistinct: true });
  };

  const finishDirectorySubmit = () => {
    resetDirectoryForm();
    setFormOpen(false);
  };

  const resultLine = isLoading
    ? "Loading…"
    : `${filtered.length} ${isSpaces ? "squad" : "place"}${filtered.length === 1 ? "" : isSpaces ? "z" : "s"}`;

  return (
    <div className={`zine-page directory-page board-page board-page--makeover directory-page--v2${isSpaces ? " directory-page--spaces" : ""}`}>
      <ZBoardAddressStrip
        path={isSpaces || activeType === "group" ? "spaces" : "directory"}
        board={isSpaces || activeType === "group" ? "MY SQUADZ" : "OUR PLACEZ"}
      />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <DirectoryHero placeCount={businesses.length} squadz={isSpaces || activeType === "group"} />

      {/* Stats band */}
      <section
        className="directory-stats-band"
        aria-label="Directory totals"
      >
        {heroStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`directory-stats-band__item${i < heroStats.length - 1 ? " directory-stats-band__item--rule" : ""}`}
          >
            <div
              className="directory-stats-band__num"
              style={{
                color: stat.color,
                animationDelay: `${0.3 + i * 0.1}s`,
              }}
            >
              <CountUpValue
                key={stat.num > 0 ? `stat-${stat.label}-ready` : `stat-${stat.label}-pending`}
                value={stat.num}
              />
            </div>
            <div className="directory-stats-band__label">{stat.label}</div>
          </div>
        ))}
      </section>

      {formOpen && (
        <ScrollReveal>
          <section id="directory-form" className="gifting-form-panel gifting-form-panel--makeover directory-form-panel">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">{isSpaces ? "Add a squad" : "Add to the directory"}</h2>
            <p className="board-copy-sm">
              {isSpaces
                ? "Logged-in members can add queer clubs, crews, nonprofits, and community groups. New listings go live immediately unless we spot a likely duplicate. Keep it accurate and scene-rooted. Organizers can claim a listing to manage it."
                : "Logged-in members can list spots that are ours or truly for us - including Clubs & Groups (Rose Court, Pink Ponies, and more). New listings go live immediately unless we spot a likely duplicate. Keep it accurate and scene-rooted. Owners can claim a listing to manage it."}
            </p>
            {submitResult ? (
              <div className="submit-success">
                <div className="submit-success__title">{submitResult.title}</div>
                <p className="submit-success__body" style={{ marginBottom: submitResult.potentialMatches?.length ? 16 : 22 }}>
                  {submitResult.desc}
                </p>
                {submitResult.potentialMatches && submitResult.potentialMatches.length > 0 && (
                  <div style={{ border: "1px solid #444", background: "var(--ink-850)", padding: 14, marginBottom: 22, borderRadius: 3 }}>
                    <p style={{ color: "var(--neon-orange)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                      Similar places on Zaylist
                    </p>
                    <ul style={{ margin: "0 0 14px", paddingLeft: 18, color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {submitResult.potentialMatches.map(match => (
                        <li key={match.businessId} style={{ marginBottom: 10 }}>
                          <span>
                            {match.name}
                            {match.neighborhood ? ` · ${match.neighborhood}` : ""}
                            {match.address ? ` · ${match.address}` : ""}
                            {match.confidence === "high" ? " (likely duplicate)" : ""}
                          </span>
                          {submitResult.heldForReview && (
                            <button
                              type="button"
                              className="btn-neon"
                              style={{ display: "block", marginTop: 6, fontSize: "0.78rem" }}
                              disabled={claimMatchMutation.isPending && claimingBusinessId === match.businessId}
                              onClick={() => requestOwnershipForMatch(match)}
                            >
                              {claimMatchMutation.isPending && claimingBusinessId === match.businessId
                                ? "Submitting…"
                                : "Request ownership & merge updates →"}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {submitResult.heldForReview && (
                      <button
                        type="button"
                        className="btn-neon solid"
                        disabled={createMutation.isPending}
                        onClick={publishDespiteMatches}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {createMutation.isPending ? "Publishing…" : "This is a different place, publish anyway →"}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!submitResult.heldForReview && (
                    <button type="button" className="btn-neon solid" onClick={openAddForm} style={{ width: "100%", justifyContent: "center" }}>
                      Add another place →
                    </button>
                  )}
                  <button type="button" onClick={finishDirectorySubmit} className="submit-hub-link">
                    {submitResult.heldForReview ? "Close" : "Back to directory"}
                  </button>
                </div>
              </div>
            ) : (
            <>
            <div className="gifting-form-grid">
              <label className="span">
                Place name *
                <input className="board-text-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={120} />
              </label>
              {!isSpaces && <label>
                Type *
                <select className="board-text-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>}
              <label>
                Neighborhood
                <select className="board-text-field" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}>
                  {FORM_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="span">
                Description *
                <textarea className="board-text-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} maxLength={2000} />
              </label>
              <label className="span">
                Address
                <input className="board-text-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address helps us pin it on the map" />
              </label>
              <label>
                Hours
                <input className="board-text-field" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. Mon–Sat 4pm–2am" />
              </label>
              <label>
                Phone
                <input className="board-text-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </label>
              <label>
                Website
                <input className="board-text-field" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} type="url" placeholder="https://..." />
              </label>
              <label>
                Instagram
                <input className="board-text-field" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
              </label>
              <label className="span directory-form-checks">
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerOwned} onChange={e => setForm(f => ({ ...f, queerOwned: e.target.checked }))} />
                  Owned by us
                </label>
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerFriendly} onChange={e => setForm(f => ({ ...f, queerFriendly: e.target.checked }))} />
                  For our crowd
                </label>
              </label>
            </div>
            <button type="button" className="btn-neon solid" disabled={createMutation.isPending} onClick={submitDirectoryForm}>
              {createMutation.isPending ? "Adding…" : "Add to directory →"}
            </button>
            </>
            )}
          </section>
        </ScrollReveal>
      )}

      {/* Category band rail */}
      {!isSpaces && <section className="directory-bands" aria-label="Categories">
        <div className="directory-bands__head">
          <h2 className="directory-bands__title">What do you need today?</h2>
          <span className="directory-bands__hint">Tap a band to tune the city</span>
        </div>
        {isLoading ? (
          <BoardLoadingState label="Loading directory" />
        ) : isError ? (
          <div className="directory-inline-error">Could not load directory.</div>
        ) : (
          <div className="directory-bands__rail" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`directory-band pdx-glass pdx-glass-rebind${activeType === "ALL" ? " directory-band--active" : ""}`}
              style={{ ["--_c" as string]: "#19e3ff" }}
              aria-pressed={activeType === "ALL"}
              onClick={() => handleSelectCategory("ALL")}
              data-testid="directory-band-all"
            >
              <span className="directory-band__bar" aria-hidden="true" />
              <span className="directory-band__count">{businesses.length}</span>
              <span className="directory-band__label">All</span>
            </button>
            {categoryBands.map(band => {
              const active = activeType === band.key;
              return (
                <button
                  key={band.key}
                  type="button"
                  className={`directory-band pdx-glass pdx-glass-rebind${active ? " directory-band--active" : ""}`}
                  style={{ ["--_c" as string]: band.color }}
                  aria-pressed={active}
                  onClick={() => handleSelectCategory(band.key)}
                  data-testid={`directory-band-${band.key}`}
                >
                  <span className="directory-band__bar" aria-hidden="true" />
                  <span className="directory-band__count">{band.count}</span>
                  <span className="directory-band__label">{band.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>}

      {/* Map + key + filters + dock */}
      <section className="directory-stage" aria-label={isSpaces ? "Squadz" : "Places"}>
        <div className="directory-stage__map">
          <div className="directory-stage__map-frame">
            {!isLoading && (
              <Suspense fallback={directoryMapFallback}>
                <DirectoryMap
                  businesses={filtered}
                  height={DIRECTORY_MAP_HEIGHT}
                  showKey={false}
                />
              </Suspense>
            )}
            {isLoading && directoryMapFallback}
            <div className="directory-stage__map-seam" aria-hidden="true" />
          </div>

          <div
            className="directory-map-key directory-map-key--dock pdx-glass pdx-glass--neutral pdx-glass-rebind"
            role="group"
            aria-label="Map key"
          >
            <span className="directory-map-key__kicker">Key</span>
            <ul className="directory-map-key__list">
              {CATEGORY_ORDER.filter(type => (categoryCounts[type] ?? 0) > 0 && (!isSpaces || type === "group")).map(type => {
                const isNonprofit = type === "nonprofit";
                const color = TYPE_COLORS[type];
                const label = TYPE_LABELS[type];
                return (
                  <li key={type} className="directory-map-key__item">
                    <span
                      className={
                        isNonprofit
                          ? "directory-map-key__swatch directory-map-key__swatch--rainbow"
                          : "directory-map-key__swatch"
                      }
                      style={
                        isNonprofit
                          ? undefined
                          : {
                              background: "#000",
                              border: `3px solid ${color}`,
                              boxShadow: "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85)",
                              width: 12,
                              height: 12,
                            }
                      }
                      aria-hidden="true"
                    />
                    <span className="directory-map-key__label">{label}</span>
                  </li>
                );
              })}
              <li className="directory-map-key__item">
                <span
                  className="directory-map-key__swatch directory-map-key__swatch--rainbow"
                  aria-hidden="true"
                />
                <span className="directory-map-key__label">Queer-owned</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Search + neighborhood chips: not sticky */}
        <div className="directory-filters" id="directory-filters">
          <div className="directory-filters__search-row">
            <div className="directory-filters__search">
              <SearchInput
                id="directory-search"
                label={undefined}
                placeholder={isSpaces ? "Search MY SQUADZ…" : "Search the directory…"}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                data-testid="directory-search"
                size="sm"
              />
            </div>
            <div className="directory-filters__count" data-testid="directory-result-count">
              {resultLine}
            </div>
          </div>
          <div
            className="directory-filters__hoods"
            role="group"
            aria-label="Filter by neighborhood"
          >
            {visibleNeighborhoods.map(n => {
              const selected = activeNeighborhood === n;
              return (
                <FilterChip
                  key={n}
                  selected={selected}
                  fill={selected}
                  accent="lime"
                  onToggle={() => {
                    setActiveNeighborhood(n);
                    setSelectedPlace(null);
                  }}
                >
                  {n}
                </FilterChip>
              );
            })}
            {neighborhoodsInUse.length > 5 && (
              <button
                type="button"
                className="directory-filters__more"
                aria-expanded={showAllNeighborhoods}
                onClick={() => setShowAllNeighborhoods(value => !value)}
              >
                {showAllNeighborhoods
                  ? "View less"
                  : `View ${neighborhoodsInUse.length - 5} more`}
              </button>
            )}
          </div>
        </div>

        {/* The dock */}
        <div ref={dockRef} className="directory-dock">
          <div className="directory-dock__head">
            <h2 className="directory-dock__title">{isSpaces ? "The squadz" : "The dock"}</h2>
            <span className="directory-dock__hint">Tap to pin it</span>
          </div>

          {isLoading ? (
            <BoardLoadingState label="Loading directory" />
          ) : isError ? (
            <div className="directory-inline-error">Could not load directory.</div>
          ) : filtered.length === 0 ? (
            <div className="board-empty board-empty--prototype directory-dock__empty">
              <p className="display section-heading">Nothing matches</p>
              <p className="board-copy-sm">
                {isSpaces ? "Try a broader search. If a squad you know is genuinely missing, add it and it will be here for the next person." : "Try a broader filter. If a place you love is genuinely missing, add it and it will be here for the next person."}
              </p>
              <button type="button" className="btn-neon magenta" onClick={openAddForm} style={{ marginTop: 16 }}>
                <Plus size={16} /> {isSpaces ? "Add a squad" : "Add your business"}
              </button>
            </div>
          ) : (
            <div className="directory-dock__list">
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
        </div>
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

/** Dock list card: compact wide PlaceCard (logo · chips · name · address · upcoming flag). */
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
      variant="compact"
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        onClick?.(e.currentTarget);
      }}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className="pdxPlace--clickable"
      isNonprofit={isNonprofit}
      logoUrl={logoUrl}
      fallbackLogoUrl={fallbackLogoUrl}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={address}
      lat={multiLoc ? null : biz.lat}
      lng={multiLoc ? null : biz.lng}
      grandOpening={grandOpening}
      businessId={biz.id}
      isFollowing={Boolean(biz.isFollowing)}
      onRequireAuth={onRequireAuth}
      events={upcomingEvents.map(event => ({
        day: event.dayOfWeek || undefined,
        date: formatDirectoryEventWhen(event),
        title: event.title,
        href: eventPath(event.id, event.title, event.dayOfWeek),
      }))}
    />
  );
}
