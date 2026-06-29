import { useEffect, useMemo, useRef, useState } from "react";
import {
  HERO_OVERLAY_LAYERS,
  HERO_OVERLAY_PRESETS,
  type HeroOverlayId,
  type HeroOverlayLayer,
  type HeroOverlayPreset,
} from "@/lib/heroOverlays";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function OverlayVideo({ layer }: { layer: HeroOverlayLayer }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || failed) return;

    video.playbackRate = layer.playbackRate ?? 1;

    const play = () => {
      void video.play().catch(() => setFailed(true));
    };

    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });

    return () => video.removeEventListener("canplay", play);
  }, [layer, failed]);

  if (failed) return null;

  return (
    <video
      ref={ref}
      className="hero-video-overlay"
      src={layer.src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      style={{
        mixBlendMode: layer.blendMode,
        opacity: layer.opacity,
      }}
      onError={() => setFailed(true)}
    />
  );
}

type HeroVideoOverlayProps = {
  preset?: HeroOverlayPreset;
  layers?: HeroOverlayId[];
  className?: string;
};

/** Looped WebM overlays blended over static hero photos (light leaks, grain, etc.). */
export default function HeroVideoOverlay({
  preset = "atmosphere",
  layers,
  className = "",
}: HeroVideoOverlayProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 900px)");

  const activeLayers = useMemo(() => {
    if (preset === "none") return [];
    const ids = layers ?? HERO_OVERLAY_PRESETS[preset];
    if (mobile) return ids.filter(id => id !== "confetti");
    return ids;
  }, [preset, layers, mobile]);

  if (reducedMotion || activeLayers.length === 0) return null;

  return (
    <div className={`hero-video-overlays${className ? ` ${className}` : ""}`} aria-hidden="true">
      {activeLayers.map(id => (
        <OverlayVideo key={id} layer={HERO_OVERLAY_LAYERS[id]} />
      ))}
    </div>
  );
}