import React from "react";

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slogans / dates to scroll. */
  items?: string[];
  /** Band color, or `rainbow` for the gradient. Default `pink`. */
  color?: "pink" | "cyan" | "purple" | "lime" | "amber" | "rainbow" | string;
  /** Separator glyph between items. Default "✦". */
  separator?: string;
  /** Seconds per loop (lower = faster). Default 26. */
  speed?: number;
}

/**
 * Infinite scrolling ticker band of slogans / dates — a signature zine/club
 * motif. Pauses on hover. Use as a full-bleed strip under the hero or between
 * sections. Intentional addition (no source component); documented in readme.
 */
export function Marquee(props: MarqueeProps): JSX.Element;
