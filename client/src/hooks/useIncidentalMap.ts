import { useCallback, useEffect, useMemo, useState } from "react";
export type IncidentalMapView = { center: [number, number]; zoom: number };
export type IncidentalMapMemory = { current: IncidentalMapView | null };
/** Keep the host box mounted, but never keep a hidden incidental renderer alive. */
export function useIncidentalMap(enabled = true, identity: string | number = "map") {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const memory = useMemo<IncidentalMapMemory>(() => ({ current: null }), [identity]);
  const ref = useCallback((node: HTMLElement | null) => setElement(node), []);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync(); document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  useEffect(() => {
    setNear(false);
    if (!element || !enabled) return;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    let disposed = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!disposed) setNear(entry.isIntersecting);
    }, { rootMargin: "300px 0px", threshold: 0 });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); };
  }, [element, enabled]);
  return { ref, active: enabled && near && visible, memory };
}
