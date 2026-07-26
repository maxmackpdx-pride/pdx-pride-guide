import React from "react";

export interface MapLegendDay {
  label: string;
  /** CSS color value for the swatch ring. */
  c: string;
}

export interface MapLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rows to show. Defaults to the full Mon-to-Sun event day colors. */
  days?: MapLegendDay[];
  /** Append the conic spectrum "Multi-day" row. Default true. */
  multi?: boolean;
  /** Home strip variant: one horizontal row instead of a stack. */
  home?: boolean;
}

/**
 * The map key. An OLED glass well (two radials over #08080c, a 7% white
 * hairline, 16px radius, inward sheen) whose swatches are the pin shape
 * itself: black core, 3px ring. Never glowing dots, and never a lime panel
 * edge. Sits bottom left over MapPanel, or centered for the home strip.
 * Ported from `.map-legend` in mapTheme.ts + index.css.
 */
export function MapLegend(props: MapLegendProps): JSX.Element;
