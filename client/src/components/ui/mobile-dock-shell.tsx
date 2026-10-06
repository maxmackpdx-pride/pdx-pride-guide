import { Children, cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MobileGlassLite } from "./mobile-glass-lite";
import "./mobile-dock-shell.css";
import { useContext } from "react";
import { DockMaterialContext } from "@/lib/dockMaterial";
import { ButtonGlassOptics } from "@/components/ui/button-glass-optics";

// Floating Nav (ruixen.ui, 5840): measured sliding indicator and fixed shell.
// LumaBar (ruixen.ui, 5841): moving colored light and a restrained active lift.
// The dock stays expanded. Collapse-to-Z was removed.
export function MobileDockShell({ children, activeIndex, location: _location, attentionCount: _attentionCount = 0 }: {
  children: ReactNode; activeIndex: number; overlayOpen?: boolean; location: string; attentionCount?: number;
}) {
  const navRef = useRef<HTMLElement>(null);
  const material = useContext(DockMaterialContext);
  const rowRef = useRef<HTMLDivElement>(null);
  const rowId = `mobile-dock-${useId().replace(/:/g, "")}`;
  const [calm, setCalm] = useState(false);
  const reduced = useReducedMotion();
  const quiet = Boolean(reduced || calm);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, color: "#19e3ff" });
  useLayoutEffect(() => {
    // The imported page uses scrollbar-gutter: stable both-edges. 100vw
    // includes those gutters, which was clipping the last button in Chrome.
    const update = () => navRef.current?.style.setProperty("--dock-viewport-width", `${document.documentElement.getBoundingClientRect().width}px`);
    update();
    const observer = new ResizeObserver(update); observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mobileDock = "expanded";
    window.dispatchEvent(new CustomEvent("zaylist:mobile-dock", { detail: { collapsed: false } }));
    return () => {
      if (root.dataset.mobileDock === "expanded") delete root.dataset.mobileDock;
    };
  }, []);
  useEffect(() => {
    const update = () => setCalm(document.documentElement.matches('.calm-mode, [data-calm="true"]'));
    update(); const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const row = rowRef.current; if (!row) return;
    const measure = () => {
      const tab = row.querySelector<HTMLElement>(`[data-dock-index="${activeIndex}"]`);
      if (!tab) return;
      const style = getComputedStyle(tab);
      setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth, color: style.getPropertyValue("--nav-glow").trim() || style.getPropertyValue("--c").trim() || "#19e3ff" });
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(row);
    return () => observer.disconnect();
  }, [activeIndex]);
  return <nav ref={navRef} className="hub-mobile-bar site-hub-mobile-bar site-mobile-nav--compact site-mobile-nav--caption z-glass site-mobile-nav--glass z-mobile-dock"
    data-seam="top" data-material={material} data-collapsed="false" data-quiet={quiet} aria-label="Site mobile navigation">
    <MobileGlassLite />
    <div ref={rowRef} id={rowId} className="hub-mobile-bar__dock">
      <motion.div className="z-mobile-dock__indicator" aria-hidden="true" initial={false}
        animate={{ left: material === "m3" ? indicator.left + (indicator.width - Math.min(64, Math.max(0, indicator.width - 8))) / 2 : indicator.left, width: material === "m3" ? Math.min(64, Math.max(0, indicator.width - 8)) : indicator.width, opacity: activeIndex >= 0 ? 1 : 0 }}
        transition={quiet ? { duration: 0 } : material === "m3" ? { duration: .25, ease: [.2, 0, 0, 1] } : { type: "spring", stiffness: 400, damping: 38 }}
        style={{ "--dock-accent": indicator.color } as CSSProperties}><span className="z-mobile-dock__glow" /></motion.div>
      {Children.map(children, (child, index) => isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        "data-dock-index": index, "data-dock-selected": index === activeIndex,
        children: <><ButtonGlassOptics />{(child.props as { children?: ReactNode }).children}</>,
      }) : child)}
    </div>
  </nav>;
}
