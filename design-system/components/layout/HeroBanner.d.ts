import React from "react";

export interface HeroBannerProps extends React.HTMLAttributes<HTMLElement> {
  /** Background wallpaper URL (a brand collage hero image). */
  image?: string;
  /** CSS background-position / object-position for the wallpaper. Default "center". */
  focal?: string;
  /** Minimum height in px. Default 480. */
  minHeight?: number;
  /** Legibility scrim. Default "bottom-left". */
  scrim?: "bottom" | "left" | "bottom-left" | "full" | "none";
  /** Content alignment. Default "bottom-left". */
  align?: "bottom-left" | "bottom" | "center";
  /** Show the top rainbow seam. Default true. */
  seam?: boolean;
  /** Square corners for full-bleed page tops. */
  flush?: boolean;
  children?: React.ReactNode;
}

/**
 * Full-bleed brand wallpaper with a legibility scrim and an overlay content
 * slot. Feed it one of the collage hero wallpapers (assets/banners/*) and put
 * a marker kicker, stacked Logo/headline, and CTAs inside. Used for the Home
 * hero and the Hub / section headers.
 *
 * @startingPoint section="Layout" subtitle="Full-bleed wallpaper hero" viewport="1200x520"
 */
export function HeroBanner(props: HeroBannerProps): JSX.Element;
