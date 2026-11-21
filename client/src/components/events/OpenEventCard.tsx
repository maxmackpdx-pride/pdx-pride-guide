import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { NEW_TAB, directionsLinks, rideWebsiteLinks } from "@/lib/travelLinks";
import { useLocation } from "wouter";
import { useResponsivePoster } from "@/lib/useResponsivePoster";
import { restoreOriginalPoster, POSTER_DETAIL_SIZES } from "@/lib/responsivePoster";
import type React from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useModalA11y } from "@/hooks/useModalA11y";
import { CardStage } from "@/components/cards/CardStage";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { eventAge, eventPrice } from "@/lib/eventFacts";
import { listingPosterUrl } from "@/lib/dsEvent";
import { eventDateLabel, eventTimeLabel } from "@/lib/eventDisplay";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { resolveDirectoryLogo } from "@shared/directoryLogos";
import { sceneCollectiveLogo } from "@/components/scenez/sceneModel";
import { type EventListing } from "@shared/multiDayEvents";
import { pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import { getMissedConnectionWindow } from "@shared/missedConnections";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import { EventSharePopup, GigInvitePopup, ShareJoinPrompt, shareUrlFor, useShareJoinGate } from "./OpenCardShare";
import { EventGoingButton, EventInterestedHeart, EventPrivateSaveButton, EventReadStatus } from "./EventParticipation";
import EventPlanning from "./EventPlanning";
import { useOptionalInboxSheet } from "@/context/InboxSheetContext";
import AuthModal from "@/components/AuthModal";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { EventHostNotice } from "./EventHostNotice";
import { weekdayCode, dayColorVar, startMs, dateStrOf, countdownParts } from "./EventFlyerFront";
import { Car, Globe, MapPin, Moon, Ticket } from "lucide-react";
import { CarpoolRailCard, EventNearbyPlaceCard, EventRailCard, gigBoardPost, mizzBoardPosts, rideBoardPost, rideDirection, useBoardRailSaves, type PlanRide } from "./EventRailCards";
import { MAP_BRAND_COLOR, MapBrandMark, RIDE_BRAND_COLOR, RideBrandMark, type MapBrand, type RideBrand } from "@/components/cards/rideBrands";
import { memberProfileHref } from "@/lib/avatarLinks";
import { ActionSheetCard } from "@/components/cards/ActionSheetCard";
import { ExpandingActionPanel, usePermittedTravel } from "@/components/cards/ExpandingActionPanel";
import { FAMILY_LOGOS } from "@/components/cards/cardLogo";
import { EventFormCard, type EventFormKind } from "./EventFormCards";
import { RidezFormCard, type RidezMode } from "@/components/ridez/RidezFormCard";
import { RidezRail, type RideNeed } from "@/components/ridez/RidezRail";
import { RidezWhosComing } from "@/components/ridez/RidezWhosComing";
import { getAfterzWindow } from "@shared/afterzWindow";
import { FLIP_MS, flipIn, flipOut, haptic, rectOf, type OriginRect } from "@/components/cards/flipCard";
import "./FlyerBoard.css";

/**
 * The one open-event card (Tucker, t276u). Every entry point renders this:
 * the Eventz board, EventModal callers (hub feed, featured ad, inbox,
 * profile), /events/:id deep links, rails and the desktop map. Mobile is the
 * sheet from the top bar's midpoint to the dock; desktop is the same card
 * centered over the blurred stage. No attendee lists or counts.
 */
export type OpenEventCardProps = {
  listing: EventListing;
  onClose: () => void;
  /** Other listings, for the "more at this venue" strip. */
  related?: EventListing[];
  /** The tapped poster / row: the card flips and grows from it and shrinks back. */
  originRect?: OriginRect | null;
  /** 0 INFO, 1 FEED, 2 MAPS, 3 PEOPLE, 4 MORE (Gigz first), 5 NEARBY. */
  initialPage?: number;
};

export const OPAGE_NAMES = ["INFO", "FEED", "MAPS", "PEOPLE", "MORE", "NEARBY"];
const OPAGE_LABELS = OPAGE_NAMES;
function countdownLabel(ms: number): string {
  const p = countdownParts(Math.max(0, ms));
  const d = Number(p.d), h = Number(p.h), m = Number(p.m);
  return d > 0 ? `${d}D ${h}H` : h > 0 ? `${h}H ${m}M` : `${m}M`;
}
const DISMISS_PX = 110;
/** Only http(s) links become tiles. */
function webUrl(u?: string | null): string | null {
  if (!u) return null;
  try { const x = new URL(u.trim()); return x.protocol === "https:" || x.protocol === "http:" ? x.href : null; } catch { return null; }
}

type EventDetailResponse = {
  event?: {
    description?: string | null;
    isClaimable?: boolean;
    hasPendingClaim?: boolean;
    ticketUrl?: string | null;
    venueWebsite?: string | null;
  } | null;
  /** Only present when the server passes this viewer through the source
   *  link gate (admins / promoters / owner); absent for everyone else. */
  sourceLink?: string | null;
  hostGroup?: { slug?: string | null; name?: string | null } | null;
  venue?: {
    id?: number;
    address?: string | null;
    neighborhood?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  hosts?: Array<{ userId?: number; displayName?: string | null; username?: string | null; role?: string | null; photoUrl?: string | null }>;
  talent?: Array<{ userId?: number; addedByUserId?: number | null; displayName?: string | null; username?: string | null; role?: string | null }>;
  gigs?: Array<{ id?: number | string; title?: string | null; description?: string | null }>;
  missedConnections?: unknown[];
  nearby?: {
    restaurants?: Array<{ id?: number; name?: string | null; type?: string | null; neighborhood?: string | null; address?: string | null; imageUrl?: string | null; distanceMi?: number }>;
    events?: Array<{ id?: number; title?: string | null; venueName?: string | null; dateStart?: string | null }>;
  } | null;
};

function endMs(e: EventListing): number {
  return parsePacificDateTime(e.dateEnd) ?? startMs(e);
}

/** Live countdown states: STARTS IN Xd Yh -> TONIGHT (same Pacific day, before
 *  start) -> HAPPENING NOW -> ENDED. Undated ends count as over at midnight. */
export function openCountdown(e: EventListing, now: number): { state: "soon" | "tonight" | "now" | "ended"; label: string; big: string; chip: string } {
  const s = startMs(e);
  const day = dateStrOf(e);
  const today = pacificTodayDate(now);
  const end = e.dateEnd ? endMs(e) : null;
  const ended = end != null ? end <= now : s <= now && day < today;
  if (ended) return { state: "ended", label: "THIS EVENT", big: "ENDED", chip: "ENDED" };
  if (s <= now) return { state: "now", label: "HAPPENING", big: "NOW", chip: "HAPPENING NOW" };
  const p = countdownParts(s - now);
  const d = Number(p.d), h = Number(p.h), m = Number(p.m);
  const left = d > 0 ? `${d}D ${h}H` : h > 0 ? `${h}H ${m}M` : `${m}M`;
  if (day === today) return { state: "tonight", label: "TONIGHT · STARTS IN", big: left, chip: "TONIGHT" };
  return { state: "soon", label: "STARTS IN", big: left, chip: `STARTS IN ${left}` };
}

/** White SVG marks only (the reviewed logo store); legacy PNG packs are skipped. */
function whiteMark(name?: string | null): string | null {
  if (!name) return null;
  const src = resolveDirectoryLogo(name);
  return src && /\.svg(\?|$)/.test(src) ? src : null;
}

/** Seen ride ids per tile (activity dots); storage can be disabled. */
function readSeen(key: string): number[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as number[]; } catch { return []; }
}
function writeSeen(key: string, ids: number[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* private mode */ }
}

/** Drag offset on the open card. A module helper so the component never
 *  mutates the ref object useModalA11y returns (React Compiler immutability). */
function dragStyle(card: HTMLElement | null, dy: number, animate: boolean) {
  if (!card) return;
  card.style.transition = animate ? "translate .22s cubic-bezier(.2,.8,.2,1)" : "none";
  card.style.translate = dy ? `0 ${dy}px` : "";
}

function FlyerViewer({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const ref = useModalA11y({ open: true, onClose });
  return createPortal(
    <div className="oflyer" role="dialog" aria-modal="true" aria-label={`${title} flyer`} ref={ref}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <button type="button" className="oflyer-x" aria-label="Close flyer" onClick={onClose}>✕</button>
      <div className={`oflyer-scroll${zoom ? " is-zoom" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <img src={src} alt={`${title} flyer`} onDoubleClick={() => setZoom(z => !z)} onClick={e => e.stopPropagation()} />
      </div>
    </div>,
    document.body,
  );
}

type FeedBubble = { id: number; body: string; isMine?: boolean; isAnonymous?: boolean; displayName?: string; username?: string; photoUrl?: string | null };

/* FEED (t327u): the pregame call to action. The chat itself lives in the inbox
   with its existing plumbing; this slot shows only the newest bubbles that fit
   (transparent, no scroll, no input) and every tap routes to that inbox group
   chat. Joining = Going (POST /api/events/:id/attendance), as before. */
/** Runs after the card's close has changed the route (the inbox closes itself on
 *  route changes, so it must open after that). */
function afterRouteSettles(fn: () => void) { window.setTimeout(fn, 120); }

function EventFeedChat({ listing, onLeave }: { listing: EventListing; onLeave: (after: () => void) => void }) {
  const { user } = useAuth();
  const rsvp = useEventRsvp();
  const inbox = useOptionalInboxSheet();
  const joined = rsvp.myEventIds.has(listing.id);
  const pending = rsvp.isRsvpPending(listing.id);
  const member = joined && !!user;
  const chat = useQuery<{ messages?: FeedBubble[] }>({
    queryKey: ["/api/events", listing.id, "chat", "preview"],
    queryFn: () => apiRequest("GET", `/api/events/${listing.id}/chat`).then(r => r.json()),
    enabled: member,
    staleTime: 15_000,
  });
  const bubbles = (Array.isArray(chat.data?.messages) ? chat.data.messages : []).slice(-3);
  const target = { kind: "EVENT" as const, id: listing.id, title: listing.title, calendarDate: dateStrOf(listing) };
  /* The inbox is a header sheet, so the card closes first and the inbox opens on
     the event's group chat (no second chat UI inside the card). */
  const openRoom = (el?: HTMLElement) => { void el; onLeave(() => inbox?.openSheet({ view: "chats", group: target })); };
  const join = (el: HTMLElement) => {
    if (member) { openRoom(el); return; }
    if (!user) { rsvp.toggleRsvp(listing.id); return; }
    rsvp.toggleRsvp(listing.id);
    openRoom(el);
  };
  return (
    <div className="ofeed ofeed--pregame">
      <p className="osec ofeed-h">THE PREGAME <span className="osec-r">GROUP CHAT · INBOX</span></p>
      <div className="ofeed-cta">
        {member && bubbles.length ? null : <p className="ofeed-cta-t">{member ? "Start the pregame" : "Join the pregame"}</p>}
        {member && bubbles.length ? null : <p className="ofeed-cta-s">{member ? "The group chat for this night lives in your inbox." : "The group chat for this night, in your inbox. Joining marks you Going."}</p>}
        <button type="button" data-action="join-chat" className="obtn obtn--accent" disabled={pending || rsvp.loading} onClick={e => join(e.currentTarget)}>
          {pending ? "JOINING…" : member ? "OPEN THE PREGAME" : user ? "JOIN THE PREGAME" : "SIGN IN TO JOIN THE PREGAME"}
        </button>
      </div>
      {member && bubbles.length ? (
        <button type="button" className="ofeed-peek" aria-label={`Open the ${listing.title} group chat in your inbox`} onClick={e => openRoom(e.currentTarget)}>
          {bubbles.map(m => {
            const name = m.isAnonymous ? "Someone" : m.displayName || m.username || "Member";
            return (
              <span key={m.id} className={`ofeed-b${m.isMine ? " is-mine" : ""}`}>
                <span className="ofeed-av" aria-hidden="true">{m.photoUrl ? <img src={m.photoUrl} alt="" /> : name.slice(0, 1).toUpperCase()}</span>
                <span className="ofeed-bubble">{m.isMine ? null : <small>@{m.username || name}</small>}{m.body}</span>
              </span>
            );
          })}
        </button>
      ) : null}
      {rsvp.showAuth && <AuthModal onClose={() => rsvp.setShowAuth(false)} />}
    </div>
  );
}

export default function OpenEventCard({ listing, onClose, related = [], initialPage = 0, originRect = null }: OpenEventCardProps) {
  const closingRef = useRef(false);
  const [, navigate] = useLocation();
  const requestClose = (fromY = 0, after?: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    void flipOut(cardEl.current, originRect, fromY).then(() => { onClose(); if (after) afterRouteSettles(after); });
  };
  const openListing = listing;
  const { user: viewer } = useAuth();
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const [opage, setOpage] = useState(initialPage);
  const [oday, setOday] = useState(0);
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [gigPop, setGigPop] = useState<null | { gig: string; mode: "message" | "invite" }>(null);
  const [sharePop, setSharePop] = useState(false);
  const gate = useShareJoinGate();
  const [form, setForm] = useState<null | { kind: EventFormKind; gigTitle?: string }>(null);
  /* Tile panel (t345u): Ridez / Afterz / Directions open in-card, not as sheets. */
  const [panel, setPanel] = useState<null | { kind: "maps" | "rides" | "afterz"; el?: HTMLElement; closing?: boolean }>(null);
  /* Expanded carpool card: design pending, so a marked stub (owner, Nov 20). */
  const [carpoolStub, setCarpoolStub] = useState<null | { origin: OriginRect | null; el?: HTMLElement }>(null);
  /* OFFER A RIDE / I NEED A RIDE (owner, Nov 20): the shared Ridez form, event preselected. */
  const [ridezForm, setRidezForm] = useState<null | { mode: RidezMode; origin: OriginRect | null }>(null);
  const [whosComing, setWhosComing] = useState<null | { needId: number; origin: OriginRect | null }>(null);
  const [item, setItem] = useState<null | { kind: "gig" | "mizz"; id: number; title: string; body?: string | null; origin: OriginRect | null }>(null);
  const [popOrigin, setPopOrigin] = useState<OriginRect | null>(null);
  const [night, setNight] = useState<undefined | "rides" | "afterz">(undefined);
  const [rideKind, setRideKind] = useState<undefined | "carpool" | "home">(undefined);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const cardEl = useModalA11y({ open: !flyerOpen, onClose: () => requestClose() });
  useLayoutEffect(() => { flipIn(cardEl.current, originRect); haptic(8); }, []);
  useEffect(() => {
    const el = pagesRef.current;
    if (el) el.scrollLeft = initialPage * el.clientWidth;
  }, [openListing.id, initialPage]);
  const goOpage = (i: number) => {
    const el = pagesRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const detailQuery = useQuery<EventDetailResponse>({
    queryKey: ["/api/events", openListing.id, "detail", viewer?.id, dateStrOf(openListing)],
    queryFn: () => apiRequest("GET", `/api/events/${openListing.id}/detail?date=${encodeURIComponent(dateStrOf(openListing))}`).then(r => r.json()),
    enabled: openListing.id > 0,
    staleTime: 60_000,
  });

  const openAccent = openListing.accentColor || dayColorVar(dateStrOf(openListing));
  const [failedOpenPoster, setFailedOpenPoster] = useState<string>();
  const openPosterUrl = listingPosterUrl(openListing);
  const openPoster = openPosterUrl === failedOpenPoster ? null : openPosterUrl;
  /* Same DPR-aware variant delivery as the old EventModal poster (srcset +
     detail sizes); a failed variant retries the original before the fallback. */
  const heroPoster = useResponsivePoster(openPoster, POSTER_DETAIL_SIZES);
  const cd = openCountdown(openListing, tick);
  const openCdText = cd.chip;
  const venueId = detailQuery.data?.venue?.id;
  const venueQuery = useQuery<{ promoters?: { id: number; displayName?: string; username: string }[] }>({
    queryKey: ["/api/placez", venueId, "card-extras"],
    queryFn: () => apiRequest("GET", `/api/placez/${venueId}`).then(r => r.json()),
    enabled: !!venueId,
    staleTime: 300_000,
  });
  const detailStatus = <EventReadStatus label="Event details" query={detailQuery} />;
  const mizzCount = detailQuery.data?.missedConnections?.length;
  const detailEvent = detailQuery.data?.event ?? null;
  const detailVenue = detailQuery.data?.venue ?? null;
  const hosts = detailQuery.data?.hosts ?? [];
  const talent = detailQuery.data?.talent ?? [];
  const nearbyR = detailQuery.data?.nearby?.restaurants ?? [];
  const nearbyE = detailQuery.data?.nearby?.events ?? [];
  const openAddr = detailVenue?.address || openListing?.address || "";
  const eventJsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "Event", "@id": `https://zaylist.com/api/events/${openListing.id}`,
    name: openListing.title, startDate: openListing.dateStart, ...(openListing.dateEnd ? { endDate: openListing.dateEnd } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: openListing.venueName, ...(openAddr ? { address: openAddr } : {}) },
    ...(listingPosterUrl(openListing) ? { image: listingPosterUrl(openListing) } : {}),
    url: `https://zaylist.com${eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing))}`,
  }).replace(/</g, "\\u003c");
  const openDesc = detailEvent?.description || openListing?.description || "";
  const openTicket = detailEvent?.ticketUrl || openListing?.ticketUrl || "";
  /* The detail payload carries sourceLink only when the server's gate
   * passed for this viewer (admins / promoters / owner) — rendering it
   * here inherits the gate exactly; everyone else never receives it. */
  const openSourceLink = /^https?:\/\//i.test(detailQuery.data?.sourceLink || "") ? (detailQuery.data?.sourceLink as string) : "";
  const openHostGroup = detailQuery.data?.hostGroup ?? null;
  const openClaimable = detailEvent?.isClaimable ?? openListing?.isClaimable ?? false;
  const openPending = detailEvent?.hasPendingClaim ?? Boolean((openListing as { hasPendingClaim?: boolean } | null)?.hasPendingClaim);
  const openLat = detailVenue?.lat ?? openListing?.lat ?? null;
  const openLng = detailVenue?.lng ?? openListing?.lng ?? null;
  const pinX = openLng != null ? Math.min(92, Math.max(8, ((openLng + 122.85) / 0.4) * 100)) : 50;
  const pinY = openLat != null ? Math.min(88, Math.max(10, ((45.65 - openLat) / 0.2) * 100)) : 50;
  /* More-at-venue strip: the open event's venue, day by day, for the 7
   * days starting on the event's own day (same shape as the expanded
   * card's strip on the event page). */
  const openStrip = useMemo(() => {
    type StripDay = { ds: string; dow: string; num: number; items: EventListing[] };
    if (!openListing) return [] as StripDay[];
    const start = dateStrOf(openListing);
    const [sy, sm, sd] = start.split("-").map(Number);
    const out: StripDay[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = new Date(Date.UTC(sy, sm - 1, sd + i)).toISOString().slice(0, 10);
      const items = related
        .filter(e2 => e2.id !== openListing.id && e2.venueName === openListing.venueName && dateStrOf(e2) === ds)
        .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
      out.push({ ds, dow: weekdayCode(ds), num: Number(ds.slice(8, 10)), items });
    }
    return out;
  }, [openListing, related]);

  const canManage = Boolean((viewer as { isAdmin?: boolean } | null)?.isAdmin) || Boolean(viewer && hosts.some(h => h.userId === viewer.id));
  /* Countdown marks (Tucker, t286u/t287u): venue and hosting collective,
     both from the reviewed white SVG store, matched by name. */
  const logos = (() => {
    const out: { src: string; alt: string; href: string; side: "venue" | "host" }[] = [];
    const v = whiteMark(openListing.venueName);
    if (v) out.push({ side: "venue", src: v, alt: openListing.venueName, href: detailVenue?.id ? placePath(detailVenue.id, openListing.venueName) : "" });
    const hostName = openHostGroup?.name || null;
    /* A party collective's own saved logo (SceneZ collective art) wins over the
       name-matched directory trace (t331u: Yes Coach). */
    const h = sceneCollectiveLogo(openHostGroup?.slug) ?? whiteMark(hostName);
    if (h && h.split("?")[0] !== v?.split("?")[0]) out.push({ side: "host", src: h, alt: hostName!, href: openHostGroup?.slug ? `/z/${openHostGroup.slug}` : "" });
    return out;
  })();
  /* One-tap directions and rides, from venue coords or the address. */
  const geo = openLat != null && openLng != null ? `${openLat},${openLng}` : "";
  const nick = encodeURIComponent(openListing.venueName);
  /* Ride and map links come from one shared helper (lib/travelLinks): websites / universal URLs
     in a new tab, the venue as destination where the URL supports it. */
  const travelPlace = { name: openListing.venueName, address: openAddr || null, lat: openLat, lng: openLng };

  const mizzWin = getMissedConnectionWindow(openListing.dateStart, openListing.dateEnd, tick);
  const mizzPosts = (detailQuery.data?.missedConnections ?? []) as MissedConnectionPost[];
  const planningDate = dateStrOf(openListing);
  const planningBase = `/api/events/${openListing.id}/occurrences/${planningDate}/planning`;
  const planning = useQuery<{ canPostGig?: boolean; gigs?: { id: number; title: string; description?: string | null }[]; rides?: PlanRide[] | null; needs?: RideNeed[] | null }>({
    queryKey: [planningBase, viewer?.id ?? null],
    queryFn: () => apiRequest("GET", planningBase).then(r => r.json()),
    enabled: openListing.id > 0,
  });
  const canPostGig = Boolean(planning.data?.canPostGig);
  const gigs = planning.data?.gigs ?? (detailQuery.data?.gigs ?? []).filter((g): g is { id: number; title: string; description?: string | null } => typeof g.id === "number" && !!g.title);
  const hostOnZaylist = hosts.some(h => h.username);
  const [railAuth, setRailAuth] = useState(false);
  const railSaves = useBoardRailSaves(() => setRailAuth(true));
  const mizzCards = mizzBoardPosts(mizzPosts);
  /* Both directions show anytime, each labeled at the card top (t335u/t336u). */
  const rideCards = (planning.data?.rides ?? []).flatMap(r => { const post = rideBoardPost(r, openListing.venueName); return post ? [{ post, tag: rideDirection(r) }] : []; });
  /* Afterz window (shared helper, same rule as the server): opens 72h before
     doors, closes 30 min after the end. */
  const afterzWin = getAfterzWindow(openListing.dateStart, openListing.dateEnd, tick);
  /* Activity dots (t314u): ride posts this viewer hasn't seen since they last
     opened the tile; stored per event in localStorage. No counts. */
  const rideIds = (kind: "carpool" | "afterz") => (planning.data?.rides ?? []).filter(r => (r.plan?.kind === "afterz") === (kind === "afterz")).map(r => r.id);
  const seenKey = (kind: string) => `zaylist:seen:${kind}:${openListing.id}:${planningDate}`;
  const [seenTick, setSeenTick] = useState(0);
  const hasNew = (kind: "carpool" | "afterz") => {
    void seenTick;
    const ids = rideIds(kind);
    if (!ids.length || typeof localStorage === "undefined") return false;
    const seen = readSeen(seenKey(kind));
    return ids.some(id => !seen.includes(id));
  };
  const markSeen = (kind: "carpool" | "afterz") => {
    writeSeen(seenKey(kind), rideIds(kind));
    setSeenTick(t => t + 1);
  };
  const shareMeta = `${eventDateLabel(openListing.dateStart)} · ${eventTimeLabel(openListing.dateStart)} · ${openListing.venueName}`;
  const sharePath = eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing));
  const sharedFrom = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

  /* Locked app tiles (Tucker, t288u): each shows only when its feature or
     data exists for this event. Colors: carpool orange, afterz yellow, host
     violet, maps acid green, rideshare hot pink. */
  const hasPlace = Boolean(geo || openAddr);
  const live = cd.state !== "ended" && openListing.id > 0;
  const [nightOrigin, setNightOrigin] = useState<{ rect: OriginRect | null; seq: number }>({ rect: null, seq: 0 });
  const openNight = (n: "rides" | "afterz", el?: HTMLElement, kind?: "carpool" | "home") => {
    setNight(n); setRideKind(kind);
    setNightOrigin(o => ({ rect: rectOf(el?.querySelector(".otile-face") ?? null), seq: o.seq + 1 }));
    setOpage(4); goOpage(4);
  };
  const mapLinks = directionsLinks(travelPlace);
  const [addrCopied, setAddrCopied] = useState(false);
  const copyAddress = () => {
    const text = [openListing.venueName, openAddr].filter(Boolean).join(", ");
    void navigator.clipboard?.writeText(text).then(() => { setAddrCopied(true); window.setTimeout(() => setAddrCopied(false), 1600); }, () => {});
  };
  /* Ride website tiles (t327u): brand mark + brand color (third-party brand exception). */
  const rideOptions = rideWebsiteLinks(travelPlace).map(l => ({
    brand: l.key, name: l.name, label: l.label, href: l.href,
    icon: <RideBrandMark brand={l.key as RideBrand} glyph={l.key === "trimet"} />, color: RIDE_BRAND_COLOR[l.key as RideBrand],
  }));
  /* Directions header (t345u): distance + travel time, only when location is already permitted. */
  const travel = usePermittedTravel(openLat != null && openLng != null ? { lat: openLat, lng: openLng } : null, panel?.kind === "maps");
  type Tile = { key: string; label: string; color: string; icon: React.ReactNode; href?: string; external?: boolean; aria?: string; popup?: boolean; badge?: string; dot?: boolean };
  /* Host slot above the tiles (Tucker, t308u). One wide slot, three cases:
     claimable -> CLAIM THIS EVENT; a promoter (person) hosts -> face stack +
     name linking to them; venue or collective/group -> no slot (they're
     linked from the venue row / countdown logos). Never attendee counts. */
  const normName = (v?: string | null) => (v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const promoters = openHostGroup?.slug ? [] : hosts.filter(h => h.username && normName(h.displayName || h.username) !== normName(openListing.venueName));
  const hostSlot: null | "claim" | "promoter" = openClaimable && !openPending ? "claim" : promoters.length ? "promoter" : null;
  const lastTileKey = `zaylist:last-tile:${openListing.id}`;
  const [lastTile, setLastTile] = useState<string | null>(() => { try { return localStorage.getItem(lastTileKey); } catch { return null; } });
  const closePanel = () => setPanel(p => (p ? { ...p, closing: true } : p));
  const togglePanel = (kind: "maps" | "rides" | "afterz", el: HTMLElement) => {
    if (panel && panel.kind === kind && !panel.closing) { closePanel(); return; }
    setPanel({ kind, el });
    setLastTile(kind);
    try { localStorage.setItem(lastTileKey, kind); } catch { /* private mode */ }
  };
  /* Tile row (owner, Nov 20): TICKETS (--neon-red) first and the VENUE WEBSITE (--neon-violet) last,
     both opening in a new tab; each hides when the event has no such link. */
  const venueSite = webUrl(detailEvent?.venueWebsite || (openListing as { venueWebsite?: string | null }).venueWebsite);
  const ticketSite = webUrl(openTicket);
  const tiles: Tile[] = [
    ...(ticketSite ? [{ key: "tickets", label: "TICKETS", color: "var(--neon-red)", icon: <Ticket />, href: ticketSite, external: true, aria: "Tickets (opens in a new tab)" }] : []),
    ...(hasPlace || live ? [{ key: "rides", label: "RIDEZ", color: "var(--neon-orange)", icon: <Car />, popup: true, dot: live && hasNew("carpool") }] : []),
    ...(live ? [{ key: "afterz", label: "AFTERZ", color: "var(--yellow)", icon: <Moon />, popup: true,
      badge: afterzWin?.state === "before" ? `OPENS ${countdownLabel(afterzWin.opensAt - tick).split(" ")[0]}` : undefined, dot: hasNew("afterz") }] : []),
    ...(hasPlace ? [{ key: "maps", label: "DIRECTIONS", color: "var(--green-acid)", icon: <MapPin />, popup: true }] : []),
    ...(venueSite ? [{ key: "venue-website", label: "WEBSITE", color: "var(--neon-violet)", icon: <Globe />, href: venueSite, external: true, aria: `${openListing.venueName} website (opens in a new tab)` }] : []),
  ];
  /* Tiles are plain data; the tap handler lives here so render never builds
     closures over refs (React Compiler). */
  const onTile = (key: string, el: HTMLElement) => {
    if (key === "rides") markSeen("carpool");
    if (key === "afterz") markSeen("afterz");
    if (key === "afterz" || key === "maps" || key === "rides") togglePanel(key, el);
  };

  /* Swipe down to dismiss (mobile): drag from the locked title / tab area
     while the scroller is at its top; snap back under the threshold. */
  const drag = useRef<{ y: number; dy: number; id: number; active: boolean; moved: boolean } | null>(null);
  const setDragY = (dy: number, animate: boolean) => {
    dragStyle(cardEl.current, dy, animate);
  };
  const dragHandlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!window.matchMedia("(max-width: 1099px)").matches) return;
      if ((e.target as HTMLElement).closest("a,input,button:not([role=tab])")) { drag.current = null; return; }
      const sc = cardEl.current?.querySelector<HTMLElement>(".oscrollarea");
      if (sc && sc.scrollTop > 2) return;
      if ((cardEl.current?.scrollTop ?? 0) > 2) return;
      drag.current = { y: e.clientY, dy: 0, id: e.pointerId, active: false, moved: false };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      d.dy = Math.max(0, e.clientY - d.y);
      if (!d.active && d.dy > 8) {
        d.active = true; d.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      if (d.active) setDragY(d.dy, false);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      if (d.active && d.dy > DISMISS_PX) { haptic(12); requestClose(d.dy); }
      else if (d.active) setDragY(0, true);
      window.setTimeout(() => { drag.current = null; }, 0);
    },
    onPointerCancel: () => { if (drag.current?.active) setDragY(0, true); drag.current = null; },
  };
  /* Tap the poster (any bare part of the locked head) for the full flyer. */
  const onHeadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current?.moved) return;
    const t = e.target as HTMLElement;
    if (!openPoster || t.closest("a,button,.ochip,[role=tab]")) return;
    setFlyerOpen(true);
  };

  return (
      <CardStage className="fbx oevent" onClose={() => requestClose()}>
        <div
          className={`ocard on${panel ? " ocard--panel" : ""}`} ref={cardEl}
          onClickCapture={e => { if (!gate.gated || gate.prompt || (e.target as HTMLElement).closest(".ox, .zas-scrim")) return; e.preventDefault(); e.stopPropagation(); gate.setPrompt(true); }}
          style={{ "--a": openAccent } as CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-label={openListing.title}
          data-zay-card="event"
          data-event-id={openListing.id}
          data-occurrence={dateStrOf(openListing)}
        >
          {/* Machine-readable event (t318u): schema.org Event for users' agents.
              No attendee counts or lists. */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: eventJsonLd }} />
          <button type="button" className="ox" aria-label="Close event" data-action="close" onClick={() => requestClose()}>✕</button>
          {/* Poster layer (Tucker, t277): natural aspect from the card top, behind
              the locked head AND the scroller, fading out at its own bottom edge. */}
          <div className="ohero" ref={heroRef}>
              {openPoster ? (
                <img {...heroPoster} className="ohero-img" alt="" fetchPriority="high" decoding="async" onError={e => { if (!restoreOriginalPoster(e.currentTarget, openPoster)) setFailedOpenPoster(openPoster); }} />
              ) : (
                <div
                  className="ohero-typo"
                  style={{ background: `linear-gradient(160deg, ${openAccent} 0%, var(--evz-ink-0a0a0e) 78%)` }}
                >
                  <div className="typo-t">{openListing.title}</div>
                  <div className="typo-v" style={{ color: openAccent }}>
                    {openListing.venueName.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          <div className="ohead" {...dragHandlers} onClick={onHeadClick} onClickCapture={e => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); } }}>
            {openPoster ? <button type="button" className="ovisually-hidden" onClick={() => setFlyerOpen(true)}>View full flyer</button> : null}
            <div className="oid">
              <h2>{openListing.title}</h2>
              <div className="ometarow">
              <p className="ometa">
                <span className="owhen">{eventDateLabel(openListing.dateStart)} · {eventTimeLabel(openListing.dateStart)}</span>
                <span className="osep" aria-hidden="true"> · </span>
                {detailVenue?.id ? (
                  <a className="ovenue" href={placePath(detailVenue.id, openListing.venueName)} aria-label={`Open ${openListing.venueName} place card`}>
                    {openListing.venueName}
                  </a>
                ) : openListing.venueName}
              </p>
              <div className="ochips">
                <span className="ochip">{eventAge(openListing.ageRequirement)==="Not stated"?"Age not stated":eventAge(openListing.ageRequirement)}</span>
                {openListing.isSexPositive ? <span className="ochip">SEX-POSITIVE</span> : null}
                {/* The countdown box owns "starts in"; the chip only flags live states. */}
                {cd.state !== "soon" ? <span className={`ochip ochip--${cd.state}`}>{openCdText}</span> : null}
              </div>
              </div>
            </div>
            {hostSlot === "claim" ? (
              <a data-action="claim" className="obtn obtn--accent ohostslot oclaim" href={`/submit/claim/${openListing.id}`} onClick={e => { e.preventDefault(); setForm({ kind: "claim" }); }}>
                CLAIM THIS EVENT <span aria-hidden="true">›</span>
              </a>
            ) : hostSlot === "promoter" ? (
              <a data-action="open-host" className="ohostslot opromo" href={memberProfileHref(promoters[0].username) || "#"}>
                <span className="ofaces" aria-hidden="true">
                  {promoters.slice(0, 3).map((h, i) => (
                    <span key={h.username ?? i} className="oface">
                      {h.photoUrl ? <img src={h.photoUrl} alt="" loading="lazy" /> : (h.displayName || h.username || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  ))}
                </span>
                <span className="opromo-t">
                  <span className="opromo-k">HOSTED BY</span>
                  <span className="opromo-n">{promoters[0].displayName || promoters[0].username}{promoters.length > 1 ? ` + ${promoters[1].displayName || promoters[1].username}${promoters.length > 2 ? ` + ${promoters.length - 2}` : ""}` : ""}</span>
                </span>
                <span className="opromo-go" aria-hidden="true">›</span>
              </a>
            ) : null}
            {tiles.length ? (
              <nav className="otiles" aria-label="Event actions" data-panel={panel && !panel.closing ? panel.kind : undefined} data-tiles={tiles.length} style={{ "--tiles": tiles.length } as CSSProperties}>
                {tiles.map(t => t.href ? (
                  <a key={t.key} data-action={t.key} className="otile" href={t.href} {...(t.external ? NEW_TAB : {})} aria-label={t.aria}
                    style={{ "--tile": t.color } as CSSProperties}>
                    <span className="otile-face" aria-hidden="true">{t.icon}</span>
                    <span className="otile-l">{t.label}</span>
                  </a>
                ) : (
                  <button key={t.key} type="button" data-action={t.key} className={`otile${panel && !panel.closing && panel.kind === t.key ? " is-active" : ""}`} aria-expanded={t.popup ? Boolean(panel && !panel.closing && panel.kind === t.key) : undefined} aria-controls={t.popup ? "ocard-tile-panel" : undefined}
                    aria-label={`${t.label}${t.badge ? `, ${t.badge.toLowerCase()}` : ""}${t.dot ? ", new activity" : ""}`}
                    onClick={e => {
                      /* Press feedback (t314u): the face dips and glows for 90ms, then the sheet grows from it. */
                      const el = e.currentTarget;
                      el.classList.add("is-pressed");
                      window.setTimeout(() => { el.classList.remove("is-pressed"); onTile(t.key, el); }, 90);
                    }}
                    style={{ "--tile": t.color } as CSSProperties}>
                    <span className="otile-face" aria-hidden="true">{t.icon}{t.dot ? <i className="otile-dot" /> : null}</span>
                    {t.badge ? <span className="otile-badge" aria-hidden="true">{t.badge}</span> : null}
                    <span className="otile-l">{t.label}</span>
                    {/* Last opened tile (t345u): a small dot, never an auto-open. */}
                    {lastTile === t.key ? <i className="otile-last" aria-hidden="true" /> : null}
                  </button>
                ))}
              </nav>
            ) : null}
            {panel ? (
              <div id="ocard-tile-panel">
                {panel.kind === "afterz" ? (
                  <ExpandingActionPanel panelKey="afterz" open={!panel.closing} onRequestClose={closePanel} onClosed={() => setPanel(null)}
                    label="Afterz" accent="var(--yellow)" logo={FAMILY_LOGOS.afterz} kicker="AFTERZ" title={openListing.title.toUpperCase()}
                    actions={[
                      { label: "INVITE FRIENDS", primary: true, onClick: () => { setPanel(null); setForm({ kind: "afterz-invite" }); } },
                      afterzWin?.state === "open"
                        ? { label: "INVITE PEOPLE NEARBY", onClick: () => { const el = panel.el; setPanel(null); openNight("afterz", el); } }
                        : { label: afterzWin?.state === "before" ? `NEARBY OPENS IN ${countdownLabel(afterzWin.opensAt - tick)}` : "NEARBY INVITES CLOSED", disabled: true },
                    ]}>
                    <p className="zas-note">
                      {afterzWin?.state === "before"
                        ? "Invite friends now. When Afterz opens (72 hours before doors), you can also invite people in the area to request to join you at the event."
                        : afterzWin?.state === "open"
                          ? "Afterz is open: you can also invite people in the area to request to join you at the event."
                          : "Afterz has closed for this event. You can still message friends."}
                      {" "}Area invites never show on the map.
                    </p>
                  </ExpandingActionPanel>
                ) : panel.kind === "maps" ? (
                  <ExpandingActionPanel panelKey="maps" open={!panel.closing} onRequestClose={closePanel} onClosed={() => setPanel(null)}
                    label="Directions" accent="var(--green-acid)" kicker="DIRECTIONS">
                    <div className="zdir-where">
                      <div className="zdir-where-t">
                        <b>{openListing.venueName}</b>
                        {openAddr ? <span>{openAddr}</span> : null}
                      </div>
                      <button type="button" className="obtn zdir-copy" data-action="copy-address" onClick={copyAddress} aria-label={`Copy the address of ${openListing.venueName}`}>
                        {addrCopied ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    {travel ? (
                      <div className="zdir-chips" aria-label="Distance and travel time">
                        {travel.split(" · ").map(c => <span key={c} className="zdir-chip">{c}</span>)}
                      </div>
                    ) : null}
                    <div className="zdir-grid">
                      {mapLinks.map(l => (
                        <a key={l.key} className={`zdir-tile${l.external ? "" : " zdir-tile--primary"}`} data-action={`directions-${l.key}`} href={l.href}
                          {...(l.external ? NEW_TAB : {})} aria-label={l.label}
                          style={{ "--obtn-c": l.key === "zaylist" ? "var(--green-acid)" : MAP_BRAND_COLOR[l.key as MapBrand] } as CSSProperties}>
                          <span className="zride-tile-icon" aria-hidden="true"><MapBrandMark brand={l.key as MapBrand | "zaylist"} /></span>
                          <span className="zride-tile-label">{l.name}</span>
                        </a>
                      ))}
                    </div>
                  </ExpandingActionPanel>
                ) : (
                  /* Ridez (t327u/t329u): carpools (wide-short cards) above the ride websites. */
                  <ExpandingActionPanel panelKey="rides" open={!panel.closing} onRequestClose={closePanel} onClosed={() => setPanel(null)}
                    label="Ridez" accent="var(--neon-orange)" title={`TO ${openListing.venueName.toUpperCase()}`} logo="ridez-pending" centered>
                    {live ? (
                      <>
                        <RidezRail rides={planning.data?.rides} needs={planning.data?.needs} signedOut={!viewer || planning.data?.rides == null}
                          onOffer={e => setRidezForm({ mode: "offer", origin: rectOf(e.currentTarget) })}
                          onNeed={e => setRidezForm({ mode: "need", origin: rectOf(e.currentTarget) })}
                          onLead={el => setCarpoolStub({ origin: rectOf(el), el })}
                          onOpenRide={(_r, el) => { setCarpoolStub(null); setPanel(null); openNight("rides", el); }}
                          onOpenNeed={(_n, el) => setRidezForm({ mode: "offer", origin: rectOf(el) })}
                          onWhosComing={(needId, el) => setWhosComing({ needId, origin: rectOf(el) })} />
                      </>
                    ) : null}
                    {hasPlace ? (
                      <>
                        <p className="zas-sec">RIDE APPS <span>OPENS THE WEBSITE</span></p>
                        {/* Brand-color icon tiles (third-party brand exception); websites in a new tab. */}
                        <div className="zride-tiles">
                          {rideOptions.map(o => (
                            <a key={o.brand} className="zride-tile" data-action={`ride-${o.brand}`} href={o.href} {...NEW_TAB}
                              style={{ "--obtn-c": o.color } as CSSProperties} aria-label={o.label}>
                              <span className="zride-tile-icon" aria-hidden="true">{o.icon}</span>
                              <span className="zride-tile-label">{o.name}</span>
                            </a>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </ExpandingActionPanel>
                )}
              </div>
            ) : null}
            <div className="otabs" role="tablist" aria-label="Event card pages">
              {OPAGE_NAMES.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={opage === i}
                  className={opage === i ? "on" : ""}
                  onClick={() => goOpage(i)}
                >
                  {n}
                </button>
              ))}
            </div>
            </div>
          <div className="oscrollarea">
            <div
              className="opages"
              ref={pagesRef}
              onScroll={e => {
                const el = e.currentTarget;
                const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (i !== opage) setOpage(i);
              }}
            >
              <section className="opage" inert={opage!==0} aria-hidden={opage!==0} aria-label="Info">
                <p className="osec">EVENT DETAILS</p>
                <div className={`ostarts ologos-${logos.length}${cd.state === "now" ? " is-live" : ""}`} data-state={cd.state}>
                  {/* Countdown (t345u): fixed size, dead center; venue mark directly left,
                      collective/host mark directly right, on one center line. Never stacked. */}
                  {(["venue", "host"] as const).map(side => {
                    const l = logos.find(x => x.side === side);
                    const img = l ? <img src={l.src} alt={l.alt} title={l.alt} /> : null;
                    return (
                      <span key={side} className={`ologo-slot ologo-slot--${side}`} aria-hidden={l ? undefined : true}>
                        {l && l.href ? <a href={l.href} aria-label={`Open ${l.alt}`}>{img}</a> : img}
                      </span>
                    );
                  })}
                  <span className="ostarts-count">
                    <i>{cd.label}</i>
                    <b>{cd.big}</b>
                  </span>
                </div>
                <div className="okv">
                  <span className="ok">WHEN</span>
                  <span>
                    {eventDateLabel(openListing.dateStart)} · {eventTimeLabel(openListing.dateStart)}
                  </span>
                </div>
                <div className="okv">
                  <span className="ok">WHERE</span>
                  <span>
                    {detailVenue?.id ? (
                      <a className="ovenue" href={placePath(detailVenue.id, openListing.venueName)}>
                        {openListing.venueName}
                      </a>
                    ) : (
                      openListing.venueName
                    )}
                    {openAddr ? (
                      <>
                        <br />
                        {openAddr}
                      </>
                    ) : null}
                  </span>
                </div>
                {openDesc ? <p className="odesc">{openDesc}</p> : null}
                <div className="okv">
                  <span className="ok">ADMISSION</span>
                  <span>{eventPrice(openListing.admission)}</span>
                </div>
                <div className="okv">
                  <span className="ok">AGE</span>
                  <span>{eventAge(openListing.ageRequirement)}</span>
                </div>
                {openTicket ? (
                  <a className="olinkbtn accent" href={openTicket} target="_blank" rel="noreferrer">
                    GET TICKETS <span>↗</span>
                  </a>
                ) : null}
                {openSourceLink ? (
                  <a className="olinkbtn" href={openSourceLink} target="_blank" rel="noreferrer">
                    SOURCE LINK <span>↗</span>
                  </a>
                ) : null}
                {openClaimable ? (
                  <p className="onote">
                    This event has not been claimed by its organizer. Details were sourced from public listings —
                    confirm time, venue, and ticketing directly before attending.
                    {openPending ? " A claim is pending admin review." : ""}
                  </p>
                ) : null}
                <a data-action="report" className="olinkbtn" href={eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing))} onClick={e => { e.preventDefault(); setForm({ kind: "report" }); }}>
                  REPORT / REQUEST A CHANGE <span>›</span>
                </a>
                {canManage ? (
                  <a className="olinkbtn" href={`${eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing))}?manage=1`}>
                    MANAGE EVENT <span>›</span>
                  </a>
                ) : null}
                {/* Public attendance, once, at the foot of Info (lead review, v8): not repeated on every tab. */}
                <div className="ogoing">
                  <EventGoingButton eventId={openListing.id} past={!!openListing.dateEnd && endMs(openListing) < tick} poster />
                </div>
                <EventHostNotice className="onote" />
              </section>
              <section className="opage opage--feed" inert={opage!==1} aria-hidden={opage!==1} aria-label="Feed">
                <EventFeedChat listing={openListing} onLeave={after => requestClose(0, after)} />
              </section>
              <section className="opage" inert={opage!==2} aria-hidden={opage!==2} aria-label="Maps">
                <p className="osec">
                  MAP & DIRECTIONS <span className="osec-r">LOCATION OVERVIEW</span>
                </p>
                <div className="omap" aria-hidden="true">
                  <span className="omap-river" />
                  <span className="omap-road" style={{ left: 0, right: 0, top: "30%", height: 7 }} />
                  <span className="omap-road" style={{ top: 0, bottom: 0, left: "38%", width: 7 }} />
                  <span className="omap-road" style={{ left: 0, right: 0, top: "74%", height: 5 }} />
                  <span className="omap-tag">REAL LOCATION · NO STREET TILES</span>
                  <span className="omap-pin" style={{ left: `${pinX}%`, top: `${pinY}%` }} />
                </div>
                <div className="okv">
                  <span className="ok">VENUE</span>
                  <span>
                    {openListing.venueName}
                    {openAddr ? (
                      <>
                        <br />
                        {openAddr}
                      </>
                    ) : null}
                  </span>
                </div>
              </section>
              <section className="opage" inert={opage!==3} aria-hidden={opage!==3} aria-label="People">
                {openHostGroup?.slug ? (
                  <a className="olinkbtn" href={`/z/${openHostGroup.slug}`}>
                    HOSTED BY {(openHostGroup.name || "").toUpperCase()} <span>›</span>
                  </a>
                ) : null}
                <p className="osec">{hosts.length === 1 ? "HOST" : "HOSTS"}</p>
                {!Array.isArray(detailQuery.data?.hosts) ? detailStatus : hosts.length > 0 ? (
                  hosts.map((h, i) => {
                    const name = h.displayName || h.username || "";
                    const initials =
                      name
                        .trim()
                        .split(/\s+/)
                        .map(w => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "?";
                    return (
                      <div className="operson" key={h.username ?? i}>
                        <span className="oavatar">{initials}</span>
                        <span>
                          <span className="opn">{name}</span>
                          {h.role ? (
                            <span className="opr">{h.role === "PRIMARY" ? "Primary host" : h.role}</span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="oclaimbox">
                      <p className="oct">{openPending ? "CLAIM IN REVIEW" : openClaimable ? "OPEN TO CLAIM" : "HOST INFORMATION"}</p>
                      <p className="ocs">
                        No public event host is listed.
                        {openPending ? " A claim is pending admin review." : ""}
                      </p>
                    </div>
                    {openClaimable && !openPending ? (
                      <a className="olinkbtn" href={`/submit/claim/${openListing.id}`} onClick={e => { e.preventDefault(); setForm({ kind: "claim" }); }}>
                        CLAIM THIS EVENT <span>›</span>
                      </a>
                    ) : null}
                  </>
                )}
                {talent.length > 0 && (
                  <>
                    <p className="osec" style={{ marginTop: 16 }}>
                      TALENT · THIS EDITION
                    </p>
                    {talent.map((t, i) => {
                      const name = t.displayName || t.username || "";
                      const initials =
                        name
                          .trim()
                          .split(/\s+/)
                          .map(w => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "?";
                      return (
                        <div className="operson" key={t.username ?? i}>
                          <span className="oavatar">{initials}</span>
                          <span>
                            <span className="opn">{name}</span>
                            {t.role ? <span className="opr">{t.role}</span> : null}
                            <span className="opr">{t.addedByUserId == null ? "Source unavailable" : t.addedByUserId === t.userId ? "Self-listed" : "Added by host or staff"}</span>
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                <p className="osec" style={{ marginTop: 16 }}>
                  VENUE PROMOTERS
                </p>
                {!detailQuery.data ? detailStatus : !venueId ? <p className="oempty">No venue is linked.</p> : !Array.isArray(venueQuery.data?.promoters) ? <EventReadStatus label="Venue promoters" query={venueQuery} /> : venueQuery.data.promoters.length ? (
                  <ul>{venueQuery.data.promoters.map(person => <li key={person.id}>{person.displayName || person.username}</li>)}</ul>
                ) : <p className="oempty">No public promoters listed for this venue.</p>}
              </section>
              <section className="opage" inert={opage!==4} aria-hidden={opage!==4} aria-label="More">
                {/* MIZZED above GIGZ (Tucker, t293u/t299u). The window is the
                    swipe flow's own rule: getMissedConnectionWindow(). */}
                <p className="osec osec--mizz osec--logo"><img className="osec-logo osec-logo--mizz" src="/brand/family/mizzed-connection-mobile.webp" alt="Mizzed Connections" width="78" height="30" /> <span className="osec-r">{mizzWin?.canPost ? "OPEN" : mizzWin && tick < mizzWin.opensAt ? `OPENS IN ${countdownLabel(mizzWin.opensAt - tick)}` : "CLOSED"}</span></p>
                <div className="orail orail--cards" style={{ "--rail": "var(--neon-magenta)" } as CSSProperties}>
                  {mizzWin?.canPost ? (
                    <button type="button" data-action="post-mizzed" className="oslot" aria-label="Post a Mizzed Connection" onClick={() => setForm({ kind: "mizz" })}><span aria-hidden="true">+</span></button>
                  ) : mizzWin && tick < mizzWin.opensAt ? (
                    <div className="oslot is-locked" role="note"><span aria-hidden="true">🔒</span><small>OPENS IN {countdownLabel(mizzWin.opensAt - tick)}</small></div>
                  ) : null}
                  {mizzCards.map(m => (
                    <EventRailCard key={m.key} post={m} saved={railSaves.isSaved(m)} saveDisabled={railSaves.pending} onSave={() => railSaves.toggle(m)}
                      onOpen={el => setItem({ kind: "mizz", id: m.id, title: m.title, body: m.description, origin: rectOf(el.closest(".orailcard")) })} />
                  ))}
                  {!mizzPosts.length && !mizzWin?.canPost && !(mizzWin && tick < mizzWin.opensAt) ? <p className="oempty">No Mizzed Connections were posted.</p> : null}
                </div>

                <p className="osec osec--gigz osec--logo"><img className="osec-logo osec-logo--gigz" src="/brand/family/gigz-mobile.webp" alt="Gigz" width="64" height="26" /> <span className="osec-r">{gigs.length ? `${gigs.length} OPEN` : "HELP OR PERFORM"}</span></p>
                <div className="orail orail--cards" style={{ "--rail": "var(--neon-violet)" } as CSSProperties}>
                  {canPostGig ? (
                    <button type="button" data-action="post-gig" className="oslot" aria-label="Post a gig for this event" onClick={() => setForm({ kind: "gig" })}><span aria-hidden="true">+</span></button>
                  ) : null}
                  {gigs.map(g => { const post = gigBoardPost(g, openListing.venueName); return (
                    <EventRailCard key={post.key} post={post} saved={railSaves.isSaved(post)} saveDisabled={railSaves.pending} onSave={() => railSaves.toggle(post)}
                      onOpen={el => setItem({ kind: "gig", id: g.id, title: g.title, body: g.description, origin: rectOf(el.closest(".orailcard")) })} />
                  ); })}
                  {!gigs.length && !canPostGig ? <p className="oempty">{planning.isLoading ? "Loading gigs…" : planning.isError ? "Couldn't load gigs. Pull to refresh." : "No gigs posted for this night."}</p> : null}
                </div>
                {openListing.id > 0 && <EventPlanning key={(night ?? "feed") + nightOrigin.seq} eventId={openListing.id} occurrenceDate={openListing.dateStart} night={night} nightOrigin={nightOrigin.rect} rideKind={rideKind} hideInlineRides hideGigs />}
                <p className="osec" style={{ marginTop: 16 }}>
                  MORE AT {openListing.venueName.toUpperCase()} <span className="osec-r">THE SAME WEEK</span>
                </p>
                <div className="odays">
                  {openStrip.map((d, i) => (
                    <button
                      key={d.ds}
                      type="button"
                      className={`oday${oday === i ? " hot" : ""}`}
                      style={{ "--day-c": dayColorVar(d.ds) } as CSSProperties}
                      onClick={() => setOday(i)}
                    >
                      <i>{d.dow}</i>
                      <b>{d.num}</b>
                      <span>{d.items.length ? `${d.items.length} event${d.items.length === 1 ? "" : "s"}` : "—"}</span>
                    </button>
                  ))}
                </div>
                {openStrip[oday]?.items.length ? (
                  <div className="orail">
                    {openStrip[oday].items.map(n => (
                      <div className="omini" key={n.id}>
                        <b>{n.title}</b>
                        <span>{eventTimeLabel(n.dateStart)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No other events at {openListing.venueName} on this day.</p>
                )}
              </section>
              <section className="opage" inert={opage!==5} aria-hidden={opage!==5} aria-label="Nearby">
                <p className="osec">
                  RESTAURANTS CLOSE BY
                </p>
                {!Array.isArray(detailQuery.data?.nearby?.restaurants) ? detailStatus : nearbyR.length ? (
                  <div className="orail">
                    {nearbyR.map((r, i) => r.id && r.name ? (
                      <EventNearbyPlaceCard key={r.id} place={{ ...r, id: r.id, name: r.name, type: r.type || "restaurant" }} onOpen={() => requestClose(0, () => navigate(placePath(r.id!, r.name!)))} />
                    ) : (
                      <div className="omini" key={`${r.name ?? "r"}-${i}`}>
                        <b>{r.name}</b>
                        <span>{r.type || "restaurant"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No restaurants listed nearby yet.</p>
                )}
                <p className="osec" style={{ marginTop: 16 }}>
                  EVENTS SAME DAY · CLOSE BY
                </p>
                {!Array.isArray(detailQuery.data?.nearby?.events) ? detailStatus : nearbyE.length ? (
                  <div className="orail">
                    {nearbyE.map((n, i) => (
                      <div className="omini" key={n.id ?? i}>
                        <b>{n.title}</b>
                        <span>
                          {n.venueName}
                          {n.dateStart ? (
                            <>
                              <br />
                              {eventDateLabel(n.dateStart)}
                            </>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No other events close by on this day.</p>
                )}
              </section>
            </div>
          </div>
          <div className="ofoot">
            <button
              type="button"
              className="oarw"
              disabled={opage === 0}
              onClick={() => goOpage(opage - 1)}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="opg">
              PAGE {opage + 1} · {OPAGE_LABELS[opage]}
            </span>
            <button
              type="button"
              className="oarw"
              disabled={opage === OPAGE_NAMES.length - 1}
              onClick={() => goOpage(opage + 1)}
              aria-label="Next page"
            >
              ›
            </button>
            <button type="button" data-action="share" className="oshare" aria-label={`Share ${openListing.title}`} onClick={e => { if (gate.gated) { gate.setPrompt(true); return; } setPopOrigin(rectOf(e.currentTarget)); setSharePop(true); }}>
              <ShareIcon />
            </button>
            <EventPrivateSaveButton eventId={openListing.id} poster />
            <EventInterestedHeart
              eventId={openListing.id}
              variant="poster"
              snapshot={{
                title: openListing.title,
                subtitle: openListing.venueName,
                image: listingPosterUrl(openListing),
                href: eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing)),
                accent: openListing.accentColor ?? null,
              }}
            />
          </div>
        {carpoolStub ? (
          /* Expanded carpool card: the design does not exist yet (owner, Nov 20). A clearly marked
             stub over the blurred backdrop with flip-and-grow. Posting moved to OFFER A RIDE / I NEED A RIDE. */
          <ActionSheetCard label="Expanded carpool card (design coming)" accent="var(--neon-orange)" kicker="CARPOOL" title="EXPANDED CARPOOL CARD · DESIGN COMING"
            logo="ridez-pending" origin={carpoolStub.origin} onDismiss={() => setCarpoolStub(null)}>
            <p className="zas-note" data-stub="expanded-carpool">Placeholder: the expanded carpool card is being designed. To post, use OFFER A RIDE or I NEED A RIDE in Ridez.</p>
          </ActionSheetCard>
        ) : null}
        {whosComing ? <RidezWhosComing needId={whosComing.needId} origin={whosComing.origin} onClose={() => setWhosComing(null)} /> : null}
        {ridezForm ? (
          <RidezFormCard mode={ridezForm.mode} direction={startMs(openListing) <= Date.now() ? "departing" : "arriving"} eventId={openListing.id} eventTitle={openListing.title} occurrenceDate={planningDate} eventStart={openListing.dateStart}
            venueName={openListing.venueName} rides={planning.data?.rides ?? null} origin={ridezForm.origin}
            onClose={() => setRidezForm(null)} onDone={() => void planning.refetch()} />
        ) : null}
        {railAuth ? <AuthModal onClose={() => setRailAuth(false)} /> : null}
        {form ? (
          <EventFormCard kind={form.kind} gigTitle={form.gigTitle} eventId={openListing.id} eventTitle={openListing.title} occurrenceDate={openListing.dateStart}
            venueName={openListing.venueName} pageUrl={typeof window !== "undefined" ? shareUrlFor(sharePath, "afterz") : sharePath}
            accent={form.kind === "mizz" ? "var(--neon-magenta)" : form.kind === "gig" || form.kind === "message" ? "var(--neon-violet)" : form.kind === "afterz-invite" ? "var(--yellow)" : openAccent}
            onClose={() => setForm(null)}
            onDone={() => { if (form.kind === "gig") void planning.refetch(); if (form.kind === "mizz") void detailQuery.refetch(); }}
            onNoContact={() => { const g = form.gigTitle ?? ""; setForm(null); setGigPop({ gig: g, mode: "invite" }); }}
            onNext={k => { if (k === "afterz-invite") window.setTimeout(() => setForm({ kind: "afterz-invite" }), FLIP_MS + 40); else window.setTimeout(() => setSharePop(true), FLIP_MS + 40); }} />
        ) : null}
        {item ? (
          <ActionSheetCard label={item.title} accent={item.kind === "gig" ? "var(--neon-violet)" : "var(--neon-magenta)"}
            kicker={item.kind === "gig" ? "GIGZ" : "MIZZED CONNECTION"} title={item.title.toUpperCase()} origin={item.origin} onDismiss={() => setItem(null)}
            actions={item.kind === "gig" ? [
              { label: hostOnZaylist ? "MESSAGE HOST" : "INVITE THEM", primary: true, onClick: () => { const g = item; setItem(null); if (hostOnZaylist) { setForm({ kind: "message", gigTitle: g.title }); return; } setPopOrigin(g.origin); setGigPop({ gig: g.title, mode: "invite" }); } },
              { label: "OPEN IN GIGZ", href: `/gigz?post=${item.id}` },
            ] : [
              { label: "OPEN IN MIZZED", href: `/mizzed?post=${item.id}`, primary: true },
            ]}>
            {item.body ? <p className="zas-body">{item.body}</p> : null}
          </ActionSheetCard>
        ) : null}
        {/* Share, gig-invite and join popups sit inside the card so they stack over it like the tile sheets. */}
        {sharePop ? <EventSharePopup origin={popOrigin} onClose={() => setSharePop(false)} accent={openAccent} eventId={openListing.id} path={sharePath} title={openListing.title} meta={shareMeta} poster={openPoster ?? null} /> : null}
        {gigPop?.mode === "invite" ? <GigInvitePopup origin={popOrigin} onClose={() => setGigPop(null)} accent={openAccent} path={sharePath} title={openListing.title} meta={shareMeta} poster={openPoster ?? null} gigTitle={gigPop.gig} /> : null}
        {gate.prompt ? <ShareJoinPrompt accent={openAccent} title={openListing.title} from={sharedFrom} onClose={() => gate.setPrompt(false)} /> : null}
        </div>
        {flyerOpen && openPoster ? <FlyerViewer src={openPoster} title={openListing.title} onClose={() => setFlyerOpen(false)} /> : null}
      </CardStage>
  );
}
