type GlitchWordProps = {
  text: string;
  className?: string;
};

/** Slow, chunky RGB glitch for accent wordmarks (nav PRIDE, hero PRIDE). */
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