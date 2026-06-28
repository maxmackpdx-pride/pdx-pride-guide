type GlitchWordProps = {
  text: string;
  className?: string;
};

/** Slow, chunky RGB glitch for accent wordmarks (nav PRIDE, hero PRIDE). */
export default function GlitchWord({ text, className = "" }: GlitchWordProps) {
  return (
    <span className={`glitch-word${className ? ` ${className}` : ""}`} data-text={text}>
      {text}
    </span>
  );
}