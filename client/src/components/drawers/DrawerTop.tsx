import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import type { DrawerFilterState } from "@shared/drawerFilters";
import { buildDrawerCalendarDays, nextDrawerEvents, type DrawerTopEvent } from "@shared/drawerTop";
import PlacezCalendarFilter from "./PlacezCalendarFilter";
import DrawerCountdownCard from "./DrawerCountdownCard";
import DrawerFilterRail from "./DrawerFilterRail";
import "./DrawerTop.css";

export type DrawerTopProps = {
  /** Upcoming events that feed the calendar counts and the countdown card. */
  events?: DrawerTopEvent[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  filters: DrawerFilterState;
  onFiltersChange: (next: DrawerFilterState) => void;
  /**
   * Replaces the Placez calendar at the top. Outzide should pass an in-view
   * rail of full-bleed mini cards here.
   */
  lead?: ReactNode;
  onOpenEvent?: (event: DrawerTopEvent) => void;
  now?: number;
};

/**
 * Shared untitled top for every room drawer (Events, Placez, Outzide, Afterz,
 * and map drawers). Order: Placez calendar (or `lead`), the next-three
 * countdown card, then Placez-style tag filters on a two-row rail. A dark
 * gradient fades from the top and a line separates this from the next
 * titled section. There is no section title.
 *
 * Import from `@/components/drawers/DrawerTop` or `@/components/drawers`.
 */
export default function DrawerTop({
  events = [],
  selectedDate = null,
  onSelectDate,
  filters,
  onFiltersChange,
  lead,
  onOpenEvent,
  now,
}: DrawerTopProps) {
  "use memo";
  const at = now ?? Date.now();
  const days = buildDrawerCalendarDays(events, at);
  const upcoming = nextDrawerEvents(events, at, 3, selectedDate || null);
  return (
    <section
      className="drawer-top pdx-glass-rebind"
      style={{ "--c": "var(--room-eventz)" } as CSSProperties}
      aria-label="Calendar, upcoming countdown, and filters"
      data-testid="drawer-top"
    >
      <div className="drawer-top__shade" aria-hidden="true" />
      {lead ?? (
        <PlacezCalendarFilter
          days={days}
          selected={selectedDate}
          onSelect={date => onSelectDate?.(date)}
        />
      )}
      <DrawerCountdownCard events={upcoming} onOpen={onOpenEvent} />
      <DrawerFilterRail value={filters} onChange={onFiltersChange} />
      <div className="drawer-top__rule" aria-hidden="true" />
    </section>
  );
}
