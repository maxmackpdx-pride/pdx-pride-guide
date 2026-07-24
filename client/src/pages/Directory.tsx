import type React from "react";
import { useState, useMemo, Suspense, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DirectoryHero from "@/components/DirectoryHero";
import AuthModal from "@/components/AuthModal";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import { MapPin, Plus, X } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { placePath, placeUrl } from "@shared/placeSlug";
import { FilterChip, PlaceCard, SearchInput } from "@/components/ds";
import { pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import { formatGrandOpeningDate, isGrandOpeningActive } from "@shared/grandOpening";

import { lazyWithReload } from "@/lib/lazyWithReload";
import { dayAccentToken } from "@/lib/dsColors";
import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";
import {
  DIRECTORY_RECENT_MAX,
  pushDirectoryRecent,
  readDirectoryRecent,
  type DirectoryRecentEntry,
} from "@/lib/directoryRecent";
import PlaceModal from "@/components/PlaceModal";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import CategoryConstellation from "@/components/CategoryConstellation";
import "./Directory.css";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

/** Browse layout map - desktop sticky map; ~30% taller than prior 570px. */
const DIRECTORY_MAP_HEIGHT = 741;

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
  isNew: boolean;
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

export const TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
  healthcare: "Health & Care",
  realestate: "Real Estate",
  group: "Clubs & Groups",
};

/** Solid pin / accent hex (gradients live on PlaceCard edges). */
export const TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
  nonprofit: "#FFFFFF",
  healthcare: "#FF00CC", // pink pole of pink→white neon
  realestate: "#1A4DFF", // neon navy pole of navy→white neon
  group: "#CCFF00",
};

const NEIGHBORHOODS = [
  "ALL", "Downtown", "SE", "NE", "N", "NW", "SW", "Pearl", "Alberta", "Hawthorne",
  "Belmont", "Division", "Mississippi", "Alberta Arts District",
];

const FORM_NEIGHBORHOODS = NEIGHBORHOODS.filter(n => n !== "ALL");

function directoryHasDeepLink(): boolean {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  return Boolean(
    (type && type in TYPE_LABELS) ||
    params.get("place") ||
    params.get("q"),
  );
}

const blankDirectoryForm = () => ({
  name: "",
  type: "bar",
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

export default function Directory() {
  const [routeMatch, routeParams] = useRoute("/directory/:id/:slug?");
  const [, setLocation] = useLocation();
  const routePlaceId = routeMatch && routeParams?.id ? Number(routeParams.id) : null;

  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(() => new URLSearchParams(window.location.search).get("add") === "1");
  const [form, setForm] = useState(blankDirectoryForm);
  const [submitResult, setSubmitResult] = useState<DirectorySubmitResult | null>(null);
  const [claimingBusinessId, setClaimingBusinessId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    return t && t in TYPE_LABELS ? t : "ALL";
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
  // Lazy init - function form so routePlaceId is actually evaluated (Boolean(fn) was a bug).
  const [showGrid, setShowGrid] = useState(() => directoryHasDeepLink() || Boolean(routePlaceId));
  const [grandOpeningOnly, setGrandOpeningOnly] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [recentViewed, setRecentViewed] = useState<DirectoryRecentEntry[]>(() => readDirectoryRecent());
  const gridRef = useRef<HTMLDivElement>(null);

  const recordRecentView = useCallback((biz: Business) => {
    const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || null;
    setRecentViewed(
      pushDirectoryRecent({
        id: biz.id,
        name: biz.name,
        type: biz.type,
        logoUrl,
      }),
    );
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
    if (activeType !== "ALL") params.set("type", activeType);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    const next = params.toString();
    return next ? `?${next}` : "";
  }, [activeType, searchQuery]);

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
      setShowGrid(true);
      setLocation(`${placePath(biz.id, biz.name)}${directoryQuerySuffix()}`);
    },
    [setLocation, directoryQuerySuffix, recordRecentView],
  );

  const closePlace = useCallback(() => {
    setSelectedPlace(null);
    setPlaceOriginRect(null);
    setLocation(`/directory${directoryQuerySuffix()}`);
  }, [setLocation, directoryQuerySuffix]);

  // Deep link: /directory/:id/:slug or legacy ?place= - open when present, clear when gone (browser back).
  // Origin rect is owned by openPlace (card click). Deep links leave it null for soft enter.
  useEffect(() => {
    if (!businesses.length) return;
    const queryPlaceId = Number(new URLSearchParams(window.location.search).get("place"));
    const placeId = routePlaceId || (Number.isFinite(queryPlaceId) && queryPlaceId > 0 ? queryPlaceId : null);
    if (!placeId) {
      setSelectedPlace(null);
      setPlaceOriginRect(null);
      return;
    }
    const match = businesses.find(b => b.id === placeId);
    if (!match) {
      setSelectedPlace(null);
      setPlaceOriginRect(null);
      return;
    }
    setSelectedPlace(match);
    setShowGrid(true);
    recordRecentView(match);
    // Canonicalize legacy ?place= to /directory/:id/:slug (keep type/q query).
    if (!routePlaceId) {
      const qs = window.location.search || "";
      setLocation(`${placePath(match.id, match.name)}${qs}`);
    }
  }, [businesses, routePlaceId, setLocation, recordRecentView]);

  const placeSeo = selectedPlace;
  usePageSeo(
    placeSeo
      ? `${placeSeo.name} | Portland Directory | Zaylist`
      : "Portland Directory | Zaylist",
    placeSeo
      ? [
          placeSeo.neighborhood,
          TYPE_LABELS[placeSeo.type] || placeSeo.type,
          placeSeo.description,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 160) || `${placeSeo.name} on Zaylist.`
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const thisMonth = pacificTodayDate().slice(0, 7);
    return businesses
      .filter(b => {
        if (grandOpeningOnly) {
          if (!isGrandOpeningActive(b.grandOpeningDate)) return false;
          const openMonth = b.grandOpeningDate?.slice(0, 7);
          if (openMonth && openMonth !== thisMonth) return false;
        }
        if (activeType !== "ALL" && b.type !== activeType) return false;
        if (activeNeighborhood !== "ALL" && b.neighborhood !== activeNeighborhood) return false;
        if (q) {
          const haystack = `${b.name} ${b.description || ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Verified grand openings first (grandOpeningDate within 60 days), then A–Z.
        const aGo = isGrandOpeningActive(a.grandOpeningDate) ? 1 : 0;
        const bGo = isGrandOpeningActive(b.grandOpeningDate) ? 1 : 0;
        const newDiff = bGo - aGo;
        if (newDiff !== 0) return newDiff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [businesses, activeType, activeNeighborhood, searchQuery, grandOpeningOnly]);

  const neighborhoodsInUse = useMemo(() => {
    const seen = new Set(businesses.map(b => b.neighborhood).filter(Boolean));
    return NEIGHBORHOODS.filter(n => n === "ALL" || seen.has(n));
  }, [businesses]);

  const grandOpeningsThisMonth = useMemo(() => {
    const thisMonth = pacificTodayDate().slice(0, 7);
    return businesses.filter(b => {
      if (!isGrandOpeningActive(b.grandOpeningDate)) return false;
      const openMonth = b.grandOpeningDate?.slice(0, 7);
      return !openMonth || openMonth === thisMonth;
    }).length;
  }, [businesses]);

  const heroStats = useMemo(() => {
    const hostingPrideEvents = businesses.filter(b => (b.upcomingEvents?.length ?? 0) > 0).length;
    return [
      { num: businesses.length, label: "Total places", color: "#ff1fa0" },
      { num: grandOpeningsThisMonth, label: "Total grand openings this month", color: "#ccff00" },
      { num: hostingPrideEvents, label: "Total hosting Pride events", color: "#19e3ff" },
    ];
  }, [businesses, grandOpeningsThisMonth]);

  const revealGrid = () => {
    setShowGrid(true);
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleSelectCategory = (key: string) => {
    setGrandOpeningOnly(false);
    setActiveType(key);
    revealGrid();
  };

  const handleSelectGrandOpening = () => {
    setGrandOpeningOnly(true);
    setActiveType("ALL");
    revealGrid();
  };

  const handleViewAll = () => {
    setGrandOpeningOnly(false);
    setActiveType("ALL");
    revealGrid();
  };

  const handleBackToCategories = () => {
    setShowGrid(false);
    setGrandOpeningOnly(false);
    setMobileMapOpen(false);
    window.setTimeout(() => {
      document.querySelector(".category-constellation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
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
      setForm(blankDirectoryForm());
      setSubmitResult({
        title: "Added to directory",
        desc: hasMatches
          ? "Your place is live on the map and listings. We also spotted similar listings you may want to double-check."
          : "Your place is live on the map and listings.",
        potentialMatches: hasMatches ? potentialMatches : undefined,
      });
      toast({ title: "Added to directory", description: "Your place is live on the map and listings." });
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
      setForm(blankDirectoryForm());
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
    setForm(blankDirectoryForm());
    setSubmitResult(null);
    setClaimingBusinessId(null);
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const resetDirectoryForm = () => {
    setForm(blankDirectoryForm());
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

  return (
    <div className="zine-page directory-page board-page board-page--makeover">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <DirectoryHero placeCount={businesses.length} stats={heroStats} onAddPlace={openAddForm} />

      {formOpen && (
        <ScrollReveal>
          <section id="directory-form" className="gifting-form-panel gifting-form-panel--makeover directory-form-panel">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">Add to the directory</h2>
            <p className="board-copy-sm">Logged-in members can list spots that are ours or truly for us - including Clubs &amp; Groups (Rose Court, Pink Ponies, and more). New listings go live immediately unless we spot a likely duplicate. Keep it accurate and scene-rooted. Owners can claim a listing to manage it.</p>
            {submitResult ? (
              <div className="submit-success">
                <div className="submit-success__title">{submitResult.title}</div>
                <p className="submit-success__body" style={{ marginBottom: submitResult.potentialMatches?.length ? 16 : 22 }}>
                  {submitResult.desc}
                </p>
                {submitResult.potentialMatches && submitResult.potentialMatches.length > 0 && (
                  <div style={{ border: "1px solid #444", background: "var(--ink-850)", padding: 14, marginBottom: 22, borderRadius: 3 }}>
                    <p style={{ color: "var(--neon-orange)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                      Similar places in the guide
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
              <label>
                Type *
                <select className="board-text-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
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

      {!showGrid && (
        isLoading ? (
          <BoardLoadingState label="Loading directory" />
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>Could not load directory.</div>
        ) : (
          <ScrollReveal>
            <CategoryConstellation
              counts={categoryCounts}
              grandOpeningCount={grandOpeningsThisMonth}
              totalPlaces={businesses.length}
              typeLabels={TYPE_LABELS}
              typeColors={TYPE_COLORS}
              onSelectCategory={handleSelectCategory}
              onSelectGrandOpening={handleSelectGrandOpening}
              onViewAll={handleViewAll}
            />
          </ScrollReveal>
        )
      )}

      {showGrid && (
        <>
          {/* Filter bar */}
          <ScrollReveal delay={30}>
          <div className="zine-filter-bar" style={{
            background: "#000", borderBottom: "1px solid #1a1a1a",
            position: "sticky", top: "var(--site-header-height)", zIndex: 50,
          }}>
            <div className="directory-filter-bar__top">
              <button
                type="button"
                className="directory-back-city"
                onClick={handleBackToCategories}
                data-testid="directory-back-city"
              >
                ← Back to City View
              </button>
            </div>
            <div className="events-filter-row" style={{ flexWrap: "wrap", rowGap: 8 }}>
              <FilterChip
                selected={activeType === "ALL" && !grandOpeningOnly}
                fill={activeType === "ALL" && !grandOpeningOnly}
                accent={dayAccentToken("ALL")}
                onToggle={() => {
                  setGrandOpeningOnly(false);
                  setActiveType("ALL");
                }}
              >
                ALL
              </FilterChip>
              {Object.entries(TYPE_LABELS).map(([key, label]) => {
                const selected = activeType === key && !grandOpeningOnly;
                return (
                  <FilterChip
                    key={key}
                    selected={selected}
                    fill={selected}
                    accent={TYPE_COLORS[key]}
                    onToggle={() => {
                      setGrandOpeningOnly(false);
                      setActiveType(key);
                    }}
                  >
                    {label}
                  </FilterChip>
                );
              })}
              <div style={{ flex: 1, minWidth: 12 }} />
              <div className="events-filter-search">
                <SearchInput
                  id="directory-search"
                  label={undefined}
                  placeholder="Search the directory..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                  data-testid="directory-search"
                  size="sm"
                />
              </div>
            </div>

            {recentViewed.length > 0 && (
              <div
                className="directory-recent"
                data-testid="directory-recently-viewed"
                aria-label="Recently viewed places"
              >
                <div className="directory-recent__label">Recently viewed</div>
                <div className="directory-recent__rail" role="list">
                  {recentViewed.slice(0, DIRECTORY_RECENT_MAX).map(entry => {
                    const live = businesses.find(b => b.id === entry.id);
                    const accent = TYPE_COLORS[entry.type] || TYPE_COLORS.venue;
                    const logo =
                      (live && resolveDirectoryLogo(live.name, live.imageUrl)) ||
                      entry.logoUrl ||
                      directoryFallbackLogo(entry.name);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        role="listitem"
                        className="directory-recent__chip"
                        style={{ ["--c" as string]: accent }}
                        data-testid={`directory-recent-${entry.id}`}
                        title={entry.name}
                        onClick={() => {
                          if (live) {
                            openPlace(live);
                            return;
                          }
                          // Stale id still on disk - open by path so deep-link can resolve if still live.
                          setShowGrid(true);
                          setLocation(`${placePath(entry.id, entry.name)}${directoryQuerySuffix()}`);
                        }}
                      >
                        <span className="directory-recent__logo" aria-hidden>
                          {logo ? (
                            <img src={logo} alt="" />
                          ) : (
                            <span className="directory-recent__logo-fallback">
                              {entry.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="directory-recent__name">{entry.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
          </ScrollReveal>

          <div ref={gridRef} className="directory-browse-layout">
            <div className="directory-browse-layout__main">
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

              <div className="directory-map-toolbar">
                <button
                  type="button"
                  className="directory-map-toggle"
                  data-testid="button-toggle-directory-map"
                  aria-expanded={mobileMapOpen}
                  aria-controls="directory-map-mobile"
                  onClick={() => setMobileMapOpen(open => !open)}
                >
                  {mobileMapOpen ? "Hide map" : "Show map"}
                </button>
              </div>

              {mobileMapOpen && !isLoading && (
                <ScrollReveal>
                  <div id="directory-map-mobile" className="directory-browse-layout__map-mobile">
                    <Suspense fallback={directoryMapFallback}>
                      <DirectoryMap
                        businesses={filtered}
                        height={DIRECTORY_MAP_HEIGHT}
                        showKey
                      />
                    </Suspense>
                  </div>
                </ScrollReveal>
              )}

              {isLoading ? (
                <BoardLoadingState label="Loading directory" />
              ) : isError ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>Could not load directory.</div>
              ) : filtered.length === 0 ? (
                <div className="board-empty board-empty--prototype">
                  <p className="display section-heading">Nothing matches</p>
                  <p className="board-copy-sm">
                    {businesses.length === 0
                      ? "Try a broader filter. If a place you love is genuinely missing, add it and it'll be here for the next person."
                      : "Try a broader filter. If a place you love is genuinely missing, add it and it'll be here for the next person."}
                  </p>
                  <button type="button" className="btn-neon magenta" onClick={openAddForm} style={{ marginTop: 16 }}>
                    <Plus size={16} /> Add your business
                  </button>
                </div>
              ) : (
                <ScrollReveal delay={50}>
                  <div className="directory-grid directory-grid--browse">
                    {filtered.map(biz => (
                      <DirectoryCard
                        key={biz.id}
                        biz={biz}
                        onClick={(el) => openPlace(biz, el)}
                        onRequireAuth={() => setShowAuth(true)}
                      />
                    ))}
                  </div>
                </ScrollReveal>
              )}
            </div>

            {!isLoading && (
              <aside className="directory-browse-layout__map-desktop" aria-label="Directory map">
                <Suspense fallback={directoryMapFallback}>
                  <DirectoryMap
                    businesses={filtered}
                    height={DIRECTORY_MAP_HEIGHT}
                    showKey
                  />
                </Suspense>
              </aside>
            )}
          </div>
        </>
      )}

      {selectedPlace && (
        <PlaceModal
          key={selectedPlace.id}
          place={selectedPlace}
          originRect={placeOriginRect}
          onClose={closePlace}
          onRequireAuth={() => setShowAuth(true)}
        />
      )}

      <BoardCloseSeam
        line="Keep us healthy."
        url="zaylist.com/directory"
      />
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
  group: "services",
};

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
  const address = [biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined;
  const isNonprofit = biz.type === "nonprofit";
  const grandOpening = isGrandOpeningActive(biz.grandOpeningDate);
  const grandOpeningDateLabel = grandOpening ? formatGrandOpeningDate(biz.grandOpeningDate) : null;
  const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || undefined;
  const fallbackLogoUrl = directoryFallbackLogo(biz.type);
  return (
    <PlaceCard
      name={biz.name}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        onClick?.(e.currentTarget);
      }}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className="pdxPlace--clickable"
      isNonprofit={isNonprofit}
      logoUrl={logoUrl}
      fallbackLogoUrl={fallbackLogoUrl}
      donateUrl={biz.donateUrl || undefined}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={address}
      lat={biz.lat}
      lng={biz.lng}
      hours={biz.hours || undefined}
      phone={biz.phone || undefined}
      description={biz.description || undefined}
      website={biz.website || undefined}
      instagram={biz.instagram || undefined}
      grandOpening={grandOpening}
      grandOpeningDate={grandOpeningDateLabel}
      promoters={biz.promoters}
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
