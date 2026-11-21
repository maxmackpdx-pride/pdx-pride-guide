import { useState } from 'react';
import { DiscoveryWordmark } from "@/components/drawers/DiscoveryWordmark";
import PlacezDrawer from '@/components/places/PlacezDrawer';
import PlacezEventsRails, { DrawerRail } from '@/components/places/PlacezEventsRails';
import PlacezInViewRail from '@/components/places/PlacezInViewRail';
import { formatPacificDateTime } from '@/lib/countdown';
import { nextDrawerEvents } from '@shared/drawerTop';
import { DrawerMiniCard, DrawerTop } from '@/components/drawers';
import { pacificCalendarDate } from '@shared/missedConnections';
import { useMapViewportItems } from '@/hooks/useMapViewportItems';
import { centerThenOpenFromDrawer } from '@/lib/placezEventsDrawerApi';
import { EMPTY_DRAWER_FILTERS, eventMatchesAnyTime, eventMatchesTags, type DrawerFilterState } from '@shared/drawerFilters';
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
  const shown = selectedDate ? items.filter(item => item.kind === 'event'
    ? pacificCalendarDate(item.event.dateStart || '') === selectedDate
    : item.place.upcomingEvents?.some(event => pacificCalendarDate(event.dateStart || '') === selectedDate)) : items;
  const placeCategory = filters.categories.some(id => id !== 'eventz') && !filters.categories.includes('eventz');
  const visibleIds = new Set(items.filter(item => item.kind === 'event').map(item => item.id));
  const filtered = events.filter(event => (!placeCategory || visibleIds.has(event.id))
    && eventMatchesAnyTime(event, filters.times) && eventMatchesTags(event, filters.tags));
  const upcoming = nextDrawerEvents(filtered, Date.now(), 24, selectedDate);
  const open = (event: DrawerTopEvent) => void centerThenOpenFromDrawer({kind:'event', id:event.id, title:event.title, lat:event.lat, lng:event.lng});
  return (
    <PlacezDrawer
        accent="var(--neon-cyan)"
        title="Events + Placez"
        brand={<DiscoveryWordmark rooms={["eventz", "placez"]}/>}
        top={
          <DrawerTop
            events={filtered}
            selectedDate={selectedDate}
            onSelectDate={date => setSelectedDate(date || null)}
            filters={filters}
            onFiltersChange={setFilters}
            onOpenEvent={open}
          />
        }
        inView={
          loading ? <p className="pz-events-status" role="status">Loading what is in view…</p>
          : error ? <p className="pz-events-status" role="alert">What is in view could not load. <button type="button" onClick={() => void retry()}>Retry</button></p>
          : shown.length ? <PlacezInViewRail items={shown} />
          : <p className="pz-events-status">Nothing in view. Pan or zoom the map to see cards here.</p>
        }
        events={<>
          <section aria-label="Events rail">
            <h3 className="pz-events-section__label">Events rail</h3>
            {upcoming.length > 0 ? <DrawerRail label="Upcoming events" testId="placez-events-rail">
              {upcoming.map((event, index) => <div className="pz-events-rail__item" key={event.id + event.dateStart} role="listitem">
                {index % 2 === 0 ? <DrawerMiniCard event={event} onOpen={open}/> :
                  <button type="button" className="pz-compact-event" onClick={() => open(event)}>
                    <small>{formatPacificDateTime(event.dateStart,{weekday:"short",month:"short",day:"numeric"})}</small>
                    <strong>{event.title}</strong>
                    <small>{formatPacificDateTime(event.dateStart,{hour:"numeric",minute:"2-digit"})} · {event.venueName}</small>
                  </button>}
              </div>)}
            </DrawerRail> : <p className="pz-events-status">No upcoming events match these filters.</p>}
          </section>
          <PlacezEventsRails/>
        </>}
        filters={<a className="pz-map-link" href="/events">Browse all events in Eventz</a>}
      />
  );
}
