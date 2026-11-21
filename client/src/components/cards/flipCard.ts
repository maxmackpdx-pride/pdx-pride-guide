/**
 * Flip-and-grow / flip-and-shrink for every card open (Tucker, t304u).
 * FLIP with the Web Animations API on transform + opacity only, so it stays
 * on the compositor (60fps on mobile) and needs no React state, which keeps
 * the React Compiler happy. Reduced motion and Calm Mode get a short fade.
 */
export type OriginRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function cardMotionOff(): boolean {
  if (typeof window === "undefined") return true;
  const root = document.documentElement;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || root.classList.contains("calm-mode") || root.dataset.calm === "true";
}

function delta(el: HTMLElement, origin: OriginRect) {
  const r = el.getBoundingClientRect();
  const sx = Math.max(0.05, origin.width / Math.max(1, r.width));
  const sy = Math.max(0.05, origin.height / Math.max(1, r.height));
  const dx = origin.left + origin.width / 2 - (r.left + r.width / 2);
  const dy = origin.top + origin.height / 2 - (r.top + r.height / 2);
  return { sx, sy, dx, dy };
}

const EASE_OPEN = "cubic-bezier(.16, 1, .3, 1)";
const EASE_CLOSE = "cubic-bezier(.55, 0, .7, .2)";
export const FLIP_MS = 420;

/** Grow from the tapped card while turning over (back face -> front). */
export function flipIn(el: HTMLElement | null, origin?: OriginRect | null): Animation | null {
  if (!el || typeof el.animate !== "function") return null;
  if (cardMotionOff() || !origin || !origin.width) {
    return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: cardMotionOff() ? 160 : 220, easing: "ease-out" });
  }
  const { sx, sy, dx, dy } = delta(el, origin);
  return el.animate([
    { transform: `perspective(1100px) translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateY(-90deg)`, opacity: 0.4 },
    { transform: `perspective(1100px) translate(${dx * 0.35}px, ${dy * 0.35}px) scale(${(sx + 2) / 3}, ${(sy + 2) / 3}) rotateY(-28deg)`, opacity: 1, offset: 0.55 },
    { transform: "perspective(1100px) none", opacity: 1 },
  ], { duration: FLIP_MS, easing: EASE_OPEN });
}

/** Shrink back into the origin card while turning away; resolves when done. */
export function flipOut(el: HTMLElement | null, origin?: OriginRect | null, fromY = 0): Promise<void> {
  if (!el || typeof el.animate !== "function") return Promise.resolve();
  const start = `perspective(1100px) translateY(${fromY}px)`;
  el.style.translate = "";
  let anim: Animation;
  if (cardMotionOff() || !origin || !origin.width) {
    anim = el.animate([{ transform: start, opacity: 1 }, { transform: start, opacity: 0 }], { duration: cardMotionOff() ? 140 : 200, easing: "ease-in", fill: "forwards" });
  } else {
    const { sx, sy, dx, dy } = delta(el, origin);
    anim = el.animate([
      { transform: start, opacity: 1 },
      { transform: `perspective(1100px) translate(${dx * 0.5}px, ${dy * 0.5 + fromY * 0.5}px) scale(${(sx + 1) / 2}, ${(sy + 1) / 2}) rotateY(35deg)`, opacity: 1, offset: 0.5 },
      { transform: `perspective(1100px) translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateY(90deg)`, opacity: 0.2 },
    ], { duration: FLIP_MS - 60, easing: EASE_CLOSE, fill: "forwards" });
  }
  return anim.finished.then(() => undefined, () => undefined);
}

export function rectOf(el: Element | null | undefined): OriginRect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** Tile open (t306u): no flip. The box expands from the tile and the tile's
 *  icon travels into the box's header icon (shared element). */
export function growIn(box: HTMLElement | null, origin?: OriginRect | null, icon?: HTMLElement | null, iconOrigin?: OriginRect | null): void {
  if (!box || typeof box.animate !== "function") return;
  if (cardMotionOff() || !origin || !origin.width) {
    box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: cardMotionOff() ? 160 : 220, easing: "ease-out" });
    return;
  }
  const { sx, sy, dx, dy } = delta(box, origin);
  box.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.3, borderRadius: "12px" },
    { transform: "none", opacity: 1 },
  ], { duration: 380, easing: EASE_OPEN });
  if (icon && iconOrigin) {
    const d = delta(icon, iconOrigin);
    icon.animate([
      { transform: `translate(${d.dx}px, ${d.dy}px) scale(${d.sx}, ${d.sy})` },
      { transform: "none" },
    ], { duration: 380, easing: EASE_OPEN });
  }
}

export function growOut(box: HTMLElement | null, origin?: OriginRect | null, icon?: HTMLElement | null, iconOrigin?: OriginRect | null, fromY = 0): Promise<void> {
  if (!box || typeof box.animate !== "function") return Promise.resolve();
  box.style.translate = "";
  const start = `translateY(${fromY}px)`;
  if (cardMotionOff() || !origin || !origin.width) {
    return box.animate([{ transform: start, opacity: 1 }, { transform: start, opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" }).finished.then(() => undefined, () => undefined);
  }
  const { sx, sy, dx, dy } = delta(box, origin);
  if (icon && iconOrigin) {
    const d = delta(icon, iconOrigin);
    icon.animate([{ transform: "none" }, { transform: `translate(${d.dx}px, ${d.dy - fromY}px) scale(${d.sx}, ${d.sy})` }], { duration: 320, easing: EASE_CLOSE, fill: "forwards" });
  }
  return box.animate([
    { transform: start, opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0 },
  ], { duration: 320, easing: EASE_CLOSE, fill: "forwards" }).finished.then(() => undefined, () => undefined);
}

/** Light haptic tick where supported (Tucker, t314u): card flip, form submit,
 *  swipe-down dismiss. No-op without navigator.vibrate and in Calm Mode /
 *  reduced motion. */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function" || cardMotionOff()) return;
  try { navigator.vibrate(pattern); } catch { /* unsupported */ }
}
