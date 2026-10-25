import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { prefersStillMotion } from "@/lib/motion";
import "./site-wallpaper.css";

/** "boot" is the moment before the first frame: the legacy page overlays are already hidden, so they never flash. */
type State = "idle" | "boot" | "live" | "still" | "fallback";

/** Routes whose own full-bleed map hides the page behind it. No frames are spent there. */
function hidesWallpaper(path: string) {
  const bare = path.split("?")[0].replace(/\/+$/, "") || "/";
  return bare === "/map" || bare === "/map-demo" || bare === "/outzide" || bare.startsWith("/outzide/")
    || bare === "/admin" || bare === "/design-system/specimen";
}

function isTouchDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iP(hone|ad|od)|Android/i.test(ua)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    || (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
}

/**
 * The one shared page wallpaper. Mounted once in the app shell, so every route sits on the same
 * single WebGL context. Calm mode, reduced motion, Save-Data, and missing WebGL2 all fall back
 * without ever blanking the page: reduced motion paints one still frame; the rest keep the
 * original CSS atmosphere layers that each page already carries.
 */
export default function SiteWallpaper() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<import("./circuitWallpaperEngine").CircuitWallpaperEngine | null>(null);
  const [location] = useLocation();
  const hidden = hidesWallpaper(location);
  const [state, setState] = useState<State>(hidden ? "idle" : "boot");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.siteWallpaper = state === "idle" ? "" : state;
    return () => { delete root.dataset.siteWallpaper; };
  }, [state]);

  // Behind a full-bleed map the wallpaper is invisible, so it is torn down completely
  // (context, textures, comet layer) instead of being paused. Memory goes to the map.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (hidden) { setState("idle"); return; }
    setState("boot");
    // A fresh canvas per boot: a context that was released with loseContext() cannot be reused.
    const canvas = document.createElement("canvas");
    canvas.className = "site-wallpaper__canvas";
    wrap.appendChild(canvas);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) { setState("fallback"); return; }
    let cancelled = false;
    const abort = new AbortController();
    let idleHandle = 0;
    let cleanup = () => {};

    const boot = async () => {
      try {
        const { CircuitWallpaperEngine } = await import("./circuitWallpaperEngine");
        if (cancelled) return;
        const engine = new CircuitWallpaperEngine(canvas, { touch: isTouchDevice() });
        engineRef.current = engine;
        const applyMotion = () => {
          const still = prefersStillMotion();
          engine.setStill(still);
          setState(still ? "still" : "live");
        };
        engine.onLost = () => { engine.stop(); setState("fallback"); };
        engine.onRestored = () => { applyMotion(); };
        await engine.load(abort.signal);
        if (cancelled) { engine.dispose(); return; }
        engine.resize();
        applyMotion();

        let resizeTimer = 0;
        const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => engine.resize(), 120); };
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        mq.addEventListener?.("change", applyMotion);
        const mo = new MutationObserver(applyMotion);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
        cleanup = () => {
          window.clearTimeout(resizeTimer);
          window.removeEventListener("resize", onResize);
          window.removeEventListener("orientationchange", onResize);
          mq.removeEventListener?.("change", applyMotion);
          mo.disconnect();
          engine.dispose();
          engineRef.current = null;
        };
      } catch {
        engineRef.current?.dispose();
        engineRef.current = null;
        if (!cancelled) setState("fallback");
      }
    };

    // Never compete with first paint: start once the page has settled.
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) idleHandle = ric(() => void boot(), { timeout: 2500 });
    else idleHandle = window.setTimeout(() => void boot(), 800);

    return () => {
      cancelled = true;
      abort.abort();
      const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (cic) cic(idleHandle); else window.clearTimeout(idleHandle);
      cleanup();
      canvas.remove();
    };
  }, [hidden]);

  return (
    <div
      ref={wrapRef}
      className="site-wallpaper"
      data-site-wallpaper={state}
      data-hidden={hidden ? "true" : undefined}
      aria-hidden="true"
    />
  );
}
