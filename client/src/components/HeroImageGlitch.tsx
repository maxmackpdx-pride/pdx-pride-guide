import { useRef } from "react";
import { useGlitchFx, type GlitchFxOptions } from "@/hooks/useGlitchFx";

const PRESETS: Record<"hero" | "panel", GlitchFxOptions> = {
  hero: {
    bars: false,
    text: null,
    lineAlpha: 0.38,
    heavy: true,
    ghost: 0.42,
    band: 0.13,
    freq: 0.055,
    pixel: 2,
  },
  panel: {
    bars: false,
    text: null,
    lineAlpha: 0.32,
    heavy: true,
    ghost: 0.36,
    band: 0.11,
    freq: 0.048,
    pixel: 2,
  },
};

type HeroImageGlitchProps = {
  intensity?: "hero" | "panel";
  className?: string;
};

export default function HeroImageGlitch({ intensity = "hero", className = "" }: HeroImageGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGlitchFx(canvasRef, PRESETS[intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`hero-glitch-overlay hero-glitch-overlay--${intensity}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    />
  );
}