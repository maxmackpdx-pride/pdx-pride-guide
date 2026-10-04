import { Link } from "wouter";
import { useEffect, useState } from "react";
import { prefetchMapz } from "@/lib/prefetchMapz";
import { prefetchOutzide } from "@/lib/prefetchOutzide";
import "./MapSwitch.css";

/** Portland city map and OutZide are one map family: a switch in the same spot on both maps crosses between them. */
export default function MapSwitch({ current }: { current: "mapz" | "outz" }) {
  const [mapzHref] = useState(() => {
    try { const path = sessionStorage.getItem("mapz.lastHref") || ""; return /^\/map(?:\?|$)/.test(path) ? path : "/map"; }
    catch { return "/map"; }
  });
  const [outzHref] = useState(() => {
    try { return sessionStorage.getItem("outzide.visited") === "1" ? "/outzide?restore=1" : "/outzide"; }
    catch { return "/outzide"; }
  });
  useEffect(() => {
    if (current === "outz") {
      try { sessionStorage.setItem("outzide.visited", "1"); } catch { /* Private browsing can disable storage. */ }
    }
    let cancelIdle = () => {};
    const warm = (event: Event) => {
      if ((event as CustomEvent<{map: string}>).detail?.map !== current) return;
      const run = () => { if (document.hidden) return; if (current === "mapz") prefetchOutzide(); else prefetchMapz(); };
      if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(run, { timeout: 2500 });
        cancelIdle = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(run, 1000);
        cancelIdle = () => clearTimeout(id);
      }
    };
    window.addEventListener("zaylist:map-ready", warm);
    return () => {
      window.removeEventListener("zaylist:map-ready", warm);
      cancelIdle();
    };
  }, [current]);
  const leavingMapz = () => {
    try {
      const url = new URL(window.location.href);
      const camera = JSON.parse(sessionStorage.getItem("mapz.lastCamera") || "null") as {lat?: number; lng?: number; zoom?: number} | null;
      if (camera && Number.isFinite(camera.lat) && Number.isFinite(camera.lng) && Number.isFinite(camera.zoom)) {
        url.searchParams.set("lat", camera.lat!.toFixed(5));
        url.searchParams.set("lng", camera.lng!.toFixed(5));
        url.searchParams.set("zoom", camera.zoom!.toFixed(2));
      }
      sessionStorage.setItem("mapz.lastHref", url.pathname + url.search);
    } catch { /* Navigation still works. */ }
  };
  const leavingOutz = () => {
    try {
      const view = document.querySelector<HTMLIFrameElement>(".outz-map-page iframe")?.contentDocument?.querySelector(".workspace")?.classList.contains("view-list") ? "list" : "map";
      sessionStorage.setItem("outzide.lastView", view);
    } catch { /* Navigation still works. */ }
  };
  return (
    <nav className="map-switch pdx-liquid-overlay" aria-label="Switch map">
      <Link href={mapzHref} onClick={current === "outz" ? leavingOutz : undefined} className="map-switch__option map-switch__option--mapz" aria-current={current === "mapz" ? "page" : undefined}>Portland</Link>
      <Link href={outzHref} onClick={current === "mapz" ? leavingMapz : undefined} className="map-switch__option map-switch__option--outz" aria-current={current === "outz" ? "page" : undefined}>OutZide</Link>
    </nav>
  );
}
