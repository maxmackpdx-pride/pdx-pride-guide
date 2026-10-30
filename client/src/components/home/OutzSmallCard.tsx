import { useState, type CSSProperties } from "react";
import { OutzPhoto } from "@/components/outz/OutzPhoto";
import { OutzBlendArt } from "@/components/outz/OutzBlendArt";
import { hasBlendRecipe } from "@/lib/outzBlend";
import { outzBandArt } from "@/lib/outzKinds";
import { RansomTitle } from "@/components/xerox/Overlays";
import CardWaypoint from "./CardWaypoint";
import HeartButton from "@/components/HeartButton";
import OutzCardModal from "./OutzCardModal";
import type { TodayLocation } from "./TodayLocationCard";
import "./OutzSmallCard.css";
import "./outz-accent-card.css";

const OUTZ_TOKENS: Record<string, string> = { trail: "--neon-orange", stay: "--neon-magenta", beach: "--neon-cyan", camp: "--green-acid", coastcamp: "--neon-cyan", watercamp: "--neon-cyan", spring: "--neon-cyan", fishing: "--green-acid", boating: "--neon-cyan", atv: "--neon-red", winter: "--neon-blue", dayuse: "--neon-yellow" };
const OUTZ_LABELS: Record<string, string> = { trail: "Trail", stay: "Stay", beach: "Beach", camp: "Camp", coastcamp: "Coastal camp", watercamp: "Waterfront camp", spring: "Hot spring", fishing: "Fishing", boating: "Boating", atv: "Off-road", winter: "Winter", dayuse: "Day use" };

/** The 136 x 150 Outzide place card: the tall card's art, kind, ransom title, and a tap to open the destination. */
export default function OutzSmallCard({ location, onRequireAuth }: { location: TodayLocation; onRequireAuth?: () => void }) {
  const [open, setOpen] = useState(false);
  const [blendFailed, setBlendFailed] = useState(false);
  const placeId = location.key.replace(/^outz:/, "");
  const blend = hasBlendRecipe(placeId, "tall") && !blendFailed;
  const accent = `var(${OUTZ_TOKENS[location.kind || ""] || "--neon-yellow"})`;
  const art = location.art ? `/outzide-map/${location.art.replace(/^\//, "")}` : outzBandArt(placeId);
  const label = OUTZ_LABELS[location.kind || ""] || "Destination";
  return <>
    <article className="outz-small outz-accent pdx-glass-rebind" style={{ "--c": accent } as CSSProperties}>
      <span className="outz-accent__band" aria-hidden="true" />
      <button type="button" className="outz-small__open" aria-label={`Open ${location.name}`} onClick={() => setOpen(true)}>
        <span className="outz-small__art">
          {blend ? <OutzBlendArt placeId={placeId} variant="tall" onUnavailable={() => setBlendFailed(true)} /> : location.photo ? <OutzPhoto photo={location.photo} /> : <img src={art} alt="" loading="lazy" />}
        </span>
        <span className="outz-small__scrim" aria-hidden="true" />
        <span className="outz-small__kind">{label}</span>
        <span className="outz-small__title" title={location.name} aria-label={location.name}><span aria-hidden="true"><RansomTitle text={location.name} seed={location.key} /></span></span>
      </button>
      <HeartButton className="outz-small__heart" kind="outz" refId={placeId} snapshot={{ title: location.name, subtitle: "Outzide", href: `/outzide?place=${encodeURIComponent(placeId)}` }} onRequireAuth={onRequireAuth} />
      <span className="outz-small__waypoint"><CardWaypoint kind={location.kind || "trail"} outside /></span>
    </article>
    {open && <OutzCardModal location={location} onClose={() => setOpen(false)} onRequireAuth={onRequireAuth} />}
  </>;
}
