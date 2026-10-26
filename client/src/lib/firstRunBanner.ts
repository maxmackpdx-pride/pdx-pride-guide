/**
 * First-run banners (Welcome, notification prompt) share one bottom slot so they never stack, never block the page,
 * and are remembered per device (and per user for the notification prompt). The notification permission itself is only
 * ever requested from a tap on the banner's button.
 */
export type FirstRunId = "welcome" | "push";

let active: FirstRunId | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

/** True when `id` now owns the slot (or already did). */
export function claimFirstRun(id: FirstRunId): boolean {
  if (active && active !== id) return false;
  if (active !== id) { active = id; notify(); }
  return true;
}
export function releaseFirstRun(id: FirstRunId) {
  if (active === id) { active = null; notify(); }
}
export function subscribeFirstRun(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function firstRunOwner(): FirstRunId | null { return active; }

export function wasDismissed(key: string): boolean {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
export function rememberDismissed(key: string) {
  try { localStorage.setItem(key, "1"); } catch { /* private mode: still dismissed for this page view */ }
}

/** Resolves after the visitor first touches, types or scrolls (never auto-popping over a page they have not used yet). */
export function afterFirstInteraction(callback: () => void): () => void {
  const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
  let done = false;
  const handler = () => {
    if (done) return;
    done = true;
    events.forEach(name => window.removeEventListener(name, handler, true));
    callback();
  };
  events.forEach(name => window.addEventListener(name, handler, { capture: true, passive: true }));
  return () => { done = true; events.forEach(name => window.removeEventListener(name, handler, true)); };
}

export function modalDialogOpen(): boolean {
  return !!document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]');
}
