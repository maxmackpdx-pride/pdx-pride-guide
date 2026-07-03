import { MapLegend } from "./MapLegend";
import type { CssVarStyle, MapPin, PrideDay } from "../types";

const DAY_COLOR: Record<PrideDay, string> = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)",
};

export const DEFAULT_MAP_PINS: MapPin[] = [
  { x: 30, y: 32, day: "SUN" },
  { x: 35, y: 42, multi: true },
  { x: 27, y: 55, day: "SAT" },
  { x: 40, y: 40, day: "THU" },
  { x: 44, y: 34, day: "FRI" },
  { x: 46, y: 52, day: "SAT" },
  { x: 33, y: 62, day: "SAT" },
  { x: 50, y: 44, day: "SAT" },
  { x: 54, y: 58, day: "SUN" },
  { x: 62, y: 30, day: "SAT" },
  { x: 74, y: 52, day: "SUN" },
  { x: 66, y: 12, day: "SUN" },
];

export interface MapPanelProps {
  pins?: MapPin[];
  height?: number;
  legend?: boolean;
  expandable?: boolean;
  onExpand?: () => void;
  showCityLabel?: boolean;
  className?: string;
  style?: CssVarStyle;
}

export function MapPanel({
  pins = DEFAULT_MAP_PINS,
  height = 420,
  legend = true,
  expandable = false,
  onExpand,
  showCityLabel = true,
  className = "",
  style,
}: MapPanelProps) {
  return (
    <div
      className={`pdxMap ${className}`}
      style={{ height, ...style }}
    >
      <span className="pdxMap__seam pdxMap__seam--top" />
      {showCityLabel && (
        <span
          className="pdxMap__label"
          style={{ left: "44%", top: "46%" }}
        >
          Portland
        </span>
      )}
      <div className="pdxMap__pins">
        {pins.map((p, i) => (
          <span
            key={i}
            className={`pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""}`}
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                "--_c": (p.day && DAY_COLOR[p.day]) || "var(--day-sat)",
              } as CssVarStyle
            }
          />
        ))}
      </div>
      {expandable ? (
        <button type="button" className="pdxMap__expand" onClick={onExpand}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Expand
        </button>
      ) : (
        legend && (
          <div className="pdxMap__legend">
            <MapLegend />
          </div>
        )
      )}
      <span className="pdxMap__attr">Leaflet | © OpenStreetMap © CARTO</span>
      <span className="pdxMap__seam pdxMap__seam--bottom" />
    </div>
  );
}