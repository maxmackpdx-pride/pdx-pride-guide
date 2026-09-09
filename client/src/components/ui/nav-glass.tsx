import { useId, type CSSProperties, type PointerEvent } from "react";
import "./zaylist-glass.css";

/** Shared optical layers from Tucker's approved 21st-inspired React demo.
 * Host keeps layout, semantics, routing and focus; only the background is blurred. */
export function NavGlassLayers() {
  const filterId = `nav-refraction-${useId().replace(/:/g, "")}`;
  return <>
    <svg className="z-filter-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} x="-15%" y="-30%" width="130%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.024" numOctaves="1" seed="17" result="glassNoise" />
          <feGaussianBlur in="glassNoise" stdDeviation="2" result="glassMap" />
          <feDisplacementMap in="SourceGraphic" in2="glassMap" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    {/* Filter the sampled backdrop, never the nav's text, icons or menus. */}
    <span className="z-glass__blur" data-refract aria-hidden="true" style={{ "--z-nav-refraction": `url("#${filterId}")` } as CSSProperties} />
    <span className="z-glass__tint" aria-hidden="true" />
    <span className="z-glass__edge" aria-hidden="true" />
    <span className="z-glass__pointer" aria-hidden="true" />
    <span className="z-glass__rainbow" aria-hidden="true" />
  </>;
}

export function navGlassPointer(event: PointerEvent<HTMLElement>) {
  const host = event.currentTarget;
  if (event.type === "pointerleave") { host.style.setProperty("--pointer-presence", "0"); return; }
  if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.matches(".calm-mode, [data-calm=true]")) return;
  const box = host.getBoundingClientRect();
  host.style.setProperty("--pointer-x", `${event.clientX - box.left}px`);
  host.style.setProperty("--pointer-y", `${event.clientY - box.top}px`);
  host.style.setProperty("--pointer-presence", "1");
}
