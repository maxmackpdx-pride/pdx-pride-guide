import { useState, type ReactNode } from 'react';
import DockDrawer, { type DockStop } from '@/components/dock/DockDrawer';
import PlacezEventsRails from '@/components/places/PlacezEventsRails';
import './PlacezEventsDrawer.css';

/**
 * The Placez drawer (Tucker, Nov 19 2026): the Events drawer's lip and
 * materials, locked to the top of the bottom dock on all three Placez
 * pages. Content, top to bottom: optional live in-view rail and map
 * filter tags (Placez map), the standard title, upcoming and past event
 * rails with plan drawers, then the page's filters, UPCOMING, SAVED.
 */
export default function PlacezDrawer({
  accent,
  title = 'Placez',
  top,
  inView,
  filterTags,
  events,
  filters,
  upcoming,
  saved,
}: {
  accent: string;
  title?: string;
  /** Shared untitled DrawerTop. */
  top?: ReactNode;
  /** Live small cards for places currently in view on the map. */
  inView?: ReactNode;
  /** Map filters restyled as tag chips. */
  filterTags?: ReactNode;
  /** Upcoming and past event rails. Defaults to the shared plans rails. */
  events?: ReactNode;
  /** The page's own filter controls, restyled by the drawer CSS. */
  filters: ReactNode;
  /** Small Wide cards on a rail, no buttons - built by the page. */
  upcoming: ReactNode;
  /** Small cards grouped by category - built by the page. */
  saved: ReactNode;
}) {
  "use memo";
  const [stop, setStop] = useState<DockStop>(0);
  return (
    <DockDrawer
      accent={accent}
      ariaLabel={`${title} filters, events, upcoming and saved`}
      lipLabel={`${title} · Events · Filters`}
      stop={stop}
      onStopChange={setStop}
      maxStops={1}
    >
      {top}
      <header className="pz-events-section">
        <h2 className="pz-events-section__title">{title}</h2>
      </header>
      {inView ? (
        <section aria-label="In view" data-testid="placez-in-view-rail">
          <h3 className="pz-events-section__label">In view</h3>
          {inView}
        </section>
      ) : null}
      {!top && filterTags ? (
        <section aria-label="Map filters" data-testid="placez-map-filter-tags">
          <h3 className="pz-events-section__label">Filters</h3>
          {filterTags}
        </section>
      ) : null}
      {events === undefined ? <PlacezEventsRails /> : events}
      <section aria-label="Filters">
        <h3 className="dock-drawer__label">Filters</h3>
        {filters}
      </section>
      <section aria-label="Upcoming">
        <h3 className="dock-drawer__label">Upcoming</h3>
        {upcoming}
      </section>
      <section aria-label="Saved">
        <h3 className="dock-drawer__label">Saved</h3>
        {saved}
      </section>
    </DockDrawer>
  );
}
