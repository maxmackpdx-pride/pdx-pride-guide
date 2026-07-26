import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  /** Neon color. Ignored when a shortcut (admission/day/category) is set. */
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | "yellow" | "blue" | "red" | "neutral" | string;
  /** `solid` (neon fill, black text, default), `outline` (colored border+text), `paper` (off-white fill). */
  variant?: "solid" | "outline" | "paper";
  /** `sm` (default) / `md` / `lg`. */
  size?: "sm" | "md" | "lg";
  /** Neon glow, used for "GRAND OPENING". */
  glow?: boolean;
  /** Leading dot. */
  dot?: boolean;
  /** Shortcut: admission enum sets color + label (FREE=lime, TICKETED=cyan, DONATION=amber). */
  admission?: "FREE" | "TICKETED" | "SUGGESTED_DONATION";
  /** Shortcut: day sets color + label, renders as a paper chip like the event modal. */
  day?: "THU" | "FRI" | "SAT" | "SUN";
  /** Shortcut: place category sets color + label. */
  category?: "bars" | "food" | "cafes" | "venues" | "services" | "shops" | "hotels";
}

/**
 * Small Anton uppercase tag with near-square corners. Solid neon fill (black
 * text) or neon outline. Powers admission badges, day chips, place-category
 * labels, status flags ("GRAND OPENING", use `color="yellow" glow`), and
 * generic tags ("21+", "DANCE", "BEAR", "PUBLIC").
 */
export function Badge(props: BadgeProps): JSX.Element;
