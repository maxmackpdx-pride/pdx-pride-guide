import React from "react";

export interface MapLegendDay {
  label: string;
  /** CSS color value for the dot. */
  c: string;
}

export interface MapLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rows to show. Defaults to the full Mon-to-Sun Pride-week day colors. */
  days?: MapLegendDay[];
  /** Append the rainbow "Multi-day" row. Default true. */
  multi?: boolean;
}

/**
 * The day-color key for the map: a lime-outlined box with a glowing dot per
 * day (Mon to Sun) plus a rainbow "Multi-day" swatch. Place it over MapPanel
 * or use standalone in a filter sidebar.
 */
export function MapLegend(props: MapLegendProps): JSX.Element;
