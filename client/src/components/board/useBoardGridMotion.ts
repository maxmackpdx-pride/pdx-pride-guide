import { useLayoutEffect, useRef, type RefObject } from "react";

type Position = { left: number; top: number };
/** Animate neighboring notes between their actual flex-layout positions. */
export function useBoardGridMotion(ref: RefObject<HTMLDivElement>) {
  const positions = useRef(new Map<HTMLElement, Position>());
  const animations = useRef(new Map<HTMLElement, Animation>());
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    let frame = 0;
    const measure = () => {
      const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm-mode") || document.documentElement.dataset.calm === "true";
      const next = new Map<HTMLElement, Position>();
      for (const card of Array.from(grid.children) as HTMLElement[]) {
        const position = { left: card.offsetLeft, top: card.offsetTop };
        next.set(card, position);
        const previous = positions.current.get(card);
        if (!previous || quiet || card.classList.contains("boardz-production-card--expanded") || typeof card.animate !== "function") continue;
        const x = previous.left - position.left, y = previous.top - position.top;
        if (Math.abs(x) + Math.abs(y) < 1) continue;
        animations.current.get(card)?.cancel();
        const animation = card.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0px, 0px)" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
        animations.current.set(card, animation);
        animation.onfinish = () => animations.current.delete(card);
      }
      positions.current = next;
    };
    measure();
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    observer.observe(grid);
    for (const card of Array.from(grid.children)) observer.observe(card);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });
  useLayoutEffect(() => () => { for (const animation of animations.current.values()) animation.cancel(); }, []);
}
