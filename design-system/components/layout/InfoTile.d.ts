import React from "react";

export interface InfoTileProps extends React.HTMLAttributes<HTMLElement> {
  /** Tile title (rendered in the accent color, no glow). */
  title: string;
  /** Body copy. */
  description?: string;
  /** Optional footer action label (adds an arrow). */
  action?: string;
  /** Accent color name or CSS color. Default "purple". */
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | "blue" | "violet" | string;
  /** Whole-tile link. */
  href?: string;
}

/**
 * Infrastructure-grid tile: glass surface with a 4px left accent border and no
 * title glow. Drop several into a responsive grid to route to sections
 * (Gigs, Gifting, Missed Connections, Nude Beaches).
 *
 * @startingPoint section="Cards" subtitle="Infrastructure grid tile" viewport="380x180"
 */
export function InfoTile(props: InfoTileProps): JSX.Element;
