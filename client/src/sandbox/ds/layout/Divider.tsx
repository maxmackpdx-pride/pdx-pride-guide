import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  variant?: "rainbow" | "glow" | "faint";
  color?: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | string;
  label?: ReactNode;
  glyph?: ReactNode;
  seam?: boolean;
  thin?: boolean;
}

const COLORS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
};

export function Divider({
  variant = "rainbow",
  color = "lime",
  label,
  glyph,
  seam = false,
  thin = false,
  className = "",
  style,
  ...rest
}: DividerProps) {
  if (seam) {
    return (
      <hr
        className={`pdxSeam ${thin ? "pdxSeam--thin" : ""} ${className}`.trim()}
        style={style}
        {...rest}
      />
    );
  }

  const center = label != null || glyph != null;
  const accentStyle = {
    "--_c": COLORS[color] ?? color,
    ...style,
  } as CSSProperties;

  return (
    <div
      className={`pdxDivider pdxDivider--${variant} ${className}`.trim()}
      role="separator"
      style={accentStyle}
      {...rest}
    >
      <span className="pdxDivider__line" />
      {center &&
        (glyph != null ? (
          <span className="pdxDivider__glyph" aria-hidden="true">
            {glyph}
          </span>
        ) : (
          <span className="pdxDivider__label">{label}</span>
        ))}
      {center && <span className="pdxDivider__line" />}
    </div>
  );
}