import React from "react";

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target datetime (ISO string). Default: Pride weekend kickoff 2026-07-16T19:00. */
  target?: string;
  /** `md` (hero, default) or `sm` (inline). */
  size?: "sm" | "md";
  /** Glow color of the numbers. Default `lime`. */
  accent?: "lime" | "pink" | "cyan" | "purple" | "amber" | string;
  /** Text shown once the target passes. */
  doneLabel?: string;
}

/**
 * Live-ticking countdown to a target datetime — the hero countdown to
 * Pride weekend. Four neon blocks (Days / Hrs / Min / Sec) with a top glow.
 * Updates every second; swaps to `doneLabel` at zero.
 */
export function Countdown(props: CountdownProps): JSX.Element;
