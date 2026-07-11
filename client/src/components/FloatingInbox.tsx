import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
  clampFloatingInboxBottom,
  readFloatingInboxBottom,
  writeFloatingInboxBottom,
} from "@/lib/floatingInboxPosition";
import { pickFloatingInboxNeon } from "@/lib/floatingInboxNeon";

const DRAG_THRESHOLD_PX = 8;

/**
 * Desktop-only floating inbox FAB. Toggles the shared InboxOverlay via
 * InboxSheetProvider. Drag vertically to reposition; default sits 30% up from
 * the bottom edge. Hidden on mobile (bottom nav owns inbox there) and on /inbox
 * (full shell page).
 */
export default function FloatingInbox() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { open, toggleSheet } = useInboxSheet();
  const unreadCount = useUnreadCount();
  const [bottomPx, setBottomPx] = useState(() => readFloatingInboxBottom());
  const [dragging, setDragging] = useState(false);
  const [neon] = useState(() => pickFloatingInboxNeon());

  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startY: 0,
    startBottom: 0,
  });

  const onInboxPage = location === "/inbox" || location.startsWith("/inbox?");

  useEffect(() => {
    const onResize = () => {
      setBottomPx(current => clampFloatingInboxBottom(current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const finishDrag = useCallback((pointerId: number) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== pointerId) return;

    drag.active = false;
    drag.pointerId = -1;
    setDragging(false);

    if (drag.moved) {
      setBottomPx(current => writeFloatingInboxBottom(current));
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      dragRef.current = {
        active: true,
        moved: false,
        pointerId: event.pointerId,
        startY: event.clientY,
        startBottom: bottomPx,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [bottomPx],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const deltaY = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;

    if (!drag.moved) {
      drag.moved = true;
      setDragging(true);
    }

    setBottomPx(clampFloatingInboxBottom(drag.startBottom + deltaY));
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      const wasDrag = drag.moved;

      finishDrag(event.pointerId);
      event.currentTarget.releasePointerCapture(event.pointerId);

      if (!wasDrag) {
        toggleSheet();
      }
    },
    [finishDrag, toggleSheet],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      finishDrag(event.pointerId);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [finishDrag],
  );

  if (!user || onInboxPage) return null;

  const anchorStyle = {
    bottom: `${bottomPx}px`,
    "--fab-neon": neon.color,
    "--fab-neon-rgb": neon.rgb,
  } as CSSProperties;

  return (
    <div className="floating-inbox" style={anchorStyle}>
      <span className="floating-inbox__halo" aria-hidden />
      <button
        type="button"
        className={`floating-inbox__fab${open ? " floating-inbox__fab--open" : ""}${dragging ? " floating-inbox__fab--dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-expanded={open}
        aria-label={
          open
            ? "Close inbox. Drag up or down to reposition."
            : unreadCount > 0
              ? `Open inbox, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}. Drag up or down to reposition.`
              : "Open inbox. Drag up or down to reposition."
        }
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unreadCount > 0 && (
          <span className="floating-inbox__fab-badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}