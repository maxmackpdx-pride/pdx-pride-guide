import PlaceModal from "@/components/PlaceModal";
import OutzCardModal from "./OutzCardModal";
import OutzFollowButton from "./OutzFollowButton";
import CardWaypoint from "./CardWaypoint";
import { useState, type CSSProperties } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import { PLACE_ACCENTS } from "@/components/discovery/placeTokens";
import { DIRECTORY_TYPE_LABELS } from "@shared/directoryTheme";
import VenueFollowButton from "@/components/VenueFollowButton";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@/lib/directoryLogos";
import RailShareButton from "./RailShareButton";
import "./TonightEventCard.css";
import type { Business } from "@/pages/Directory";
import { outzBandArt } from "@/lib/outzKinds";
import "./TodayLocationCard.css";

export type TodayLocation = { key: string; name: string; room: "OutZide" | "Placez"; detail: string; href: string; kind?: string; art?: string; place?: Business };
// Matches the OutZide drawer's waypoint palette and destination categories.
const OUTZ_TOKENS: Record<string, string> = { trail: "--neon-orange", stay: "--neon-magenta", beach: "--neon-magenta", camp: "--green-acid", coastcamp: "--neon-cyan", watercamp: "--neon-cyan", spring: "--neon-cyan", fishing: "--green-acid", boating: "--neon-cyan", atv: "--neon-red", winter: "--neon-blue", dayuse: "--neon-yellow" };
const OUTZ_LABELS: Record<string, string> = { trail: "Trail", stay: "Stay", beach: "Beach", camp: "Camp", coastcamp: "Coastal camp", watercamp: "Waterfront camp", spring: "Hot spring", fishing: "Fishing", boating: "Boating", atv: "Off-road", winter: "Winter", dayuse: "Day use" };

export default function TodayLocationCard({ location, onRequireAuth }: { location: TodayLocation; onRequireAuth?: () => void }) {
  const [open, setOpen] = useState(false);
  const isPlace = location.room === "Placez";
  const kind = location.place?.type || "community";
  const accent = isPlace ? PLACE_ACCENTS[kind] || "var(--neon-cyan)" : `var(${OUTZ_TOKENS[location.kind || ""] || "--neon-yellow"})`;
  const art = location.art ? `/outzide-map/${location.art.replace(/^\//, "")}` : outzBandArt(location.key.replace(/^outz:/, ""));
  const businessLogo = isPlace ? resolveDirectoryLogo(location.name, location.place?.imageUrl) || directoryFallbackLogo(kind) : null;
  const label = isPlace ? DIRECTORY_TYPE_LABELS[kind] || "Placez" : OUTZ_LABELS[location.kind || ""] || "Destination";
  return <><article className="tonight-card today-location pdx-glass-card pdx-glass-rebind" style={{ "--c": accent, "--dir-gm": 8 } as CSSProperties}>
    {isPlace && <ResourceCardMotif name={location.name} category={`place-${kind}`} />}
    <CardWaypoint kind={isPlace ? kind : location.kind || "trail"} outside={!isPlace} />
    <RailShareButton href={location.href} title={location.name} />
    <button type="button" className="tonight-card__open" aria-label={`Open ${location.name}`} onClick={() => setOpen(true)}>
      <div className="tonight-card__art today-location__art">
        {!isPlace && <img src={art} alt="" loading="lazy" />}
        {isPlace && <img className={`today-location__brand${isPlace ? " today-location__brand--business" : ""}`} src={businessLogo || "/brand/outzide.png"} alt={isPlace ? `${location.name} logo` : "OutZide"} onError={event => { if (isPlace) { event.currentTarget.onerror = null; event.currentTarget.src = directoryFallbackLogo(kind); } }} />}
      </div>
      <div className="tonight-card__body">
        <p className="rail-card-room"><img className={isPlace ? "rail-card-room__logo rail-card-room__logo--white" : "rail-card-room__logo"} src={isPlace ? "/brand/family/our-placez.svg" : "/brand/outzide.png"} alt={location.room} /></p>
        <p className="tonight-card__time">{label}</p>
        <h3 title={location.name}>{location.name}</h3>
        <p className="tonight-card__venue"><MapPin size={16} aria-hidden="true" /><span>{location.detail}</span></p>
        <div className="tonight-card__tags"><span>{label}</span></div>
      </div>
    </button>
    <footer className="tonight-card__footer">
      {!isPlace && <OutzFollowButton placeId={location.key.replace(/^outz:/, "")} onRequireAuth={onRequireAuth} />}
      {isPlace && location.place && <VenueFollowButton accent={accent} businessId={location.place.id} initialFollowing={Boolean(location.place.isFollowing)} onRequireAuth={onRequireAuth} />}
      <button type="button" className="tonight-card__view" onClick={() => setOpen(true)}>View details <ArrowUpRight size={17} aria-hidden="true" /></button>
    </footer>
  </article>{open && (isPlace && location.place ? <PlaceModal place={location.place} onClose={() => setOpen(false)} onRequireAuth={onRequireAuth || (() => {})} /> : <OutzCardModal location={location} onClose={() => setOpen(false)} onRequireAuth={onRequireAuth} />)}</>;
}
