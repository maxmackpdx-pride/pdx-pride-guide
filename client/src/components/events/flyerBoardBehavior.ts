/** Nested controls retain their own native keyboard activation. */
export function isPosterActivation(key: string, isPosterTarget: boolean): boolean {
  return isPosterTarget && (key === "Enter" || key === " ");
}

/** Reserve the selected/front slot before deduplicating small decks. */
export function fanSlots(count: number, selected: number): Array<{ index: number; offset: number }> {
  if (count <= 0) return [];
  const used = new Set<number>();
  const slots: Array<{ index: number; offset: number }> = [];
  for (const offset of [0, -1, 1, -2, 2]) {
    const index = ((selected + offset) % count + count) % count;
    if (used.has(index)) continue;
    used.add(index);
    slots.push({ index, offset });
  }
  return slots.sort((a, b) => a.offset - b.offset);
}
