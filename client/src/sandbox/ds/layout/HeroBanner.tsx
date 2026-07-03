import type { HTMLAttributes, ReactNode } from "react";

export interface HeroBannerProps extends HTMLAttributes<HTMLElement> {
  image?: string;
  focal?: string;
  minHeight?: number;
  scrim?: "bottom" | "left" | "bottom-left" | "full" | "none";
  align?: "bottom-left" | "bottom" | "center";
  seam?: boolean;
  flush?: boolean;
  children?: ReactNode;
}

const SCRIM: Record<string, string> = {
  bottom: "bottom",
  left: "left",
  "bottom-left": "bl",
  full: "full",
  none: "none",
};

export function HeroBanner({
  image,
  focal = "center",
  minHeight = 480,
  scrim = "bottom-left",
  align = "bottom-left",
  seam = true,
  flush = false,
  children,
  className = "",
  style,
  ...rest
}: HeroBannerProps) {
  const alignKey = align === "center" ? "center" : align === "bottom" ? "bottom" : "bl";
  const cls = ["pdxHero", `pdxHero--${alignKey}`, flush ? "pdxHero--flush" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cls} style={{ minHeight, ...style }} {...rest}>
      {image && (
        <img
          className="pdxHero__img"
          src={image}
          alt=""
          style={{ objectPosition: focal }}
        />
      )}
      <div className={`pdxHero__scrim pdxHero__scrim--${SCRIM[scrim] ?? "bl"}`} />
      {seam && <div className="pdxHero__seam" aria-hidden="true" />}
      <div className="pdxHero__content">{children}</div>
    </section>
  );
}