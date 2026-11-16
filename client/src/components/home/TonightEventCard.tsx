import { rememberCardOrigin } from "@/components/cards/CardAPI";
import { CardMorph } from "@/components/cards/react19Card";
import { cardMorphName, nextOptimisticFlag, openCardFromEvent } from "@/components/cards/react19CardModel";
import { startTransition, useEffect, useOptimistic, useState, type CSSProperties } from "react";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import type { ScheduleEvent } from "@/lib/scheduleEvents";
import type { EventListing } from "@shared/multiDayEvents";
import { formatCardTime, formatGridCardWhen, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { formatPacificDateTime } from "@/lib/countdown";
import { parsePacificDateTime } from "@shared/missedConnections";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import "./TonightEventCard.css";
import "../events/EventzFaces.css";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import RailShareButton from "./RailShareButton";
import { eventPath } from "@shared/eventSlug";
import ZLineIcon from "@/components/ZLineIcon";
import { ChangeBadge } from "@/components/ds/ChangeBadge";
import { CardArtworkGlass } from '../CardArtworkGlass';
import { CardHeartButton } from "@/components/CardHeartButton";

const CHANGE_WINDOW_MS = 14 * 86400000;

const clock = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

/** Live state for a card: on now, or starting soon with a ticking countdown. */
export type TonightCardLive = { kind: "now" } | { kind: "soon"; startMs: number };

const pad2 = (n: number) => String(n).padStart(2, "0");

export function LiveBadge({ live }: { live: TonightCardLive }) {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (live.kind !== "soon") return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live]);
  const left = live.kind === "soon" ? Math.max(0, live.startMs - tick) : 0;
  if (live.kind === "now" || left === 0) {
    return <span className="tonight-card__live"><i aria-hidden="true" />On now</span>;
  }
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className="tonight-card__live tonight-card__live--count" role="timer" aria-label={`Starts in ${h ? `${h} hours ` : ""}${m} minutes`}>
      <i aria-hidden="true" />
      <span className="tonight-card__live-label">Starts in</span>
      <b aria-hidden="true">{h}:{pad2(m)}:{pad2(s)}</b>
    </span>
  );
}

/**
 * Tall-face countdown, styled after the Placez NextEventCountdown: an accent
 * "Starts in" label, big tabular digits (days / hrs / min) and the date line.
 * Renders nothing once the event has started (the live badge takes over).
 */
export function EventStartsIn({ listing }: { listing: EventListing }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const startMs = parsePacificDateTime(listing.dateStart);
  if (startMs == null) return null;
  const remaining = startMs - now;
  if (remaining <= 0) return null;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const units: Array<[number, string]> = [[days, "days"], [hours, "hrs"], [minutes, "min"]];
  return (
    <section className="evz-countdown" aria-label={`Starts in ${days} days, ${hours} hours, ${minutes} minutes`}>
      <p className="evz-countdown__label">Starts in</p>
      <div className="evz-countdown__digits" aria-hidden="true">
        {units.map(([value, unit]) => (
          <span key={unit}><strong>{pad2(value)}</strong><small>{unit}</small></span>
        ))}
      </div>
      <time dateTime={listing.dateStart}>{formatPacificDateTime(listing.dateStart, { weekday: "short", month: "short", day: "numeric" })} · {formatCardTime(listing)}</time>
    </section>
  );
}

/** Wide face's only counter: Gigz at the event's venue, from the detail payload. Unknown reads as a dash until it lands. */
function GigzCounter({ eventId }: { eventId: number }) {
  const { data } = useQuery<{ gigs?: unknown[] }>({
    queryKey: ["/api/events", eventId, "detail"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/detail`).then((r) => r.json()),
    staleTime: 300_000,
  });
  const count = Array.isArray(data?.gigs) ? data.gigs.length : null;
  return (
    <span className="evz-count" aria-label={count == null ? "Gigz count loading" : `${count} Gigz at this venue`}>
      <strong>{count == null ? "–" : pad2(count)}</strong><span>Gigz</span>
    </span>
  );
}

export type TonightEventCardProps = {
  event?: ScheduleEvent;
  listing: EventListing;
  rsvped: boolean;
  onToggleRsvp: (eventId: number) => void;
  onOpen: (listing: EventListing) => void;
  liveState?: TonightCardLive | null;
  /** "card" (default): the fixed-size big event card. "row": the wide full-bleed card. */
  layout?: "card" | "row";
};

export default function TonightEventCard({ event, listing, rsvped, onToggleRsvp, onOpen, liveState, layout = "card" }: TonightEventCardProps) {
  const [saved, setSaved] = useOptimistic(rsvped, nextOptimisticFlag);
  const admission = listing.admission === "FREE" ? "Free" : listing.admission === "SUGGESTED_DONATION" ? "Suggested donation" : listing.admission === "DOOR_FEE" ? "Door fee" : "Ticketed";
  // Saved cards show what moved since you saved them (last two weeks).
  const changedAt = listing.lastChangeAt ? Date.parse(listing.lastChangeAt) : NaN;
  const changeLabel = rsvped && listing.lastChangeLabel && Number.isFinite(changedAt) && Date.now() - changedAt < CHANGE_WINDOW_MS ? listing.lastChangeLabel : null;
  const poster = listingPosterUrl(listing);
  // Flyer accent (QSearch flyer-accent system) drives the card's color when set; the day accent is the fallback.
  const flyerAccent = (listing as { accentColor?: string | null }).accentColor || null;
  const accent = flyerAccent ?? dayAccentToken(listingDay(listing));
  const age = listing.ageRequirement === "21_PLUS" ? "21+" : listing.ageRequirement === "18_PLUS" ? "18+" : "All ages";
  const toggleSave = (click: { stopPropagation: () => void }) => {
    click.stopPropagation();
    const next = !rsvped;
    startTransition(() => { setSaved(next); });
    onToggleRsvp(listing.id);
  };
  const open = (click: { currentTarget: EventTarget | null }) => openCardFromEvent(click, () => onOpen(listing));

  if (layout === "row") {
    return <CardMorph name={cardMorphName(["event", listing.id, layout])}><article data-card-size="wide" data-card-category={"eventz"} onClickCapture={rememberCardOrigin} className="evz-face evz-face--wide pdx-glass-rebind" style={{ "--c": accent, "--ac": accent, "--card-secondary-override": dayComplementToken(listingDay(listing)) } as CSSProperties}>
      <button className="tonight-card__open evz-face__open" type="button" onClick={open} aria-label={`Open ${listing.title}`}>
        <span className="tonight-card__art evz-wide__art">
          <EventFlyerArt src={poster} day={listingDay(listing)} title={listing.title} venueName={listing.venueName} sizes="360px" />
          <CardArtworkGlass />
        </span>
        <span className="evz-wide__scrim">
          <span className="tonight-card__body evz-wide__id">
            {changeLabel ? <ChangeBadge label={changeLabel} className="evz-wide__change" /> : null}
            <h3 className="evz-wide__title">{listing.title}</h3>
            <span className="evz-wide__meta">{event ? `${clock.format(event.startMs)} to ${clock.format(event.endMs)}` : formatGridCardWhen(listing)} · {listing.venueName}</span>
          </span>
          <GigzCounter eventId={listing.id} />
        </span>
      </button>
      {liveState ? <LiveBadge live={liveState} /> : null}
      <CardHeartButton active={saved}
        className="evz-wide__save"
        aria-pressed={saved}
        aria-label={`${saved ? "Remove" : "Add"} ${listing.title} ${saved ? "from" : "to"} my schedule`}
        onClick={toggleSave}
      />
    </article></CardMorph>;
  }

  return <CardMorph name={cardMorphName(["event", listing.id, layout])}><article data-card-size="tall" data-card-category={"eventz"} onClickCapture={rememberCardOrigin} className="evz-face evz-face--tall pdx-glass-rebind" style={{ "--c": accent, "--ac": accent, "--card-secondary-override": dayComplementToken(listingDay(listing)) } as CSSProperties}>
    <RailShareButton href={eventPath(listing.id, listing.title, listing.dayOfWeek)} title={listing.title} />
    {liveState ? <LiveBadge live={liveState} /> : null}
    <button className="tonight-card__open evz-face__open" type="button" onClick={open} aria-label={`Open ${listing.title}`}>
      <span className="tonight-card__art evz-tall__art">
        <EventFlyerArt src={poster} day={listingDay(listing)} title={listing.title} venueName={listing.venueName} sizes="200px" />
        <CardArtworkGlass />
        {liveState ? null : <EventStartsIn listing={listing} />}
      </span>
      <span className="tonight-card__body evz-tall__body">
        {changeLabel ? <ChangeBadge label={changeLabel} className="evz-tall__change" /> : null}
        <h3 title={listing.title}>{listing.title}</h3>
        <span className="evz-tall__venue"><MapPin size={15} aria-hidden="true" /><span>{listing.venueName}<small>{listing.neighborhood || "Portland"}</small></span></span>
        <span className="evz-tall__time"><Clock3 size={14} aria-hidden="true" />{event ? `${clock.format(event.startMs)} to ${clock.format(event.endMs)}` : formatCardTime(listing)}</span>
        <span className="evz-tall__tags"><span>{admission}</span><span>{age}</span></span>
      </span>
    </button>
    <footer className="evz-tall__actions">
      <button type="button" className="evz-tall__details" onClick={open} aria-label={`View ${listing.title}`}>View event <ArrowUpRight size={16} aria-hidden="true" /></button>
      <button type="button" className="evz-tall__heart" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Add"} ${listing.title} ${saved ? "from" : "to"} my schedule`} onClick={toggleSave}><ZLineIcon name="favorite" size={18} filled={saved} /></button>
    </footer>
  </article></CardMorph>;
}
