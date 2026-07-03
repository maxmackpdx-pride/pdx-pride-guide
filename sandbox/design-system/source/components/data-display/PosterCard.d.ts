import React from "react";

export interface PosterCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Event name (Barlow 900 uppercase; also the fallback flyer text). */
  title: string;
  /** Venue name. */
  venue?: string;
  /** When-line, e.g. "Fri, Jul 17 · 9:00 PM · Pearl District". */
  when?: string;
  /** Pride day (MON..SUN). Drives the ambient glow, poster stripe, and day tag. */
  day?: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  /** 2:3 flyer art URL. Omitted -> placeholder block with the title. */
  image?: string;
  /** Event-type outline tags, e.g. ["Drag", "Dance party"]. */
  types?: string[];
  /** Admission, joined into the meta tag ("Ticketed · 21+"). */
  admission?: "FREE" | "TICKETED" | "SUGGESTED_DONATION";
  /** Age requirement, joined into the meta tag. */
  age?: "ALL_AGES" | "18_PLUS" | "21_PLUS";
  /** Unclaimed listing -> shows a yellow "Claimable" tag. */
  claimable?: boolean;
  /** Attendance count -> "N GOING" pill. */
  going?: number;
  /** RSVP handler -> shows the acid-yellow "I'll be there" button. */
  onRsvp?: () => void;
  /** Whole-card link. */
  href?: string;
  /** Show the top-right link chip. Default true. */
  showLink?: boolean;
}

/**
 * The canonical event "board card" (default grid view). A 2:3 flyer with a
 * thin day-color stripe on its bottom edge, then a meta block (white day tag,
 * outline type tags, meta tag, title, venue, when-line, details link) and an
 * optional attendance footer. The card carries the day color as an ambient
 * glow that slow-pulses. Day colors are data (calm mode flattens them).
 * Pair with EventCard for the list view.
 *
 * @startingPoint section="Cards" subtitle="Event board (poster) card" viewport="260x460"
 */
export function PosterCard(props: PosterCardProps): JSX.Element;
