import React from "react";

export interface MapPin {
  /** Horizontal position as a percentage (0-100). */
  x: number;
  /** Vertical position as a percentage (0-100). */
  y: number;
  /** Day key, sets the ring color. Omit and set `multi` for a multi-day pin. */
  day?: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  /** Multi-day venue: conic spectrum core with a 2px black rim. */
  multi?: boolean;
  /** Explicit ring color, for category pins (Directory) or beach accents. */
  color?: string;
  /** The viewer has RSVPed here: 2.2s scale pulse, never an outer glow. */
  rsvp?: boolean;
}

export interface MapPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pins to plot. Defaults to a representative Portland cluster. */
  pins?: MapPin[];
  /** Panel height in px. Default 420. */
  height?: number;
  /** Show the map key. Default true. */
  legend?: boolean;
  /** `corner` (bottom left, stacked) or `home` (centered, one row). */
  legendVariant?: "corner" | "home";
  /** Override the key rows, e.g. Directory categories or beach markers. */
  legendDays?: Array<{ label: string; c: string }>;
  /** Show the EXPAND chip (Events and Directory, not the home strip). */
  expandable?: boolean;
  /** Expand click handler. */
  onExpand?: () => void;
  /** Show the YOU locate chip. */
  locate?: boolean;
  /** Show the faint "PORTLAND" plate label. Default true. */
  showCityLabel?: boolean;
}

/**
 * The map surface for Events, the home strip, Directory and the beaches.
 * A debossed OLED well: thin black outline plus inward-only deboss, hole-rim
 * vignette, and a diagonal light shaft. Pins are an 18px black core with a
 * 3px day ring and inward shadow only.
 *
 * Frame rule (docs/LIVE_DESIGN_STANDARD.md): no outer neon or neutral bloom on
 * any map surface, and none on any pin. RSVP feedback is a scale pulse. In
 * production the plate is Leaflet + CARTO dark tiles; the grid background is
 * the offline stand-in. Values ported from `client/src/components/ds/mapTheme.ts`.
 */
export function MapPanel(props: MapPanelProps): JSX.Element;
