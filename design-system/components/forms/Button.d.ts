import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `neon` = outlined on the glass chassis (default, secondary);
   *  `solid` = lit accent fill, the primary; `sticker` = collage CTA, lit
   *  plate with an accent bloom on the floor; `gradient` = rainbow/hot fill;
   *  `pill` = soft filled for system dialogs; `ghost` = rounded tertiary. */
  variant?: "neon" | "solid" | "sticker" | "outline" | "gradient" | "pill" | "ghost";
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
 * The canonical CTA in Barlow Condensed 700, built on the chrome atoms: black
 * keyline, 1px top bevel, floor shade and an accent bloom. Tactile press: hover
 * lifts and the bloom grows; click settles and the bloom collapses to a press
 * shade. The flat magenta offset is retired; `variant="sticker"` carries the
 * collage energy as a lit plate instead.
 * Primary action is acid yellow (#CCFF00); use `accent="cyan"` for secondary.
 *
 * @startingPoint section="Buttons" subtitle="Neon CTA on the lit chrome chassis" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
