import { useCallback, useRef } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";

/** Match the ReZources 220ms close while keeping the dialog mounted until it ends. */
export function useOpenCardClose(onClose: () => void, enabled = true) {
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  const closing = useRef(false);
  const requestClose = useCallback(() => {
    if (closing.current) return;
    const panel = dialogRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("calm-mode") ||
      document.documentElement.dataset.calm === "true") {
      latestClose.current();
      return;
    }
    closing.current = true;
    const animation = panel.animate(
      [{ opacity: 1, scale: 1 }, { opacity: 0, scale: .98 }],
      { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    animation.onfinish = () => latestClose.current();
    animation.oncancel = () => { closing.current = false; };
  }, []);
  const dialogRef = useModalA11y({ onClose: requestClose, enabled });
  return { dialogRef, requestClose };
}
