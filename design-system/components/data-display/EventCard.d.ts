import React from "react";

export interface EventCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Shows the CLAIM THIS EVENT sticker. It keeps a hard 3px CYAN offset: the one deliberate exception to the retired flat offset. */
  claimable?: boolean;
  /** Claim already submitted. Swaps the sticker to magenta and stops it being a button. */
  claimPending?: boolean;
  onClaimClick?: () => void;
  /** Links the venue name out to the place page. */
  venueHref?: string;
  /** Street line under the venue. */
  address?: string;
  /** Ticket link. Renders the solid glass button as the row's primary CTA. */
  ticketHref?: string;
  /** Label for the ticket CTA. Default "Get tickets". */
  ticketLabel?: string;
  /** Event name. */
  title: string;
  /** Venue name (bolded in the when-line). */
  venue?: string;
  /** When-line, e.g. "Fri, Jul 17 · 9:00 PM · Pearl District". */
  when?: string;
  /** event day (MON..SUN). Drives the 4px left border + day tag. */
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
/* extended: claim state, venue link, address and the ticket CTA */
export function EventCard(props: EventCardProps): JSX.Element;
