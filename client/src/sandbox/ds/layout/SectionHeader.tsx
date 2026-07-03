import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "size" | "title"> {
  kicker?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  accent?: "pink" | "cyan" | "purple" | "lime" | "amber" | string;
  align?: "left" | "center";
  size?: "sm" | "md";
}

const ACCENTS: Record<string, string> = {
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  purple: "var(--purple)",
  lime: "var(--lime)",
  amber: "var(--amber)",
};

export function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  accent = "pink",
  align = "left",
  size = "md",
  className = "",
  ...rest
}: SectionHeaderProps) {
  const cls = [
    "pdxSection",
    align === "center" ? "pdxSection--center" : "",
    size === "sm" ? "pdxSection--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = { "--_c": ACCENTS[accent] ?? accent } as CSSProperties;

  return (
    <div className={cls} style={style} {...rest}>
      <div className="pdxSection__lead">
        {kicker && <div className="pdxSection__kicker">{kicker}</div>}
        {title && <h2 className="pdxSection__title">{title}</h2>}
        {subtitle && <p className="pdxSection__sub">{subtitle}</p>}
      </div>
      {action && <div className="pdxSection__action">{action}</div>}
    </div>
  );
}