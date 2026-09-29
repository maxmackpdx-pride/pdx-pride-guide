import { useEffect, useRef } from "react";

type GlitchLogoProps = {
  src: string;
  alt: string;
  className?: string;
  /**
   * The hero wordmark announces itself while it is on screen so the nav mark
   * can rest: the guide allows one glitching mark on screen at a time.
   */
  hero?: boolean;
};

/** Slow RGB glitch for brand wordmarks (nav + hero). Guide: brand-glitch. */
export default function GlitchLogo({ src, alt, className = "", hero = false }: GlitchLogoProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!hero || !node || typeof IntersectionObserver === "undefined") return;
    const root = document.documentElement;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) root.setAttribute("data-hero-mark-visible", "true");
      else root.removeAttribute("data-hero-mark-visible");
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.removeAttribute("data-hero-mark-visible");
    };
  }, [hero]);
  return (
    <span ref={ref} className={`glitch-logo${hero ? " glitch-logo--hero" : ""}${className ? ` ${className}` : ""}`}>
      <img
        src={src}
        alt={alt}
        className="glitch-logo__main"
        loading="eager"
        decoding="async"
        {...({ fetchpriority: "high" } as Record<string, string>)}
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-logo__ghost glitch-logo__ghost--cyan"
        loading="lazy"
        decoding="async"
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-logo__ghost glitch-logo__ghost--magenta"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
