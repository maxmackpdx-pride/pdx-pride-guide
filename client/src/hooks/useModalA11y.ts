import { useEffect, useRef } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog a11y: Escape to close, focus trap, body scroll lock, restore focus.
 * Attach dialogRef to the role="dialog" node.
 */
export function useModalA11y(opts: {
  open?: boolean;
  onClose: () => void;
  /** When false, skip (e.g. parent not mounted). Default true. */
  enabled?: boolean;
}) {
  const { open = true, onClose, enabled = true } = opts;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // iOS-safe: position:fixed lock (overflow:hidden detaches the fixed bottom nav)
    lockBodyScroll();

    const node = dialogRef.current;
    const focusables = () =>
      node
        ? (Array.from(node.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter(
            el => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null,
          )
        : [];

    // Focus first focusable (or dialog itself)
    requestAnimationFrame(() => {
      const list = focusables();
      if (list[0]) list[0].focus();
      else node?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const list = focusables();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      unlockBodyScroll();
      previousFocus.current?.focus?.();
    };
  }, [enabled, open, onClose]);

  return dialogRef;
}
