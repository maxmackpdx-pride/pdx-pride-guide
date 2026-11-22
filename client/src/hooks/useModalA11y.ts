import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

const modalStack: HTMLDivElement[] = [];

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
  dialogRef?: RefObject<HTMLDivElement | null>;
}) {
  const { open = true, onClose, enabled = true } = opts;
  const ownDialogRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = opts.dialogRef ?? ownDialogRef;
  const closeRef = useRef(onClose);
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // iOS-safe: position:fixed lock (overflow:hidden detaches the fixed bottom nav)
    lockBodyScroll();

    const node = dialogRef.current;
    if (node) modalStack.push(node);
    const focusables = () =>
      node
        ? (Array.from(node.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter(
            el => !el.hasAttribute("disabled") && !el.closest("[inert]") && el.tabIndex !== -1 && el.offsetParent !== null,
          )
        : [];

    // Focus first focusable (or dialog itself)
    const frame = requestAnimationFrame(() => {
      if (node && modalStack.at(-1) !== node) return;
      const list = focusables();
      if (list[0]) list[0].focus();
      else node?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (node?.closest("[inert]") || document.activeElement?.closest("dialog[open]")) return;
      if (node && modalStack.at(-1) !== node) return;
      if (e.key === "Escape") {
        const nested = e.target instanceof Element ? e.target.closest("[data-owns-escape]") : null;
        if (nested && node?.contains(nested)) return;
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
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
      cancelAnimationFrame(frame);
      if (node) { const index = modalStack.lastIndexOf(node); if (index >= 0) modalStack.splice(index, 1); }
      document.removeEventListener("keydown", onKeyDown, true);
      unlockBodyScroll();
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    };
  }, [enabled, open, dialogRef]);

  return dialogRef;
}
