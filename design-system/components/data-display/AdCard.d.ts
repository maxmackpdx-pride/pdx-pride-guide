import React from "react";

export interface AdCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "grid" = green events-grid slot; "feed" = red in-feed slot. Default "grid". */
  variant?: "grid" | "feed";
  /** Logo image URL for the well. */
  logo?: string;
  /** Fallback wordmark shown in the well when no logo. Default "Logo". */
  logoText?: string;
  /** Headline. */
  title?: string;
  /** Body copy (grid variant). */
  description?: string;
  /** CTA button label (grid variant). Default "Shop now". */
  cta?: string;
  /** Pills above the title (grid variant); first renders solid, rest outlined. */
  tags?: string[];
  /** Emphasis line: the green "shop the link" line (grid) or the big offer line (feed). */
  note?: string;
  /** Mono subcopy under the title (feed variant). */
  subcopy?: string;
  /** Mono code / URL line (feed variant). */
  code?: string;
  /** Dismiss handler (feed variant close ✕). */
  onClose?: () => void;
  /** CTA click handler (grid variant). */
  onClick?: () => void;
}

/**
 * Affiliate ad card built to be indistinguishable from a real event card:
 * the glass surface, refraction seam, and a radial accent logo well with a 4px
 * accent bottom edge. Grid slot is green; in-feed slot is red.
 *
 * @startingPoint section="Cards" subtitle="Affiliate ad card" viewport="320x480"
 */
export function AdCard(props: AdCardProps): JSX.Element;
