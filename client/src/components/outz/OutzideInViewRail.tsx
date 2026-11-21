import { type CSSProperties } from "react";
import { CardHeartButton } from "@/components/CardHeartButton";
import RailShareButton from "@/components/home/RailShareButton";
import DrawerMiniCard from "@/components/drawers/DrawerMiniCard";
import { openOutzideCountdownItem } from "@/lib/outzideDrawerApi";
import { outzPlaceHref } from "@shared/outz";
import type { InViewItem } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./OutzideDrawer.css";
import "@/components/drawers/DrawerTop.css";

/**
 * Full-bleed mini cards for whatever is in view on the Outzide map:
 * events use DrawerMiniCard, places use the same geometry.
 */
export default function OutzideInViewRail({
  items,
  savedIds,
  onToggleSave,
  onOpenEvent,
  onOpenPlace,
}: {
  items: InViewItem[];
  savedIds?: Set<number>;
  onToggleSave?: (kind: "event" | "place", id: number) => void;
  onOpenEvent?: (event: DrawerTopEvent) => void;
  onOpenPlace?: (id: number, name: string) => void;
}) {
  "use memo";
  if (!items.length) {
    return <p className="outz-drawer-status">Nothing in view. Pan or zoom the map to see cards here.</p>;
  }
  return (
    <div className="outz-drawer-lead" data-testid="outzide-in-view-rail" role="list" aria-label="What is in view on the map">
      {items.map(item => (
        <div className="outz-drawer-lead__item" key={`${item.kind}:${item.id}`} role="listitem">
          {item.kind === "event" ? (
            <DrawerMiniCard
              event={item.event as DrawerTopEvent}
              saved={savedIds?.has(item.event.id)}
              onToggleSave={onToggleSave ? id => onToggleSave("event", id) : undefined}
              onOpen={event => onOpenEvent ? onOpenEvent(event) : openOutzideCountdownItem(event)}
            />
          ) : (
            <OutzidePlaceMini
              id={item.place.id}
              name={item.place.name}
              imageUrl={item.place.imageUrl}
              saved={savedIds?.has(item.place.id)}
              onToggleSave={onToggleSave ? () => onToggleSave("place", item.place.id) : undefined}
              onOpen={() => onOpenPlace?.(item.place.id, item.place.name)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function OutzidePlaceMini({
  id,
  name,
  imageUrl,
  saved,
  onToggleSave,
  onOpen,
}: {
  id: number;
  name: string;
  imageUrl?: string | null;
  saved?: boolean;
  onToggleSave?: () => void;
  onOpen?: () => void;
}) {
  "use memo";
  const href = outzPlaceHref({ id: String(id), name });
  return (
    <article
      data-card-size="small"
      data-card-category="outzide"
      data-testid="outzide-place-mini"
      className="drawer-mini outz-mini-place pdx-glass-rebind"
      style={{ "--c": "var(--room-outz, var(--neon-orange))" } as CSSProperties}
    >
      <div className="drawer-mini__art" aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" /> : <div className="day-motif" />}
      </div>
      <button type="button" className="drawer-mini__open" onClick={onOpen} aria-label={`Open ${name}`}>
        <span className="drawer-mini__meta">
          <span className="drawer-mini__title">{name}</span>
        </span>
      </button>
      <RailShareButton href={href} title={name} />
      {onToggleSave ? (
        <CardHeartButton
          active={!!saved}
          aria-label={`${saved ? "Remove" : "Add"} ${name} ${saved ? "from" : "to"} my saved destinations`}
          onClick={click => { click.stopPropagation(); onToggleSave(); }}
        />
      ) : null}
    </article>
  );
}
