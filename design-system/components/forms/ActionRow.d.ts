import React from "react";

export interface ActionRowProps extends React.HTMLAttributes<HTMLElement> {
  /** Big leading number, e.g. "01". */
  number?: React.ReactNode;
  /** Row title. */
  title: string;
  /** Emphasized lead sentence (rendered bold). */
  lead?: string;
  /** Remaining copy after the lead. */
  rest?: string;
  /** Outlined status badge in the accent color, e.g. "Goes Live Now". */
  badge?: string;
  /** Accent color name or CSS color. Default "lime". */
  color?: "lime" | "cyan" | "pink" | "magenta" | "green" | "orange" | "purple" | "blue" | string;
  /** Whole-row link. */
  href?: string;
  /** Click handler (renders a button when no href). */
  onClick?: () => void;
}

/**
 * Promoter-intake action row on the glass surface: a big number, title with a
 * bold lead + rest, an outlined status badge, and a trailing arrow. Stack a few
 * keyed to different accents (Submit = lime, Claim = cyan, Spotted = magenta).
 *
 * @startingPoint section="Cards" subtitle="Promoter action row" viewport="620x120"
 */
export function ActionRow(props: ActionRowProps): JSX.Element;
