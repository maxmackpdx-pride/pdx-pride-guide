import type { CSSProperties } from "react";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { dayAccentToken } from "@/lib/dsColors";
import type { RailCardProps } from "@/components/RailCard";
import { formatGridCardWhen, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import "./TonightEventCard.css";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import RailShareButton from "./RailShareButton";
import { eventPath } from "@shared/eventSlug";
import ZLineIcon from "@/components/ZLineIcon";

const clock = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

export default function TonightEventCard({ event, listing, rsvped, onToggleRsvp, onOpen }: Omit<RailCardProps, "event"> & { event?: RailCardProps["event"] }) {
  const admission = listing.admission === "FREE" ? "Free" : listing.admission === "SUGGESTED_DONATION" ? "Suggested donation" : listing.admission === "DOOR_FEE" ? "Door fee" : "Ticketed";
  const age = listing.ageRequirement === "21_PLUS" ? "21+" : listing.ageRequirement === "18_PLUS" ? "18+" : "All ages";
  return <article className="tonight-card pdx-glass-card pdx-glass-rebind" style={{ "--c": dayAccentToken(listingDay(listing)), "--dir-gm": 8 } as CSSProperties}>
    <ResourceCardMotif name={listing.title} category="eventz" />
    <RailShareButton href={eventPath(listing.id, listing.title, listing.dayOfWeek)} title={listing.title} />
    <div className="tonight-card__sheen pdx-glass-sheen--specular" aria-hidden="true" />
    <button className="tonight-card__open" type="button" onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
      <div className="tonight-card__art tonight-card__art--flyer"><img src={listingPosterUrl(listing)} alt="" loading="lazy" /></div>
      <div className="tonight-card__body">
        <p className="rail-card-room"><img className="rail-card-room__logo rail-card-room__logo--white" src="/brand/family/eventz.png" alt="Eventz" /></p>
        <p className="tonight-card__time"><Clock3 size={15} aria-hidden="true" />{event ? `${clock.format(event.startMs)} – ${clock.format(event.endMs)}` : formatGridCardWhen(listing)}</p>
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
