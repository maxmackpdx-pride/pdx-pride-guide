import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import "@/components/hub/hub-panel.css";

/** The shared header dropdown frame for Hub and Inbox. */
export default function HeaderDropdown({ open, onOpenChange, trigger, triggerSelector, id, title, description, className = "", actionContext, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLElement | null>;
  triggerSelector: string;
  id: string;
  title: string;
  description: string;
  className?: string;
  actionContext?: string;
  children: ReactNode;
}) {
  const [top, setTop] = useState(86);
  const wasOpen = useRef(false);
  const shouldReturnFocus = useRef(true);
  const returnFocus = useCallback(() => {
    // Switching dropdowns should leave focus in the newly opened panel.
    if (Array.from(document.querySelectorAll<HTMLElement>('.hub-panel[data-state="open"]')).some(panel => panel.id !== id && panel.getClientRects().length)) return;
    const original = trigger.current;
    const visible = original?.isConnected && original.getClientRects().length ? original
      : Array.from(document.querySelectorAll<HTMLElement>(triggerSelector)).find(element => element.getClientRects().length);
    visible?.focus();
  }, [id, trigger, triggerSelector]);
  useEffect(() => {
    if (wasOpen.current && !open && shouldReturnFocus.current) returnFocus();
    if (open) shouldReturnFocus.current = true;
    wasOpen.current = open;
  }, [open, returnFocus]);
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(max-width: 959px)");
    let locked = false;
    const update = () => {
      if (media.matches && !locked) { lockBodyScroll(); locked = true; }
      else if (!media.matches && locked) { unlockBodyScroll(); locked = false; }
    };
    update();
    media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); if (locked) unlockBodyScroll(); };
  }, [open]);
  useEffect(() => {
    const position = () => {
      const header = document.querySelector(".site-header");
      setTop(Math.max(16, Math.round(header?.getBoundingClientRect().bottom ?? 76) + 10));
    };
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open]);
  return <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
    <Dialog.Portal forceMount>
      <Dialog.Content id={id} forceMount className={`hub-panel pdx-glass-rebind ${className}`} data-action-context={actionContext} style={{ top, "--hub-top": `${top}px` } as CSSProperties} aria-describedby={`${id}-description`}
        onEscapeKeyDown={event => {
          if (Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).some(dialog => dialog.id !== id && dialog.getClientRects().length)) event.preventDefault();
        }}
        onCloseAutoFocus={event => { event.preventDefault(); if (shouldReturnFocus.current) returnFocus(); }}
        onInteractOutside={event => {
          const target = event.detail.originalEvent.target;
          if (target instanceof Element && target.closest('[role="dialog"], [data-hub-trigger], [data-inbox-open-trigger]')) event.preventDefault();
          else shouldReturnFocus.current = false;
        }}>
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        <Dialog.Description id={`${id}-description`} className="sr-only">{description}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
