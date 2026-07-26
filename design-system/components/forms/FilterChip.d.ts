import React from "react";

export interface FilterChipProps {
  /** Label text. */
  children?: React.ReactNode;
  /** Selected/active state — fills with the accent color. */
  selected?: boolean;
  /** Toggle handler. */
  onToggle?: () => void;
  /** Accent color when selected. Default `pink`. */
  accent?: "pink" | "cyan" | "purple" | "lime" | "amber" | string;
  /** Optional trailing count (e.g. events in this filter). */
  count?: number;
  /** Show a leading accent dot. */
  showDot?: boolean;
  className?: string;
}

/**
 * Toggleable filter/tag pill for the event directory — day, admission
 * (FREE / TICKETED), neighborhood, or category. Fills with its accent
 * color when selected. Compose in a horizontal scroll row.
 */
export function FilterChip(props: FilterChipProps): JSX.Element;
