import { EventMapSurface } from "@/components/EventLocationMap";
import EventMizzedBlock from "./EventMizzedBlock";
import { EventReport } from "./EventReport";
import { EventShare } from "./EventShare";
import { canSharePublicEvent } from "@shared/publicEventVisibility";
import { pacificCalendarDate } from "@shared/missedConnections";
import { eventAge, eventPrice, eventTicketFacts, eventRuntime, listingDjCredit } from "@/lib/eventFacts";
import { EventGoingButton, EventRemoveAttendance, EventInterestedHeart, EventPrivateSaveButton, EventReadStatus } from "./EventParticipation";
import { PosterlessFlyer } from "./PosterlessFlyer";
import EventPlanning from "./EventPlanning";
import { EventHostNotice } from "./EventHostNotice";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import type { EventListing as Event } from "@shared/multiDayEvents";
import { EVENT_TALENT_ROLE_COLORS, EVENT_TALENT_ROLE_LABELS, type EventTalentRow } from "@shared/eventTalent";
import { publicHttpUrl } from "@shared/safeHttpUrl";
import { resolveVenueWebsite } from "@shared/venueLinks";
import { resolveDirectoryLogo } from "@shared/directoryLogos";
import { CardStage } from "@/components/cards/CardStage";
import { eventCardOrigin } from "@/components/cards/CardAPI";
import { formatCardCountdown } from "@/lib/countdown";
import { EventActionTiles, EventPosterDialog } from "./EventCardActions";
import { memberProfileHref } from "@/lib/avatarLinks";
import { OpenCardMeta } from "@/components/cards/react19Card";
import { closeOpenCard } from "@/components/cards/react19CardModel";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { dayAccentToken } from "@/lib/dsColors";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { formatPacificDateTime } from "@/lib/countdown";
import { eventTimeLabel } from "@/lib/eventDisplay";
import { parsePacificDateTime } from "@shared/missedConnections";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { useResponsivePoster } from "@/lib/useResponsivePoster";
import { POSTER_DETAIL_SIZES, restoreOriginalPoster } from "@/lib/responsivePoster";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import MissedConnectionsPanel from "@/components/MissedConnectionsPanel";
import EventModal,{ type EventModalOriginRect } from "@/components/EventModal";
import "./EventzExpanded.css";

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

const PAGES = ["Feed", "Info", "Maps", "People", "More", "Nearby"] as const;

type EventzExpandedProps = {
  openPlanning?: boolean;
  openChat?: boolean;
  event: Event;
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
  originRect?: EventModalOriginRect | null;
  documentMeta?: boolean;
  onOpenEvent?: (event: Event) => void;
};

export default function EventzExpanded({ event, onClose, onEventUpdated, originRect = null, documentMeta = true, onOpenEvent, openPlanning = false, openChat = false }: EventzExpandedProps) {
  const [origin] = useState(() => originRect ?? eventCardOrigin());
  const [manage, setManage] = useState(openChat);
  if (!event || typeof event.id !== "number") return null;
  if (manage) {
    return <EventModal initialSection={openChat ? "attendance" : undefined} event={event} onClose={onClose} onEventUpdated={onEventUpdated} originRect={originRect} documentMeta={documentMeta} />;
  }
  return (
    <>
      {documentMeta && canSharePublicEvent(event) ? <OpenCardMeta title={event.title} description={event.venueName || event.description} /> : null}
      <EventzExpandedInner key={event.id} origin={origin} openPlanning={openPlanning} event={event} onClose={() => closeOpenCard(onClose)} onManage={() => setManage(true)} onOpenEvent={onOpenEvent} />
    </>
  );
}

/**
 * The Info page's STARTS IN panel (v12): accent label, big tabular digits,
 * and the date line, in a bordered box. Renders nothing once the event has
 * started.
 */
function StartsInBox({ event, hostName }: { event: Event; hostName?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const startMs = parsePacificDateTime(event.dateStart);
  if (startMs == null || startMs - now <= 0) return null;
  const venueMark = resolveDirectoryLogo(event.venueName);
  const hostMark = hostName ? resolveDirectoryLogo(hostName) : null;
  return <><h3 className="evz-x__sech">Event details</h3>
  <div className="evz-x__starts" role="timer">
    <span className="evz-timer-mark" aria-hidden="true">{venueMark && <img src={venueMark} alt="" />}</span>
    <div className="evz-timer-value">
      <span className="evz-x__starts-l">Starts in</span>
      <strong>{formatCardCountdown(startMs - now)}</strong>
    </div>
    <span className="evz-timer-mark" aria-hidden="true">{hostMark && hostMark !== venueMark && <img src={hostMark} alt="" />}</span>
  </div></>;
}

function EventPersonRow({ username, children }: { username?: string | null; children: ReactNode }) {
  const href = memberProfileHref(username);
  return href ? <Link className="evz-x__person" href={href}>{children}</Link> : <div className="evz-x__person">{children}</div>;
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

function EventzExpandedInner({ event, onClose, onManage, onOpenEvent, openPlanning, origin }: {
  origin: EventModalOriginRect | null;
  openPlanning: boolean;
  event: Event;
  onClose: () => void;
  onManage: () => void;
  onOpenEvent?: (event: Event) => void;
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState(openPlanning ? 0 : 1);
  const [visited, setVisited] = useState<number[]>([]);
  function selectPage(index: number) {
    setPage(index);
    if (index >= 3) setVisited(previous => previous.includes(index) ? previous : [...previous, index]);
  }
  const [mizzedOpen, setMizzedOpen] = useState(false);
  const [venueDay, setVenueDay] = useState<string | null>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const pages = pagesRef.current;
    const pin = pinRef.current;
    const active = pages?.children[page];
    if (!pages || !pin || !(active instanceof HTMLElement)) return;
    const card = pin.closest<HTMLElement>(".evz-x")!;
    let frame = 0;
    let pinned = false;
    function scrub() {
      frame = 0;
      const progress = Math.min(1, Math.max(0, (active as HTMLElement).scrollTop / 140));
      const scale = 1 - progress * .3;
      card.style.setProperty("--pin-scale", String(scale));
      card.style.setProperty("--pin-progress", String(progress));
      if (progress === 1 && !pinned && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pin!.querySelector(".evz-pin-settle")?.animate(
          [{ opacity: 0 }, { opacity: 1, offset: .32 }, { opacity: 0 }], { duration: 280 }
        );
      }
      pinned = progress === 1;
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(scrub); };
    const measure = () => {
      card.style.setProperty("--pin-height", pin.offsetHeight + "px");
      scrub();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(pin);
    active.addEventListener("scroll", queue, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      active.removeEventListener("scroll", queue);
    };
  }, [page]);
  useLayoutEffect(() => {
    const pages = pagesRef.current;
    if (pages) pages.scrollTo({ left: openPlanning ? 0 : pages.clientWidth, behavior: "instant" });
  }, [openPlanning]);
  const { dialogRef, requestClose } = useOpenCardClose(onClose, true, { origin });

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
    queryKey: ["/api/placez", venue?.id, "card-extras", user?.id],
    queryFn: () => apiRequest("GET", `/api/placez/${venue!.id}`).then((r) => r.json()),
    enabled: Boolean(venue?.id) && (visited.includes(3) || visited.includes(4)),
    staleTime: 300_000,
  });
  const placeData = placeQuery.data;
  const venueUpcoming: PlaceUpcomingEvent[] = Array.isArray(placeData?.upcomingEvents) ? placeData.upcomingEvents : [];
  const promoters: PlacePromoter[] = Array.isArray(placeData?.promoters) ? placeData.promoters : [];
  const eventDayKey = pacificDayKey(event.dateStart);
  const stripDays = eventDayKey && visited.includes(4)
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
  const claimed = (detail?.event ?? event).isClaimed ?? Boolean((detail?.event ?? event).claimedBy);
  const claimable = (detail?.event ?? event).isClaimable && !(detail?.event ?? event).claimedBy;
  const canManage = Boolean(user?.isAdmin) || Boolean(user && hosts.some((h) => h.userId === user.id));
  const ticketUrl = publicHttpUrl(event.ticketUrl);
  const ticketHost = ticketUrl && !ticketUrl.startsWith("/") ? new URL(ticketUrl).hostname : null;
  const startsAt = parsePacificDateTime(event.dateStart);
  const endsAt = parsePacificDateTime(event.dateEnd);
  const music = talent.length ? null : listingDjCredit(event.description);
  // Imported listings may carry an estimated end. Publish a duration only
  // when the event's owning record marks its end as a reviewed field.
  const runtime = event.lockedFields?.includes('"dateEnd"') ? eventRuntime(startsAt, endsAt) : null;
  const age = eventAge(event.ageRequirement);
  const admission = eventPrice(event.admission);
  const ticketFacts = eventTicketFacts(event.description);
  const chips = [
    ...(event.admission && event.admission !== "UNKNOWN" ? [admission] : []),
    ...(age === "Not stated" ? [] : [age]),
    ...(event.isSexPositive ? ["Sex-positive"] : []),
  ];
  const [posterOpen, setPosterOpen] = useState(false);
  const shortWhen = `${formatPacificDateTime(event.dateStart, { weekday: "short", month: "short", day: "numeric" })} · ${eventTimeLabel(event.dateStart)}`;
  const directionsDest = event.lat != null && event.lng != null ? `${event.lat},${event.lng}` : (event.address || `${event.venueName}, Portland, OR`);
  const googleDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDest)}`;
  const appleDirections = `https://maps.apple.com/?daddr=${encodeURIComponent(directionsDest)}`;

  const goTo = (index: number) => {
    const next = (index + PAGES.length) % PAGES.length;
    selectPage(next);
    const el = pagesRef.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "instant" });
  };
  const onPagesScroll = () => {
    const el = pagesRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== page && index >= 0 && index < PAGES.length) selectPage(index);
  };

  return (
    <CardStage onClose={requestClose}>
    <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} data-testid="event-modal" data-card-category="eventz" className="evz-x pdx-glass-rebind" style={{ "--c": accent, "--ac": accent, "--piece": accent } as CSSProperties} aria-label={`${event.title} details`}>
    <div className="evz-sheet-layout">
      <div className="evz-pin" ref={pinRef}>
      <header className="evz-x__heading">
        <div className="evz-x__heading-copy">
          <h2 className="evz-x__title">{event.title}</h2>
          <p className="evz-x__when">{shortWhen} · {venue
            ? <Link href={placePath(venue.id, venue.name)}>{event.venueName}</Link>
            : <strong>{event.venueName}</strong>}</p>
          <div className="evz-x__chips">
            <span className="evz-x__chip" data-claimed={claimed}>{claimed ? "Claimed" : "Unclaimed"}</span>
            {chips.map(chip => <span className="evz-x__chip" key={chip}>{chip}</span>)}
          </div>
        </div>
        <div className="evz-x__thumb">
          {poster ? <button type="button" onClick={() => setPosterOpen(true)} aria-label={`Open full poster for ${event.title}`}>
            <img {...posterAttributes} alt="" onError={e => { if (!restoreOriginalPoster(e.currentTarget, poster)) setFailedPoster(poster); }}/>
          </button> : <PosterlessFlyer placeImageUrl={isFetLife ? null : venue?.imageUrl || event.fallbackPlaceImage} logoUrl={fallbackLogo} wordmark={fallbackWordmark}/>}
          <button type="button" className="evz-x__close" onClick={requestClose} aria-label={`Close ${event.title}`}><X size={18}/></button>
        </div>
      </header>
      <EventActionTiles event={event} website={publicHttpUrl((event as Event & {venueWebsite?: string}).venueWebsite) ?? publicHttpUrl(resolveVenueWebsite(event.venueName))} googleDirections={googleDirections} appleDirections={appleDirections}/>
      {posterOpen && poster && <EventPosterDialog src={poster} title={event.title} onClose={() => setPosterOpen(false)}/>}
      <nav className="evz-x__tabs" aria-label="Event pages">
        {PAGES.map((label, index) => (
          <button key={label} type="button" className={index === page ? "on" : ""} aria-current={index === page ? "page" : undefined} onClick={() => goTo(index)}>
            {label}
          </button>
        ))}
      </nav>
      <span className="evz-pin-settle" aria-hidden="true"/>
      </div>

      <div className="evz-x__pageswrap">
        <div className="evz-x__pages" ref={pagesRef} onScroll={onPagesScroll}>
          <section className="evz-x__page" inert={page !== 0} aria-hidden={page !== 0} aria-label="Feed">
            {page === 0 && event.id > 0 && <EventPlanning section="feed" eventId={event.id} occurrenceDate={event.dateStart} />}
          </section>

          <section className="evz-x__page" inert={page !== 1} aria-hidden={page !== 1} aria-label="Info">

            <StartsInBox event={event} hostName={hostGroup?.name} />
            <h3 className="evz-x__sech">Night at a glance</h3>
            <dl className="evz-glance">
              {music && <div><dt>Music</dt><dd>{music}</dd></div>}
              {event.dateEnd && <div><dt>Ends</dt><dd>{eventTimeLabel(event.dateEnd)}</dd></div>}
              {runtime && <div><dt>Runs</dt><dd>{runtime}</dd></div>}
              {hostGroup && <div className="evz-glance-host">
                <dt>Host</dt>
                <dd><Link href={`/z/${hostGroup.slug}`}>{hostGroup.name} <ArrowUpRight size={12} aria-hidden="true" /></Link></dd>
              </div>}
              {talent.length > 0 && <div><dt>Lineup</dt><dd>{talent.map(person => person.displayName || person.username).filter(Boolean).join(", ")}</dd></div>}
              {!hostGroup && !talent.length && !music && !event.dateEnd && <div><dt>Event</dt><dd>{admission}</dd></div>}
            </dl>
            {event.description && <h3 className="evz-x__sech">About this night</h3>}
            {ticketFacts.description && <p className="evz-x__desc">{ticketFacts.description}</p>}
            {(ticketFacts.prices || ticketUrl) && <section className="evz-tickets" aria-label="Tickets">
              <h3 className="evz-x__sech">Tickets</h3>
              {ticketFacts.prices && <dl className="evz-ticket-prices" aria-label="Ticket prices">
                <div><dt>Presale{ticketUrl && <small>Online</small>}</dt><dd>{ticketFacts.prices.presale}</dd></div>
                <div><dt>Door<small>At {event.venueName}</small></dt><dd>{ticketFacts.prices.door}</dd></div>
              </dl>}
              {ticketUrl && <>
                <a className="evz-ticket-action" href={ticketUrl} target="_blank" rel="noopener noreferrer">
                  Tickets <ArrowUpRight size={17} aria-hidden="true" />
                </a>
                {ticketHost && <small className="evz-ticket-domain">{ticketHost}</small>}
              </>}
            </section>}
            {sourceUrl && <a className="evz-x__link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
              Source link <ArrowUpRight size={16} aria-hidden="true" />
            </a>}
            {claimable ? (
              <p className="evz-x__note">This event has not been claimed by its organizer. Details were sourced from public listings. Please confirm time, venue, and ticketing directly before attending.{hasPendingClaim ? " A claim is pending admin review." : ""}</p>
            ) : null}
            <div className="evz-x__manage">
              {canManage ? <button type="button" className="evz-x__managebtn" onClick={onManage}>Manage event</button> : null}
              <EventReport title={event.title} href={eventPath(event.id, event.title, event.dayOfWeek, pacificCalendarDate(event.dateStart))}/>
            </div>
            <EventRemoveAttendance eventId={event.id} />
            <EventPrivateSaveButton eventId={event.id} />
            <EventHostNotice className="evz-x__note" />
          </section>

          <section className="evz-x__page" inert={page !== 2} aria-hidden={page !== 2} aria-label="Maps">
            <div className="evz-x__sech"><span>Map &amp; directions</span><span className="evz-x__sech-r">Location overview</span></div>
            {page === 2 && <EventMapSurface event={event} primary={flyerAccent || "var(--neon-red)"} complementary="var(--text-hi)">
              {!event.isPrivate && <a className="evz-x__link evz-map-open" href={`/placez/map?mode=mapz&item=event-${event.id}`}>Open on PlaceZ <MapPin size={16}/></a>}
            </EventMapSurface>}
          </section>

          <section className="evz-x__page" inert={page !== 3} aria-hidden={page !== 3} aria-label="People">
            {visited.includes(3) && <>
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
                  return <EventPersonRow key={host.userId} username={host.username}>{inner}</EventPersonRow>;
                })}
              </div>
            ) : (
              <>
                <div className="evz-x__claim">
                  <p className="evz-x__claim-t">{hasPendingClaim ? "Claim in review" : claimable ? "Open to claim" : "Host information"}</p>
                  {hostGroup ? <Link href={`/z/${hostGroup.slug}`} className="evz-x__venuelink">{hostGroup.name}</Link> : <p className="evz-x__claim-s">No public event host is listed.</p>}
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
                    <EventPersonRow key={row.id} username={row.username}>
                      <UserAvatar photoUrl={row.photoUrl} avatarChoice={row.avatarChoice} avatarRing={row.avatarRing} displayName={row.displayName} username={row.username} size={48} />
                      <span className="evz-x__person-meta">
                        <span className="evz-x__person-name">{row.displayName || row.username}</span>
                        <span className="evz-x__person-role" style={{ color: EVENT_TALENT_ROLE_COLORS[row.role]?.color }}>{EVENT_TALENT_ROLE_LABELS[row.role] || row.role} · {row.addedByUserId == null ? "Source unavailable" : row.addedByUserId === row.userId ? "Self-listed" : "Added by host or staff"}</span>
                      </span>
                    </EventPersonRow>
                  ))}
                </div>
              </>
            ) : null}
            <div className="evz-x__sech"><span>Venue promoters</span></div>
            {!detail ? detailStatus : !venue ? <p>No venue is linked.</p> : !Array.isArray(placeData?.promoters) ? <EventReadStatus label="Venue promoters" query={placeQuery} /> : promoters.length > 0 ? (
              <div className="evz-x__people">
                {promoters.map((promoter, index) => (
                  <EventPersonRow key={promoter.username || index} username={promoter.username}>
                    <span className="evz-x__person-name">{promoter.displayName || promoter.name || promoter.username}</span>
                  </EventPersonRow>
                ))}
              </div>
            ) : (
              <p className="evz-x__empty-block">No public promoters listed for this venue.</p>
            )}
            </>}
          </section>

          <section className="evz-x__page" inert={page !== 4} aria-hidden={page !== 4} aria-label="More">
            {visited.includes(4) && <>
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
            <EventMizzedBlock event={event} hasNotes={missedCount > 0} onOpen={() => setMizzedOpen(true)}/>
            {page === 4 && <EventPlanning section="gigs" eventId={event.id} occurrenceDate={event.dateStart}/>}
            </>}
          </section>

          <section className="evz-x__page" inert={page !== 5} aria-hidden={page !== 5} aria-label="Nearby">
            {visited.includes(5) && <>
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
            </>}
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
          <button type="button" className="evz-x__arw" onClick={() => goTo(page - 1)} aria-label="Previous page"><ChevronLeft size={17} aria-hidden="true" /></button>
          <button type="button" className="evz-x__arw" onClick={() => goTo(page + 1)} aria-label="Next page"><ChevronRight size={17} aria-hidden="true" /></button>
          {canSharePublicEvent(event) && <EventShare eventId={event.id} title={event.title} accent={accent} href={eventPath(event.id, event.title, event.dayOfWeek, pacificCalendarDate(event.dateStart))}/>}
          <EventGoingButton eventId={event.id} past={isPastEvent}/>
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
    </div>
    </CardStage>
  );
}
