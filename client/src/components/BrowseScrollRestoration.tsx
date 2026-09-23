import { useEffect } from "react";
import { useLocation } from "wouter";
import { resetPageScroll } from "@/lib/resetPageScroll";
const positions = new Map<string, number>();
function browsePath(path: string) {
  // Event and place details are overlays over the same list.
  if (/^\/events(?:\/|$)/.test(path)) return "/events";
  if (/^\/directory(?:\/|$)/.test(path)) return "/directory";
  return path;
}
export default function BrowseScrollRestoration() {
  const [location] = useLocation();
  const path = browsePath(location.split("?")[0]);
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useEffect(() => {
    let stopped = false;
    let frame = 0;
    const target = positions.get(path) || 0;
    const remember = () => {
      if (!stopped || document.body.style.position === "fixed") return;
      positions.set(path, window.scrollY);
      if (positions.size > 40) positions.delete(positions.keys().next().value!);
    };
    const stop = () => { stopped = true; observer.disconnect(); cancelAnimationFrame(frame); };
    const restore = () => {
      if (stopped || document.body.style.position === "fixed") return;
      window.scrollTo({ top: target, left: 0, behavior: "instant" });
      if (Math.abs(window.scrollY - target) < 2) stop();
    };
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); });
    if (target) {
      observer.observe(document.documentElement);
      frame = requestAnimationFrame(restore);
    } else { resetPageScroll(); stopped = true; }
    const timeout = window.setTimeout(stop, 5000);
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      stop(); clearTimeout(timeout);
      window.removeEventListener("scroll", remember);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [path]);
  return null;
}
