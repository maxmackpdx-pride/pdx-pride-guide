import { closeBoardCard } from "@/components/board/BoardCardContinuity";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";

const quietMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.classList.contains("calm-mode") ||
  document.documentElement.dataset.calm === "true";

/** Shared 21st-inspired reveal; the shell and logo never scale. */
export function useOpenCardClose(onClose: () => void, enabled = true) {
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
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
    cancelAnimations();
    if (!panel || quietMotion() || typeof panel.animate !== "function") {
      latestClose.current();
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
  }, [cancelAnimations]);
  const dialogRef = useModalA11y({ onClose: requestClose, enabled });

  useLayoutEffect(() => {
    closing.current = false;
    if (!enabled || !dialogRef.current) return;
    const panel = dialogRef.current;
    panel.dataset.cardMotion = "shared";
    // Override the older family-specific scale/flip entrance before paint.
    const originalOpacity = panel.style.opacity;
    panel.style.opacity = "1";
    if (!panel.dataset.boardContinuity && !quietMotion() && typeof panel.animate === "function") {
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
      panel.style.opacity = originalOpacity;
    };
  }, [enabled, cancelAnimations, dialogRef]);
  return { dialogRef, requestClose };
}
