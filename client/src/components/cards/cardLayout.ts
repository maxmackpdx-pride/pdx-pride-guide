/** Public geometry shared by every card family. Artwork never scales the shell. */
export const CARD_SIZES = {
  tall: { width: 200, height: 403 },
  wide: { width: 360, height: 216 },
  small: { width: 136, height: 170 },
} as const;
export type CardSize = keyof typeof CARD_SIZES;

/** Resolve from measured position, not item index (mixed cards can span tracks). */
export function expansionPlacement({ columns, column, trackWidth, gap, maxWidth = 760 }: {
  columns: number; column: number; trackWidth: number; gap: number; maxWidth?: number;
}) {
  const count = Math.max(1, Math.floor(columns));
  const col = Math.max(1, Math.min(count, column));
  const anchor = count > 1 && col === count ? 'right' : 'left';
  const capacity = anchor === 'right' ? col : count - col + 1;
  const span = Math.max(1, Math.min(capacity, Math.ceil((maxWidth + gap) / (trackWidth + gap))));
  return { anchor, start: anchor === 'right' ? col - span + 1 : col, span,
    width: Math.min(maxWidth, span * trackWidth + (span - 1) * gap) } as const;
}
