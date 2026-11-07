import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { prefersStillMotion } from "@/lib/motion";
import "./site-wallpaper.css";

/** "boot" is the moment before the first frame: the legacy page overlays are already hidden, so they never flash. */
type State = "idle" | "boot" | "live" | "still" | "fallback";

/** Placez is the directory: /directory and every place page under it. */
function isPlacezRoute(path: string) {
  const bare = path.split("?")[0].replace(/\/+$/, "") || "/";
  return bare === "/directory" || bare.startsWith("/directory/");
}

/**
 * The wallpaper runs on Placez ONLY (owner's order, Nov 7). Every other
 * route hides it — including the full-bleed map routes, whose own map
 * covers the page anyway. No frames are spent there.
 */
function hidesWallpaper(path: string) {
  return !isPlacezRoute(path);
}

/** Board pages are long: the wallpaper scrolls with them as one surface instead of staying fixed to the viewport. */
function isBoardRoute(path: string) {
  const bare = path.split("?")[0].replace(/\/+$/, "") || "/";
  return bare === "/boardz" || bare === "/boards" || bare === "/all-boards" || bare === "/our-boardz";
}

/**
 * The shared page wallpaper, mounted once in the app shell but running on Placez (the
 * directory) only — every other route tears it down and keeps its own CSS atmosphere.
 * The surface itself is the standalone circuit-cork board (no wordmark) served
 * from /circuit-wallpaper/index.html and embedded as a frame inside this layer; the state
 * contract is unchanged, so Placez keeps the same behaviour: Calm mode and reduced motion
 * hold one still frame (the board honours prefers-reduced-motion itself), Save-Data and a
 * failed frame load fall back without ever blanking the page — the original CSS atmosphere
 * layers that the page already carries take over again.
 */
export default function SiteWallpaper() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const hidden = hidesWallpaper(location);
  const longPage = isBoardRoute(location);
  const [state, setState] = useState<State>(hidden ? "idle" : "boot");
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.siteWallpaper = state === "idle" ? "" : state;
    return () => { delete root.dataset.siteWallpaper; };
  }, [state]);

  // Behind a full-bleed map the wallpaper is invisible, so the frame is torn down
  // completely instead of being paused. Memory goes to the map.
  useEffect(() => {
    if (hidden) { setState("idle"); setMount(false); return; }
    setState("boot");
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) { setState("fallback"); return; }
    // Never compete with first paint: mount once the page has settled.
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    let idleHandle = 0;
    if (ric) idleHandle = ric(() => setMount(true), { timeout: 2500 });
    else idleHandle = window.setTimeout(() => setMount(true), 800);
    return () => {
      const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (cic) cic(idleHandle); else window.clearTimeout(idleHandle);
    };
  }, [hidden]);

  // Calm mode / reduced-motion changes flip live <-> still; the board inside the
  // frame paints (or holds) its own frame to match.
  useEffect(() => {
    const applyMotion = () => {
      setState(prev => (prev === "live" || prev === "still")
        ? (prefersStillMotion() ? "still" : "live")
        : prev);
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", applyMotion);
    const mo = new MutationObserver(applyMotion);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => { mq.removeEventListener?.("change", applyMotion); mo.disconnect(); };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="site-wallpaper"
      data-site-wallpaper={state}
      data-hidden={hidden ? "true" : undefined}
      data-long={longPage ? "true" : undefined}
      aria-hidden="true"
    >
      {mount && !hidden && (
        <iframe
          className="site-wallpaper__canvas"
          src="/circuit-wallpaper/index.html"
          title=""
          tabIndex={-1}
          onLoad={() => setState(prefersStillMotion() ? "still" : "live")}
          onError={() => setState("fallback")}
        />
      )}
    </div>
  );
}
