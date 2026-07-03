import type { ReactNode } from "react";
import type { CssVarStyle, SpanProps } from "../types";

export type StickerColor =
  | "lime"
  | "pink"
  | "cyan"
  | "purple"
  | "yellow"
  | "rainbow"
  | "paper"
  | "outline";

export interface StickerBadgeProps extends SpanProps {
  children?: ReactNode;
  color?: StickerColor;
  size?: "sm" | "md" | "lg";
  rotate?: number;
}

export function StickerBadge({
  children,
  color = "lime",
  size = "md",
  rotate = -4,
  className = "",
  style,
  ...rest
}: StickerBadgeProps) {
  const cls = [
    "pdxSticker",
    `pdxSticker--${color}`,
    `pdxSticker--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssStyle: CssVarStyle = {
    "--_rot": `${rotate}deg`,
    ...style,
  };

  return (
    <span className={cls} style={cssStyle} {...rest}>
      {children}
    </span>
  );
}