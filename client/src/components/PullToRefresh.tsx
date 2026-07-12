import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom pull-to-refresh for the installed PWA. Standalone display mode hides
 * the browser chrome (and its native pull-to-refresh), so we roll our own:
 * pull down hard from the very top of the page to refetch all live data.
 * Only active in standalone mode on touch devices, so it never double-ups with
 * a browser's built-in gesture.
 */
const THRESHOLD = 72; // px of resolved pull needed to trigger
const MAX_PULL = 110;
const RESISTANCE = 0.5;

export default function PullToRefresh() {
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone || !("ontouchstart" in window)) return;

    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0 || e.touches.length !== 1) return;
      startY.current = e.touches[0].clientY;
      dragging.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging.current || startY.current == null) return;
      if (window.scrollY > 0) {
        dragging.current = false;
        set(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        set(0);
        return;
      }
      set(Math.min(MAX_PULL, dy * RESISTANCE));
      // Stop the standalone rubber-band while we own the gesture.
      if (pullRef.current > 2 && e.cancelable) e.preventDefault();
    };

    const finish = () => {
      if (!dragging.current) return;
      dragging.current = false;
      startY.current = null;
      if (pullRef.current >= THRESHOLD && !busy.current) {
        busy.current = true;
        setRefreshing(true);
        set(THRESHOLD);
        Promise.resolve(queryClient.invalidateQueries())
          .catch(() => {})
          .finally(() => {
            window.setTimeout(() => {
              busy.current = false;
              setRefreshing(false);
              set(0);
            }, 450);
          });
      } else {
        set(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", finish, { passive: true });
    window.addEventListener("touchcancel", finish, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", finish);
      window.removeEventListener("touchcancel", finish);
    };
  }, [queryClient]);

  const visible = pull > 0 || refreshing;
  const y = (refreshing ? THRESHOLD : pull) - 46;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2000,
        transform: `translateY(${y}px)`,
        transition: !dragging.current && !visible ? "transform .2s ease, opacity .2s ease" : "none",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(10,10,12,0.92)",
          border: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 22px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.22)",
            borderTopColor: "var(--neon-cyan, #19e3ff)",
            transform: refreshing ? undefined : `rotate(${progress * 300}deg)`,
            animation: refreshing ? "ptr-spin .7s linear infinite" : undefined,
          }}
        />
      </div>
    </div>
  );
}
