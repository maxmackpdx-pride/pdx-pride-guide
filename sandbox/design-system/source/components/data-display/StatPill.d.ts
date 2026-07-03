import React from "react";

export interface StatPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Leading number, e.g. 52. Rendered in the accent color. */
  count?: number | string;
  /** Trailing label, e.g. "EVENTS". */
  children?: React.ReactNode;
  /** Accent color. Default `lime`. */
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | string;
  /** `outline` (default) or `solid`. */
  variant?: "outline" | "solid";
  /** `md` (default) or `sm`. */
  size?: "sm" | "md";
  /** Neon glow (e.g. the "LIVE" pill). */
  glow?: boolean;
  /** Leading dot. */
  dot?: boolean;
  /** Leading icon element (e.g. a map pin for "52 EVENTS"). */
  icon?: React.ReactNode;
}

/**
 * Compact count pill: accent-colored number + gray uppercase label. Used all
 * over the Hub and Admin ("1 EVENTS", "3 ACTION ITEMS", "52 EVENTS", "1 TOTAL",
 * "1 POSTS") and for status pills ("LIVE" with `variant="solid" glow`).
 */
export function StatPill(props: StatPillProps): JSX.Element;
