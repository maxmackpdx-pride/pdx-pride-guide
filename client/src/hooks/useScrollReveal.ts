import { useEffect, useRef, useState } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(delay = 0) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      reveal();
      return;
    }

    // Already on screen when mounted — don't leave sections at opacity 0.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    obs.observe(el);

    // Safety net: never keep content permanently hidden if IO misfires.
    const fallback = window.setTimeout(reveal, 1200);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return {
    ref,
    visible,
    className: visible ? "scroll-reveal scroll-reveal--visible" : "scroll-reveal",
    style: { transitionDelay: `${delay}ms` } as React.CSSProperties,
  };
}