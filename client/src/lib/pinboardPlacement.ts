import type { CSSProperties } from "react";

function hash(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
}

/**
 * Where a card sits on the bulletin board: a stable mix of small and large cards, each nudged
 * off the grid and turned a little, so rows never line up. Same post key, same spot, every render.
 */
export function pinboardPlacement(key: string, phone: boolean): { small: boolean; style: CSSProperties } {
  const h = hash(key);
  const unit = (shift: number) => ((h >>> shift) & 255) / 255;
  const small = phone ? true : unit(0) < 0.45;
  const turn = (unit(8) - 0.5) * (small ? 7 : 4.5);
  const dx = Math.round((unit(16) - 0.5) * (phone ? 10 : 36));
  const dy = Math.round((unit(24) - 0.35) * (phone ? 16 : 44));
  return {
    small,
    style: {
      rotate: `${turn.toFixed(2)}deg`,
      translate: `${dx}px ${dy}px`,
    },
  };
}
