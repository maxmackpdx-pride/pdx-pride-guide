import { useMemo, useState, type CSSProperties } from 'react';
import { PlaceCard } from '@/components/cards';
import PlacezDrawer from '@/components/places/PlacezDrawer';
import PlacezEventsRails from '@/components/places/PlacezEventsRails';
import AuthModal from '@/components/AuthModal';
import { useMapViewportPlaces } from '@/hooks/useMapViewportPlaces';
import { DIRECTORY_TYPE_LABELS, DIRECTORY_TYPES, isPlacezType } from '@shared/directoryTheme';
import { MAPZ_TIME_FILTERS, type MapzTimeFilter } from '@shared/placezEventsDrawer';
import './PlacezEventsDrawer.css';

const CATEGORY_ACCENT: Record<string, string> = {
  cafe: 'var(--cat-cafes)',
  restaurant: 'var(--cat-food)',
  bar: 'var(--cat-bars)',
  venue: 'var(--cat-venues)',
  shop: 'var(--cat-shops)',
  service: 'var(--cat-services)',
  adult: 'var(--neon-red)',
};

/**
 * Host-side Placez map drawer, in the Events drawer style. Live in-view
 * place cards update as the map camera settles. Map filters are tag chips.
 * Event rails with plan and Mizzed drawers follow, then a link back to Eventz.
 */
export default function PlacezMapDrawer() {
  "use memo";
  const { inView, loading, error, retry } = useMapViewportPlaces(true);
  const [category, setCategory] = useState('');
  const [time, setTime] = useState<MapzTimeFilter | ''>('');
  const [auth, setAuth] = useState(false);
  const categories = useMemo(
    () => [
      ...DIRECTORY_TYPES.filter(isPlacezType).map(id => ({ id, label: DIRECTORY_TYPE_LABELS[id] || id })),
      { id: 'adult', label: 'Adult' },
    ],
    [],
  );
  const visible = inView.filter(place => !category || place.type === category);
  return (
    <>
      <PlacezDrawer
        accent="var(--room-placez)"
        title="Placez"
        inView={
          loading ? <p className="pz-events-status" role="status">Loading places in view…</p>
          : error ? <p className="pz-events-status" role="alert">Places in view could not load. <button type="button" onClick={() => void retry()}>Retry</button></p>
          : visible.length ? (
            <div className="pz-drawer-rail">
              {visible.map(place => (
                <div className="pz-drawer-bare" key={place.id}>
                  <PlaceCard place={place} size="small" onRequireAuth={() => setAuth(true)} />
                </div>
              ))}
            </div>
          ) : <p className="pz-events-status">No places in view. Pan or zoom the map to see cards here.</p>
        }
        filterTags={
          <div className="pz-map-filters">
            {categories.map(option => (
              <button
                key={option.id}
                type="button"
                className="pz-map-filters__chip"
                style={{ '--category': CATEGORY_ACCENT[option.id] || 'var(--room-placez)' } as CSSProperties}
                aria-pressed={category === option.id}
                onClick={() => setCategory(current => current === option.id ? '' : option.id)}
              >
                {option.label}
              </button>
            ))}
            {MAPZ_TIME_FILTERS.map(option => (
              <button
                key={option}
                type="button"
                className="pz-map-filters__chip"
                style={{ '--category': 'var(--room-eventz)' } as CSSProperties}
                aria-pressed={time === option}
                onClick={() => setTime(current => current === option ? '' : option)}
              >
                {option}
              </button>
            ))}
          </div>
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
