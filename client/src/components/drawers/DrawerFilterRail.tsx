import type { CSSProperties, ComponentType } from "react";
import {
  Calendar,
  Clock,
  Coffee,
  Flame,
  Home,
  Music,
  ShoppingBag,
  Tag,
  Tent,
  Utensils,
  Wine,
  Wrench,
} from "lucide-react";
import {
  DRAWER_FILTERS,
  isDrawerFilterOn,
  toggleDrawerFilter,
  type DrawerFilterChip,
  type DrawerFilterState,
} from "@shared/drawerFilters";
import { isPlacezType } from "@shared/directoryTheme";
import "./DrawerTop.css";

const ICONS: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  eventz: Calendar,
  bar: Wine,
  restaurant: Utensils,
  cafe: Coffee,
  venue: Music,
  service: Wrench,
  shop: ShoppingBag,
  hotel: Home,
  realestate: Home,
  campground: Tent,
  adult: Flame,
  today: Clock,
  tonight: Clock,
  tomorrow: Clock,
  week: Clock,
  later: Clock,
};

/**
 * Compact filter chips on a horizontal rail. Only place-type chips use
 * category colors; event, time, and tag chips stay neutral.
 */
export default function DrawerFilterRail({
  value,
  onChange,
}: {
  value: DrawerFilterState;
  onChange: (next: DrawerFilterState) => void;
}) {
  "use memo";
  return (
    <div
      className="drawer-filter-rail pdx-glass-rebind"
      style={{ "--c": "var(--room-placez)" } as CSSProperties}
      role="toolbar"
      aria-label="Filters"
      data-testid="drawer-top-filters"
    >
      {DRAWER_FILTERS.map((chip: DrawerFilterChip) => {
        const on = isDrawerFilterOn(value, chip);
        const Icon = ICONS[chip.id] || Tag;
        return (
          <button
            key={chip.id}
            type="button"
            className={`drawer-filter-rail__chip pdx-glass-rebind${isPlacezType(chip.id) ? " is-place" : " is-neutral"}`}
            style={isPlacezType(chip.id) ? { "--c": chip.accent, "--category": chip.accent } as CSSProperties : undefined}
            aria-pressed={on}
            onClick={() => onChange(toggleDrawerFilter(value, chip))}
          >
            <Icon size={14} aria-hidden={true} />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
