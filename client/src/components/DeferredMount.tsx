import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts children only once the browser goes idle (with a timeout cap), so
 * prompt / nudge / reminder furniture never competes with first paint or the
 * route's own data fetch. The children are already code-split by the caller;
 * this defers the render that triggers their chunk download.
 */
export default function DeferredMount({ children, timeout = 2500 }: { children: ReactNode; timeout?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    }).requestIdleCallback;
    let handle: number;
    if (typeof ric === "function") {
      handle = ric(() => { if (!cancelled) setReady(true); }, { timeout });
    } else {
      handle = window.setTimeout(() => { if (!cancelled) setReady(true); }, 1200);
    }
    return () => {
      cancelled = true;
      const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (typeof ric === "function" && typeof cic === "function") cic(handle);
      else window.clearTimeout(handle);
    };
  }, [timeout]);
  return ready ? <>{children}</> : null;
}
