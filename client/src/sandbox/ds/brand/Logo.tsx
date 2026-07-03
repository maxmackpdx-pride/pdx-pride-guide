import type { CSSProperties, HTMLAttributes } from "react";

export interface LogoProps extends HTMLAttributes<HTMLElement> {
  /** `lockup` (icon + stacked wordmark, default), `stacked`, `icon`, `wordmark`. */
  variant?: "lockup" | "stacked" | "icon" | "wordmark";
  /** Icon size in px; drives wordmark scale. Default 56. */
  size?: number;
  /** `light` (white text on dark, default) or `dark` (ink text on paper). */
  tone?: "light" | "dark";
  /** Path to the mark PNG. */
  src?: string;
  /** Accessible name. Default "PDX Pride Guide". */
  alt?: string;
  /** Render as a link. */
  href?: string;
}

const DEFAULT_LOGO_SRC = "/sandbox-ds/logo.png";

export function Logo({
  variant = "lockup",
  size = 56,
  tone = "light",
  src = DEFAULT_LOGO_SRC,
  alt = "PDX Pride Guide",
  className = "",
  href,
  ...rest
}: LogoProps) {
  const showIcon = variant !== "wordmark";
  const showText = variant !== "icon";
  const wmSize = variant === "wordmark" ? size : Math.round(size * 0.42);

  const cls = ["pdxLogo", `pdxLogo--${variant}`, `pdxLogo--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  const imgStyle = { "--_sz": `${size}px` } as CSSProperties;
  const wmStyle: CSSProperties = { fontSize: `${wmSize}px` };

  const inner = (
    <>
      {showIcon && (
        <img
          className="pdxLogo__img"
          src={src}
          alt={showText ? "" : alt}
          style={imgStyle}
          aria-hidden={showText ? true : undefined}
        />
      )}
      {showText && (
        <span className="pdxLogo__wm" style={wmStyle}>
          <span>PDX</span>
          <span className="pdxLogo__rainbow">PRIDE</span>
          <span>GUIDE</span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a className={cls} href={href} aria-label={alt} {...rest}>
        {inner}
      </a>
    );
  }

  return (
    <span className={cls} role="img" aria-label={alt} {...rest}>
      {inner}
    </span>
  );
}