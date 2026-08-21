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
        fetchPriority="high"
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-logo__ghost glitch-logo__ghost--cyan"
        loading="eager"
        decoding="async"
        fetchPriority="low"
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-logo__ghost glitch-logo__ghost--magenta"
        loading="eager"
        decoding="async"
        fetchPriority="low"
      />
    </span>
  );
}
