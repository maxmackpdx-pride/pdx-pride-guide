import React from "react";

export interface PlaceEvent {
  /** Day key for the left-border color. */
  day?: "THU" | "FRI" | "SAT" | "SUN";
  /** Display date/time, e.g. "Sat, Jul 18 · 8:00 PM". */
  date: string;
  /** Event name. */
  title: string;
}

export interface PlaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Venue name. */
  name: string;
  /** Category, sets the neon border + category badge color. */
  /** The venue's own mark. Rendered as a neon logo (screen blend + contrast pass) over a soft category orb, never a boxed image. */
  logoUrl?: string;
  /** Per-category fallback art, used when `logoUrl` is absent or fails to load. Flat art, so it renders with normal blend at a smaller size. */
  fallbackLogoUrl?: string;
  category?: "bars" | "food" | "cafes" | "venues" | "services" | "shops" | "hotels";
  /** Override the category badge label (defaults to the category's name). */
  categoryLabel?: React.ReactNode;
  /** Street address (pin icon). */
  address?: string;
  /** Hours (clock icon). */
  hours?: string;
  /** Phone (phone icon). */
  phone?: string;
  /** Short description. */
  description?: string;
  /** Website URL (renders a "Website" link in the category color). */
  website?: string;
  /** Instagram handle, e.g. "@campbarpdx". */
  instagram?: string;
  /** Show the yellow glowing "Grand Opening" flag. */
  grandOpening?: boolean;
  /** Optional "Upcoming Events" sublist. */
  events?: PlaceEvent[];
}

/**
 * Venue / place directory card. Neon border in the category color, a category
 * badge, optional "Grand Opening" flag, address / hours / phone rows with
 * icons, description, website + Instagram links, and an optional "Upcoming
 * Pride Events" sublist with day-colored markers. Uses Badge internally.
 *
 * @startingPoint section="Cards" subtitle="Venue directory card" viewport="380x520"
 */
export function PlaceCard(props: PlaceCardProps): JSX.Element;
