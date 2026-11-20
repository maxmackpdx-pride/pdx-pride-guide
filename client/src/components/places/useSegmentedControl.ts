import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';

/** A horizontal drag follows the stops. Vertical gestures remain native page scrolls. */
export function useSegmentedControl(active: number, count: number, select: (index: number) => void) {
  const start = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const [preview, setPreview] = useState<number | null>(null);
  const stopAt = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(count - 1, Math.floor(count * (event.clientX - rect.left) / rect.width)));
  };
  return {
    preview: preview ?? active,
    bindings: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (!event.isPrimary || event.button !== 0) return;
        ignoreClick.current = false;
        start.current = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false };
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const gesture = start.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        if (!gesture.dragging) {
          const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
          if (Math.max(dx, dy) < 7) return;
          if (dy > dx) { start.current = null; return; }
          gesture.dragging = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        setPreview(stopAt(event));
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        if (start.current?.id !== event.pointerId) return;
        if (start.current.dragging) {
          ignoreClick.current = true;
          select(stopAt(event));
        }
        start.current = null;
        setPreview(null);
      },
      onPointerCancel() { start.current = null; setPreview(null); },
      onClickCapture(event: MouseEvent<HTMLElement>) {
        if (ignoreClick.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
        }
        ignoreClick.current = false;
      },
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a,button'));
        const current = stops.indexOf(event.target as HTMLElement);
        if (current < 0) return;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 :
          event.key === 'ArrowLeft' ? Math.max(0, current - 1) :
          event.key === 'ArrowRight' ? Math.min(count - 1, current + 1) : null;
        if (next === null) return;
        event.preventDefault();
        stops[next]?.focus();
        select(next);
      },
    },
  };
}
