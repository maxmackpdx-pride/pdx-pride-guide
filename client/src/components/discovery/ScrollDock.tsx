import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Search } from "lucide-react";
import "./ScrollDock.css";

/**
 * Scroll dock: the Eventz day-dock pattern shared by Eventz, Placez, NEEDZ and BoardZ.
 * The page's full controls (big category tiles, search, actions) stay in normal flow
 * and scroll away. Once the anchor row passes under the site header, a slim frosted
 * bar pins there with compact chips, so the list underneath keeps the screen.
 */
export function useScrollDock(anchor: RefObject<HTMLElement | null>, enabled = true) {
  const [dockTop, setDockTop] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) { setDockTop(null); return; }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = anchor.current;
      if (!el) { setDockTop(null); return; }
      const header = document.querySelector(".site-header");
      const hr = header?.getBoundingClientRect();
      const top = hr && hr.height > 0 && hr.bottom > 0 ? hr.bottom : 0;
      setDockTop(el.getBoundingClientRect().bottom < top + 8 ? top : null);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [anchor, enabled]);
  return dockTop;
}

/** Bring a search field back into view below the dock and focus it. */
export function focusPageSearch(selector: string, dockTop: number | null) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) return;
  const quiet = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm-mode");
  const y = input.getBoundingClientRect().top + window.scrollY - (dockTop ?? 0) - 150;
  window.scrollTo({ top: Math.max(0, y), behavior: quiet ? "auto" : "smooth" });
  input.focus({ preventScroll: true });
}

/** After a dock pick, land on the top of the new results, still under the dock. */
export function scrollToResults(selector: string, dockTop: number | null) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;
  const quiet = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm-mode");
  const y = el.getBoundingClientRect().top + window.scrollY - (dockTop ?? 0) - 76;
  window.scrollTo({ top: Math.max(0, y), behavior: quiet ? "auto" : "smooth" });
}

export function ScrollDock({ top, label, searchLabel, onSearch, className = "", railClassName = "", children }: {
  top: number; label: string; searchLabel?: string; onSearch?: () => void; className?: string; railClassName?: string; children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  // Open with the selected chip in view, not always scrolled to the start.
  useEffect(() => {
    const rail = railRef.current;
    const pressed = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (rail && pressed) rail.scrollLeft = Math.max(0, pressed.offsetLeft - rail.clientWidth / 2 + pressed.offsetWidth / 2);
  }, []);
  return <nav className={`zl-dock ${className}`.trim()} aria-label={label} style={{ "--zl-dock-top": `${top}px` } as CSSProperties}>
    <div className="zl-dock__inner">
      {onSearch && <button type="button" className="zl-dock__search" aria-label={searchLabel || "Search"} onClick={onSearch}>
        <Search size={18} aria-hidden="true" />
      </button>}
      <div className={`zl-dock__rail ${railClassName}`.trim()} ref={railRef}>{children}</div>
    </div>
  </nav>;
}

export function DockChip({ label, count, color, pressed, onClick }: {
  label: string; count?: number; color: string; pressed: boolean; onClick: () => void;
}) {
  return <button type="button" className="zl-dock-chip pdx-glass-rebind" style={{ "--c": color } as CSSProperties} aria-pressed={pressed} onClick={onClick}>
    <span>{label}</span>{count != null && <b aria-label={`${count} listings`}>{count}</b>}
  </button>;
}
