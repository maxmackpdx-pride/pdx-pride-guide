import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { dayAccentToken, dayComplementToken } from "@/lib/dsColors";
import type { ScheduleEvent } from "@/lib/scheduleEvents";
import type { EventListing } from "@shared/multiDayEvents";
import { formatCardTime, formatGridCardWhen, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import "./TonightEventCard.css";
import DayMotif, { motifDay } from "@/components/events/DayMotif";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import RailShareButton from "./RailShareButton";
import { eventPath } from "@shared/eventSlug";
import ZLineIcon from "@/components/ZLineIcon";
import { ChangeBadge } from "@/components/ds/ChangeBadge";

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

export type TonightEventCardProps = {
  event?: ScheduleEvent;
  listing: EventListing;
  rsvped: boolean;
  onToggleRsvp: (eventId: number) => void;
  onOpen: (listing: EventListing) => void;
  liveState?: TonightCardLive | null;
  /** "card" (default): the fixed-size big event card. "row": the list-view row. */
  layout?: "card" | "row";
};

export default function TonightEventCard({ event, listing, rsvped, onToggleRsvp, onOpen, liveState, layout = "card" }: TonightEventCardProps) {
  const admission = listing.admission === "FREE" ? "Free" : listing.admission === "SUGGESTED_DONATION" ? "Suggested donation" : listing.admission === "DOOR_FEE" ? "Door fee" : "Ticketed";
  // Saved cards show what moved since you saved them (last two weeks).
  const changedAt = listing.lastChangeAt ? Date.parse(listing.lastChangeAt) : NaN;
  const changeLabel = rsvped && listing.lastChangeLabel && Number.isFinite(changedAt) && Date.now() - changedAt < CHANGE_WINDOW_MS ? listing.lastChangeLabel : null;
  const poster = listingPosterUrl(listing);
  const age = listing.ageRequirement === "21_PLUS" ? "21+" : listing.ageRequirement === "18_PLUS" ? "18+" : "All ages";
  return <article className={`tonight-card tonight-card--${layout} pdx-glass-card pdx-glass-rebind`} style={{ "--c": dayAccentToken(listingDay(listing)), "--card-secondary-override": dayComplementToken(listingDay(listing)), "--dir-gm": 8 } as CSSProperties}>
    {poster
      ? <DayMotif day={listingDay(listing)} placement="card" />
      : <DayMotif day={listingDay(listing)} placement="art" className="tonight-card__motif-fill" />}
    <RailShareButton href={eventPath(listing.id, listing.title, listing.dayOfWeek)} title={listing.title} />
    {liveState ? <LiveBadge live={liveState} /> : null}
    <div className="tonight-card__sheen pdx-glass-sheen--specular" aria-hidden="true" />
    <button className="tonight-card__open" type="button" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
      <div className={`tonight-card__art tonight-card__art--flyer${poster ? "" : " tonight-card__art--motif"}`}>{poster ? <EventFlyerArt src={poster} day={listingDay(listing)} /> : <i className="day-motif-code">{motifDay(listingDay(listing))}</i>}</div>
      <div className="tonight-card__body">
        <p className="rail-card-room"><img className="rail-card-room__logo rail-card-room__logo--white" src="/brand/family/eventz.png" alt="Eventz" /></p>
        {changeLabel ? <ChangeBadge label={changeLabel} className="tonight-card__change" /> : null}
        <p className="tonight-card__time"><Clock3 size={15} aria-hidden="true" />{event ? `${clock.format(event.startMs)} to ${clock.format(event.endMs)}` : layout === "card" ? formatCardTime(listing) : formatGridCardWhen(listing)}</p>
        <h3 title={listing.title}>{listing.title}</h3>
        <p className="tonight-card__venue"><MapPin size={16} aria-hidden="true" /><span>{listing.venueName}<small>{listing.neighborhood || "Portland"}</small></span></p>
        <div className="tonight-card__tags"><span>{admission}</span><span>{age}</span></div>
      </div>
    </button>
    <footer className="tonight-card__footer">
      <button type="button" className="tonight-card__save" aria-pressed={rsvped} aria-label={`${rsvped ? "Remove" : "Add"} ${listing.title} ${rsvped ? "from" : "to"} my schedule`} onClick={() => onToggleRsvp(listing.id)}><ZLineIcon name="favorite" size={18} filled={rsvped} />{rsvped ? "Saved" : "Save"}</button>
      <button type="button" className="tonight-card__view" onClick={() => onOpen(listing)} aria-label={`View ${listing.title}`}>View event <ArrowUpRight size={17} aria-hidden="true" /></button>
    </footer>
  </article>;
}
