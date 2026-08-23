type GlitchLogoProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Slow RGB glitch for brand wordmarks (nav + hero). Guide: brand-glitch. */
export default function GlitchLogo({ src, alt, className = "" }: GlitchLogoProps) {
  return (
    <span className={`glitch-logo${className ? ` ${className}` : ""}`}>
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
