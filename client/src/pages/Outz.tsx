import { useEffect, useRef } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";

/** Keep the field map's canvas, dialogs and styles isolated from the site shell. */
export type OutzDiscoveryPlace = { id: string; name: string; region: string; kind: string; short: string; accent: string; cardAccent?: string; note: string; href: string; lat?: number; lng?: number; logo?: string };

export default function Outz() {
  usePageSeo("OutZide | Northwest field map | Zaylist", "Explore trails, campgrounds, hot springs, beaches and community stays across Oregon and Washington.");
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const resize = () => {
      if (!frame.current) return;
      const bottomNav = window.innerWidth < 768 ? 72 : 0;
      frame.current.style.height = `${Math.max(360, window.innerHeight - frame.current.getBoundingClientRect().top - bottomNav)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <iframe ref={frame} src={"/outzide-map/index.html?v=20260922&place=" + encodeURIComponent(new URLSearchParams(window.location.search).get("place") || "")} title="Outzide Northwest field map" allow="geolocation" style={{ display: "block", width: "100%", height: "calc(100dvh - 80px)", border: 0 }} />;
}
