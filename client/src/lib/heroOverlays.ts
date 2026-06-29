/** CC-BY 3.0 overlay footage (VFX FOOTAGE / Wikimedia Commons). Blend on black via screen/overlay. */
export type HeroOverlayId = "lightLeaks" | "filmGrain" | "scanlines" | "confetti" | "rain";

export type HeroOverlayBlend = "screen" | "overlay" | "soft-light" | "plus-lighter";

export type HeroOverlayLayer = {
  id: HeroOverlayId;
  src: string;
  blendMode: HeroOverlayBlend;
  opacity: number;
  playbackRate?: number;
};

export const HERO_OVERLAY_LAYERS: Record<HeroOverlayId, HeroOverlayLayer> = {
  lightLeaks: {
    id: "lightLeaks",
    src: "/overlays/light-leaks.webm",
    blendMode: "screen",
    opacity: 0.44,
    playbackRate: 0.5,
  },
  filmGrain: {
    id: "filmGrain",
    src: "/overlays/scanlines.webm",
    blendMode: "overlay",
    opacity: 0.202,
    playbackRate: 0.85,
  },
  scanlines: {
    id: "scanlines",
    src: "/overlays/scanlines.webm",
    blendMode: "screen",
    opacity: 0.09,
  },
  confetti: {
    id: "confetti",
    src: "/overlays/confetti.webm",
    blendMode: "screen",
    opacity: 0.2,
    playbackRate: 0.75,
  },
  rain: {
    id: "rain",
    src: "/overlays/rain.webm",
    blendMode: "screen",
    opacity: 0.26,
  },
};

export type HeroOverlayPreset = "home" | "panel" | "atmosphere" | "none";

export const HERO_OVERLAY_PRESETS: Record<Exclude<HeroOverlayPreset, "none">, HeroOverlayId[]> = {
  home: ["lightLeaks", "filmGrain", "confetti"],
  panel: ["lightLeaks", "filmGrain"],
  atmosphere: ["lightLeaks", "filmGrain"],
};