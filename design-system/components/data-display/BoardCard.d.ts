import React from "react";

export interface BoardCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Which board the post belongs to. Drives accent color + label + motif. */
  board?: "spotted" | "gifting" | "gigs";
  /** Post direction: "give" (offering out) or "iso" (asking in). Sets the chip + rail. */
  kind?: "give" | "iso";
  /** Post headline. */
  title: string;
  /** Small meta line beside the board label (e.g. "Sat 5pm", "Size 9", "Paid"). */
  meta?: string;
  /** Location / origin line in the footer. */
  where?: string;
  /** Body copy. */
  text?: string;
  /** Footer action label. Default "Reply". */
  cta?: string;
  /** Whole-card link. */
  href?: string;
}

/**
 * Community-board post card on the glass surface. Keyed to a board color
 * (Missed Connections magenta, Gifting lime, Gigs violet) with a faint
 * oversized line motif bled into the top-right and a GIVE/ISO direction
 * chip + rail. Motion + bloom silence under calm mode / reduced-motion.
 *
 * @startingPoint section="Cards" subtitle="Community board post card" viewport="380x260"
 */
export function BoardCard(props: BoardCardProps): JSX.Element;
