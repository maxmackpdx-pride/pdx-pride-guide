"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./web-gl-shader.css";

/** The approved mobile wave plane is the shared page atmosphere on every screen. */
export function WebGLShader({ accent }: { accent?: string; palette?: "prime" | "week"; direction?: -1 | 1; blueprintUrl?: string | null; waveSpeed?: number; lowPower?: boolean } = {}) {
  const plane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = plane.current;
    if (!element) return;
    let onscreen = true;
    const sync = () => { element.style.animationPlayState = document.hidden || !onscreen ? "paused" : "running"; };
    const observer = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return <div ref={plane} aria-hidden="true" className="rg-stream-background rg-stream-background--mobile-fallback"
    style={accent ? { color:accent, "--rg-mobile-primary":accent, "--rg-mobile-secondary":accent, "--rg-mobile-tertiary":accent } as CSSProperties : undefined} />;
}
