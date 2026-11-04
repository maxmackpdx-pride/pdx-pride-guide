import { rememberCardOrigin } from "@/components/cards/CardAPI";
import { CardMorph, OpenCardMeta, PausedCard } from "@/components/cards/react19Card";
import { cardMorphName, openCardFromEvent, preloadCardImage, preloadSizedImage } from "@/components/cards/react19CardModel";
import { blendedArtPhotoUrl } from "@/lib/outzBlendedArt";
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

const OUTZ_TOKENS: Record<string, string> = { trail: "--neon-orange", stay: "--neon-magenta", beach: "--neon-magenta", camp: "--green-acid", coastcamp: "--neon-cyan", watercamp: "--neon-cyan", spring: "--neon-cyan", fishing: "--green-acid", boating: "--neon-cyan", atv: "--neon-red", winter: "--neon-blue", dayuse: "--neon-yellow" };
const OUTZ_LABELS: Record<string, string> = { trail: "Trail", stay: "Stay", beach: "Beach", camp: "Camp", coastcamp: "Coastal camp", watercamp: "Waterfront camp", spring: "Hot spring", fishing: "Fishing", boating: "Boating", atv: "Off-road", winter: "Winter", dayuse: "Day use" };

/** The 136 x 170 Outzide place card: the tall card's art, kind, ransom title, and a tap to open the destination. */
export default function OutzSmallCard({ location, onRequireAuth }: { location: TodayLocation; onRequireAuth?: () => void }) {
  const [open, setOpen] = useState(false);
  const [blendFailed, setBlendFailed] = useState(false);
  const placeId = location.key.replace(/^outz:/, "");
  const blend = hasBlendRecipe(placeId, "tall") && !blendFailed;
  const accent = `var(${OUTZ_TOKENS[location.kind || ""] || "--neon-yellow"})`;
  const art = location.art ? `/outzide-map/${location.art.replace(/^\//, "")}` : outzBandArt(placeId);
  const label = OUTZ_LABELS[location.kind || ""] || "Destination";
  const photoSrc = location.photo?.src ? (location.photo.src.startsWith("/") ? location.photo.src : location.photo.src.startsWith("assets/") ? `/outzide-map/${location.photo.src}` : null) : null;
  if (blend) preloadCardImage(blendedArtPhotoUrl(placeId, "tall"), "high");
  else if (location.photo?.variants?.length) preloadSizedImage(location.photo.variants.map(item => ({ src: item.src.startsWith("/") || item.src.startsWith("http") ? item.src : `/outzide-map/${item.src.replace(/^\//, "")}`, width: item.width })), "136px", photoSrc, "auto");
  return <>
    <CardMorph name={cardMorphName(["outz-small", location.key])}>
    <article data-card-size="small" data-card-category={"outzide"} onClickCapture={rememberCardOrigin} className="outz-small outz-accent pdx-glass-rebind" style={{ "--c": accent } as CSSProperties}>
      <span className="outz-accent__band" aria-hidden="true" />
      <button type="button" className="outz-small__open" aria-label={`Open ${location.name}`} onClick={(event) => openCardFromEvent(event, () => setOpen(true))}>
        <span className="outz-small__art">
          {blend ? <OutzBlendArt placeId={placeId} variant="tall" onUnavailable={() => setBlendFailed(true)} /> : location.photo ? <OutzPhoto photo={location.photo} sizes="136px" /> : <img src={art} alt="" loading="lazy" />}
        </span>
        <span className="outz-small__scrim" aria-hidden="true" />
        <span className="outz-small__kind">{label}</span>
        <span className="outz-small__title" title={location.name} aria-label={location.name}><span aria-hidden="true"><RansomTitle text={location.name} seed={location.key} /></span></span>
      </button>
      <HeartButton className="outz-small__heart" kind="outz" refId={placeId} snapshot={{ title: location.name, subtitle: "Outzide", href: `/outzide?place=${encodeURIComponent(placeId)}` }} onRequireAuth={onRequireAuth} />
      <span className="outz-small__waypoint"><CardWaypoint kind={location.kind || "trail"} outside /></span>
    </article>
    </CardMorph>
    {open && <OpenCardMeta title={location.name} description={location.detail} />}
    <PausedCard open={open}><OutzCardModal documentMeta={false} location={location} onClose={() => setOpen(false)} onRequireAuth={onRequireAuth} /></PausedCard>
  </>;
}
