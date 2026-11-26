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
    const selector = '.site-header, .site-hub-mtop, .z-mobile-dock';
    const bars = () => document.querySelectorAll<HTMLElement>(selector);
    const measure = () => {
      const viewport = document.documentElement.clientHeight;
      let top = parseFloat(document.documentElement.style.getPropertyValue('--site-header-sticky-edge')) || 0;
      let bottom = 0;
      for (const bar of bars()) {
        const rect = bar.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= viewport) continue;
        if (bar.matches('.z-mobile-dock')) bottom = Math.max(bottom, viewport - rect.top);
        else if (rect.top < viewport / 3) top = Math.max(top, rect.bottom);
      }
      frame.current?.style.setProperty('--card-stage-top', top + 'px');
      frame.current?.style.setProperty('--card-stage-bottom', bottom + 'px');
    };
    const observer = new ResizeObserver(measure);
    const observeBars = () => {
      observer.disconnect();
      bars().forEach(bar => observer.observe(bar));
    };
    observeBars();
    // The map package attaches its dock in a separate, asynchronous React root.
    const chrome = className === 'outz-family-stage' ? new MutationObserver(records => {
      if (!records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && (node.matches(selector) || node.querySelector(selector))))) return;
      observeBars();
      measure();
    }) : null;
    chrome?.observe(document.body, {childList: true, subtree: true});
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      chrome?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [className]);
  return createPortal(
    <div ref={frame} data-active="true" className={`zay-card-stage ${front ? 'zay-card-stage--front' : 'zay-card-stage--expanded'} ${className}`}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="zay-card-stage__scrim" data-glass-piece="scrim" aria-hidden="true" />
      <BoardCardInline.Provider value={false}>{children}</BoardCardInline.Provider>
    </div>, document.body);
}
