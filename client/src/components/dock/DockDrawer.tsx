import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import './DockDrawer.css';

export type DockStop = 0 | 1 | 2;

/**
 * Drawer locked to the top of the bottom dock (Tucker, Nov 19 2026).
 * A thick lip with three stacked lines sits on the dock; pulling it up
 * opens stop 1, and (when maxStops is 2) a second pull below the first
 * layer opens stop 2 full screen. Closing physics: a normal swipe down
 * from stop 2 STOPS at stop 1 with a slight bounce; only a hard/fast
 * swipe (velocity past threshold) or a second swipe down closes fully.
 */
export default function DockDrawer({
  accent = 'var(--neon-cyan)',
  ariaLabel,
  lipLabel,
  stop,
  onStopChange,
  maxStops = 1,
  children,
  fullChildren,
}: {
  accent?: string;
  ariaLabel: string;
  lipLabel: string;
  stop: DockStop;
  onStopChange: (stop: DockStop) => void;
  maxStops?: 1 | 2;
  /** Stop-1 content (filters / calendar / Placez sections). */
  children: ReactNode;
  /** Stop-2 content, rendered below the stop-1 content at full screen. */
  fullChildren?: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const start = useRef<{ y: number; t: number; lastY: number; lastT: number; velocity: number } | null>(null);

  useEffect(() => {
    if (stop !== 2) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [stop]);

  useEffect(() => {
    if (!bouncing) return;
    const timer = window.setTimeout(() => setBouncing(false), 480);
    return () => window.clearTimeout(timer);
  }, [bouncing]);

  const settle = (dy: number, velocity: number) => {
    if (Math.abs(dy) < 6) {
      // Tap on the grip: cycle stops.
      if (stop === 0) onStopChange(1);
      else if (stop === 1 && maxStops === 2) onStopChange(2);
      else if (stop === 2) onStopChange(1);
      else onStopChange(0);
      return;
    }
    if (dy < -40) { onStopChange(Math.min(maxStops, stop + 1) as DockStop); return; }
    if (dy > 40) {
      if (velocity > 0.55) { onStopChange(0); return; } // hard/fast drag: close fully
      if (stop === 2) { setBouncing(true); onStopChange(1); return; } // normal swipe: stop at 1, bounce
      onStopChange(0);
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* older browsers */ }
    start.current = { y: event.clientY, t: performance.now(), lastY: event.clientY, lastT: performance.now(), velocity: 0 };
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s || !dragging) return;
    const now = performance.now();
    const dt = now - s.lastT;
    if (dt > 0) s.velocity = (event.clientY - s.lastY) / dt;
    s.lastY = event.clientY; s.lastT = now;
    setDragY(event.clientY - s.y);
  };
  const onPointerUp = () => {
    const s = start.current;
    if (!s || !dragging) return;
    setDragging(false);
    setDragY(0);
    start.current = null;
    settle(s.lastY - s.y, s.velocity);
  };

  const grip = (
    <button
      type="button"
      className="dock-drawer__grip"
      aria-label={stop === 0 ? `Open ${ariaLabel}` : stop === 2 ? 'Drag down to shrink or close' : maxStops === 2 ? 'Drag up for full screen, down to close' : 'Drag down to close'}
      aria-expanded={stop > 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={event => { if (event.detail === 0) settle(0, 0); }}
      onKeyDown={event => {
        if (event.key === 'ArrowUp') { event.preventDefault(); onStopChange(Math.min(maxStops, stop + 1) as DockStop); }
        if (event.key === 'ArrowDown') { event.preventDefault(); if (stop === 2) { setBouncing(true); onStopChange(1); } else onStopChange(0); }
        if (event.key === 'Escape') { event.preventDefault(); if (stop === 2) onStopChange(1); else onStopChange(0); }
      }}
    >
      <span className="dock-drawer__lines" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );

  if (stop === 0) {
    return (
      <div className="dock-drawer-lip pdx-glass-rebind" style={{ '--c': accent } as CSSProperties}>
        {grip}
        <span className="dock-drawer-lip__label" aria-hidden="true">{lipLabel}</span>
      </div>
    );
  }

  return (
    <section
      className={`dock-drawer pdx-glass-rebind is-stop${stop}${dragging ? ' is-dragging' : ''}${bouncing ? ' is-bounce' : ''}`}
      style={{ '--c': accent, transform: dragY !== 0 ? `translateY(${Math.max(-24, dragY)}px)` : undefined } as CSSProperties}
      role="dialog"
      aria-modal={stop === 2}
      aria-label={ariaLabel}
    >
      {grip}
      <div className="dock-drawer__body">
        {children}
        {stop === 2 && fullChildren}
      </div>
    </section>
  );
}
