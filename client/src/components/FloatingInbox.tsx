import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useInboxAttentionCount } from "@/hooks/useInboxAttentionCount";
import {
  clampFloatingInboxPosition,
  nearestFloatingInboxCorner,
  positionForFloatingInboxCorner,
  readFloatingInboxCorner,
  writeFloatingInboxCorner,
} from "@/lib/floatingInboxPosition";
import { pickFloatingInboxNeon } from "@/lib/floatingInboxNeon";
import { isLocalDemo } from "@/lib/localDemo";

const DRAG_THRESHOLD_PX = 8;

/**
 * Desktop-only floating inbox FAB. Toggles the shared InboxOverlay via
 * InboxSheetProvider. Drag to move it between screen corners; it starts at the
 * bottom right. Hidden on mobile (bottom nav owns inbox there).
 * Local demo (localhost / Vite): FAB is always shown so chrome can be demoed
 * without a session; the sheet prompts to sign in for real threads.
 */
export default function FloatingInbox() {
  const { user } = useAuth();
  const { open, toggleSheet } = useInboxSheet();
  const { total: attentionCount, unread, actionQueue } = useInboxAttentionCount();
  const [corner, setCorner] = useState(() => readFloatingInboxCorner());
  const [position, setPosition] = useState(() => positionForFloatingInboxCorner(readFloatingInboxCorner()));
  const [dragging, setDragging] = useState(false);
  const [neon, setNeon] = useState(() => pickFloatingInboxNeon());
  const localDemo = isLocalDemo();

  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPosition: position,
    currentPosition: position,
  });

  useEffect(() => {
    const onResize = () => {
      setPosition(positionForFloatingInboxCorner(corner));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [corner]);

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
      const nextCorner = nearestFloatingInboxCorner(drag.currentPosition);
      setCorner(nextCorner);
      setPosition(positionForFloatingInboxCorner(nextCorner));
      writeFloatingInboxCorner(nextCorner);
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        active: true,
        moved: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPosition: position,
        currentPosition: position,
      };
      // Keep drags captured even when the pointer leaves the button.
      // Pointer-up still opens the inbox when the drag threshold is not reached.
    },
    [position],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;

    if (!drag.moved) {
      drag.moved = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }

    const nextPosition = clampFloatingInboxPosition({
      x: drag.startPosition.x + deltaX,
      y: drag.startPosition.y + deltaY,
    });
    drag.currentPosition = nextPosition;
    setPosition(nextPosition);
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      const wasDrag = drag.moved;

      finishDrag(event.pointerId);
      try {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* ignore */
      }

      if (!wasDrag) {
        toggleSheet();
      }
    },
    [finishDrag, toggleSheet],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      finishDrag(event.pointerId);
      try {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* ignore */
      }
    },
    [finishDrag],
  );

  // Production: members only. Local demo: always show FAB (guest opens glass shell).
  if (!user && !localDemo) return null;

  const anchorStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    "--fab-neon": neon.color,
    "--fab-neon-rgb": neon.rgb,
  } as CSSProperties;

  // Pulse only when something needs attention (unread DMs and/or admin/owner queue).
  // Idle FAB keeps a soft static neon - no perpetual "you've got mail" throb.
  // Local guest: soft attention so the demo FAB is easy to spot.
  const needsAttention = !open && (attentionCount > 0 || (localDemo && !user));

  return createPortal(
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
        data-inbox-open-trigger="fab"
        className={`floating-inbox__fab${open ? " floating-inbox__fab--open" : ""}${dragging ? " floating-inbox__fab--dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-expanded={open}
        aria-label={
          open
            ? "Close inbox. Drag to move to another corner."
            : attentionCount > 0
              ? `Open inbox, ${unread} unread message${unread === 1 ? "" : "s"}${actionQueue > 0 ? `, ${actionQueue} in queue` : ""}. Drag to move to another corner.`
              : "Open inbox. Drag to move to another corner."
        }
      >
        {open ? <X size={29} /> : <MessageCircle size={29} />}
        {!open && attentionCount > 0 && (
          <span
            className={`floating-inbox__fab-badge${actionQueue > 0 && unread === 0 ? " floating-inbox__fab-badge--queue" : ""}`}
            aria-hidden="true"
          >
            {attentionCount > 9 ? "9+" : attentionCount}
          </span>
        )}
      </button>
    </div>,
    document.body,
  );
}
