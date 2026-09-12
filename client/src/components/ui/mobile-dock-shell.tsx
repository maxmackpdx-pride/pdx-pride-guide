import { Children, cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MobileLiquidGlass } from "./mobile-liquid-glass";
import { HeroZSymbol } from "./hero-z-hologram";
import { advanceDockScroll } from "@/lib/mobileDockScroll";
import "./mobile-dock-shell.css";
import { useContext } from "react";
import { DockMaterialContext } from "@/lib/dockMaterial";
import { GlassButtonSurface } from '@/components/ui/glass-button';
import { ButtonGlassOptics } from '@/components/ui/button-glass-optics';

// Floating Nav (ruixen.ui, 5840): measured sliding indicator and fixed shell.
// LumaBar (ruixen.ui, 5841): moving colored light and a restrained active lift.
// Existing children remain the real product links/buttons with their handlers.
export function MobileDockShell({ children, activeIndex, overlayOpen, location, attentionCount = 0 }: {
  children: ReactNode; activeIndex: number; overlayOpen: boolean; location: string; attentionCount?: number;
}) {
  const navRef = useRef<HTMLElement>(null);
  const material = useContext(DockMaterialContext);
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef({ y: 0, travel: 0, collapsed: false });
  const rowId = `mobile-dock-${useId().replace(/:/g, "")}`;
  const [collapsed, setCollapsed] = useState(false);
  const [collapseRequested, setCollapseRequested] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [calm, setCalm] = useState(false);
  const reduced = useReducedMotion();
  const quiet = Boolean(reduced || calm);
  const held = overlayOpen || keyboardFocus;
  const compact = collapsed && !held;
  const [indicator, setIndicator] = useState({ left: 0, width: 0, color: "#19e3ff" });
  useLayoutEffect(() => {
    // The imported page uses scrollbar-gutter: stable both-edges. 100vw
    // includes those gutters, which was clipping the last button in Chrome.
    const update = () => navRef.current?.style.setProperty('--dock-viewport-width', `${document.documentElement.getBoundingClientRect().width}px`);
    update();
    const observer = new ResizeObserver(update); observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const update = () => setCalm(document.documentElement.matches('.calm-mode, [data-calm="true"]'));
    update(); const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setCollapsed(false);
    setCollapseRequested(false);
    scrollState.current = { y: window.scrollY, travel: 0, collapsed: false };
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = Math.max(0, Math.min(window.scrollY, Math.max(0, document.documentElement.scrollHeight - innerHeight)));
      scrollState.current = advanceDockScroll(scrollState.current, y, held, innerWidth >= 960);
      setCollapseRequested(scrollState.current.collapsed);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [location, held]);
  useEffect(() => {
    if (!collapseRequested || held) { setCollapsed(false); return; }
    // A short grace period keeps the dock available after the scroll threshold.
    // Continued scrolling does not restart it; menus, focus and routes cancel it.
    const timer = window.setTimeout(() => setCollapsed(true), 350);
    return () => window.clearTimeout(timer);
  }, [collapseRequested, held, location]);
  useLayoutEffect(() => {
    const row = rowRef.current; if (!row) return;
    // Works with both React 18 (product) and React 19 (isolated preview).
    row.toggleAttribute("inert", compact);
    const measure = () => {
      const tab = row.querySelector<HTMLElement>(`[data-dock-index="${activeIndex}"]`);
      if (!tab) return;
      const style = getComputedStyle(tab);
      setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth, color: style.getPropertyValue("--nav-glow").trim() || style.getPropertyValue("--c").trim() || "#19e3ff" });
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(row);
    return () => observer.disconnect();
  }, [activeIndex, compact]);
  return <nav ref={navRef} className="hub-mobile-bar site-hub-mobile-bar site-mobile-nav--compact site-mobile-nav--caption z-glass site-mobile-nav--glass z-mobile-dock"
    data-seam="top" data-material={material} data-collapsed={compact} data-quiet={quiet} aria-label="Site mobile navigation"
    onKeyDownCapture={() => { setKeyboardFocus(true); setCollapsed(false); }}
    onPointerDownCapture={() => setKeyboardFocus(false)}
    onFocusCapture={event => { if (event.target.matches(":focus-visible")) {
      setKeyboardFocus(true); setCollapsed(false);
      if (compact) requestAnimationFrame(() => rowRef.current?.querySelector<HTMLElement>("button, a")?.focus());
    } }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false); }}>
    <MobileLiquidGlass quiet={quiet} />
    <div ref={rowRef} id={rowId} className="hub-mobile-bar__dock" aria-hidden={compact || undefined}>
      <motion.div className="z-mobile-dock__indicator" aria-hidden="true" initial={false}
        animate={{ left: material === "m3" ? indicator.left + (indicator.width - Math.min(64, Math.max(0, indicator.width - 8))) / 2 : indicator.left, width: material === "m3" ? Math.min(64, Math.max(0, indicator.width - 8)) : indicator.width, opacity: activeIndex >= 0 && !compact ? 1 : 0 }}
        transition={quiet ? { duration: 0 } : material === "m3" ? { duration: .25, ease: [.2, 0, 0, 1] } : { type: "spring", stiffness: 400, damping: 38 }}
        style={{ "--dock-accent": indicator.color } as CSSProperties}><span className="z-mobile-dock__glow" /></motion.div>
      {Children.map(children, (child, index) => isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        "data-dock-index": index, "data-dock-selected": index === activeIndex,
        children: <><ButtonGlassOptics />{(child.props as { children?: ReactNode }).children}</>,
      }) : child)}
    </div>
    <button type="button" className="z-mobile-dock__restore" aria-label={attentionCount > 0 ? `Expand navigation, ${attentionCount} messages need attention` : "Expand navigation"}
      aria-expanded={!compact} aria-controls={rowId} aria-hidden={!compact || undefined} tabIndex={compact ? 0 : -1}
      onClick={event => {
        scrollState.current = { y: window.scrollY, travel: 0, collapsed: false };
        setCollapseRequested(false);
        setCollapsed(false);
        if (event.detail === 0) requestAnimationFrame(() => rowRef.current?.querySelector<HTMLElement>("button, a")?.focus());
      }}>
      <GlassButtonSurface /><span className="z-dock-glitch" aria-hidden="true">
        <HeroZSymbol />
        <span className="z-dock-glitch__red"><HeroZSymbol /></span>
        <span className="z-dock-glitch__green"><HeroZSymbol /></span>
        <span className="z-dock-glitch__blue"><HeroZSymbol /></span>
      </span>{attentionCount > 0 && <i aria-hidden="true">{attentionCount > 9 ? "9+" : attentionCount}</i>}
    </button>
  </nav>;
}

