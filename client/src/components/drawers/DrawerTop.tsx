import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import type { DrawerFilterState } from "@shared/drawerFilters";
import { buildDrawerCalendarDays, nextDrawerEvents, type DrawerTopEvent } from "@shared/drawerTop";
import PlacezCalendarFilter from "./PlacezCalendarFilter";
import DrawerCountdownCard from "./DrawerCountdownCard";
import DrawerFilterRail from "./DrawerFilterRail";
import "./DrawerTop.css";

export type DrawerTopProps = {
  /** Upcoming events that feed the calendar counts and the default countdown card. */
  events?: DrawerTopEvent[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  filters: DrawerFilterState;
  onFiltersChange: (next: DrawerFilterState) => void;
  /**
   * Replaces the 14-day calendar rail only. Outzide passes a full-bleed
   * in-view mini-card rail here. Other worlds keep the calendar.
   */
  lead?: ReactNode;
  onOpenEvent?: (event: DrawerTopEvent) => void;
  now?: number;
  /** Section title above the countdown. Default "UP NEXT". Pass null to hide. */
  upcomingTitle?: ReactNode;
  /** Section title above the calendar and filter chips. Default "FILTERS". Pass null to hide. */
  filtersTitle?: ReactNode;
  /** Replaces the default narrow countdown card. */
  countdown?: ReactNode;
  /** Optional event list for the default countdown (Outzide can mix featured / buddy / carpool). */
  countdownEvents?: DrawerTopEvent[];
  /** Slot under the countdown (Afterz: wide HOST AN AFTERZ button). */
  actions?: ReactNode;
  /** Slot after the filter chips, before the divider (Afterz: yellow-bloom RSVP cards, explainer). */
  after?: ReactNode;
  /** When false, hide the calendar unless `lead` is passed. Default true. */
  showCalendar?: boolean;
  /** Length of the date rail. Default 14 (two weeks). */
  calendarLength?: number;
};

/**
 * Shared, composable top for room drawers. Worlds stay similar, not identical:
 * they share UP NEXT, a narrow countdown card, FILTERS, a 14-day calendar,
 * and compact chips, then configure the rest with slots.
 *
 * Placez / Events map drawers use the default layout. Outzide passes `lead`
 * (in-view mini cards) and `countdownEvents` (featured + next-up buddy /
 * carpool). Afterz passes `actions` (HOST AN AFTERZ) and `after` (RSVP cards).
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
  upcomingTitle = "UP NEXT",
  filtersTitle = "FILTERS",
  countdown,
  countdownEvents,
  actions,
  after,
  showCalendar = true,
  calendarLength = 14,
}: DrawerTopProps) {
  "use memo";
  const at = now ?? Date.now();
  const days = buildDrawerCalendarDays(events, at, calendarLength);
  const upcoming = nextDrawerEvents(countdownEvents ?? events, at, 1, selectedDate || null);
  return (
    <section
      className="drawer-top pdx-glass-rebind"
      style={{ "--c": "var(--room-eventz)" } as CSSProperties}
      aria-label="Upcoming countdown and filters"
      data-testid="drawer-top"
    >
      <div className="drawer-top__shade" aria-hidden="true" />
      {upcomingTitle != null ? <h2 className="drawer-top__title">{upcomingTitle}</h2> : null}
      {countdown ?? <DrawerCountdownCard events={upcoming} onOpen={onOpenEvent} />}
      {actions}
      {filtersTitle != null ? <h2 className="drawer-top__title">{filtersTitle}</h2> : null}
      {lead ?? (showCalendar ? (
        <PlacezCalendarFilter
          days={days}
          selected={selectedDate}
          onSelect={date => onSelectDate?.(date)}
        />
      ) : null)}
      <DrawerFilterRail value={filters} onChange={onFiltersChange} />
      {after}
      <div className="drawer-top__rule" aria-hidden="true" />
    </section>
  );
}
