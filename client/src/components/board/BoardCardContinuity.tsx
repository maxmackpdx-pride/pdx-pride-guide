import { createContext, useContext, useLayoutEffect, type RefObject } from "react";

export type CardOrigin = { element: HTMLElement; rect: DOMRect };
export const BoardCardOrigin = createContext<CardOrigin | null>(null);
const closeAnimations = new WeakMap<HTMLElement, (finish: () => void) => void>();
const quiet = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.classList.contains("calm-mode") || document.documentElement.dataset.calm === "true";

/** Move the edges, without scaling the artwork or type inside the card. */
export function cardEdgeFrames(source: Pick<DOMRect, "left" | "top" | "width" | "height">, target: Pick<DOMRect, "left" | "top" | "width" | "height">): Keyframe[] | null {
  if (![source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height].every(Number.isFinite) || Math.min(source.width, source.height, target.width, target.height) < 8) return null;
  const x = source.left + source.width / 2 - target.left - target.width / 2;
  const y = source.top + source.height / 2 - target.top - target.height / 2;
  const vertical = (target.height - source.height) / 2;
  const horizontal = (target.width - source.width) / 2;
  return [
    { translate: `${x}px ${y}px`, clipPath: `inset(${vertical}px ${horizontal}px)` },
    { translate: "0px 0px", clipPath: "inset(0px 0px)" },
  ];
}

export function closeBoardCard(panel: HTMLElement | null, finish: () => void): boolean {
  const close = panel && closeAnimations.get(panel);
  if (!close) return false;
  close(finish);
  return true;
}

/** Runs once the real head has applied the final paper geometry to its dialog. */
export function useBoardCardContinuity(head: RefObject<HTMLElement>) {
  const origin = useContext(BoardCardOrigin);
  useLayoutEffect(() => {
    const panel = head.current?.closest<HTMLElement>('[role="dialog"]');
    if (!panel || !origin) return;
    panel.dataset.boardContinuity = "true";
    let animation: Animation | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closing = false;
    let finishClose: (() => void) | undefined;
    const sourceVisibility = origin.element.style.visibility;
    const play = (frames: Keyframe[], finish?: () => void) => {
      if (quiet() || typeof panel.animate !== "function") { finish?.(); return; }
      try {
        animation?.cancel();
        const current = panel.animate(frames, { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
        animation = current;
        if (finish) {
          let finished = false;
          const done = () => { if (finished) return; finished = true; clearTimeout(timer); finish(); };
          animation.onfinish = done;
          // A cancelled/interrupted browser animation must never trap the dialog.
          timer = setTimeout(done, 400);
        } else current.onfinish = () => current.cancel();
      } catch { finish?.(); }
    };
    const frames = cardEdgeFrames(origin.rect, panel.getBoundingClientRect());
    if (frames) {
      origin.element.style.visibility = "hidden";
      play(frames);
    }
    closeAnimations.set(panel, finish => {
      if (closing) return;
      closing = true;
      let finished = false;
      finishClose = () => { if (finished) return; finished = true; finish(); };
      const current = origin.element.isConnected ? origin.element.getBoundingClientRect() : origin.rect;
      const reverse = cardEdgeFrames(current, panel.getBoundingClientRect());
      if (reverse) play([...reverse].reverse(), finishClose); else finishClose();
    });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopMotion = () => {
      if (!quiet()) return;
      animation?.cancel();
      if (closing) { clearTimeout(timer); finishClose?.(); }
    };
    media.addEventListener("change", stopMotion);
    const observer = new MutationObserver(stopMotion);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => {
      observer.disconnect();
      media.removeEventListener("change", stopMotion);
      clearTimeout(timer);
      if (animation) { animation.onfinish = null; animation.cancel(); }
      closeAnimations.delete(panel);
      delete panel.dataset.boardContinuity;
      origin.element.style.visibility = sourceVisibility;
    };
  }, [head, origin]);
}
