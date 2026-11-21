import { DrawerMiniCard } from "@/components/drawers";
import { centerThenOpenFromDrawer } from "@/lib/placezEventsDrawerApi";
import type { InViewItem } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./PlacezEventsDrawer.css";

/** Mixed map records share one fixed mini with a single open action. */
export default function PlacezInViewRail({
  items,
}: {
  items: InViewItem[];
}) {
  "use memo";
  if (!items.length) return null;
  return (
    <div className="pz-drawer-rail" role="list" aria-label="In view on the map">
      {items.map(item => (
        <div className="pz-drawer-bare" key={`${item.kind}:${item.id}`} role="listitem">
          {item.kind === "event" ? (
            <DrawerMiniCard
              event={item.event as DrawerTopEvent}
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
