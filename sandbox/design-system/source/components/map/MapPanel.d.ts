import React from "react";

export interface MapPin {
  /** Horizontal position as a percentage (0-100). */
  x: number;
  /** Vertical position as a percentage (0-100). */
  y: number;
  /** Day key, sets the pin color. Omit and set `multi` for a multi-day pin. */
  day?: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  /** Rainbow multi-day pin. */
  multi?: boolean;
}

export interface MapPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pins to plot ({x, y, day} percentages). Defaults to a representative Portland cluster. */
  pins?: MapPin[];
  /** Panel height in px. Default 420. */
  height?: number;
  /** Show the day-color legend box (top-right). Default true. */
  legend?: boolean;
  /** Show an "Expand" control instead of the legend (top-right). */
  expandable?: boolean;
  /** Expand click handler. */
  onExpand?: () => void;
  /** Show the faint "PORTLAND" city label. Default true. */
  showCityLabel?: boolean;
}

/**
 * The dark neon map surface for the Events and Directory pages: day-colored
 * glowing pins over a dark map, rainbow flag seams top and bottom, and either
 * the day legend or an Expand control. In production the background is a
 * Leaflet + CARTO dark tile layer; this component styles the branded overlay
 * (pins, legend, seams). Uses MapLegend internally.
 */
export function MapPanel(props: MapPanelProps): JSX.Element;
