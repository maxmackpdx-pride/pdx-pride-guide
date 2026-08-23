import { useEffect, useRef } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isVisibleFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled") || el.tabIndex === -1) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  // getClientRects works for position:fixed; offsetParent does not.
  return el.getClientRects().length > 0;
}

/** Last visible aria-modal dialog in DOM order is treated as the top layer. */
function isTopModal(node: HTMLElement | null): boolean {
  if (!node) return false;
  const visible = Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]')).filter(
    el => el.getClientRects().length > 0,
  );
  if (!visible.length) return true;
  return visible[visible.length - 1] === node;
}

/**
 * Dialog a11y: Escape to close, focus trap, body scroll lock, restore focus.
 * Attach dialogRef to the role="dialog" node.
 * Nested modals: only the topmost dialog traps Tab / handles Escape.
 */
export function useModalA11y(opts: {
  open?: boolean;
  onClose: () => void;
  /** When false, skip (e.g. parent not mounted). Default true. */
  enabled?: boolean;
  /** Required gates can lock + trap without dismissing on Escape. Default true. */
  closeOnEscape?: boolean;
}) {
  const { open = true, onClose, enabled = true, closeOnEscape = true } = opts;
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
        ? (Array.from(node.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter(isVisibleFocusable)
        : [];

    // Focus first focusable (or dialog itself) only if this is the top dialog
    requestAnimationFrame(() => {
      if (!isTopModal(node)) return;
      const list = focusables();
      if (list[0]) list[0].focus();
      else node?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTopModal(node)) return;
      if (e.key === "Escape") {
        if (!closeOnEscape) return;
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
      } else if (active === last || !node.contains(active)) {
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
  }, [enabled, open, onClose, closeOnEscape]);

  return dialogRef;
}
