import React from "react";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mono uppercase kicker with an accent tick, e.g. "The Guide". */
  kicker?: React.ReactNode;
  /** Loud display title. Wrap a word in <span className="hl"> to accent it. */
  title?: React.ReactNode;
  /** Supporting body copy under the title. */
  subtitle?: React.ReactNode;
  /** Optional right-aligned element (e.g. a Button or "view all" link). */
  action?: React.ReactNode;
  /** Accent color of kicker tick + highlighted word. */
  accent?: "pink" | "cyan" | "purple" | "lime" | "amber" | string;
  /** `left` (default) or `center`. */
  align?: "left" | "center";
  /** `md` (default) or `sm`. */
  size?: "sm" | "md";
}

/**
 * Section heading block: mono kicker + loud Anton display title + optional
 * subtitle and right-aligned action. Use to open every page section.
 */
export function SectionHeader(props: SectionHeaderProps): JSX.Element;
