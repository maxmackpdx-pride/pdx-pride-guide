import type { CssVarStyle, MapLegendDay } from "../types";

const DEFAULT_DAYS: MapLegendDay[] = [
  { label: "Mon", c: "var(--day-mon)" },
  { label: "Tue", c: "var(--day-tue)" },
  { label: "Wed", c: "var(--day-wed)" },
  { label: "Thu", c: "var(--day-thu)" },
  { label: "Fri", c: "var(--day-fri)" },
  { label: "Sat", c: "var(--day-sat)" },
  { label: "Sun", c: "var(--day-sun)" },
];

export interface MapLegendProps {
  days?: MapLegendDay[];
  multi?: boolean;
  className?: string;
  style?: CssVarStyle;
}

export function MapLegend({
  days = DEFAULT_DAYS,
  multi = true,
  className = "",
  style,
}: MapLegendProps) {
  return (
    <div className={`pdxLegend ${className}`} style={style}>
      {days.map((d) => (
        <div className="pdxLegend__row" key={d.label}>
          <span
            className="pdxLegend__dot"
            style={{ "--_c": d.c } as CssVarStyle}
          />
          {d.label}
        </div>
      ))}
      {multi && (
        <>
          <div className="pdxLegend__rule" />
          <div className="pdxLegend__row">
            <span className="pdxLegend__dot pdxLegend__dot--multi" />
            Multi-day
          </div>
        </>
      )}
    </div>
  );
}