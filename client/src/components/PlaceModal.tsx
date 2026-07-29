import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useModalA11y } from "@/hooks/useModalA11y";
import { Badge } from "@/components/ds";
import { Share2 } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import {
  TYPE_LABELS,
  TYPE_TO_DS_CATEGORY,
  formatDirectoryEventWhen,
  type Business,
  type DirectoryEventSummary,
} from "@/pages/Directory";
import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";
import { placeGoogleMapsUrl, placeAppleMapsUrl, telHref } from "@/lib/placeLinks";
import { placePath } from "@shared/placeSlug";
import { sharePageLink, shareToastTitle } from "@/lib/shareEvent";
import VenueFollowButton from "@/components/VenueFollowButton";
import { formatGrandOpeningDate, isGrandOpeningActive } from "@shared/grandOpening";
import { categoryHidesMissedConnections } from "@shared/missedConnections";
import { resolveBusinessLocations } from "@shared/businessLocations";
import "./PlaceModal.css";

/** Source-card rect for little→big FLIP expand. */
export type PlaceModalOriginRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type EditableFields = {
  description: string;
  hours: string;
  phone: string;
  website: string;
  instagram: string;
  donateUrl: string;
};

type OwnerEditableFields = EditableFields & {
  name: string;
  address: string;
  type: string;
  neighborhood: string;
  queerOwned: boolean;
  queerFriendly: boolean;
};

function toEditableFields(place: Business): EditableFields {
  return {
    description: place.description || "",
    hours: place.hours || "",
    phone: place.phone || "",
    website: place.website || "",
    instagram: place.instagram || "",
    donateUrl: place.donateUrl || "",
  };
}

function toOwnerEditableFields(place: Business): OwnerEditableFields {
  return {
    ...toEditableFields(place),
    name: place.name || "",
    address: place.address || "",
    type: place.type || "bar",
    neighborhood: place.neighborhood || "",
    queerOwned: place.queerOwned,
    queerFriendly: place.queerFriendly,
  };
}

/* Detail modal for a directory business - same fixed-overlay flex-center
   idiom as the Schedule embed popover / AuthModal / MissedConnectionsPanel:
   click the overlay to close, stopPropagation on the panel. Roomier version
   of PlaceCard's content (name, category, address/hours/phone, description,
   links, upcoming Pride events / missed connections / gigs tabs). */

const DAY_COLOR: Record<string, string> = {
  MON: "var(--day-mon, #ff2d5e)",
  TUE: "var(--day-tue, #ff9500)",
  WED: "var(--day-wed, #ffee00)",
  THU: "var(--day-thu, var(--cyan, #19e3ff))",
  FRI: "var(--day-fri, var(--pink, #ff00cc))",
  SAT: "var(--day-sat, var(--green, #39ff14))",
  SUN: "var(--day-sun, var(--orange, #ff6600))",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.classList.contains("calm-mode")) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Nonprofit card border - full-spectrum rainbow instead of a single category color. */
const NONPROFIT_RAINBOW_EDGE =
  "linear-gradient(120deg,var(--neon-red),#FF9500,var(--yellow),var(--green),var(--neon-cyan),#3A6BFF,var(--neon-violet),var(--neon-magenta))";
/** Health & Care - pink → white neon edge. */
const HEALTHCARE_EDGE =
  "linear-gradient(125deg,#FF00CC 0%,#FF4DD2 35%,#FFB3EC 70%,#FFFFFF 100%)";
/** Real Estate - neon navy → white edge. */
const REALESTATE_EDGE =
  "linear-gradient(125deg,#061A66 0%,#0A1F8C 28%,#1A4DFF 62%,#FFFFFF 100%)";
/** Campgrounds - lime → dark forest green neon edge. */
const CAMPGROUND_EDGE =
  "linear-gradient(125deg,#B8FF3C 0%,#39FF14 28%,#0F8A3D 62%,#064E2A 100%)";
/** Clubs & Groups - white → gold neon edge. */
const GROUP_EDGE =
  "linear-gradient(125deg,#FFFFFF 0%,#FFF3C4 32%,#FFD700 68%,#C9A227 100%)";

function Icon({ d }: { d: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
const PIN = (
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>
);
const CLOCK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
const PHONE = (
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
);
const GLOBE = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </>
);
const IG = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </>
);
const CAL = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

const BLANK_FIELDS: EditableFields = {
  description: "", hours: "", phone: "", website: "", instagram: "", donateUrl: "",
};
const BLANK_OWNER_FIELDS: OwnerEditableFields = {
  ...BLANK_FIELDS, name: "", address: "", type: "bar", neighborhood: "", queerOwned: false, queerFriendly: true,
};

type ModalTab = "events" | "past" | "missed" | "gigs";

const DAY_CODES = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);

function dayCodeFromEvent(ev: DirectoryEventSummary): string {
  const raw = (ev.dayOfWeek || "").trim().toUpperCase().slice(0, 3);
  if (DAY_CODES.has(raw)) return raw;
  if (ev.dateStart) {
    const d = new Date(ev.dateStart);
    if (!Number.isNaN(d.getTime())) {
      return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
    }
  }
  return "FRI";
}

function formatPastWhen(ev: DirectoryEventSummary): string {
  if (!ev.dateStart) return "Past";
  const d = new Date(ev.dateStart);
  if (Number.isNaN(d.getTime())) return "Past";
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  return `${mon} ${d.getFullYear()}`;
}

export default function PlaceModal({
  place,
  onClose,
  onRequireAuth,
  originRect = null,
}: {
  place: Business | null;
  onClose: () => void;
  onRequireAuth: () => void;
  /** Bounding rect of the directory card that was clicked - drives little→big expand. */
  originRect?: PlaceModalOriginRect | null;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(BLANK_FIELDS);
  const [ownerForm, setOwnerForm] = useState<OwnerEditableFields>(BLANK_OWNER_FIELDS);
  const [savedOverrides, setSavedOverrides] = useState<Partial<Business> | null>(null);
  const [tab, setTab] = useState<ModalTab>("events");
  const [sharing, setSharing] = useState(false);
  const [open, setOpen] = useState(false);
  const [flipVars, setFlipVars] = useState<React.CSSProperties | null>(null);
  const useFlip = Boolean(originRect && originRect.width > 0 && originRect.height > 0);
  const handleClose = useCallback(() => onClose(), [onClose]);
  // Single ref for a11y + FLIP measure (avoid readonly RefObject.current assign).
  const panelRef = useModalA11y({ open: !!place, onClose: handleClose, enabled: !!place });

  // Fresh tab when opening a different place
  useEffect(() => {
    setTab("events");
    setEditing(false);
    setSavedOverrides(null);
  }, [place?.id]);

  // Little→big FLIP: map final panel onto source card, then animate to identity.
  // Keep open=false until after the inverted transform is applied (same frame as paint).
  useLayoutEffect(() => {
    if (!place) return;
    let cancelled = false;
    setOpen(false);

    const reduce = prefersReducedMotion();
    const panel = panelRef.current;

    const armOpen = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (!cancelled) setOpen(true);
        });
      });
    };

    if (!panel) {
      setFlipVars(null);
      armOpen();
      return () => {
        cancelled = true;
      };
    }

    if (reduce || !useFlip || !originRect) {
      setFlipVars(null);
      armOpen();
      return () => {
        cancelled = true;
      };
    }

    // Measure final layout while still closed (enter/flip start state)
    const last = panel.getBoundingClientRect();
    if (last.width < 8 || last.height < 8) {
      setFlipVars(null);
      armOpen();
      return () => {
        cancelled = true;
      };
    }

    const sx = originRect.width / last.width;
    const sy = originRect.height / last.height;
    const tx = originRect.left - last.left;
    const ty = originRect.top - last.top;
    setFlipVars({
      ["--pm-sx" as string]: String(sx),
      ["--pm-sy" as string]: String(sy),
      ["--pm-tx" as string]: `${tx}px`,
      ["--pm-ty" as string]: `${ty}px`,
    });
    armOpen();
    return () => {
      cancelled = true;
    };
  }, [place?.id, useFlip, originRect]);

  const saveMutation = useMutation({
    mutationFn: (fields: EditableFields | OwnerEditableFields) => {
      if (!place) throw new Error("No venue selected");
      return apiRequest("PATCH", `/api/directory/${place.id}`, fields).then(r => r.json());
    },
    onSuccess: (updated: Partial<Business>) => {
      setSavedOverrides(updated);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      toast({ title: "Venue updated", description: "Changes are live on the directory." });
    },
    onError: (err: unknown) => {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Something went wrong. Try again.",
        variant: "destructive",
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (claimReason: string) => {
      if (!place) throw new Error("No venue selected");
      return apiRequest("POST", `/api/directory/${place.id}/claim`, { claimReason }).then(r => r.json());
    },
    onSuccess: (result: { autoApproved?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      toast({
        title: result?.autoApproved ? "You're the owner!" : "Claim submitted",
        description: result?.autoApproved
          ? "This venue is now linked to your account."
          : "Sent to the site admin for approval.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Could not submit claim",
        description: err instanceof Error ? err.message : "Something went wrong. Try again.",
        variant: "destructive",
      });
    },
  });

  if (!place) return null;

  const category = TYPE_TO_DS_CATEGORY[place.type] || "venues";
  const categoryLabel = TYPE_LABELS[place.type] || place.type;
  const locations =
    Array.isArray(place.locations) && place.locations.length > 0
      ? place.locations
      : resolveBusinessLocations(place);
  const multiLoc = locations.length > 1;
  const address = multiLoc
    ? [place.neighborhood, `${locations.length} locations`].filter(Boolean).join(" · ") ||
      `${locations.length} locations`
    : [place.address, place.neighborhood].filter(Boolean).join(" · ") || undefined;
  const upcomingEvents = place.upcomingEvents ?? [];
  const pastEvents = place.pastEvents ?? [];
  const spotted = place.spotted ?? [];
  const gigs = place.gigs ?? [];
  const promoters = place.promoters ?? [];
  const canEditVenue = Boolean(place.canEditVenue);
  const isOwner = Boolean(place.isOwner);
  const displayed: Business = { ...place, ...(savedOverrides || {}) };
  const isNonprofit = place.type === "nonprofit";
  const isHealthcare = place.type === "healthcare" || category === "healthcare";
  const isRealEstate = place.type === "realestate" || category === "realestate";
  const isCampground = place.type === "campground" || category === "campgrounds";
  const isGroup = place.type === "group" || category === "groups";
  const accent = isNonprofit
    ? "var(--cyan)"
    : isHealthcare
      ? "#FF00CC"
      : isRealEstate
        ? "#1A4DFF"
        : isCampground
          ? "#39FF14"
          : isGroup
            ? "#FFD700"
            : ({
            bars: "var(--pink)",
            food: "var(--orange)",
            cafes: "var(--green)",
            venues: "var(--cyan)",
            services: "var(--purple)",
            shops: "var(--amber)",
            hotels: "var(--blue)",
            healthcare: "#FF00CC",
            realestate: "#1A4DFF",
            campgrounds: "#39FF14",
            groups: "#FFD700",
          } as Record<string, string>)[category] || "var(--pink)";
  const edge = isNonprofit
    ? NONPROFIT_RAINBOW_EDGE
    : isHealthcare
      ? HEALTHCARE_EDGE
      : isRealEstate
        ? REALESTATE_EDGE
        : isCampground
          ? CAMPGROUND_EDGE
          : isGroup
            ? GROUP_EDGE
            : `linear-gradient(${accent},${accent})`;
  const logoUrl = resolveDirectoryLogo(place.name, place.imageUrl);
  const fallbackLogoUrl = directoryFallbackLogo(place.type);

  const startEditing = () => {
    if (isOwner) {
      setOwnerForm(toOwnerEditableFields(displayed));
    } else {
      setForm(toEditableFields(displayed));
    }
    setEditing(true);
  };
  const cancelEditing = () => setEditing(false);
  const saveEdits = () => saveMutation.mutate(isOwner ? ownerForm : form);

  const requestClaim = () => {
    if (!user || !place) {
      if (!user) onRequireAuth();
      return;
    }
    const brandNote = multiLoc
      ? `\n\nThis listing covers ${locations.length} locations. Claiming means you represent the brand on Zaylist (all locations), not one storefront.`
      : "";
    const reason = window.prompt(
      `Tell us about your connection to this business (e.g. "I own/manage this venue"):${brandNote}`,
      "",
    );
    if (reason == null) return;
    if (!reason.trim()) {
      toast({ title: "Add a short reason", variant: "destructive" });
      return;
    }
    claimMutation.mutate(reason.trim());
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await sharePageLink(placePath(place.id, place.name), place.name);
      toast({
        title: shareToastTitle(result, "venue"),
        description: result === "copied" ? placePath(place.id, place.name) : undefined,
      });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast({ title: "Could not share venue", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "var(--ink-750)", color: "var(--text-hi)", border: "1px solid var(--ink-border-strong)",
    borderRadius: 6, padding: "8px 10px", fontFamily: "var(--font-body)", fontSize: "0.9rem",
    marginTop: 4, marginBottom: 12,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)", fontSize: "0.7rem", letterSpacing: "0.06em",
    textTransform: "uppercase", color: "var(--text-lo)",
  };

  // Standard: healthcare (and any category in MISSED_CONNECTIONS_HIDDEN_CATEGORIES)
  // never surfaces Missed Connections in the directory.
  const hideMissed = categoryHidesMissedConnections(place.type, category);
  const tabs: Array<{ key: ModalTab; label: string; count: number }> = [
    { key: "events", label: "Events", count: upcomingEvents.length },
    { key: "past", label: "Past", count: pastEvents.length },
    ...(hideMissed
      ? []
      : [{ key: "missed" as ModalTab, label: "Missed Connections", count: spotted.length }]),
    { key: "gigs", label: "Gigs", count: gigs.length },
  ];

  const useSpecialEdge =
    isNonprofit || isHealthcare || isRealEstate || isCampground || isGroup;
  const panelClass = [
    "place-modal-panel",
    "pdx-glass-rebind",
    useSpecialEdge ? "place-modal-panel--edge" : "",
    useFlip ? "place-modal-panel--flip" : "place-modal-panel--enter",
    open ? "place-modal-panel--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Portal to body + overlay-scroll (same idiom as EventModal) so tall venues
  // like Camp never load clipped off-screen or trapped in a non-scrolling flex box.
  return createPortal(
    <div
      onClick={onClose}
      role="presentation"
      className={`place-modal-overlay${open ? " place-modal-overlay--open" : ""}`}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={place.name}
        tabIndex={-1}
        className={panelClass}
        style={{
          ["--c" as string]: accent,
          ["--_c" as string]: accent,
          ...(useSpecialEdge ? { ["--_edge" as string]: edge } : {}),
          ...(flipVars || {}),
        }}
      >
        <div className="place-modal-panel__glow" aria-hidden="true" />
        <div className="place-modal-panel__sheen" aria-hidden="true" />
        <div className="place-modal-panel__seam dir-refract" aria-hidden="true" />

        <div className="place-modal-panel__inner">
        <div className="place-modal-panel__actions">
          <VenueFollowButton
            businessId={place.id}
            initialFollowing={Boolean(place.isFollowing)}
            variant="modal"
            accent={accent}
            onRequireAuth={onRequireAuth}
          />
          <button
            type="button"
            className="place-modal-panel__share"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share this venue"
          >
            <Share2 size={13} strokeWidth={2.5} /> {sharing ? "..." : "SHARE"}
          </button>
          <button
            type="button"
            className="place-modal-panel__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div>
          <div className="place-modal-panel__media">
            <div className="place-modal-panel__media-glow" aria-hidden="true" />
            <div className="place-modal-panel__media-scan" aria-hidden="true" />
            {logoUrl ? (
              <img
                className="place-modal-panel__logo"
                src={logoUrl}
                alt={`${place.name} logo`}
                loading="lazy"
              />
            ) : (
              <img
                className="place-modal-panel__logo place-modal-panel__logo--fallback"
                src={fallbackLogoUrl}
                alt={categoryLabel}
                loading="lazy"
              />
            )}
          </div>

          <div className="place-modal-panel__body">

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", marginBottom: 10 }}>
            {isGrandOpeningActive(place.grandOpeningDate) && (
              <Badge color="yellow" glow size="sm" admission={undefined} day={undefined} category={undefined}>
                Grand Opening
              </Badge>
            )}
            <Badge
              category={isNonprofit ? undefined : category}
              color={isNonprofit ? "paper" : undefined}
              size="md"
              admission={undefined}
              day={undefined}
            >
              {categoryLabel}
            </Badge>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "1.9rem",
              lineHeight: 1.02,
              color: "var(--text-hi)",
              margin: isGrandOpeningActive(place.grandOpeningDate) ? "0 0 4px" : "0 0 14px",
            }}
          >
            {place.name}
          </h2>
          {isGrandOpeningActive(place.grandOpeningDate) && formatGrandOpeningDate(place.grandOpeningDate) && (
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "1.33rem", // ~30% smaller than 1.9rem
                lineHeight: 1.1,
                letterSpacing: "0.04em",
                color: "var(--neon-yellow, #FFEE00)",
                textShadow: "0 0 12px color-mix(in srgb, var(--neon-yellow, #FFEE00) 55%, transparent)",
                margin: "0 0 14px",
              }}
            >
              {formatGrandOpeningDate(place.grandOpeningDate)}
            </div>
          )}

          {address && (
            <div style={{ ...rowStyle, marginBottom: multiLoc ? 10 : 6, flexWrap: "wrap", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 8 }}>
                <Icon d={PIN} />
                {address}
              </span>
              {!multiLoc && (
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <a href={placeGoogleMapsUrl({ address: place.address, name: place.name, lat: place.lat, lng: place.lng })} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, fontSize: "0.8rem" }}>
                    Google Maps
                  </a>
                  <a href={placeAppleMapsUrl({ address: place.address, name: place.name, lat: place.lat, lng: place.lng })} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, fontSize: "0.8rem" }}>
                    Apple Maps
                  </a>
                </span>
              )}
            </div>
          )}

          {multiLoc && !editing && (
            <div className="place-modal-locations" style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: accent,
                  marginBottom: 8,
                }}
              >
                Locations ({locations.length})
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {locations.map((loc, i) => (
                  <li
                    key={`${loc.label}-${i}`}
                    style={{
                      border: "1px solid color-mix(in srgb, var(--c, #19e3ff) 28%, #1c1c22)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "color-mix(in srgb, #0c0c0f 88%, transparent)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        fontSize: "0.85rem",
                        letterSpacing: "0.03em",
                        color: "var(--text-hi)",
                        marginBottom: 4,
                      }}
                    >
                      {loc.label}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-mid)", lineHeight: 1.45, marginBottom: 4 }}>
                      {loc.address}
                    </div>
                    {(loc.phone || loc.hours) && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          fontSize: "0.8rem",
                          color: "var(--text-lo)",
                          marginBottom: 6,
                        }}
                      >
                        {loc.phone && (
                          <a href={telHref(loc.phone)} style={{ color: "inherit", textDecoration: "none" }}>
                            {loc.phone}
                          </a>
                        )}
                        {loc.hours && <span>{loc.hours}</span>}
                      </div>
                    )}
                    <span style={{ display: "inline-flex", gap: 12 }}>
                      <a
                        href={placeGoogleMapsUrl({
                          address: loc.address,
                          name: `${place.name} ${loc.label}`,
                          lat: loc.lat,
                          lng: loc.lng,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...linkStyle, fontSize: "0.78rem" }}
                      >
                        Google Maps
                      </a>
                      <a
                        href={placeAppleMapsUrl({
                          address: loc.address,
                          name: `${place.name} ${loc.label}`,
                          lat: loc.lat,
                          lng: loc.lng,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...linkStyle, fontSize: "0.78rem" }}
                      >
                        Apple Maps
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {promoters.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {promoters.map(p => (
                <span
                  key={p.id}
                  style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem",
                    border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`, color: accent,
                  }}
                >
                  @{p.username}
                </span>
              ))}
            </div>
          )}

          {editing ? (
            <div style={{ marginBottom: 16 }}>
              {isOwner && (
                <>
                  <label style={labelStyle}>
                    Name
                    <input style={fieldStyle} value={ownerForm.name} onChange={e => setOwnerForm(f => ({ ...f, name: e.target.value }))} />
                  </label>
                  <label style={labelStyle}>
                    Address
                    <input style={fieldStyle} value={ownerForm.address} onChange={e => setOwnerForm(f => ({ ...f, address: e.target.value }))} />
                  </label>
                  <label style={labelStyle}>
                    Neighborhood
                    <input style={fieldStyle} value={ownerForm.neighborhood} onChange={e => setOwnerForm(f => ({ ...f, neighborhood: e.target.value }))} />
                  </label>
                  <label style={labelStyle}>
                    Type
                    <select
                      style={fieldStyle}
                      value={ownerForm.type}
                      onChange={e => setOwnerForm(f => ({ ...f, type: e.target.value }))}
                    >
                      {Object.entries(TYPE_LABELS).filter(([k]) => k !== "nonprofit").map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <input type="checkbox" checked={ownerForm.queerOwned} onChange={e => setOwnerForm(f => ({ ...f, queerOwned: e.target.checked }))} />
                    Owned by us
                  </label>
                  <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <input type="checkbox" checked={ownerForm.queerFriendly} onChange={e => setOwnerForm(f => ({ ...f, queerFriendly: e.target.checked }))} />
                    For our crowd
                  </label>
                </>
              )}
              <label style={labelStyle}>
                Description
                <textarea
                  style={{ ...fieldStyle, resize: "vertical" }}
                  rows={4}
                  maxLength={2000}
                  value={isOwner ? ownerForm.description : form.description}
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, description: e.target.value }))
                    : setForm(f => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Hours
                <input
                  style={fieldStyle}
                  value={isOwner ? ownerForm.hours : form.hours}
                  placeholder="e.g. Mon–Sat 4pm–2am"
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, hours: e.target.value }))
                    : setForm(f => ({ ...f, hours: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Phone
                <input
                  style={fieldStyle}
                  value={isOwner ? ownerForm.phone : form.phone}
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, phone: e.target.value }))
                    : setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Website
                <input
                  style={fieldStyle}
                  type="url"
                  placeholder="https://..."
                  value={isOwner ? ownerForm.website : form.website}
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, website: e.target.value }))
                    : setForm(f => ({ ...f, website: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Instagram
                <input
                  style={fieldStyle}
                  placeholder="@handle"
                  value={isOwner ? ownerForm.instagram : form.instagram}
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, instagram: e.target.value }))
                    : setForm(f => ({ ...f, instagram: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Donate link
                <input
                  style={{ ...fieldStyle, marginBottom: 4 }}
                  type="url"
                  placeholder="https://..."
                  value={isOwner ? ownerForm.donateUrl : form.donateUrl}
                  onChange={e => isOwner
                    ? setOwnerForm(f => ({ ...f, donateUrl: e.target.value }))
                    : setForm(f => ({ ...f, donateUrl: e.target.value }))}
                />
              </label>
              {isOwner && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-lo)", marginBottom: 12 }}>
                  Logo changes go through the Hub's venue section. They're sent to the site admin for conversion before going live.
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-neon solid"
                  disabled={saveMutation.isPending}
                  onClick={saveEdits}
                >
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className="btn-neon" onClick={cancelEditing}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Primary hours/phone only for single-location; multi-loc lists them per storefront. */}
              {!multiLoc && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {displayed.hours && (
                    <div style={rowStyle}>
                      <Icon d={CLOCK} />
                      {displayed.hours}
                    </div>
                  )}
                  {displayed.phone && (
                    <div style={rowStyle}>
                      <Icon d={PHONE} />
                      <a href={telHref(displayed.phone)} style={{ color: "inherit", textDecoration: "none" }}>
                        {displayed.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {displayed.description && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "var(--text-mid)",
                    margin: "0 0 16px",
                  }}
                >
                  {displayed.description}
                </p>
              )}

              {(displayed.website || displayed.instagram || displayed.donateUrl) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 16 }}>
                  {displayed.donateUrl && (
                    <a href={displayed.donateUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      <Icon d={GLOBE} />
                      Donate
                    </a>
                  )}
                  {displayed.website && (
                    <a href={displayed.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      <Icon d={GLOBE} />
                      Website
                    </a>
                  )}
                  {displayed.instagram && (
                    <a
                      href={
                        displayed.instagram.startsWith("http")
                          ? displayed.instagram
                          : `https://instagram.com/${displayed.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      <Icon d={IG} />
                      {displayed.instagram}
                    </a>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {canEditVenue && (
                  <button type="button" className="btn-neon" onClick={startEditing}>
                    Edit venue info
                  </button>
                )}
                {!place.ownerId && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "36ch" }}>
                    <button
                      type="button"
                      onClick={requestClaim}
                      disabled={claimMutation.isPending}
                      style={{
                        background: "none", border: "none", color: accent, cursor: "pointer",
                        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", padding: 0,
                        textAlign: "left",
                      }}
                    >
                      ↗{" "}
                      {claimMutation.isPending
                        ? "Submitting…"
                        : multiLoc
                          ? "Claim this brand listing"
                          : "Claim this business"}
                    </button>
                    {multiLoc ? (
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-body)",
                          fontSize: "0.78rem",
                          lineHeight: 1.45,
                          color: "var(--text-lo)",
                        }}
                      >
                        This listing covers {locations.length} locations. Claiming means you
                        represent the brand on Zaylist.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop: 6, paddingTop: 16, borderTop: "1px solid var(--ink-border)" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 999,
                    border: `1px solid ${tab === t.key ? accent : "var(--ink-border-strong)"}`,
                    background: tab === t.key ? `color-mix(in srgb, ${accent} 16%, transparent)` : "transparent",
                    color: tab === t.key ? accent : "var(--text-lo)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t.label}{t.count > 0 ? ` (${t.count})` : ""}
                </button>
              ))}
            </div>

            {tab === "events" && (
              upcomingEvents.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-lo)" }}>No upcoming Pride events matched to this venue yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {upcomingEvents.map((ev) => {
                    const dayAccent = (ev.dayOfWeek && DAY_COLOR[ev.dayOfWeek]) || "var(--cyan)";
                    return (
                      <Link
                        key={ev.listingInstanceKey ?? ev.id}
                        href={eventPath(ev.id, ev.title, ev.dayOfWeek)}
                        onClick={onClose}
                        style={{
                          padding: "8px 0 8px 12px",
                          borderLeft: `3px solid ${dayAccent}`,
                          textDecoration: "none",
                          color: "inherit",
                          display: "block",
                        }}
                      >
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", color: dayAccent }}>
                          {formatDirectoryEventWhen(ev)}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-hi)" }}>
                          {ev.title}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {tab === "past" && (
              pastEvents.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-lo)" }}>
                  No past events matched to this venue yet.
                </p>
              ) : (
                <div className="place-modal-past">
                  <p className="place-modal-past__hint">
                    Swipe for past nights · does not grow the card
                  </p>
                  <div
                    className="place-modal-past__rail"
                    role="list"
                    aria-label={`Past events at ${place.name}`}
                  >
                    {pastEvents.map((ev) => {
                      const code = dayCodeFromEvent(ev);
                      const dayVar = `var(--day-${code.toLowerCase()})`;
                      const poster = resolveEventPosterUrl(
                        ev.id,
                        ev.posterImageUrl,
                        ev.dayOfWeek,
                      );
                      return (
                        <Link
                          key={ev.listingInstanceKey ?? ev.id}
                          href={eventPath(ev.id, ev.title, ev.dayOfWeek)}
                          onClick={onClose}
                          role="listitem"
                          className="place-modal-past__card"
                          style={{ ["--pm-day" as string]: dayVar }}
                        >
                          <div className="place-modal-past__banner">
                            {poster ? (
                              <img
                                className="place-modal-past__poster"
                                src={poster}
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                            <div className="place-modal-past__scrim" aria-hidden="true" />
                            <span className="place-modal-past__when">{formatPastWhen(ev)}</span>
                          </div>
                          <div className="place-modal-past__body">
                            <div className="place-modal-past__title">{ev.title}</div>
                            {ev.hostDisplayName ? (
                              <div className="place-modal-past__host">
                                Host · {ev.hostDisplayName}
                              </div>
                            ) : (
                              <div className="place-modal-past__host place-modal-past__host--muted">
                                Ended
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {tab === "missed" && (
              spotted.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-lo)" }}>No missed connections posted at this venue yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {spotted.map(mc => (
                    <div key={mc.id} style={{ padding: "8px 0 8px 12px", borderLeft: `3px solid ${accent}` }}>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-hi)", marginBottom: 2 }}>
                        {mc.body}
                      </div>
                    </div>
                  ))}
                  <Link href="/spotted" onClick={onClose} style={{ ...linkStyle, marginTop: 4 }}>
                    View Missed Connections board →
                  </Link>
                </div>
              )
            )}

            {tab === "gigs" && (
              gigs.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-lo)" }}>No gig postings at this venue yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {gigs.map(g => (
                    <div key={g.id} style={{ padding: "8px 0 8px 12px", borderLeft: `3px solid ${accent}` }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", color: accent }}>
                        {g.postType === "LOOKING_FOR_WORK" ? "Available" : "Gig"}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-hi)" }}>
                        {g.title}
                      </div>
                    </div>
                  ))}
                  <Link href="/pride-work" onClick={onClose} style={{ ...linkStyle, marginTop: 4 }}>
                    View the Gig Board →
                  </Link>
                </div>
              )
            )}
          </div>
          </div>
        </div>
        </div>{/* /.place-modal-panel__inner */}
      </div>
    </div>,
    document.body,
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--text-lo)",
};
const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: "0.9rem",
  color: "var(--c, var(--pink))",
  textDecoration: "none",
};
