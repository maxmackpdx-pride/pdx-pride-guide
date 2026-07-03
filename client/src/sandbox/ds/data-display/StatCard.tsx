import type { ReactNode } from "react";
import type { ClickHandler, CssVarStyle } from "../types";

const COLORS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
  blue: "var(--blue)",
};

export interface StatCardProps {
  value: ReactNode;
  label: ReactNode;
  action?: string;
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | "blue" | string;
  size?: "sm" | "md";
  href?: string;
  onClick?: ClickHandler;
  className?: string;
  style?: CssVarStyle;
}

export function StatCard({
  value,
  label,
  action = "View",
  color = "lime",
  size = "md",
  href,
  onClick,
  className = "",
  style,
}: StatCardProps) {
  const cls = ["pdxStatCard", size === "sm" ? "pdxStatCard--sm" : "", className]
    .filter(Boolean)
    .join(" ");

  const cssStyle: CssVarStyle = {
    "--_c": COLORS[color] || color,
    ...style,
  };

  const inner = (
    <>
      <span className="pdxStatCard__num">{value}</span>
      <span className="pdxStatCard__label">{label}</span>
      {action && (
        <span className="pdxStatCard__action">
          {action} <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a className={cls} href={href} style={cssStyle}>
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} style={cssStyle}>
        {inner}
      </button>
    );
  }

  return (
    <div className={cls} style={cssStyle}>
      {inner}
    </div>
  );
}