import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (renders as aria-label + title). */
  label: string;
  variant?: "outline" | "solid" | "ghost";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
}

export function IconButton({
  children,
  label,
  variant = "outline",
  size = "md",
  className = "",
  ...rest
}: IconButtonProps) {
  const cls = ["pdxIconBtn", `pdxIconBtn--${variant}`, `pdxIconBtn--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}