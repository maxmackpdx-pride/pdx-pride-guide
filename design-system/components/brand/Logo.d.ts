import React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** `full` (baked horizontal lockup image: badge + wordmark), `lockup` (icon + live
   *  stacked wordmark, default), `stacked` (icon over wordmark), `icon` (mark only),
   *  `wordmark` (text only). */
  variant?: "full" | "lockup" | "stacked" | "icon" | "wordmark";
  /** Icon size in px; drives wordmark scale. Default 56. For `full` this is the lockup
   *  height; for `wordmark` it is the text size. */
  size?: number;
  /** `light` (white text on dark, default) or `dark` (ink text on paper). */
  tone?: "light" | "dark";
  /** Path to the square app-icon PNG. Default "app-face/icons/zaylist-512.png", the shipped app face export. Pass the correct relative path per page. */
  src?: string;
  /** Path to the full baked lockup WEBP (used by `variant="full"`). Default "assets/logo-lockup.png". */
  fullSrc?: string;
  /** Accessible name. Default "Zaylist". */
  alt?: string;
  /** Append the ™ mark to the live-text wordmark. Default true. */
  tm?: boolean;
  /** Render as a link. */
  href?: string;
}

/**
 * The official brand lockup: the app face tile plus the ZAYLIST wordmark
 * (spectrum gradient). Brand rule: the
 * mark appears WITH the wordmark unless you explicitly use `variant="icon"`.
 *
 * @startingPoint section="Brand" subtitle="Official logo lockup" viewport="700x150"
 */
export function Logo(props: LogoProps): JSX.Element;
