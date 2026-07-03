import React from "react";

export interface EventCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Event name. */
  title: string;
  /** Venue name (bolded in the when-line). */
  venue?: string;
  /** When-line, e.g. "Fri, Jul 17 · 9:00 PM · Pearl District". */
  when?: string;
  /** Pride day (MON..SUN). Drives the 4px left border + day tag. */
  day?: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  /** Flyer thumbnail URL. */
  image?: string;
  /** Event-type outline tags. */
  types?: string[];
  /** Admission (joined into the meta tag). */
  admission?: "FREE" | "TICKETED" | "SUGGESTED_DONATION";
  /** Age requirement (joined into the meta tag). */
  age?: "ALL_AGES" | "18_PLUS" | "21_PLUS";
  /** Attendance count -> "N GOING" pill. */
  going?: number;
  /** Saved (heart) state. */
  saved?: boolean;
  /** Save handler -> shows the heart button. */
  onSave?: () => void;
  /** Whole-row link. */
  href?: string;
}

/**
 * The list-view event row: flyer thumbnail left, text right, and a 4px solid
 * LEFT border in the day color (in place of the board card's poster stripe).
 * Same data model as PosterCard. Stack rows in a column for the list view.
 */
export function EventCard(props: EventCardProps): JSX.Element;
