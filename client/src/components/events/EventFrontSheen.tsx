import { prefersStillMotion } from "@/lib/motion";
import "./EventFrontSheen.css";

let observer: IntersectionObserver | undefined;
function firstAppearance(node: HTMLSpanElement | null) {
  if (!node || prefersStillMotion() || !("IntersectionObserver" in window)) return;
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-seen", "");
      observer?.unobserve(entry.target);
    }
  }, { threshold: .12 });
  observer.observe(node);
  return () => observer?.unobserve(node);
}

export function EventFrontSheen() {
  return <span className="event-front-sheen" ref={firstAppearance} aria-hidden="true"/>;
}
