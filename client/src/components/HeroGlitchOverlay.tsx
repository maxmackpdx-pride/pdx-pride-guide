import { useRef } from "react";
import { useGlitchFx } from "@/hooks/useGlitchFx";

/** Subtle CRT scanlines + rolling refresh band over the home hero (motion guide motif 01). */
export default function HeroGlitchOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGlitchFx(canvasRef, {
    bars: false,
    text: null,
    lineAlpha: 0.18,
    heavy: false,
    ghost: 0.22,
    band: 0.07,
    freq: 0.016,
    pixel: 3,
  });

  return (
    <canvas
      ref={canvasRef}
      className="hero-glitch-overlay"
      aria-hidden="true"
    />
  );
}