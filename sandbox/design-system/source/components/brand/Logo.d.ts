import React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** `lockup` (icon + stacked wordmark, default), `stacked` (icon over wordmark),
   *  `icon` (mark only), `wordmark` (text only). */
  variant?: "lockup" | "stacked" | "icon" | "wordmark";
  /** Icon size in px; drives wordmark scale. Default 56. For `wordmark` this is the text size. */
  size?: number;
  /** `light` (white text on dark, default) or `dark` (ink text on paper). */
  tone?: "light" | "dark";
  /** Path to the mark PNG. Default "assets/logo.png" — pass the correct relative path per page. */
  src?: string;
  /** Accessible name. Default "Zaylist". */
  alt?: string;
  /** Render as a link. */
  href?: string;
}

/**
 * The official brand lockup — the app-icon mark plus the stacked wordmark
 * (PDX / PRIDE / GUIDE with PRIDE in the rainbow gradient). Brand rule: the
 * mark appears WITH the wordmark unless you explicitly use `variant="icon"`.
 *
 * @startingPoint section="Brand" subtitle="Official logo lockup" viewport="700x150"
 */
export function Logo(props: LogoProps): JSX.Element;
