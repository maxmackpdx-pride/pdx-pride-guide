import type { CSSProperties } from "react";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { DAY_COLORS } from "@shared/eventWeek";
import type { RailCardProps } from "@/components/RailCard";
import ZLineIcon from "@/components/ZLineIcon";

const clock = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

export default function TonightEventCard({ event, listing, rsvped, onToggleRsvp, onOpen }: RailCardProps) {
  const admission = event.adm === "FREE" ? "Free" : event.adm === "SUGGESTED_DONATION" ? "Suggested donation" : "Ticketed";
  return <article className="tonight-card pdx-glass-card pdx-glass-rebind" style={{ "--c": DAY_COLORS[event.day], "--dir-gm": 8 } as CSSProperties}>
    <div className="tonight-card__sheen pdx-glass-sheen--specular" aria-hidden="true" />
    <button className="tonight-card__open" type="button" onClick={() => onOpen(listing)} aria-label={`Open ${event.title}`}>
      <div className="tonight-card__art"><img src={event.posterUrl} alt="" loading="lazy" /><span className="tonight-card__day">Tonight · {event.day}</span></div>
      <div className="tonight-card__body">
        <p className="tonight-card__time"><Clock3 size={15} aria-hidden="true" />{clock.format(event.startMs)} – {clock.format(event.endMs)}</p>
        <h3>{event.title}</h3>
        <p className="tonight-card__venue"><MapPin size={16} aria-hidden="true" /><span>{event.venue}<small>{event.hood}</small></span></p>
        <div className="tonight-card__tags"><span>{admission}</span><span>{event.age === "all-ages" ? "All ages" : event.age}</span></div>
      </div>
    </button>
    <footer className="tonight-card__footer">
      <button type="button" className="tonight-card__save" aria-pressed={rsvped} aria-label={`${rsvped ? "Remove" : "Add"} ${event.title} ${rsvped ? "from" : "to"} my schedule`} onClick={() => onToggleRsvp(event.id)}><ZLineIcon name="favorite" size={18} filled={rsvped} />{rsvped ? "Saved" : "Save"}</button>
      <button type="button" className="tonight-card__view" onClick={() => onOpen(listing)} aria-label={`View ${event.title}`}>View event <ArrowUpRight size={17} aria-hidden="true" /></button>
    </footer>
  </article>;
}
