import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label — required (renders as aria-label + title). */
  label: string;
  /** `outline` (default), `solid` (hot-pink), or `ghost`. */
  variant?: "outline" | "solid" | "ghost";
  /** Circle diameter preset. Default `md` (44px). */
  size?: "sm" | "md" | "lg";
  /** A single icon element (e.g. a Lucide <i data-lucide> or inline SVG). */
  children?: React.ReactNode;
}

/**
 * Circular single-glyph button for toolbar/nav actions (share, filter,
 * close, map). Always pass `label` for accessibility.
 */
export function IconButton(props: IconButtonProps): JSX.Element;
