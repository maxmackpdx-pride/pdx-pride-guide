import { EventCard, PlaceCard } from "@/components/cards";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { openEventFromDrawer } from "@/lib/placezEventsDrawerApi";
import type { InViewItem } from "@shared/drawerFilters";
import type { EventListing } from "@shared/multiDayEvents";
import "@/pages/Events.css";
import "./PlacezEventsDrawer.css";

/**
 * Mixed in-view rail: standard small event and place cards for everything
 * currently visible on the map.
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
            <EventCard
              listing={item.event as EventListing}
              size="small"
              rsvped={rsvp.myEventIds.has(item.event.id)}
              onToggleRsvp={() => rsvp.toggleRsvp(item.event.id)}
              onOpen={() => openEventFromDrawer(item.event.id, item.event.title)}
            />
          ) : (
            <PlaceCard place={item.place as never} size="small" onRequireAuth={onRequireAuth} />
          )}
        </div>
      ))}
    </div>
  );
}
