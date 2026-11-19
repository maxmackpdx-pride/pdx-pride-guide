import { useState, type ReactNode } from 'react';
import DockDrawer, { type DockStop } from '@/components/dock/DockDrawer';

/**
 * The Placez drawer (Tucker, Nov 19 2026): the Events drawer's lip and
 * materials, locked to the top of the bottom dock on all three Placez
 * pages. Content, top to bottom: the page's filters, UPCOMING, SAVED.
 * Saved lives here now — the standalone saved sections are gone from
 * the pages.
 */
export default function PlacezDrawer({
  accent,
  filters,
  upcoming,
  saved,
}: {
  accent: string;
  /** The page's own filter controls, restyled by the drawer CSS. */
  filters: ReactNode;
  /** Small Wide cards on a rail, no buttons — built by the page. */
  upcoming: ReactNode;
  /** Small cards grouped by category — built by the page. */
  saved: ReactNode;
}) {
  const [stop, setStop] = useState<DockStop>(0);
  return (
    <DockDrawer
      accent={accent}
      ariaLabel="Filters, upcoming and saved"
      lipLabel="Filters · Upcoming · Saved"
      stop={stop}
      onStopChange={setStop}
      maxStops={1}
    >
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
