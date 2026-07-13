import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useInboxAttentionCount } from "@/hooks/useInboxAttentionCount";
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
  const { total: attentionCount, unread, actionQueue } = useInboxAttentionCount();
  const [bottomPx, setBottomPx] = useState(() => readFloatingInboxBottom());
  const [dragging, setDragging] = useState(false);
  const [neon, setNeon] = useState(() => pickFloatingInboxNeon());

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

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setNeon(pickFloatingInboxNeon());
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
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

  // Pulse only when something needs attention (unread DMs and/or admin/owner queue).
  // Idle FAB keeps a soft static neon — no perpetual "you've got mail" throb.
  const needsAttention = !open && attentionCount > 0;

  return (
    <div
      className={[
        "floating-inbox",
        `floating-inbox--${neon.id}`,
        needsAttention ? "floating-inbox--attention" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={anchorStyle}
      data-fab-neon={neon.id}
      data-attention={needsAttention ? "true" : "false"}
    >
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
            : attentionCount > 0
              ? `Open inbox, ${unread} unread message${unread === 1 ? "" : "s"}${actionQueue > 0 ? `, ${actionQueue} in queue` : ""}. Drag up or down to reposition.`
              : "Open inbox. Drag up or down to reposition."
        }
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && attentionCount > 0 && (
          <span
            className={`floating-inbox__fab-badge${actionQueue > 0 && unread === 0 ? " floating-inbox__fab-badge--queue" : ""}`}
            aria-hidden="true"
          >
            {attentionCount > 9 ? "9+" : attentionCount}
          </span>
        )}
      </button>
    </div>
  );
}