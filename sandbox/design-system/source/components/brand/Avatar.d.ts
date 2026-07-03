import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Photo URL. Omit to show initials from `name`. */
  src?: string;
  /** Full name, used for initials and alt text. */
  name?: string;
  /** Size preset (sm 32 / md 44 / lg 64 / xl 84) or an explicit px number. */
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Ring style: `rainbow` (default), `neutral`, or a day key (MON..SUN). */
  ring?: "rainbow" | "neutral" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  /** Show a status dot. */
  status?: boolean;
  /** Status dot color. Default neon green. */
  statusColor?: string;
}

/**
 * Community member avatar: a circular photo (or initials) inside the signature
 * rainbow gradient ring. Use `ring="MON".."SUN"` to tint the ring to a day
 * (e.g. a HOST chip), or `ring="neutral"`. Cluster with negative margins for
 * the "12 going" attendance stack.
 */
export function Avatar(props: AvatarProps): JSX.Element;
