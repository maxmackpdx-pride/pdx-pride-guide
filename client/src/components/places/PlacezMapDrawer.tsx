import { useState } from 'react';
import PlacezDrawer from '@/components/places/PlacezDrawer';
import PlacezEventsRails from '@/components/places/PlacezEventsRails';
import PlacezInViewRail from '@/components/places/PlacezInViewRail';
import { DrawerTop } from '@/components/drawers';
import AuthModal from '@/components/AuthModal';
import { useMapViewportItems } from '@/hooks/useMapViewportItems';
import { openEventFromDrawer } from '@/lib/placezEventsDrawerApi';
import { EMPTY_DRAWER_FILTERS, type DrawerFilterState } from '@shared/drawerFilters';
import type { DrawerTopEvent } from '@shared/drawerTop';
import './PlacezEventsDrawer.css';

/**
 * Host-side Placez map drawer. Shared DrawerTop first, then the mixed
 * in-view rail of everything on the map, then plan and Mizzed rails.
 */
export default function PlacezMapDrawer() {
  "use memo";
  const [filters, setFilters] = useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { items, events, loading, error, retry } = useMapViewportItems(true, filters);
  const [auth, setAuth] = useState(false);
  return (
    <>
      <PlacezDrawer
        accent="var(--room-placez)"
        title="Placez"
        top={
          <DrawerTop
            events={events as DrawerTopEvent[]}
            selectedDate={selectedDate}
            onSelectDate={date => setSelectedDate(date || null)}
            filters={filters}
            onFiltersChange={setFilters}
            onOpenEvent={event => openEventFromDrawer(event.id, event.title)}
          />
        }
        inView={
          loading ? <p className="pz-events-status" role="status">Loading what is in view…</p>
          : error ? <p className="pz-events-status" role="alert">What is in view could not load. <button type="button" onClick={() => void retry()}>Retry</button></p>
          : items.length ? <PlacezInViewRail items={items} onRequireAuth={() => setAuth(true)} />
          : <p className="pz-events-status">Nothing in view. Pan or zoom the map to see cards here.</p>
        }
        events={<PlacezEventsRails />}
        filters={<a className="pz-map-link" href="/events">Browse all events in Eventz</a>}
        upcoming={<p className="pz-drawer-empty">Upcoming events you planned are in the events rail above.</p>}
        saved={<p className="pz-drawer-empty">Heart a place on its card to follow it. Hearts mean you are interested: the place is saved to your stack and you get notifications about it.</p>}
      />
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </>
  );
}
