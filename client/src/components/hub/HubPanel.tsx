import { useCallback, useEffect, useRef, useState, type RefObject, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import HubReader from "./HubReader";
import "./hub-panel.css";

export default function HubPanel({ open, onOpenChange, trigger }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLElement | null>;
}) {
  const [top, setTop] = useState(86);
  const wasOpen = useRef(false);
  const returnFocus = useCallback(() => {
    const original = trigger.current;
    const visible = original?.isConnected && original.getClientRects().length ? original
      : Array.from(document.querySelectorAll<HTMLElement>("[data-hub-trigger]")).find(element => element.getClientRects().length);
    visible?.focus();
  }, [trigger]);
  useEffect(() => {
    if (wasOpen.current && !open) returnFocus();
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
      <Dialog.Content forceMount className="hub-panel pdx-glass-rebind" style={{ top, "--hub-top": `${top}px` } as CSSProperties} aria-describedby="hub-panel-description"
        onEscapeKeyDown={event => { if (document.querySelector('[role="dialog"]:not(.hub-panel)')) event.preventDefault(); }}
        onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}
        onInteractOutside={event => {
          // Existing event/board/auth detail overlays are descendants in the
          // React tree but may portal their DOM beside the Hub.
          const target = event.detail.originalEvent.target as Element;
          if (target?.closest('[role="dialog"], [data-hub-trigger]')) event.preventDefault();
        }}>
        <Dialog.Title className="sr-only">Hub</Dialog.Title>
        <Dialog.Description id="hub-panel-description" className="sr-only">Chronological activity from Portland people, places, events, boards, and destinations. Filter, post, or load older updates.</Dialog.Description>
        <HubReader panelOpen={open} onClose={() => onOpenChange(false)} />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
