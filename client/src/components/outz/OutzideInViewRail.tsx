import DrawerMiniCard from "@/components/drawers/DrawerMiniCard";
import { centerThenOpenFromDrawer } from "@/lib/placezEventsDrawerApi";
import { outzidePlaceArtUrl } from "@shared/outzideDrawer";
import type { InViewItem } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./OutzideDrawer.css";
import "@/components/drawers/DrawerTop.css";

type LocatedEvent = DrawerTopEvent & { lat?: number | null; lng?: number | null };

/**
 * Full-bleed mini cards for whatever is in view on the Outzide map.
 * Uses the shared DrawerMiniCard (148x96, beveled, share top-right, heart
 * bottom-right). Tap centers the map, then opens the existing expanded card.
 * Places without a photo use a known destination image or the motif fallback
 * inside DrawerMiniCard.
 */
export default function OutzideInViewRail({
  items,
  savedIds,
  onToggleSave,
  onOpenEvent,
  onOpenPlace,
  onRequireAuth,
}: {
  items: InViewItem[];
  savedIds?: Set<number>;
  onToggleSave?: (kind: "event" | "place", id: number) => void;
  onOpenEvent?: (event: DrawerTopEvent) => void;
  onOpenPlace?: (id: number, name: string) => void;
  onRequireAuth?: () => void;
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
              onOpen={event => {
                if (onOpenEvent) {
                  onOpenEvent(event);
                  return;
                }
                const located = event as LocatedEvent;
                void centerThenOpenFromDrawer({ kind: "event", id: event.id, title: event.title, lat: located.lat, lng: located.lng });
              }}
            />
          ) : (
            <DrawerMiniCard
              place={{
                id: item.place.id,
                name: item.place.name || "Destination",
                type: item.place.type,
                imageUrl: outzidePlaceArtUrl({ name: item.place.name, imageUrl: item.place.imageUrl }),
                neighborhood: item.place.neighborhood,
                isFollowing: item.place.isFollowing,
                lat: item.place.lat,
                lng: item.place.lng,
              }}
              onRequireAuth={onRequireAuth}
              onOpenPlace={place => {
                if (onOpenPlace) {
                  onOpenPlace(place.id, place.name);
                  return;
                }
                void centerThenOpenFromDrawer({ kind: "place", id: place.id, title: place.name, lat: place.lat, lng: place.lng });
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
