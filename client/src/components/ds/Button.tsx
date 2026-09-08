// @ts-nocheck
import React from "react";

/* Shared action appearance and states live in tokens/buttons.css. */
const ACCENTS = {
  lime:    { c: "var(--neon-yellow)" },
  yellow:  { c: "var(--neon-yellow)" },
  cyan:    { c: "var(--neon-cyan)" },
  pink:    { c: "var(--neon-magenta)" },
  magenta: { c: "var(--neon-magenta)" },
  orange:  { c: "var(--neon-orange)" },
  green:   { c: "var(--neon-green)" },
  purple:  { c: "var(--neon-violet)" },
};

/**
 * Button - glass CTA (default) with solid / outline / gradient variants.
 * @param {any} props
 */
export function Button({
  children,
  variant = "neon",        // neon(=glass default) | solid | outline | gradient | pill | ghost
  accent = "lime",
  size = "md",
  block = false,
  live = false,
  arrow = false,
  leadingIcon = null,
  trailingIcon = null,
  as = "button",
  className = "",
  style = {},
  ...rest
}: any) {
  const Tag = as;
  const a = ACCENTS[accent] || ACCENTS.lime;
  const cls = ["pdxBtn", "pdx-glass-rebind", `pdxBtn--${variant}`, `pdxBtn--${size}`,
    block ? "pdxBtn--block" : "", className].filter(Boolean).join(" ");
  return (
    <Tag data-button-accent={accent} className={cls} style={{ "--_c": a.c, "--c": a.c, ...style }} {...rest}>
      {live && <span className="pdxBtn__dot" aria-hidden="true" />}
      {leadingIcon}
      {children}
      {trailingIcon}
      {arrow && <span className="pdxBtn__arrow" aria-hidden="true">&rarr;</span>}
    </Tag>
  );
}
