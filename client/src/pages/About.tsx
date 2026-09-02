import { useEffect, useRef } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import roadmapCss from "./AboutRoadmap.css?raw";
import roadmapMarkup from "./about-roadmap.fragment.html?raw";
import { mountAboutRoadmap } from "./AboutRoadmapRuntime.body";

export default function About() {
  const hostRef = useRef<HTMLDivElement>(null);

  usePageSeo(
    "What’s next for Zaylist | About",
    "From Portland’s first community Pride Guide to the product and system roadmap behind Zaylist.",
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${roadmapCss}</style><div class="about-roadmap-page">${roadmapMarkup}</div>`;
    const dispose = mountAboutRoadmap(shadow);

    return () => {
      dispose();
      shadow.innerHTML = "";
    };
  }, []);

  return <div ref={hostRef} className="about-roadmap-host" />;
}
