type GlitchWordProps = {
  text: string;
  className?: string;
};

/** Slow RGB glitch for accent text. Same timing recipe as GlitchLogo. */
export default function GlitchWord({ text, className = "" }: GlitchWordProps) {
  return (
    <span
      className={`glitch-word glitch-word--rainbow${className ? ` ${className}` : ""}`}
      data-text={text}
    >
      <span className="glitch-word__outline" aria-hidden="true">
        {text}
      </span>
      <span className="glitch-word__gradient">{text}</span>
    </span>
  );
}
