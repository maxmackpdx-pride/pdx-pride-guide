import React from "react";

export interface DividerProps extends React.HTMLAttributes<HTMLElement> {
  /** `rainbow` (flag seam, default), `glow` (single neon line), `faint` (hairline). */
  variant?: "rainbow" | "glow" | "faint";
  /** Line/glyph color for `glow` variant and the glyph. Default `lime`. */
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | string;
  /** Centered uppercase label between two lines. */
  label?: React.ReactNode;
  /** Centered glyph (e.g. "✦") between two lines. */
  glyph?: React.ReactNode;
  /** Render as a flush full-bleed seam (a plain <hr>), for under sticky headers / hero edges. */
  seam?: boolean;
  /** Thinner seam (2px). Only applies with `seam`. */
  thin?: boolean;
}

/**
 * The brand section divider. Default is the thin rainbow flag seam that sits
 * under the header, at hero top/bottom, and between page sections. Add `label`
 * or `glyph` for a centered section break, or `seam` for a flush full-bleed
 * line with no label.
 */
export function Divider(props: DividerProps): JSX.Element;
