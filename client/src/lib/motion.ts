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
  "#D4FF00",
  "#FF1FA0",
  "#FF7B00",
  "#7B00FF",
  "#2BFF00",
] as const;

export const DAY_PALETTE = [
  "#7B00FF",
  "#0066FF",
  "#FFDD00",
  "#00FFFF",
  "#FF1FA0",
  "#2BFF00",
  "#FF7B00",
] as const;
