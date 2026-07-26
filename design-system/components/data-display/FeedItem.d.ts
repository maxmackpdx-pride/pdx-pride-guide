import React from "react";

export interface FeedItemAttachment {
  /** Attachment title (e.g. the referenced event). */
  title: string;
  /** Mono sub-line (venue · going). */
  sub?: string;
  /** Dot color; defaults to the status color. */
  color?: string;
}

export interface FeedItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Poster name. */
  name: string;
  /** Mono action + time line, e.g. "is going · 4h ago". */
  action?: string;
  /** Avatar image URL (rendered inside a conic-rainbow ring). */
  avatar?: string;
  /** Fallback initial when no avatar. */
  initial?: string;
  /** Status key → badge color. */
  status?: "rsvp" | "submitted" | "looking" | "checkin" | "event" | "host";
  /** Outlined status badge label. */
  statusLabel?: string;
  /** Full prismatic top bar (used by "Looking" posts). */
  rainbowTop?: boolean;
  /** Body copy. */
  children?: React.ReactNode;
  /** Optional referenced-event attachment chip. */
  attachment?: FeedItemAttachment;
}

/**
 * Hub scene-feed row on the NEUTRAL glass surface (corner sheen kept as a
 * background layer so text stays legible): conic-rainbow avatar ring, outlined
 * status badge in the status color, body copy, an optional attachment chip, and
 * an optional full rainbow top bar for "Looking" posts.
 *
 * @startingPoint section="Cards" subtitle="Hub scene-feed item" viewport="440x220"
 */
export function FeedItem(props: FeedItemProps): JSX.Element;
