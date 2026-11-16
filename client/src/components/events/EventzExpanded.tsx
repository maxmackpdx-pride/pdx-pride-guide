import { useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Share2, X } from "lucide-react";
import type { Event } from "@shared/schema";
import { EVENT_TALENT_ROLE_COLORS, EVENT_TALENT_ROLE_LABELS, type EventTalentRow } from "@shared/eventTalent";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { publicHttpUrl } from "@shared/safeHttpUrl";
import { resolveVenueWebsite } from "@shared/venueLinks";
import { CardDetails } from "@/components/cards/CardAPI";
import { OpenCardMeta } from "@/components/cards/react19Card";
import { closeOpenCard } from "@/components/cards/react19CardModel";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import { useAuth } from "@/context/AuthContext";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import { formatCardTime, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { formatPacificDateTime } from "@/lib/countdown";
import { eventTimeLabel } from "@/lib/eventDisplay";
import { parsePacificDateTime } from "@shared/missedConnections";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { shareEventLink, shareToastTitle } from "@/lib/shareEvent";
import { timeAgo } from "@/lib/timeAgo";
import { useResponsivePoster } from "@/lib/useResponsivePoster";
import { POSTER_DETAIL_SIZES, restoreOriginalPoster } from "@/lib/responsivePoster";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import EventLocationMap from "@/components/EventLocationMap";
import MissedConnectionsPanel from "@/components/MissedConnectionsPanel";
import AttendanceCluster from "@/components/AttendanceCluster";
import EventModal, { type EventModalOriginRect } from "@/components/EventModal";
import ZLineIcon from "@/components/ZLineIcon";
import "./EventzExpanded.css";

/**
 * The Eventz expanded card, built on the Placez setup: one card, five swipe
 * pages (Feed / Info / Maps / More + Nearby / People), the flyer full-size
 * from the top with its gradient starting 35% down the card, black action
 * cards, and the pager + SAVE THIS EVENT pinned at the bottom. Data comes
 * from GET /api/events/:id/detail. Admin / edit / moderation stay in
 * EventModal, one tap away from the Info page. Made-by: Muse
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

type EventDetail = {
  event: Event;
  venue: SlimPlace | null;
  hosts: DetailHost[];
  talent: EventTalentRow[];
  gigs: DetailGig[];
  missedConnections: unknown[];
  nearby: { restaurants: SlimPlace[]; events: NearbyEvent[] };
};

const PAGES = ["Feed", "Info", "Maps", "More", "People"] as const;

type EventzExpandedProps = {
  event: Event;
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
  originRect?: EventModalOriginRect | null;
  documentMeta?: boolean;
  onOpenEvent?: (event: Event) => void;
};

export default function EventzExpanded({ event, onClose, onEventUpdated, originRect = null, documentMeta = true, onOpenEvent }: EventzExpandedProps) {
  const [manage, setManage] = useState(false);
  if (!event || typeof event.id !== "number") return null;
  if (manage) {
    return <EventModal event={event} onClose={onClose} onEventUpdated={onEventUpdated} originRect={originRect} documentMeta={documentMeta} />;
  }
  return (
    <CardDetails navigationWidth key={event.id} onClose={onClose}>
      {documentMeta ? <OpenCardMeta title={event.title} description={event.venueName || event.description} /> : null}
      <EventzExpandedInner event={event} onClose={() => closeOpenCard(onClose)} onManage={() => setManage(true)} onOpenEvent={onOpenEvent} />
    </CardDetails>
  );
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

function EventzExpandedInner({ event, onClose, onManage, onOpenEvent }: {
  event: Event;
  onClose: () => void;
  onManage: () => void;
  onOpenEvent?: (event: Event) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const saves = useSavedEvents();
  const rsvp = useEventRsvp();
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState(0);
  const [mizzedOpen, setMizzedOpen] = useState(false);
  const pagesRef = useRef<HTMLDivElement>(null);
  const { dialogRef, requestClose } = useOpenCardClose(onClose);

  const { data: rawDetail } = useQuery<EventDetail>({
    queryKey: ["/api/events", event.id, "detail"],
    queryFn: () => apiRequest("GET", `/api/events/${event.id}/detail`).then((r) => r.json()),
    staleTime: 60_000,
  });
  const detail = rawDetail && !Array.isArray(rawDetail) ? rawDetail : undefined;
  const hosts: DetailHost[] = Array.isArray(detail?.hosts) ? detail.hosts : [];
  const talent: EventTalentRow[] = Array.isArray(detail?.talent) ? detail.talent : [];
  const gigs: DetailGig[] = Array.isArray(detail?.gigs) ? detail.gigs : [];
  const missedCount = Array.isArray(detail?.missedConnections) ? detail.missedConnections.length : 0;
  const restaurants: SlimPlace[] = Array.isArray(detail?.nearby?.restaurants) ? detail.nearby.restaurants : [];
  const nearbyEvents: NearbyEvent[] = Array.isArray(detail?.nearby?.events) ? detail.nearby.events : [];
  const venue = detail?.venue ?? null;

  const day = listingDay(event);
  const flyerAccent = (event as { accentColor?: string | null }).accentColor || null;
  const accent = flyerAccent ?? dayAccentToken(day);
  const poster = listingPosterUrl(event);
  const posterAttributes = useResponsivePoster(poster, POSTER_DETAIL_SIZES);
  const saved = saves.savedIds.has(event.id);
  const interested = rsvp.myEventIds.has(event.id);
  const endMs = parsePacificDateTime(event.dateEnd);
  const isPastEvent = endMs != null && endMs < Date.now();
  const hasPendingClaim = Boolean((event as { hasPendingClaim?: boolean }).hasPendingClaim);
  const canManage = Boolean(user?.isAdmin) || Boolean(user && hosts.some((h) => h.userId === user.id));
  const primaryLink = primaryLinkFor(event);
  const age = event.ageRequirement === "21_PLUS" ? "21+" : event.ageRequirement === "18_PLUS" ? "18+" : "All ages";
  const admission = event.admission === "FREE" ? "Free" : event.admission === "SUGGESTED_DONATION" ? "Suggested donation" : event.admission === "DOOR_FEE" ? "Door fee" : "Ticketed";
  const chips = [...getEventTypeTagsForEvent(event).slice(0, 3), age, ...(event.isSexPositive ? ["Sex-positive"] : [])];
  const whenLine = `${formatPacificDateTime(event.dateStart, { weekday: "long", month: "long", day: "numeric" })} · ${formatCardTime(event)}`;
  const mapHref = event.lat != null && event.lng != null
    ? `/map?layer=events&lat=${event.lat}&lng=${event.lng}&zoom=15`
    : `/map?layer=events&q=${encodeURIComponent(event.title)}`;

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
  const toggleSave = () => { if (user) saves.toggleSave(event.id); else setShowAuth(true); };
  const share = async () => {
    try {
      const result = await shareEventLink(eventPath(event.id, event.title, event.dayOfWeek), event.title);
      toast({ title: shareToastTitle(result, "event") });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast({ title: "Could not share. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div ref={dialogRef} data-testid="event-modal" data-card-category="eventz" className="evz-x pdx-glass-rebind" style={{ "--c": accent, "--ac": accent } as CSSProperties} aria-label={`${event.title} details`}>
      <header className="evz-x__hero">
        {poster
          ? <img {...posterAttributes} alt="" loading="lazy" decoding="async" className="evz-x__flyer" onError={(e) => { restoreOriginalPoster(e.currentTarget, poster); }} />
          : <span className="evz-x__flyer evz-x__flyer--none" aria-hidden="true" />}
        <span className="evz-x__grad" aria-hidden="true" />
        <div className="evz-x__chrome">
          <button type="button" className="evz-x__iconbtn" onClick={share} aria-label={`Share ${event.title}`}><Share2 size={17} aria-hidden="true" /></button>
          <button type="button" className="evz-x__iconbtn" onClick={requestClose} aria-label={`Close ${event.title}`}><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="evz-x__id">
          <p className="evz-x__when"><CalendarDays size={13} aria-hidden="true" />{whenLine}</p>
          <h2 className="evz-x__title">{event.title}</h2>
          <p className="evz-x__venue"><MapPin size={14} aria-hidden="true" />{event.venueName}{event.neighborhood ? <span> · {event.neighborhood}</span> : null}</p>
          <div className="evz-x__chips">{chips.map((chip) => <span key={chip} className="evz-x__chip">{chip}</span>)}</div>
        </div>
      </header>

      <div className="evz-x__actions">
        <button type="button" className="evz-x__act" aria-pressed={interested} disabled={rsvp.isRsvpPending(event.id)} onClick={() => rsvp.toggleRsvp(event.id)}>
          <span className="evz-x__act-main">
            <span className="evz-x__act-t">{isPastEvent ? "I was there" : interested ? "You're interested" : "I'm interested"}</span>
            <span className="evz-x__act-s">{interested ? "You're on the list — tap to undo" : "Join the interested list for this event"}</span>
          </span>
          <span className="evz-x__act-ar" aria-hidden="true">›</span>
        </button>
        <button type="button" className="evz-x__act" aria-expanded={mizzedOpen} onClick={() => setMizzedOpen((open) => !open)}>
          <span className="evz-x__act-main">
            <span className="evz-x__act-t">Add a Mizzed Connection</span>
            <span className="evz-x__act-s">{missedCount > 0 ? `${missedCount} posted for this event` : "Post during or after the event"}</span>
          </span>
          <span className="evz-x__act-ar" aria-hidden="true">›</span>
        </button>
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
          <section className="evz-x__page" aria-label="Feed — Gigz">
            <div className="evz-x__sech"><span>Gigz at {event.venueName}</span>{detail ? <span className="evz-x__cnt">{gigs.length}</span> : null}</div>
            {!detail ? <p className="evz-x__empty">Loading Gigz…</p> : gigs.length === 0 ? (
              <p className="evz-x__empty">No Gigz posted at {event.venueName} right now. Gigz the venue posts land here.</p>
            ) : gigs.map((gig) => (
              <article key={gig.id} className="evz-x__gig">
                <div className="evz-x__gig-t"><span>{gig.title}</span>{gig.compensation ? <span className="evz-x__gig-pay">{gig.compensation}</span> : null}</div>
                <p className="evz-x__gig-meta">{[gig.postType?.replace(/_/g, " "), gig.gigDate ? `${gig.gigDate}${gig.gigTime ? ` · ${gig.gigTime}` : ""}` : timeAgo(gig.createdAt), gig.location].filter(Boolean).join(" · ")}</p>
                {gig.description ? <p className="evz-x__gig-desc">{gig.description}</p> : null}
              </article>
            ))}
          </section>

          <section className="evz-x__page" aria-label="Info">
            <div className="evz-x__kv"><Clock3 size={17} aria-hidden="true" /><span>{whenLine}</span></div>
            <div className="evz-x__kv"><MapPin size={17} aria-hidden="true" /><span>{event.venueName}{event.address ? <><br />{event.address}</> : null}</span></div>
            {event.description ? <p className="evz-x__desc">{event.description}</p> : null}
            <div className="evz-x__kv"><span className="evz-x__kv-k">Admission</span><span>{admission}</span></div>
            <div className="evz-x__kv"><span className="evz-x__kv-k">Age</span><span>{age}</span></div>
            {primaryLink ? (
              <a className="evz-x__link" href={primaryLink.href} target="_blank" rel="noopener noreferrer">{primaryLink.label} <ArrowUpRight size={16} aria-hidden="true" /></a>
            ) : null}
            {event.isClaimable ? (
              <p className="evz-x__note">This event has not been claimed by its organizer. Details were sourced from public listings. Please confirm time, venue, and ticketing directly before attending.{hasPendingClaim ? " A claim is pending admin review." : ""}</p>
            ) : null}
            <div className="evz-x__manage">
              {canManage ? <button type="button" className="evz-x__managebtn" onClick={onManage}>Manage event</button> : null}
              <button type="button" className="evz-x__managebtn" onClick={onManage}>Report / request a change</button>
            </div>
          </section>

          <section className="evz-x__page" aria-label="Maps">
            <div className="evz-x__sech"><span>{event.venueName}</span></div>
            <p className="evz-x__addr">{event.address || venue?.address || "Portland, OR"}</p>
            <EventLocationMap event={event} primary={accent} complementary={dayComplementToken(day)} scheduled={interested} schedulePending={rsvp.isRsvpPending(event.id)} onSchedule={() => rsvp.toggleRsvp(event.id)} />
            <a className="evz-x__link" href={mapHref}>View on Mapz <ArrowUpRight size={16} aria-hidden="true" /></a>
          </section>

          <section className="evz-x__page" aria-label="More + Nearby">
            <div className="evz-x__sech"><span>Restaurants close by</span></div>
            {!detail ? <p className="evz-x__empty">Loading nearby…</p> : restaurants.length === 0 ? (
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
            <div className="evz-x__sech"><span>Same day, close by</span></div>
            {!detail ? <p className="evz-x__empty">Loading nearby events…</p> : nearbyEvents.length === 0 ? (
              <p className="evz-x__empty">No other events close by on this day.</p>
            ) : (
              <div className="evz-x__rail">
                {nearbyEvents.map((near) => {
                  const nearPoster = listingPosterUrl(near);
                  const nearAccent = (near as { accentColor?: string | null }).accentColor || accent;
                  return (
                    <button key={near.id} type="button" className="evz-x__railcard" style={{ "--ac": nearAccent } as CSSProperties}
                      onClick={() => { if (onOpenEvent) onOpenEvent(near); else setLocation(eventPath(near.id, near.title, near.dayOfWeek)); }}
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

          <section className="evz-x__page" aria-label="People">
            {hosts.length > 0 ? (
              <>
                <div className="evz-x__sech"><span>{hosts.length === 1 ? "Host" : "Hosts"}</span></div>
                <div className="evz-x__people">
                  {hosts.map((host) => {
                    const inner = (
                      <>
                        <UserAvatar photoUrl={host.photoUrl} avatarChoice={host.avatarChoice} avatarRing={host.avatarRing} displayName={host.displayName} username={host.username} size={48} />
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
              </>
            ) : null}
            {talent.length > 0 ? (
              <>
                <div className="evz-x__sech"><span>Talent</span></div>
                <div className="evz-x__people">
                  {talent.map((row) => (
                    <div key={row.id} className="evz-x__person">
                      <UserAvatar photoUrl={row.photoUrl} avatarChoice={row.avatarChoice} avatarRing={row.avatarRing} displayName={row.displayName} username={row.username} size={48} />
                      <span className="evz-x__person-meta">
                        <span className="evz-x__person-name">{row.displayName || row.username}</span>
                        <span className="evz-x__person-role" style={{ color: EVENT_TALENT_ROLE_COLORS[row.role]?.color }}>{EVENT_TALENT_ROLE_LABELS[row.role] || row.role}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {hosts.length === 0 && talent.length === 0 ? (
              <div className="evz-x__claim">
                <p className="evz-x__claim-t">Unclaimed</p>
                <p className="evz-x__claim-s">No organizer has claimed this event yet, and no talent is tagged.</p>
                {event.isClaimable && !hasPendingClaim ? (
                  <button type="button" className="evz-x__claimbtn" onClick={() => { if (user) setLocation(`/submit/claim/${event.id}`); else setShowAuth(true); }}>Claim this event</button>
                ) : null}
                {hasPendingClaim ? <p className="evz-x__claim-s">Claim pending admin review.</p> : null}
              </div>
            ) : null}
            <div className="evz-x__sech"><span>{isPastEvent ? "Who was there" : "Going"}</span></div>
            <AttendanceCluster eventId={event.id} embedded pastEvent={isPastEvent} />
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
              <button key={label} type="button" className={index === page ? "on" : ""} onClick={() => goTo(index)} aria-label={`Go to ${label} page`} />
            ))}
            <span className="evz-x__pg">Page {page + 1} · {PAGES[page]}</span>
          </div>
          <button type="button" className="evz-x__arw" onClick={() => goTo(page + 1)} disabled={page === PAGES.length - 1} aria-label="Next page"><ChevronRight size={17} aria-hidden="true" /></button>
        </div>
        <div className="evz-x__save">
          <button type="button" className="evz-x__savet" aria-pressed={saved} onClick={toggleSave}>Save this event</button>
          <button type="button" className="evz-x__heart" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Add"} ${event.title} ${saved ? "from" : "to"} my schedule`} onClick={toggleSave}>
            <ZLineIcon name="favorite" size={18} filled={saved} />
          </button>
        </div>
      </footer>

      {(showAuth || rsvp.showAuth) && <AuthModal onClose={() => { setShowAuth(false); rsvp.setShowAuth(false); }} />}
    </div>
  );
}
