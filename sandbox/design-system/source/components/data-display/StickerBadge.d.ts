import React from "react";

export interface StickerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  /** Fill color. `rainbow` uses the signature gradient; `outline`/`paper` for quieter looks. */
  color?: "lime" | "pink" | "cyan" | "purple" | "yellow" | "rainbow" | "paper" | "outline";
  /** `sm` / `md` (default) / `lg`. */
  size?: "sm" | "md" | "lg";
  /** Rotation in degrees. Default -4 (jaunty). Vary per instance for collage energy. */
  rotate?: number;
}

/**
 * The collage slogan sticker — chunky rotated display type on a hard-shadow
 * neon chip. Use for irreverent brand slogans ("KEEP PORTLAND WEIRD",
 * "PRIDE IS A PROTEST", "MADE BY THE SCENE"). Scatter a few at varied
 * rotations over hero/promo areas. Do NOT use for functional UI labels.
 *
 * @startingPoint section="Brand" subtitle="Rotated slogan stickers" viewport="700x150"
 */
export function StickerBadge(props: StickerBadgeProps): JSX.Element;
