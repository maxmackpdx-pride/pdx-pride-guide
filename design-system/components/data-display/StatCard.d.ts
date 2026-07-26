import React from "react";

export interface StatCardProps extends React.HTMLAttributes<HTMLElement> {
  /** The big number/value, e.g. 47. */
  value: React.ReactNode;
  /** Uppercase label, e.g. "Live Events". */
  label: React.ReactNode;
  /** Action text (renders with a trailing arrow). Pass "" to hide. Default "View". */
  action?: string;
  /** Neon border + number color. Default `lime`. */
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | "blue" | string;
  /** `md` (default) or `sm`. */
  size?: "sm" | "md";
  /** Renders as a link. */
  href?: string;
  onClick?: React.MouseEventHandler;
}

/**
 * Big-number dashboard tile with a neon border and glow, an uppercase label,
 * and a "VIEW ->" action. Lay out in a responsive grid for the Admin
 * dashboard. Rotate `color` across the grid for the neon-rainbow rhythm.
 */
export function StatCard(props: StatCardProps): JSX.Element;
