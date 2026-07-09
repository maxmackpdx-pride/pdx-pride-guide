/** Shared motion helpers for additive UI animations (pdxa*). */

/** True when calm mode or OS reduced-motion is active. Short-circuit JS motion. */
export function prefersStillMotion(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return true;
  const root = document.documentElement;
  if (root.dataset.calm === "true" || root.classList.contains("calm-mode")) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export const NEON_CYCLE = [
  "#00FFFF",
  "#CCFF00",
  "#FF00CC",
  "#FF6600",
  "#8800FF",
  "#39FF14",
] as const;

export const DAY_PALETTE = [
  "#8800FF",
  "#0044FF",
  "#FFEE00",
  "#00FFFF",
  "#FF00CC",
  "#39FF14",
  "#FF6600",
] as const;
