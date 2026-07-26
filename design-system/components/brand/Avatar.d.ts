import React from "react";

export type AvatarRing =
  | "progress" | "rainbow" | "lesbian" | "gay-men" | "bisexual" | "transgender"
  | "nonbinary" | "pansexual" | "genderfluid" | "genderqueer" | "intersex"
  | "asexual" | "aromantic" | "agender" | "leather" | "bear"
  | "chain" | "none";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Photo URL. Omit to show initials from `name`. */
  src?: string;
  /** Full name, used for initials and the ring tooltip. */
  name?: string;
  /** Size preset (sm 32 / md 44 / lg 64 / xl 84) or an explicit px number. */
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Pride-flag ring (the member's identity). Defaults to `progress` (Progress
   *  Pride). `chain` adds a metal ring + padlock; `none` fills the circle. */
  ring?: AvatarRing;
  /** Fallback background color behind the initial (black text). Auto-picked from
   *  the name when omitted. */
  tint?: string;
  /** Show a status dot. */
  status?: boolean;
  /** Status dot color. Default neon green. */
  statusColor?: string;
}

/**
 * Community member avatar: a circular photo or initial inside a 4px conic
 * PRIDE-FLAG ring. The ring is identity, chosen by the member (progress,
 * rainbow, lesbian, gay-men, bisexual, transgender, nonbinary, pansexual,
 * intersex, asexual, leather, bear). Unset defaults to Progress Pride.
 * `chain` is the leather/kink chain ring with a padlock; `none` shows no ring
 * (masked guests). Cluster several with negative left margin for the
 * "N going" attendance stack.
 */
export function Avatar(props: AvatarProps): JSX.Element;
