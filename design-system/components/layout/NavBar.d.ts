import React from "react";

export interface NavBarItem {
  /** Stable key; matches `active`. */
  key: string;
  /** Tab label. */
  label: string;
  /** Icon node (e.g. an <svg>). */
  icon?: React.ReactNode;
  /** Accent color name or CSS color for the active state. */
  accent?: "lime" | "cyan" | "pink" | "magenta" | "green" | "orange" | "purple" | "blue" | string;
  /** Optional link target. */
  href?: string;
}

export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Tabs to render. */
  items: NavBarItem[];
  /** Active tab key. */
  active?: string;
  /** Selection handler (prevents navigation when provided). */
  onSelect?: (key: string) => void;
  /** Show the glowing pull handle. Default true. */
  handle?: boolean;
}

/**
 * Mobile bottom navigation bar on the deep-glass surface with an inward-debossed
 * edge, a half-strength cyan outward glow, and a glowing-cyan pull handle. The
 * active tab lights in its neon accent with a tinted fill + glow. Motion silences
 * under calm mode / reduced-motion.
 *
 * @startingPoint section="Navigation" subtitle="Mobile bottom nav bar" viewport="420x92"
 */
export function NavBar(props: NavBarProps): JSX.Element;
