import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";

/** The flight has its own document so its camera cannot alter the page layout. */
export default function HomeFlight({ paused = false, onExploringChange }: {
  paused?: boolean;
  onExploringChange: (exploring: boolean) => void;
}) {
  const { calmMode } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const front = element.closest<HTMLElement>(".home-front");
    const header = document.querySelector<HTMLElement>(".site-header");
    const counter = element.parentElement?.querySelector<HTMLElement>(".home-hero-stats-boundary");
    const bounds = element.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    const sync = () => {
      const headerStyle = header ? getComputedStyle(header) : null;
      const headerHeight = (header?.getBoundingClientRect().height ?? 0)
        + (parseFloat(headerStyle?.marginTop ?? "0") || 0)
        + (parseFloat(headerStyle?.marginBottom ?? "0") || 0);
      const bottomInset = (counter?.getBoundingClientRect().height ?? 96) + 12;
      element.style.setProperty("--home-flight-bottom", `${bottomInset}px`);
      front?.style.setProperty("--home-header-height", `${headerHeight}px`);
      frame.current?.contentWindow?.postMessage({
        type: "zaylist:flight-state",
        active: visible && !document.hidden && !paused,
        still: calmMode || prefersStillMotion(),
        topInset: headerHeight,
        bottomInset,
      }, window.location.origin);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "zaylist:flight-ready") { setReady(true); onExploringChange(false); sync(); }
      if (event.data?.type === "zaylist:flight-error") { setReady(false); onExploringChange(false); }
      if (event.data?.type === "zaylist:flight-exploring" && typeof event.data.exploring === "boolean") {
        onExploringChange(event.data.exploring);
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.01 });
    observer.observe(element);
    const resize = new ResizeObserver(sync);
    if (header) resize.observe(header);
    if (counter) resize.observe(counter);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = new MutationObserver(sync);
    root.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("message", onMessage);
    frame.current?.addEventListener("load", sync);
    const currentFrame = frame.current;
    sync();
    return () => {
      currentFrame?.contentWindow?.postMessage({ type: "zaylist:flight-state", active: false }, window.location.origin);
      currentFrame?.removeEventListener("load", sync);
      observer.disconnect(); resize.disconnect(); root.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("message", onMessage);
    };
  }, [calmMode, paused, onExploringChange]);

  return (
    <div ref={container} className="home-front__flight" data-ready={ready}>
      {!ready && (
        <div className="home-front__flight-credit">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
          {" · "}<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · OpenMapTiles
        </div>
      )}
      <iframe
        ref={frame}
        src="/home-flight/index.html"
        title="Explore Portland’s queer venues — click the map to pause the flyover"
        className="home-front__flight-frame"
      />
    </div>
  );
}
