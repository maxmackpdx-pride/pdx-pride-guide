import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

export default function ScrollFade({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => { el.removeEventListener("scroll", update); observer.disconnect(); };
  }, [children]);
  return <div ref={ref} className={`pdx-scroll-fade-x${edges.start ? " has-start" : ""}${edges.end ? " has-end" : ""} ${className}`.trim()} {...props}>{children}</div>;
}
