/**
 * Needz sub-category accents for Mapz waypoints. Secondary colors come from the
 * Zaylist neon tokens only (no Radix or shadcn defaults). Health and Safety use
 * the red token; Needz primary uses the Progress Pride gradient, like the avatar ring.
 */
export type NeedzCategoryId =
  | "health" | "safety" | "legal" | "youth" | "community"
  | "family" | "money" | "arts" | "mental-health" | "harm-reduction";

export const NEEDZ_ACCENT: Record<NeedzCategoryId, string> = {
  health: "var(--neon-red)",
  safety: "var(--neon-red)",
  legal: "var(--neon-blue)",
  youth: "var(--text-hi)",
  community: "var(--yellow)",
  family: "var(--neon-magenta)",
  money: "var(--green-acid)",
  arts: "var(--neon-violet)",
  "mental-health": "var(--neon-red)",
  "harm-reduction": "var(--neon-red)",
};

/** Needz primary waypoint: heart icon with the Progress Pride gradient as its secondary. */
export const NEEDZ_PRIMARY = { icon: "heart", accent: "progress-pride" } as const;

export function needzAccent(id: string): string | undefined {
  return (NEEDZ_ACCENT as Record<string, string>)[id];
}
