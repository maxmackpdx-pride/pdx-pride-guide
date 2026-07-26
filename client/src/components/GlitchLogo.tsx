type GlitchLogoProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Slow RGB glitch for brand wordmarks (nav + hero). Guide: brand-glitch. */
export default function GlitchLogo({ src, alt, className = "" }: GlitchLogoProps) {
  return (
    <span className={`glitch-logo${className ? ` ${className}` : ""}`}>
      <img src={src} alt={alt} className="glitch-logo__main" />
      <img src={src} alt="" aria-hidden="true" className="glitch-logo__ghost glitch-logo__ghost--cyan" />
      <img src={src} alt="" aria-hidden="true" className="glitch-logo__ghost glitch-logo__ghost--magenta" />
    </span>
  );
}
