import type { CSSProperties } from "react";
import type { DrawerCalendarDay } from "@shared/drawerTop";
import { dayAccentToken } from "@/lib/dsColors";
import "./DrawerTop.css";

/**
 * Horizontal date rail under FILTERS. DrawerTop feeds 14 days (two weeks)
 * by default. Selecting a day is a button alternative to swiping the rail.
 * Tile borders use the shared day-of-week tokens (--day-mon through --day-sun).
 */
export default function PlacezCalendarFilter({
  days,
  selected,
  onSelect,
}: {
  days: DrawerCalendarDay[];
  selected?: string | null;
  onSelect: (date: string) => void;
}) {
  "use memo";
  return (
    <div className="drawer-cal" data-testid="drawer-top-calendar">
      <div className="pz-calendar-rail drawer-cal__rail" role="listbox" aria-label="Filter by date"
        onKeyDown={event => {
          const offsets: Record<string, number> = {ArrowLeft:-1,ArrowRight:1,Home:-days.length,End:days.length};
          if (!(event.key in offsets)) return;
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
          const index = buttons.indexOf(event.target as HTMLButtonElement);
          if (index < 0) return;
          event.preventDefault();
          buttons[Math.max(0, Math.min(buttons.length-1, index+offsets[event.key]))]?.focus();
        }}>
        {days.map(day => {
          const pressed = selected === day.key;
          return (
            <button
              key={day.key}
              type="button"
              className="pz-calendar-day drawer-cal__day"
              style={{ "--piece": dayAccentToken(day.weekday), "--day": dayAccentToken(day.weekday) } as CSSProperties}
              role="option"
              aria-selected={pressed}
              aria-pressed={pressed}
              aria-label={`${day.label}${day.count ? `, ${day.count} event${day.count === 1 ? "" : "s"}` : ""}`}
              onClick={() => onSelect(pressed ? "" : day.key)}
            >
              <span>{day.weekday}</span>
              <strong>{day.day}</strong>
              <small>{day.count ? `${day.count}` : ""}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
