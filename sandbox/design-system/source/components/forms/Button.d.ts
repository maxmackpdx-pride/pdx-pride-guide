import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `neon` = outlined + brutalist magenta offset shadow (default, primary);
   *  `solid` = filled accent; `gradient` = rainbow/hot fill; `pill` = soft
   *  filled for system dialogs; `ghost` = rounded tertiary. */
  variant?: "neon" | "solid" | "gradient" | "pill" | "ghost";
  /** Accent color. `lime` (= acid yellow #CCFF00, the primary action) is default. */
  accent?: "lime" | "yellow" | "cyan" | "pink" | "magenta" | "orange" | "purple" | string;
  /** Padding preset. Default `md` (10px 20px, per source). */
  size?: "sm" | "md" | "lg";
  /** Full container width. */
  block?: boolean;
  /** Blinking "live" dot before the label. */
  live?: boolean;
  /** Trailing arrow (the site's CTA convention: "VIEW AS SCHEDULE →"). */
  arrow?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  as?: React.ElementType;
  children?: React.ReactNode;
}

/**
 * The canonical CTA. Neon outlined rectangle in Barlow Condensed 700 with the
 * signature brutalist magenta offset shadow. Tactile press: hover lifts up-left
 * and the shadow grows; click pushes down-right and the shadow collapses.
 * Primary action is acid yellow (#CCFF00); use `accent="cyan"` for secondary.
 *
 * @startingPoint section="Buttons" subtitle="Neon CTA with brutalist offset shadow" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
