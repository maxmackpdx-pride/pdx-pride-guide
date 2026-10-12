import { useEffect, useRef, useState, type RefObject, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import HubReader from "./HubReader";
import "./hub-panel.css";

export default function HubPanel({ open, onOpenChange, trigger }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLElement | null>;
}) {
  const [top, setTop] = useState(86);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open && trigger.current?.isConnected) trigger.current.focus();
    wasOpen.current = open;
    if (!open || !window.matchMedia("(max-width: 959px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open, trigger]);
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
        onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}
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
