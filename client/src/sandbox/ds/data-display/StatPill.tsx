import type { ReactNode } from "react";
import type { CssVarStyle, NeonColor, SpanProps } from "../types";

const COLORS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
};

export interface StatPillProps extends SpanProps {
  count?: number | string;
  children?: ReactNode;
  color?: NeonColor | string;
  variant?: "outline" | "solid";
  size?: "sm" | "md";
  glow?: boolean;
  dot?: boolean;
  icon?: ReactNode;
}

export function StatPill({
  count,
  children,
  color = "lime",
  variant = "outline",
  size = "md",
  glow = false,
  dot = false,
  icon = null,
  className = "",
  style,
  ...rest
}: StatPillProps) {
  const cls = [
    "pdxStatPill",
    `pdxStatPill--${variant}`,
    size === "sm" ? "pdxStatPill--sm" : "",
    glow ? "pdxStatPill--glow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssStyle: CssVarStyle = {
    "--_c": COLORS[color] || color,
    ...style,
  };

  return (
    <span className={cls} style={cssStyle} {...rest}>
      {dot && <span className="pdxStatPill__dot" />}
      {icon && <span className="pdxStatPill__icon">{icon}</span>}
      {count != null && <span className="pdxStatPill__num">{count}</span>}
      {children}
    </span>
  );
}