import type { ButtonHTMLAttributes, CSSProperties, ElementType, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "neon" | "solid" | "gradient" | "pill" | "ghost";
  accent?: "lime" | "yellow" | "cyan" | "pink" | "magenta" | "orange" | "purple" | string;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  live?: boolean;
  arrow?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  as?: ElementType;
  children?: ReactNode;
}

const ACCENTS: Record<string, { c: string; sh: string; shx: string }> = {
  lime: { c: "var(--neon-yellow)", sh: "rgba(255,0,204,0.36)", shx: "rgba(255,0,204,0.5)" },
  yellow: { c: "var(--neon-yellow)", sh: "rgba(255,0,204,0.36)", shx: "rgba(255,0,204,0.5)" },
  cyan: { c: "var(--neon-cyan)", sh: "rgba(204,255,0,0.30)", shx: "rgba(204,255,0,0.45)" },
  pink: { c: "var(--neon-magenta)", sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
  magenta: { c: "var(--neon-magenta)", sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
  orange: { c: "var(--neon-orange)", sh: "rgba(255,0,204,0.32)", shx: "rgba(255,0,204,0.46)" },
  purple: { c: "var(--neon-violet)", sh: "rgba(0,255,255,0.30)", shx: "rgba(0,255,255,0.45)" },
};

export function Button({
  children,
  variant = "neon",
  accent = "lime",
  size = "md",
  block = false,
  live = false,
  arrow = false,
  leadingIcon = null,
  trailingIcon = null,
  as: Tag = "button",
  className = "",
  style,
  ...rest
}: ButtonProps) {
  const a = ACCENTS[accent] ?? ACCENTS.lime;
  const cls = [
    "pdxBtn",
    `pdxBtn--${variant}`,
    `pdxBtn--${size}`,
    block ? "pdxBtn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const accentStyle = {
    "--_c": a.c,
    "--_sh": a.sh,
    "--_shx": a.shx,
    ...style,
  } as CSSProperties;

  return (
    <Tag className={cls} style={accentStyle} {...rest}>
      {live && <span className="pdxBtn__dot" aria-hidden="true" />}
      {leadingIcon}
      {children}
      {trailingIcon}
      {arrow && (
        <span className="pdxBtn__arrow" aria-hidden="true">
          &rarr;
        </span>
      )}
    </Tag>
  );
}