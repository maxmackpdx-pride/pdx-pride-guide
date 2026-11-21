import { type CSSProperties } from "react";
import {
  DRAWER_CATEGORY_FILTERS,
  DRAWER_TAG_FILTERS,
  DRAWER_TIME_FILTERS,
  isDrawerFilterOn,
  toggleDrawerFilter,
  type DrawerFilterChip,
  type DrawerFilterState,
} from "@shared/drawerFilters";
import "./DrawerFilterChips.css";

/**
 * The one chip set for Placez drawers, the Events drawer, and map views.
 */
export default function DrawerFilterChips({
  value,
  onChange,
  hideGroups,
}: {
  value: DrawerFilterState;
  onChange: (next: DrawerFilterState) => void;
  hideGroups?: Array<DrawerFilterChip["group"]>;
}) {
  "use memo";
  const groups: Array<{ label: string; chips: DrawerFilterChip[] }> = [
    { label: "Categories", chips: DRAWER_CATEGORY_FILTERS },
    { label: "When", chips: DRAWER_TIME_FILTERS },
    { label: "Tags", chips: DRAWER_TAG_FILTERS },
  ].filter(group => !hideGroups?.includes(group.chips[0].group));
  return (
    <div className="drawer-filters pdx-glass-rebind" style={{ "--c": "var(--room-placez)" } as CSSProperties}>
      {groups.map(group => (
        <div key={group.label} className="drawer-filters__group" role="group" aria-label={group.label}>
          <p className="drawer-filters__label">{group.label}</p>
          <div className="drawer-filters__row">
            {group.chips.map(chip => {
              const on = isDrawerFilterOn(value, chip);
              return (
                <button
                  key={chip.id}
                  type="button"
                  className="drawer-filters__chip pdx-glass-rebind"
                  style={{ "--c": chip.accent, "--category": chip.accent } as CSSProperties}
                  aria-pressed={on}
                  onClick={() => onChange(toggleDrawerFilter(value, chip))}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
