// @ts-nocheck
import React from "react";

/** IconButton, square-ish circular button holding a single glyph. */
export function IconButton({
  children,
  label,
  variant = "outline",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["pdxIconBtn", "zay-action", "zay-action--icon", "pdx-glass-rebind", variant === "solid" ? "zay-action--solid" : "", `pdxIconBtn--${variant}`, `pdxIconBtn--${size}`, className]
    .filter(Boolean).join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
