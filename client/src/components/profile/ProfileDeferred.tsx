import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mount expensive, secondary profile media near the viewport, then retain it. */
export default function ProfileDeferred({label, children}: {label: string; children: ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!root.current || ready) return;
    if (typeof IntersectionObserver === "undefined") { setReady(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setReady(true); observer.disconnect(); }
    }, {rootMargin: "500px"});
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [ready]);
  return <div ref={root} className="pp-deferred">{ready ? children : <div className="pp-section-placeholder" aria-label={label}><h2>{label}</h2><p>More from this profile</p></div>}</div>;
}
