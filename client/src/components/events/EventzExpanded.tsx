import { pacificCalendarDate } from "@shared/missedConnections";
import { eventAge, eventPrice } from "@/lib/eventFacts";
import { EventGoingButton, EventInterestedHeart, EventPrivateSaveButton, EventReadStatus } from "./EventParticipation";
import { PosterlessFlyer } from "./PosterlessFlyer";
import EventPlanning from "./EventPlanning";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, MapPin, Share2, X } from "lucide-react";
import type { EventListing as Event } from "@shared/multiDayEvents";
import { EVENT_TALENT_ROLE_COLORS, EVENT_TALENT_ROLE_LABELS, type EventTalentRow } from "@shared/eventTalent";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { publicHttpUrl } from "@shared/safeHttpUrl";
import { resolveVenueWebsite } from "@shared/venueLinks";
import { resolveDirectoryLogo } from "@shared/directoryLogos";
import { CardStage } from "@/components/cards/CardStage";
import { EventFrontStage } from "./EventFlyerFront";
import { OpenCardMeta } from "@/components/cards/react19Card";
import { closeOpenCard } from "@/components/cards/react19CardModel";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { dayAccentToken } from "@/lib/dsColors";
import { formatCardTime, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { formatPacificDateTime } from "@/lib/countdown";
import { eventTimeLabel } from "@/lib/eventDisplay";
import { parsePacificDateTime } from "@shared/missedConnections";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { shareEventLink, shareToastTitle } from "@/lib/shareEvent";
import { useResponsivePoster } from "@/lib/useResponsivePoster";
import { POSTER_DETAIL_SIZES, restoreOriginalPoster } from "@/lib/responsivePoster";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import MissedConnectionsPanel from "@/components/MissedConnectionsPanel";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import "./EventzExpanded.css";

/**
 * The Eventz expanded card, built on the Placez setup: one card, five swipe
 * pages (Info / Feed / Maps / More + Nearby / People — Info is the first
 * page per Tucker's Nov 19, 2026 ruling, superseding the Feed-first order),
 * the flyer full-size from the top with its gradient starting 35% down the
 * card, black action cards, and the pager + SAVE THIS EVENT pinned at the
 * bottom. The page scroller spans the full card behind the flyer layer, so
 * content scrolls up underneath the flyer instead of stopping below it.
 * Data comes from GET /api/events/:id/detail. Admin / edit / moderation
 * stay in EventModal, one tap away from the Info page. Made-by: Muse
 */

type DetailHost = {
  userId: number;
  username?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  role?: string | null;
};

type DetailGig = {
  id: number;
  title: string;
  postType: string;
  createdAt: string;
  location?: string | null;
  description?: string | null;
  compensation?: string | null;
  gigDate?: string | null;
  gigTime?: string | null;
};

type SlimPlace = {
  id: number;
  name: string;
  type: string;
  neighborhood?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceMi?: number;
};

type NearbyEvent = Event & { distanceMi?: number };

type DetailHostGroup = {
  id: string;
  slug: string;
  name: string;
  businessId?: number | null;
};

type EventDetail = {
  event: Event;
  venue: SlimPlace | null;
  hosts: DetailHost[];
  hostGroup?: DetailHostGroup | null;
  /** Only present when the server passes this viewer through the source
   *  link gate (admins / promoters / owner, or public if the gate flips);
   *  absent from the payload entirely for everyone else. */
  sourceLink?: string | null;
  /** Origin platform only ("fetlife", another host, or null) — public;
   *  picks the mark on the posterless fallback flyer. */
  sourcePlatform?: string | null;
  talent: EventTalentRow[];
  gigs: DetailGig[];
  missedConnections: unknown[];
  nearby: { restaurants: SlimPlace[]; events: NearbyEvent[] };
};

const PAGES = ["Info", "Feed", "Maps", "More", "People"] as const;

type EventzExpandedProps = {
  openPlanning?: boolean;
  event: Event;
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
  originRect?: EventModalOriginRect | null;
  documentMeta?: boolean;
  onOpenEvent?: (event: Event) => void;
};

export default function EventzExpanded({ event, onClose, onEventUpdated, originRect = null, documentMeta = true, onOpenEvent, openPlanning = false }: EventzExpandedProps) {
  const [expandedKey, setExpandedKey] = useState("");
  const [manage, setManage] = useState(false);
  if (!event || typeof event.id !== "number") return null;
  const key = event.id + "/" + event.dateStart;
  if (!openPlanning && expandedKey !== key) return <EventFrontStage key={key} listing={event} onClose={onClose} onExpand={() => setExpandedKey(key)} />;
  if (manage) {
    return <EventModal event={event} onClose={onClose} onEventUpdated={onEventUpdated} originRect={originRect} documentMeta={documentMeta} />;
  }
  return (
    <CardStage key={event.id} onClose={onClose}>
      {documentMeta ? <OpenCardMeta title={event.title} description={event.venueName || event.description} /> : null}
      <EventzExpandedInner openPlanning={openPlanning} event={event} onClose={() => closeOpenCard(onClose)} onManage={() => setManage(true)} onOpenEvent={onOpenEvent} />
    </CardStage>
  );
}

/**
 * The Info page's STARTS IN panel (v12): accent label, big tabular digits,
 * and the date line, in a bordered box. Renders nothing once the event has
 * started.
 */
function StartsInBox({ event }: { event: Event }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const startMs = parsePacificDateTime(event.dateStart);
  if (startMs == null || startMs - now <= 0) return null;
  const remaining = startMs - now;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const units: Array<[number, string]> = [[days, "days"], [hours, "hrs"], [minutes, "min"]];
  return (
    <div className="evz-x__starts" role="timer" aria-label={`Starts in ${days} days, ${hours} hours, ${minutes} minutes`}>
      <p className="evz-x__starts-l">Starts in</p>
      <div className="evz-x__starts-d" aria-hidden="true">
        {units.map(([value, unit]) => (
          <span key={unit}><strong>{pad2(value)}</strong><small>{unit}</small></span>
        ))}
      </div>
      <p className="evz-x__starts-w">{formatPacificDateTime(event.dateStart, { weekday: "short", month: "short", day: "numeric" })} · {formatCardTime(event)}</p>
    </div>
  );
}

type PlaceUpcomingEvent = { id: number; title: string; dateStart: string; dateEnd?: string | null; dayOfWeek?: string | null; posterImageUrl?: string | null };
type PlacePromoter = { name?: string | null; displayName?: string | null; username?: string | null };

const pacificDayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });
function pacificDayKey(iso: string): string | null {
  const ms = parsePacificDateTime(iso);
  return ms == null ? null : pacificDayKeyFmt.format(new Date(ms));
}
function shiftDayKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
}
function dayKeyLabel(key: string): { dow: string; num: number } {
  const [y, m, d] = key.split("-").map(Number);
  const dow = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
  return { dow, num: d };
}

function primaryLinkFor(event: Event): { href: string; label: string } | null {
  const links = event as Event & { ticketUrl?: string | null; venueWebsite?: string | null; sourceUrl?: string | null; source?: string | null };
  const ticket = publicHttpUrl(links.ticketUrl);
  if (ticket) return { href: ticket, label: "Tickets" };
  const site = publicHttpUrl(links.venueWebsite) || publicHttpUrl(resolveVenueWebsite(event.venueName));
  if (site) return { href: site, label: "Venue site" };
  const source = publicHttpUrl(links.sourceUrl) || publicHttpUrl(links.source);
  if (source) return { href: source, label: "Event page" };
  return null;
}

function EventzExpandedInner({ event, onClose, onManage, onOpenEvent, openPlanning }: {
  openPlanning: boolean;
  event: Event;
  onClose: () => void;
  onManage: () => void;
  onOpenEvent?: (event: Event) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState(openPlanning ? 1 : 0);
  const [mizzedOpen, setMizzedOpen] = useState(false);
  const [venueDay, setVenueDay] = useState<string | null>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const pages = pagesRef.current;
    if (openPlanning && pages) pages.scrollTo({ left: pages.clientWidth, behavior: "instant" });
  }, [openPlanning]);
  const { dialogRef, requestClose } = useOpenCardClose(onClose);

  const detailQuery = useQuery<EventDetail>({
    queryKey: ["/api/events", event.id, "detail", user?.id, pacificCalendarDate(event.dateStart)],
    queryFn: () => apiRequest("GET", `/api/events/${event.id}/detail?date=${encodeURIComponent(pacificCalendarDate(event.dateStart)??"")}`).then((r) => r.json()),
    staleTime: 60_000,
  });
  const rawDetail = detailQuery.data;
  const detailStatus = <EventReadStatus label="Event details" query={detailQuery} />;
  const detail = rawDetail && !Array.isArray(rawDetail) ? rawDetail : undefined;
  const hosts: DetailHost[] = Array.isArray(detail?.hosts) ? detail.hosts : [];
  const talent: EventTalentRow[] = Array.isArray(detail?.talent) ? detail.talent : [];
  const missedCount = Array.isArray(detail?.missedConnections) ? detail.missedConnections.length : 0;
  const restaurants: SlimPlace[] = Array.isArray(detail?.nearby?.restaurants) ? detail.nearby.restaurants : [];
  const nearbyEvents: NearbyEvent[] = Array.isArray(detail?.nearby?.events) ? detail.nearby.events : [];
  const venue = detail?.venue ?? null;
  const hostGroup = detail?.hostGroup ?? null;
  // The source URL is only present in the payload when the server's
  // source-link gate passed for this viewer (canViewSourceLink in
  // server/routes.ts) — the button never renders for anyone else.
  const sourceUrl = publicHttpUrl(detail?.sourceLink);
  // Posterless fallback flyer (Tucker, Nov 19, 2026): FetLife-sourced
  // events carry the FetLife mark; everything else carries the venue's
  // directory logo. Neither asset → the typographic face stays.
  const isFetLife = (detail?.sourcePlatform ?? event.sourcePlatform) === "fetlife";
  const fallbackLogo = isFetLife ? null : resolveDirectoryLogo(event.venueName, venue?.imageUrl);
  const fallbackWordmark = isFetLife ? "FetLife" : null;

  // The venue's own payload feeds two v12 sections the event detail does not
  // carry: "More at {venue}" (next-7-days strip on More + Nearby) and the
  // Promoters block on People.
  const placeQuery = useQuery<{ upcomingEvents?: PlaceUpcomingEvent[]; promoters?: PlacePromoter[] }>({
    queryKey: ["/api/placez", venue?.id, "card-extras"],
    queryFn: () => apiRequest("GET", `/api/placez/${venue!.id}`).then((r) => r.json()),
    enabled: Boolean(venue?.id),
    staleTime: 300_000,
  });
  const placeData = placeQuery.data;
  const venueUpcoming: PlaceUpcomingEvent[] = Array.isArray(placeData?.upcomingEvents) ? placeData.upcomingEvents : [];
  const promoters: PlacePromoter[] = Array.isArray(placeData?.promoters) ? placeData.promoters : [];
  const eventDayKey = pacificDayKey(event.dateStart);
  const stripDays = eventDayKey
    ? Array.from({ length: 7 }, (_, i) => {
        const key = shiftDayKey(eventDayKey, i);
        const dayEvents = venueUpcoming.filter((e) => e.id !== event.id && pacificDayKey(e.dateStart) === key);
        return { key, ...dayKeyLabel(key), events: dayEvents };
      })
    : [];
  const selectedDay = stripDays.find((d) => d.key === (venueDay ?? eventDayKey)) ?? stripDays[0];

  const day = listingDay(event);
  const flyerAccent = (event as { accentColor?: string | null }).accentColor || null;
  const accent = flyerAccent ?? dayAccentToken(day);
  const posterUrl = listingPosterUrl(event);
  const [failedPoster, setFailedPoster] = useState<string>();
  const poster = posterUrl === failedPoster ? undefined : posterUrl;
  const posterAttributes = useResponsivePoster(poster, POSTER_DETAIL_SIZES);
  const endMs = parsePacificDateTime(event.dateEnd);
  const isPastEvent = endMs != null && endMs < Date.now();
  const hasPendingClaim = Boolean(((detail?.event ?? event) as { hasPendingClaim?: boolean }).hasPendingClaim);
  const claimable = (detail?.event ?? event).isClaimable && !(detail?.event ?? event).claimedBy;
  const canManage = Boolean(user?.isAdmin) || Boolean(user && hosts.some((h) => h.userId === user.id));
  const primaryLink = primaryLinkFor(event);
  const age = eventAge(event.ageRequirement);
  const admission = eventPrice(event.admission);
  const rawChips = [...getEventTypeTagsForEvent(event).slice(0, 3), ...(age === "Not stated" ? [] : [age]), ...(event.isSexPositive ? ["Sex-positive"] : [])];
  const seenChipKeys = new Set<string>();
  const chips = rawChips.filter((chip) => {
    const key = chip.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
    if (seenChipKeys.has(key)) return false;
    seenChipKeys.add(key);
    return true;
  });
  const whenLine = `${formatPacificDateTime(event.dateStart, { weekday: "long", month: "long", day: "numeric" })} · ${formatCardTime(event)}`;
  const shortWhen = `${formatPacificDateTime(event.dateStart, { weekday: "short", month: "short", day: "numeric" })} · ${formatCardTime(event)}`;
  const directionsDest = event.lat != null && event.lng != null ? `${event.lat},${event.lng}` : (event.address || `${event.venueName}, Portland, OR`);
  const googleDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDest)}`;
  const appleDirections = `https://maps.apple.com/?daddr=${encodeURIComponent(directionsDest)}`;

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(PAGES.length - 1, index));
    setPage(next);
    const el = pagesRef.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };
  const onPagesScroll = () => {
    const el = pagesRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== page && index >= 0 && index < PAGES.length) setPage(index);
  };
  const share = async () => {
    try {
      const result = await shareEventLink(eventPath(event.id, event.title, event.dayOfWeek, pacificCalendarDate(event.dateStart)), event.title);
      toast({ title: shareToastTitle(result, "event") });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast({ title: "Could not share. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} data-testid="event-modal" data-card-category="eventz" className="evz-x pdx-glass-rebind" style={{ "--c": accent, "--ac": accent } as CSSProperties} aria-label={`${event.title} details`}>
      <span className="evz-x__grad" aria-hidden="true" />
      <header className="evz-x__hero">
        {poster
          ? <img {...posterAttributes} alt="" loading="lazy" decoding="async" className="evz-x__flyer" onError={(e) => { if (!restoreOriginalPoster(e.currentTarget, poster)) setFailedPoster(poster); }} />
          : (
            <>
              <span className="evz-x__flyer evz-x__flyer--none" aria-hidden="true" />
              <PosterlessFlyer placeImageUrl={isFetLife ? null : venue?.imageUrl || event.fallbackPlaceImage} logoUrl={fallbackLogo} wordmark={fallbackWordmark} />
            </>
          )}
        <div className="evz-x__chrome">
          <button type="button" className="evz-x__iconbtn" onClick={share} aria-label={`Share ${event.title}`}><Share2 size={17} aria-hidden="true" /></button>
          <button type="button" className="evz-x__iconbtn" onClick={requestClose} aria-label={`Close ${event.title}`}><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="evz-x__id">
          <h2 className="evz-x__title">{event.title}</h2>
          <p className="evz-x__venue"><MapPin size={14} aria-hidden="true" />{event.venueName}{event.neighborhood ? <span> · {event.neighborhood}</span> : null}<span> · {shortWhen}</span></p>
          <div className="evz-x__chips">{chips.map((chip) => <span key={chip} className="evz-x__chip">{chip}</span>)}</div>
        </div>
      </header>

      <div className="evz-x__actions">
        <EventGoingButton eventId={event.id} past={isPastEvent} />
      </div>

      <nav className="evz-x__tabs" aria-label="Event pages">
        {PAGES.map((label, index) => (
          <button key={label} type="button" className={index === page ? "on" : ""} aria-current={index === page ? "page" : undefined} onClick={() => goTo(index)}>
            {label === "More" ? "More + Nearby" : label}
          </button>
        ))}
      </nav>

      <div className="evz-x__pageswrap">
        <div className="evz-x__pages" ref={pagesRef} onScroll={onPagesScroll}>
          <section className="evz-x__page" inert={page!==0} aria-hidden={page!==0} aria-label="Info">
            <div className="evz-x__sech"><span>Event details</span></div>
            <StartsInBox event={event} />
            <div className="evz-x__kv"><Clock3 size={17} aria-hidden="true" /><span>{whenLine}</span></div>
            <div className="evz-x__kv"><MapPin size={17} aria-hidden="true" /><span>{venue ? <Link href={placePath(venue.id, venue.name)} className="evz-x__venuelink">{event.venueName}</Link> : event.venueName}{event.address ? <><br />{event.address}</> : null}</span></div>
            {hostGroup ? (
              <div className="evz-x__kv"><span className="evz-x__kv-k">Hosted by</span><span><Link href={`/z/${hostGroup.slug}`} className="evz-x__venuelink">{hostGroup.name}</Link></span></div>
            ) : null}
            {event.description ? <p className="evz-x__desc">{event.description}</p> : null}
            <div className="evz-x__kv"><span className="evz-x__kv-k">Admission</span><span>{admission}</span></div>
            <div className="evz-x__kv"><span className="evz-x__kv-k">Age</span><span>{age}</span></div>
            {(primaryLink || sourceUrl) ? (
              <div className="evz-x__linkrow">
                {primaryLink ? (
                  <a className="evz-x__link" href={primaryLink.href} target="_blank" rel="noopener noreferrer">{primaryLink.label} <ArrowUpRight size={16} aria-hidden="true" /></a>
                ) : null}
                {sourceUrl ? (
                  <a className="evz-x__link" href={sourceUrl} target="_blank" rel="noopener noreferrer">Source link <ArrowUpRight size={16} aria-hidden="true" /></a>
                ) : null}
              </div>
            ) : null}
            {claimable ? (
              <p className="evz-x__note">This event has not been claimed by its organizer. Details were sourced from public listings. Please confirm time, venue, and ticketing directly before attending.{hasPendingClaim ? " A claim is pending admin review." : ""}</p>
            ) : null}
            <div className="evz-x__manage">
              {canManage ? <button type="button" className="evz-x__managebtn" onClick={onManage}>Manage event</button> : null}
              <button type="button" className="evz-x__managebtn" onClick={onManage}>Report / request a change</button>
            </div>
          </section>

          <section className="evz-x__page" inert={page!==1} aria-hidden={page!==1} aria-label="Feed — Gigz">
            {event.id > 0 && <EventPlanning eventId={event.id} occurrenceDate={event.dateStart} />}
            <button type="button" className="evz-x__act evz-x__act--dash" aria-expanded={mizzedOpen} onClick={() => setMizzedOpen((open) => !open)}>
              <span className="evz-x__act-main">
                <span className="evz-x__act-t">Add a Mizzed Connection</span>
                <span className="evz-x__act-s">{missedCount > 0 ? `${missedCount} posted for this event` : "Met someone at this event? Post it — during or after."}</span>
              </span>
              <span className="evz-x__act-ar" aria-hidden="true">+</span>
            </button>
          </section>

          <section className="evz-x__page" inert={page!==2} aria-hidden={page!==2} aria-label="Maps">
            <div className="evz-x__sech"><span>Map &amp; directions</span><span className="evz-x__sech-r">Location overview</span></div>
            <div className="evz-x__mapbox" aria-hidden="true"><span className="evz-x__pin" /></div>
            <div className="evz-x__kv"><MapPin size={17} aria-hidden="true" /><span>This event · {event.venueName}<br />{event.address || venue?.address || "Portland, OR"}<br /><span className="evz-x__note-inline">Real locations, no street tiles. Directions open in your chosen app.</span></span></div>
            <div className="evz-x__dirrow">
              <a className="evz-x__link" href={googleDirections} target="_blank" rel="noopener noreferrer">Directions · Google <ArrowUpRight size={16} aria-hidden="true" /></a>
              <a className="evz-x__link" href={appleDirections} target="_blank" rel="noopener noreferrer">Directions · Apple <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </section>

          <section className="evz-x__page" inert={page!==3} aria-hidden={page!==3} aria-label="More + Nearby">
            {venue && !Array.isArray(placeData?.upcomingEvents) && <EventReadStatus label="More at this venue" query={placeQuery} />}
            {venue && stripDays.some((d) => d.events.length > 0) ? (
              <>
                <div className="evz-x__sech"><span>More at {event.venueName}</span><span className="evz-x__sech-r">Next 7 days</span></div>
                <div className="evz-x__days">
                  {stripDays.map((d) => (
                    <button key={d.key} type="button" className={selectedDay?.key === d.key ? "evz-x__day hot" : "evz-x__day"} onClick={() => setVenueDay(d.key)} aria-pressed={selectedDay?.key === d.key}>
                      <span className="evz-x__day-d">{d.dow}</span>
                      <span className="evz-x__day-n">{d.num}</span>
                      <span className="evz-x__day-c">{d.events.length ? `${d.events.length} event${d.events.length === 1 ? "" : "s"}` : "—"}</span>
                    </button>
                  ))}
                </div>
                {selectedDay && selectedDay.events.length > 0 ? (
                  <div className="evz-x__rail">
                    {selectedDay.events.slice(0, 8).map((near) => (
                      <button key={near.id} type="button" className="evz-x__railcard" style={{ "--ac": accent } as CSSProperties}
                        onClick={() => setLocation(eventPath(near.id, near.title, near.dayOfWeek, pacificCalendarDate(near.dateStart)))}
                        aria-label={`Open ${near.title}`}>
                        {near.posterImageUrl
                          ? <img src={near.posterImageUrl} alt="" loading="lazy" className="evz-x__railimg" />
                          : <span className="evz-x__railfill" aria-hidden="true" />}
                        <span className="evz-x__railscrim">
                          <span className="evz-x__railtitle">{near.title}</span>
                          <span className="evz-x__railmeta">{eventTimeLabel(near.dateStart)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="evz-x__empty">No other events at {event.venueName} on this day.</p>
                )}
              </>
            ) : null}
            <div className="evz-x__sech"><span>Restaurants close by</span></div>
            {!Array.isArray(detail?.nearby?.restaurants) ? detailStatus : restaurants.length === 0 ? (
              <p className="evz-x__empty">No restaurants mapped close by yet.</p>
            ) : (
              <div className="evz-x__rail">
                {restaurants.map((place) => (
                  <Link key={place.id} href={placePath(place.id, place.name)} className="evz-x__railcard">
                    {place.imageUrl
                      ? <img src={place.imageUrl} alt="" loading="lazy" className="evz-x__railimg" />
                      : <span className="evz-x__railfill" aria-hidden="true" />}
                    <span className="evz-x__railscrim">
                      <span className="evz-x__railtitle">{place.name}</span>
                      <span className="evz-x__railmeta">{[place.type, place.neighborhood, place.distanceMi != null ? `${place.distanceMi} mi` : null].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="evz-x__sech"><span>Events same day · close by</span></div>
            {!Array.isArray(detail?.nearby?.events) ? detailStatus : nearbyEvents.length === 0 ? (
              <p className="evz-x__empty">No other events close by on this day.</p>
            ) : (
              <div className="evz-x__rail">
                {nearbyEvents.map((near) => {
                  const nearPoster = listingPosterUrl(near);
                  const nearAccent = (near as { accentColor?: string | null }).accentColor || accent;
                  return (
                    <button key={near.id} type="button" className="evz-x__railcard" style={{ "--ac": nearAccent } as CSSProperties}
                      onClick={() => { if (onOpenEvent) onOpenEvent(near); else setLocation(eventPath(near.id, near.title, near.dayOfWeek, pacificCalendarDate(near.dateStart))); }}
                      aria-label={`Open ${near.title}`}>
                      {nearPoster
                        ? <img src={nearPoster} alt="" loading="lazy" className="evz-x__railimg" />
                        : <span className="evz-x__railfill" aria-hidden="true" />}
                      <span className="evz-x__railscrim">
                        <span className="evz-x__railtitle">{near.title}</span>
                        <span className="evz-x__railmeta">{[eventTimeLabel(near.dateStart), near.venueName, near.distanceMi != null ? `${near.distanceMi} mi` : null].filter(Boolean).join(" · ")}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="evz-x__page" inert={page!==4} aria-hidden={page!==4} aria-label="People">
            <div className="evz-x__sech"><span>{hosts.length === 1 ? "Host" : "Hosts"}</span></div>
            {!Array.isArray(detail?.hosts) ? detailStatus : hosts.length > 0 ? (
              <div className="evz-x__people">
                {hosts.map((host) => {
                  const inner = (
                    <>
                      <UserAvatar photoUrl={host.photoUrl} avatarChoice={host.avatarChoice} avatarRing={host.avatarRing} displayName={host.displayName} username={host.username ?? undefined} size={48} />
                      <span className="evz-x__person-meta">
                        <span className="evz-x__person-name">{host.displayName || host.username}</span>
                        {host.role === "PRIMARY" ? <span className="evz-x__person-role">Primary host</span> : null}
                      </span>
                    </>
                  );
                  return host.username
                    ? <Link key={host.userId} href={`/u/${encodeURIComponent(host.username)}`} className="evz-x__person">{inner}</Link>
                    : <div key={host.userId} className="evz-x__person">{inner}</div>;
                })}
              </div>
            ) : (
              <>
                <div className="evz-x__claim">
                  <p className="evz-x__claim-t">{hasPendingClaim ? "Claim in review" : claimable ? "Open to claim" : "Host information"}</p>
                  <p className="evz-x__claim-s">No public event host is listed.</p>
                  {hasPendingClaim ? <p className="evz-x__claim-s">A claim is pending admin review.</p> : null}
                </div>
                {claimable && !hasPendingClaim ? (
                  <button type="button" className="evz-x__act" onClick={() => { if (user) setLocation(`/submit/claim/${event.id}`); else setShowAuth(true); }}>
                    <span className="evz-x__act-main">
                      <span className="evz-x__act-t">Claim this event</span>
                      <span className="evz-x__act-s">Are you the host? Claim it to manage this listing.</span>
                    </span>
                    <span className="evz-x__act-ar" aria-hidden="true">›</span>
                  </button>
                ) : null}
              </>
            )}
            {talent.length > 0 ? (
              <>
                <div className="evz-x__sech"><span>Talent · this edition</span></div>
                <div className="evz-x__people">
                  {talent.map((row) => (
                    <div key={row.id} className="evz-x__person">
                      <UserAvatar photoUrl={row.photoUrl} avatarChoice={row.avatarChoice} avatarRing={row.avatarRing} displayName={row.displayName} username={row.username} size={48} />
                      <span className="evz-x__person-meta">
                        <span className="evz-x__person-name">{row.displayName || row.username}</span>
                        <span className="evz-x__person-role" style={{ color: EVENT_TALENT_ROLE_COLORS[row.role]?.color }}>{EVENT_TALENT_ROLE_LABELS[row.role] || row.role} · {row.addedByUserId == null ? "Source unavailable" : row.addedByUserId === row.userId ? "Self-listed" : "Added by host or staff"}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <div className="evz-x__sech"><span>Venue promoters</span></div>
            {!detail ? detailStatus : !venue ? <p>No venue is linked.</p> : !Array.isArray(placeData?.promoters) ? <EventReadStatus label="Venue promoters" query={placeQuery} /> : promoters.length > 0 ? (
              <div className="evz-x__people">
                {promoters.map((promoter, index) => (
                  <div key={index} className="evz-x__person">
                    <span className="evz-x__person-meta">
                      <span className="evz-x__person-name">{promoter.displayName || promoter.name || promoter.username}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="evz-x__empty-block">No public promoters listed for this venue.</p>
            )}
          </section>
        </div>

        {mizzedOpen ? (
          <div className="evz-x__mizzed">
            <div className="evz-x__mizzed-head">
              <span>Mizzed Connections</span>
              <button type="button" className="evz-x__iconbtn evz-x__iconbtn--sm" onClick={() => setMizzedOpen(false)} aria-label="Close Mizzed Connections"><X size={16} aria-hidden="true" /></button>
            </div>
            <div className="evz-x__mizzed-body">
              <MissedConnectionsPanel mode="event" eventId={event.id} compact />
            </div>
          </div>
        ) : null}
      </div>

      <footer className="evz-x__foot">
        <div className="evz-x__pager">
          <button type="button" className="evz-x__arw" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous page"><ChevronLeft size={17} aria-hidden="true" /></button>
          <div className="evz-x__dots">
            {PAGES.map((label, index) => (
              <i key={label} aria-hidden="true" className={index === page ? "on" : ""} />
            ))}
            <span className="evz-x__pg">Page {page + 1} · {PAGES[page]}</span>
          </div>
          <button type="button" className="evz-x__arw" onClick={() => goTo(page + 1)} disabled={page === PAGES.length - 1} aria-label="Next page"><ChevronRight size={17} aria-hidden="true" /></button>
        </div>
        <div className="evz-x__save">
          <EventPrivateSaveButton eventId={event.id} />
          <EventInterestedHeart
            eventId={event.id}
            variant="expanded"
            snapshot={{
              title: event.title,
              subtitle: event.venueName,
              image: poster,
              href: eventPath(event.id, event.title, event.dayOfWeek, pacificCalendarDate(event.dateStart)),
              accent: flyerAccent,
            }}
          />
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
