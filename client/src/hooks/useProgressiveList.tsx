import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Caps how many rows a long list renders and adds more as the reader scrolls.
 * `resetKey` puts the cap back to the first batch when a filter or search changes.
 */
export function useProgressiveList(total: number, { initial = 24, step = 24, resetKey = "" }: { initial?: number; step?: number; resetKey?: string } = {}) {
  const [limit, setLimit] = useState(initial);
  useEffect(() => { setLimit(initial); }, [resetKey, initial]);
  return { limit, hasMore: total > limit, loadMore: () => setLimit(n => n + step), remaining: Math.max(0, total - limit) };
}

/** Sits under a capped list. Loads the next batch when it nears the viewport; the button covers browsers without observers. */
export function LoadMore({ hasMore, onLoad, remaining, label = "Show more", className = "eb-tool ab-more" }: { hasMore: boolean; onLoad: () => void; remaining?: number; label?: string; className?: string }): ReactNode {
  const ref = useRef<HTMLButtonElement>(null);
  const load = useRef(onLoad);
  load.current = onLoad;
  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) load.current(); }, { rootMargin: "700px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, remaining]);
  if (!hasMore) return null;
  return <button ref={ref} type="button" className={className} onClick={onLoad}>{label}{remaining ? ` (${remaining} more)` : ""}</button>;
}
