import { DrawerMiniCard } from "@/components/drawers";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { centerThenOpenFromDrawer } from "@/lib/placezEventsDrawerApi";
import type { InViewItem } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./PlacezEventsDrawer.css";

/**
 * Mixed in-view rail: one DrawerMiniCard height and chrome (share top-right,
 * heart bottom-right, no outer bloom) for every event and place currently on
 * the map. A tap centers the map on the item, then opens the existing card.
 */
export default function PlacezInViewRail({
  items,
  onRequireAuth,
}: {
  items: InViewItem[];
  onRequireAuth?: () => void;
}) {
  "use memo";
  const rsvp = useEventRsvp();
  if (!items.length) return null;
  return (
    <div className="pz-drawer-rail" role="list" aria-label="In view on the map">
      {items.map(item => (
        <div className="pz-drawer-bare" key={`${item.kind}:${item.id}`} role="listitem">
          {item.kind === "event" ? (
            <DrawerMiniCard
              event={item.event as DrawerTopEvent}
              saved={rsvp.myEventIds.has(item.event.id)}
              onToggleSave={() => rsvp.toggleRsvp(item.event.id)}
              onOpen={event => void centerThenOpenFromDrawer({
                kind: "event",
                id: event.id,
                title: event.title,
                lat: event.lat ?? item.event.lat,
                lng: event.lng ?? item.event.lng,
              })}
            />
          ) : (
            <DrawerMiniCard
              place={{
                id: item.place.id,
                name: item.place.name || "Place",
                type: item.place.type,
                imageUrl: item.place.imageUrl,
                neighborhood: item.place.neighborhood,
                isFollowing: item.place.isFollowing,
                lat: item.place.lat,
                lng: item.place.lng,
              }}
              onRequireAuth={onRequireAuth}
              onOpenPlace={place => void centerThenOpenFromDrawer({
                kind: "place",
                id: place.id,
                title: place.name,
                lat: place.lat ?? item.place.lat,
                lng: place.lng ?? item.place.lng,
              })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
