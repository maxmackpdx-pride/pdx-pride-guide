import type { CSSProperties } from "react";
import { DRAWER_CATEGORY_FILTERS, DRAWER_TAG_FILTERS, DRAWER_TIME_FILTERS, isDrawerFilterOn, toggleDrawerFilter, type DrawerFilterGroup, type DrawerFilterState } from "@shared/drawerFilters";
import { isPlacezType } from "@shared/directoryTheme";
import "./DrawerFilterChips.css";

const sections = [
  {label: "Place types", chips: DRAWER_CATEGORY_FILTERS},
  {label: "When and tags", chips: [...DRAWER_TIME_FILTERS, ...DRAWER_TAG_FILTERS]},
];

export default function DrawerFilterChips({value, onChange, groups}: {
  value: DrawerFilterState;
  onChange: (next: DrawerFilterState) => void;
  groups?: DrawerFilterGroup[];
}) {
  return <div className="drawer-filters" data-testid="drawer-top-filters">
    {sections.map(section => {
      const chips = section.chips.filter(chip => !groups || groups.includes(chip.group));
      if (!chips.length) return null;
      return <div className="drawer-filters__row" key={section.label} role="group" aria-label={section.label}>
        {chips.map(chip => <button key={chip.id} type="button" className="drawer-filters__chip"
          style={{"--piece": isPlacezType(chip.id) ? chip.accent : "var(--text-meta)"} as CSSProperties}
          aria-pressed={isDrawerFilterOn(value, chip)} onClick={() => onChange(toggleDrawerFilter(value, chip))}>
          {isPlacezType(chip.id) && <i aria-hidden="true"/>}{chip.label}
        </button>)}
      </div>;
    })}
  </div>;
}
