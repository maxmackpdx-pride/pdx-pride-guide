export type DockScrollState = { y: number; travel: number; collapsed: boolean };

/** Scroll only collapses. Reopening is an explicit tap or keyboard action. */
export function advanceDockScroll(previous: DockScrollState, y: number, held: boolean, desktop: boolean): DockScrollState {
  y = Math.max(0, y);
  if (held || desktop) return { y, travel: 0, collapsed: false };
  if (y < 80) return { ...previous, y, travel: 0 };
  const delta = y - previous.y;
  if (!delta) return previous;
  const travel = Math.sign(delta) === Math.sign(previous.travel) ? previous.travel + delta : delta;
  if (travel >= 24) return { y, travel: 0, collapsed: true };
  return { ...previous, y, travel };
}

