import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./EventsDrawer.css";

type Snap = "half" | "full";

/**
 * Bottom drawer for Eventz browse tools. Opens at half height; drag the grip
 * up for full height, down to shrink or close. Tap (or Enter) on the grip
 * toggles between the two heights. Escape and the backdrop close it.
 */
export default function EventsDrawer({
  open,
  onClose,
  title,
  meta,
  accent = "var(--room-eventz)",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  meta?: ReactNode;
  accent?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [snap, setSnap] = useState<Snap>("half");
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const moved = useRef(0);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    setSnap("half");
    setDrag(0);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const toggleSnap = () => setSnap(current => (current === "half" ? "full" : "half"));
  const onDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* older browsers */ }
    startY.current = event.clientY;
    moved.current = 0;
    setDragging(true);
  };
  const onMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    moved.current = event.clientY - startY.current;
    setDrag(moved.current);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    const distance = moved.current;
    setDrag(0);
    if (Math.abs(distance) < 6) { toggleSnap(); return; }
    if (distance < -50) { setSnap("full"); return; }
    if (distance > 110) {
      if (snap === "full" && distance < 300) setSnap("half");
      else onClose();
    }
  };
  // Keyboard activation arrives as a click with no pointer movement.
  const onGripClick = (event: ReactMouseEvent<HTMLButtonElement>) => { if (event.detail === 0) toggleSnap(); };
  const onGripKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") { event.preventDefault(); setSnap("full"); }
    if (event.key === "ArrowDown") { event.preventDefault(); if (snap === "full") setSnap("half"); else onClose(); }
  };

  return createPortal(
    <div className="events-drawer-layer">
      <button type="button" className="events-drawer__backdrop" aria-label="Close" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`events-drawer pdx-glass-rebind is-${snap}${dragging ? " is-dragging" : ""}`}
        style={{ "--c": accent, transform: drag > 0 ? `translateY(${drag}px)` : undefined } as CSSProperties}
      >
        <button
          type="button"
          className="events-drawer__grip"
          aria-label={snap === "full" ? "Drag down to shrink or close" : "Drag up to expand, down to close"}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onClick={onGripClick}
          onKeyDown={onGripKey}
        >
          <span aria-hidden="true" />
        </button>
        <header className="events-drawer__head">
          <h2>{title}</h2>
          {meta ? <small>{meta}</small> : null}
        </header>
        <div className="events-drawer__body">{children}</div>
        {footer ? <div className="events-drawer__foot">{footer}</div> : null}
      </section>
    </div>,
    document.body,
  );
}
