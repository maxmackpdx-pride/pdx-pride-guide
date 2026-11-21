import { closeBoardCard, useInlineBoardCard, useInlineBoardCardKeyboard } from "@/components/board/BoardCardContinuity";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";

const quietMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.classList.contains("calm-mode") ||
  document.documentElement.dataset.calm === "true";

type CardRect = Pick<DOMRect, "left" | "top" | "width" | "height">;
function sourceTransform(panel: HTMLElement, origin?: CardRect | null, measured?: CardRect) {
  if (!origin || !origin.width || !origin.height) return "scale(.86)";
  const end = measured ?? panel.getBoundingClientRect();
  if (!end.width || !end.height) return "scale(.86)";
  const dx = origin.left + origin.width / 2 - end.left - end.width / 2;
  const dy = origin.top + origin.height / 2 - end.top - end.height / 2;
  return `translate(${dx}px, ${dy}px) scale(${origin.width / end.width}, ${origin.height / end.height})`;
}
/** Convert distance along the grow's easing curve to time. */
function sheenDelay(distance: number) {
  const curve = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0, high = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    if (curve(mid, .78, 1) < distance) low = mid;
    else high = mid;
  }
  return Math.round(720 * curve((low + high) / 2, .19, .24));
}
export function useOpenCardClose(onClose: () => void, enabled = true, grow?: { origin: CardRect | null }) {
  const growEnabled = Boolean(grow);
  const origin = grow?.origin;
  const inline = useInlineBoardCard();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const latestClose = useRef(onClose);
  useLayoutEffect(() => { latestClose.current = onClose; }, [onClose]);
  const closing = useRef(false);
  const animations = useRef<Animation[]>([]);
  const cancelAnimations = useCallback(() => {
    for (const animation of animations.current) {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
    animations.current = [];
  }, []);
  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const panel = dialogRef.current;
    const opacity = panel ? getComputedStyle(panel).opacity : "1";
    const transform = panel ? getComputedStyle(panel).transform : "none";
    cancelAnimations();
    if (!panel || quietMotion() || typeof panel.animate !== "function") {
      latestClose.current();
      return;
    }
    if (growEnabled) {
      const reverse = panel.animate([{ transform, opacity }, { transform: sourceTransform(panel, origin), opacity: 0 }],
        { duration: 260, easing: "cubic-bezier(.4,0,.8,.45)", fill: "forwards" });
      animations.current = [reverse];
      reverse.onfinish = () => latestClose.current();
      return;
    }
    if (closeBoardCard(panel, () => latestClose.current())) return;
    // Boardz zine cards close through the same slice glitch they open with, in reverse.
    const animation = panel.dataset.zineOpen && !panel.classList.contains("ab-open-card") ? panel.animate([
      { clipPath: "inset(0)", transform: "none", opacity },
      { clipPath: "polygon(0 0,100% 0,100% 40%,0 40%,0 46%,100% 46%,100% 100%,0 100%)", transform: "skewX(-4deg) translateX(4px)", offset: .3 },
      { clipPath: "inset(0 0 calc(100% - 240px))", transform: "none", opacity: 0 },
    ], { duration: 320, easing: "cubic-bezier(.6,0,.8,.2)", fill: "forwards" }) : panel.animate([{ opacity }, { opacity: 0 }], {
      duration: 180, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards",
    });
    animations.current = [animation];
    animation.onfinish = () => {
      animation.onfinish = null;
      latestClose.current();
    };
    animation.oncancel = () => { closing.current = false; };
  }, [cancelAnimations, growEnabled, origin]);
  useModalA11y({ dialogRef, onClose: requestClose, enabled: enabled && !inline });
  useInlineBoardCardKeyboard(dialogRef, requestClose);

  useLayoutEffect(() => {
    closing.current = false;
    if (!enabled || !dialogRef.current) return;
    const panel = dialogRef.current;
    panel.dataset.cardMotion = "shared";
    // Override the older family-specific scale/flip entrance before paint.
    const originalOpacity = panel.style.opacity;
    panel.style.opacity = "1";
    function settled() {
      delete panel.dataset.cardEntering;
      panel.dispatchEvent(new Event("zaylist:card-settled"));
    }
    if (growEnabled && !quietMotion() && typeof panel.animate === "function") {
      const end = panel.getBoundingClientRect();
      const start = origin?.height ?? end.height * .86;
      const poster = panel.querySelector<HTMLImageElement>(".evz-x__thumb img");
      const aspect = poster?.naturalWidth ? poster.naturalHeight / poster.naturalWidth : 912 / 724;
      const crossing = end.height > start ? (end.width * aspect - start) / (end.height - start) : .5;
      panel.style.setProperty("--evz-sheen-delay", sheenDelay(Math.max(.2, Math.min(.85, crossing))) + "ms");
      panel.dataset.cardEntering = "true";
      animations.current = [panel.animate([
        { transform: sourceTransform(panel, origin, end), opacity: 0 },
        { transform: "none", opacity: 1 }
      ], { duration: 720, easing: "cubic-bezier(.19,.78,.24,1)" })];
      animations.current[0].onfinish = settled;
    } else if (!panel.dataset.boardContinuity && !quietMotion() && typeof panel.animate === "function") {
      const timing = { duration: 240, easing: "cubic-bezier(.16,1,.3,1)" };
      animations.current = [panel.animate([{ opacity: 0 }, { opacity: 1 }], timing)];
      // Only text/detail regions move, never the shell, artwork, or wordmark.
      for (const content of panel.querySelectorAll<HTMLElement>(
        ".event-modal__hero-block, .place-modal-panel__details-room, .board-detail-modal__body",
      )) {
        animations.current.push(content.animate([
          { opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0" },
        ], timing));
      }
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreferenceChange = () => {
      if (!quietMotion()) return;
      cancelAnimations();
      if (panel.dataset.cardEntering) settled();
      if (closing.current) latestClose.current();
    };
    media.addEventListener("change", onPreferenceChange);
    const observer = new MutationObserver(onPreferenceChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onPreferenceChange);
      cancelAnimations();
      closing.current = false;
      delete panel.dataset.cardMotion;
      delete panel.dataset.cardEntering;
      panel.style.removeProperty("--evz-sheen-delay");
      panel.style.opacity = originalOpacity;
    };
  }, [enabled, cancelAnimations, dialogRef, growEnabled, origin]);
  return { dialogRef, requestClose };
}
