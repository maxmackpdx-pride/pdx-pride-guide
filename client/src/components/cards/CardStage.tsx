import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BoardCardInline } from '../board/BoardCardContinuity';
import './CardStage.css';

/** The top bar and dock can change height with viewport, safe area and navigation. */
export function CardStage({ children, front = false, onClose, className = '' }: {
  children: ReactNode;
  front?: boolean;
  onClose: () => void;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const stage = frame.current;
    stage?.setAttribute("data-active", "true");
    const bars = document.querySelectorAll<HTMLElement>('.site-header, .site-hub-mtop, .z-mobile-dock');
    const measure = () => {
      const viewport = document.documentElement.clientHeight;
      let top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-sticky-edge')) || 0;
      let bottom = 0;
      let navMid = 0;
      for (const bar of bars) {
        const rect = bar.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= viewport) continue;
        if (bar.matches('.z-mobile-dock')) bottom = Math.max(bottom, viewport - rect.top);
        else if (rect.top < viewport / 3) {
          top = Math.max(top, rect.bottom);
          navMid = Math.max(navMid, rect.top + rect.height / 2);
        }
      }
      frame.current?.style.setProperty('--card-stage-top', top + 'px');
      frame.current?.style.setProperty('--card-stage-bottom', bottom + 'px');
      // Shared with portaled dialogs (carpool) so every backdrop stops above the dock.
      document.documentElement.style.setProperty('--z-dock-h', bottom + 'px');
      // Open event sheets start halfway over the top bar.
      frame.current?.style.setProperty('--card-stage-nav-mid', (navMid || top) + 'px');
    };
    const observer = new ResizeObserver(measure);
    bars.forEach(bar => observer.observe(bar));
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      stage?.removeAttribute("data-active");
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);
  return createPortal(
    <div ref={frame} className={`zay-card-stage ${front ? 'zay-card-stage--front' : 'zay-card-stage--expanded'} ${className}`}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <BoardCardInline.Provider value={false}>{children}</BoardCardInline.Provider>
    </div>, document.body);
}
